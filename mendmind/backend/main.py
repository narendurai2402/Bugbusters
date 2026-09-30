"""Reason x API. Run: uvicorn main:app --reload --port 8000"""
import logging
import json
import hashlib
import hmac
import os
import random
import re
import secrets
import smtplib
import ssl
import time
from email.message import EmailMessage
from typing import Literal
from urllib.parse import urlencode, urlparse

import httpx
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, Field, ValidationError
import questions as Q, state, llm, uploads

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Reason x API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
SOCIAL_AUTH_STATES: dict[str, dict[str, str]] = {}


# ── Global exception handler ───────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "An unexpected server error occurred. Please try again."})


# ── Request models ─────────────────────────────────────────────────────────
class LoginIn(BaseModel):
    email: str
    password: str
    role: str = "student"
    name: str | None = None

class SocialAuthIn(BaseModel):
    provider: Literal["google", "microsoft"]
    name: str | None = None
    role: Literal["student", "teacher"] = "student"

class SignupIn(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=80)
    role: Literal["student", "teacher"] = "student"

class SignupVerifyIn(BaseModel):
    email: str
    code: str = Field(pattern=r"^\d{6}$")

class SignupResendIn(BaseModel):
    email: str

class QuizStartIn(BaseModel):
    studentId: str = Field(min_length=1, max_length=254)
    subject: str = "all"

class QuizAnswerIn(BaseModel):
    studentId: str = Field(min_length=1, max_length=254)
    answer: str = Field(min_length=1, max_length=1000)

class AnswerIn(BaseModel):
    questionId: str
    answer: str
    attempt: int = 1
    studentId: str = Field(min_length=1, max_length=254)

class RecoveryIn(BaseModel):
    questionId: str
    answer: str
    studentId: str = Field(min_length=1, max_length=254)

class TutorMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)

class TutorChatIn(BaseModel):
    messages: list[TutorMessage] = Field(min_length=1, max_length=16)
    studentId: str = Field(min_length=1, max_length=254)

class AssignmentIn(BaseModel):
    title: str
    subject: str
    questionIds: list[str]
    mode: str = "all"
    students: list[str] = Field(default_factory=list)
    due: str | None = None
    note: str = ""
    teacher: str = "teacher"


# ── Helpers ────────────────────────────────────────────────────────────────
norm = lambda s: "".join(s.split()).lower()
OTP_SECRET = os.getenv("OTP_HASH_SECRET") or secrets.token_hex(32)
OTP_TTL_SECONDS = 10 * 60
OTP_RESEND_SECONDS = 45
OTP_MAX_ATTEMPTS = 5


def _otp_digest(email: str, code: str) -> str:
    return hmac.new(OTP_SECRET.encode(), f"{email}:{code}".encode(), hashlib.sha256).hexdigest()


def send_signup_email(email: str, name: str, code: str) -> None:
    host = os.getenv("SMTP_HOST")
    sender = os.getenv("SMTP_FROM") or os.getenv("SMTP_USERNAME")
    if not host or not sender:
        raise RuntimeError("Email delivery is not configured. Set SMTP_HOST and SMTP_FROM before signing up.")

    message = EmailMessage()
    message["Subject"] = "Your Reason X verification code"
    message["From"] = sender
    message["To"] = email
    message.set_content(
        f"Hello {name},\n\nYour Reason X verification code is {code}. "
        f"It expires in 10 minutes. If you did not request this, you can ignore this email."
    )

    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
    context = ssl.create_default_context()
    smtp_class = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
    with smtp_class(host, port, context=context) if use_ssl else smtp_class(host, port, timeout=20) as smtp:
        if not use_ssl and os.getenv("SMTP_STARTTLS", "true").lower() == "true":
            smtp.starttls(context=context)
        if username:
            smtp.login(username, password or "")
        smtp.send_message(message)


def _signup_email(email: str) -> str:
    clean_email = email.strip().lower()
    if not state.is_valid_email(clean_email):
        raise HTTPException(400, "Invalid email address. Please provide a valid email address.")
    return clean_email


def _oauth_provider(provider: str) -> dict[str, str]:
    provider = provider.lower()
    if provider == "google":
        return {
            "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "userinfo_url": "https://openidconnect.googleapis.com/v1/userinfo",
            "scope": "openid email profile",
            "client_id_env": "GOOGLE_CLIENT_ID",
            "client_secret_env": "GOOGLE_CLIENT_SECRET",
            "redirect_env": "GOOGLE_REDIRECT_URI",
        }
    if provider == "microsoft":
        return {
            "authorize_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            "token_url": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            "userinfo_url": "https://graph.microsoft.com/oidc/userinfo",
            "scope": "openid profile email User.Read",
            "client_id_env": "MICROSOFT_CLIENT_ID",
            "client_secret_env": "MICROSOFT_CLIENT_SECRET",
            "redirect_env": "MICROSOFT_REDIRECT_URI",
        }
    raise HTTPException(404, f"Unsupported provider: {provider}")


def _social_user_payload(provider: str, profile: dict) -> tuple[str, str]:
    if provider == "google":
        email = (profile.get("email") or profile.get("preferred_username") or f"{provider}-user@reasonx.local").strip().lower()
        name = (profile.get("name") or profile.get("given_name") or "Google User").strip() or "Google User"
        return email, name
    if provider == "microsoft":
        email = (profile.get("email") or profile.get("preferred_username") or f"{provider}-user@reasonx.local").strip().lower()
        name = (profile.get("name") or profile.get("given_name") or "Microsoft User").strip() or "Microsoft User"
        return email, name
    raise HTTPException(404, f"Unsupported provider: {provider}")


def _redirect_to_frontend(page: str, params: dict[str, str]) -> RedirectResponse:
    frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
    url = f"{frontend_base}/{page}"
    query = urlencode(params)
    return RedirectResponse(f"{url}?{query}")


def _send_signup_code(email: str, name: str, password_hash: str, role: str) -> dict:
    now = time.time()
    code = f"{secrets.randbelow(1_000_000):06d}"
    state.create_signup_challenge(email, password_hash, name, role, _otp_digest(email, code), now, now + OTP_TTL_SECONDS)
    demo_mode = os.getenv("ALLOW_DEMO_EMAILS", "false").lower() == "true"
    if demo_mode:
        logger.info("Demo email signup enabled for %s; returning generated code without SMTP delivery.", email)
        return {"success": True, "email": email, "demoCode": code, "expiresIn": OTP_TTL_SECONDS, "resendAfter": OTP_RESEND_SECONDS}
    try:
        send_signup_email(email, name, code)
    except Exception as exc:
        state.delete_signup_challenge(email)
        logger.warning("Signup email delivery failed: %s", exc)
        raise HTTPException(503, "Could not send the verification email. Check SMTP configuration and try again.") from exc
    return {"success": True, "email": email, "expiresIn": OTP_TTL_SECONDS, "resendAfter": OTP_RESEND_SECONDS}


@app.post("/api/signup")
def start_signup(body: SignupIn):
    email = _signup_email(body.email)
    if not body.name.strip():
        raise HTTPException(400, "Your full name is required.")
    if state.get_user(email):
        raise HTTPException(409, "An account already exists for this email. Please log in.")
    pending = state.get_signup_challenge(email)
    if pending:
        if pending["expires_at"] > time.time():
            raise HTTPException(409, "A signup is already pending. Enter the emailed code or use resend.")
        state.delete_signup_challenge(email)
    return _send_signup_code(email, body.name.strip(), state.hash_password(body.password), body.role)


@app.post("/api/signup/resend")
def resend_signup_code(body: SignupResendIn):
    email = _signup_email(body.email)
    challenge = state.get_signup_challenge(email)
    if not challenge:
        raise HTTPException(404, "No pending signup was found. Please start again.")
    now = time.time()
    wait_seconds = OTP_RESEND_SECONDS - int(now - challenge["last_sent"])
    if wait_seconds > 0:
        raise HTTPException(429, f"Please wait {wait_seconds} seconds before requesting another code.")
    code = f"{secrets.randbelow(1_000_000):06d}"
    try:
        send_signup_email(email, challenge["name"], code)
    except Exception as exc:
        logger.warning("Signup email resend failed: %s", exc)
        raise HTTPException(503, "Could not send the verification email. Check SMTP configuration and try again.") from exc
    state.update_signup_challenge(email, _otp_digest(email, code), now, now + OTP_TTL_SECONDS)
    return {"success": True, "expiresIn": OTP_TTL_SECONDS, "resendAfter": OTP_RESEND_SECONDS}


@app.post("/api/signup/verify")
def verify_signup_code(body: SignupVerifyIn):
    email = _signup_email(body.email)
    challenge = state.get_signup_challenge(email)
    if not challenge:
        raise HTTPException(404, "No pending signup was found. Please request a new verification code.")
    if challenge["expires_at"] <= time.time():
        state.delete_signup_challenge(email)
        raise HTTPException(400, "That verification code has expired. Please sign up again.")
    if challenge["attempts"] >= OTP_MAX_ATTEMPTS:
        state.delete_signup_challenge(email)
        raise HTTPException(429, "Too many incorrect codes. Please request a new verification code.")
    if not hmac.compare_digest(challenge["otp_hash"], _otp_digest(email, body.code)):
        attempts = state.increment_signup_attempts(email)
        if attempts >= OTP_MAX_ATTEMPTS:
            state.delete_signup_challenge(email)
            raise HTTPException(429, "Too many incorrect codes. Please request a new verification code.")
        raise HTTPException(400, f"Incorrect verification code. {OTP_MAX_ATTEMPTS - attempts} attempts remaining.")

    try:
        state.create_verified_user(email, challenge["password_hash"], challenge["name"], challenge["role"])
    except RuntimeError as exc:
        raise HTTPException(409, "An account already exists for this email. Please log in.") from exc
    state.delete_signup_challenge(email)
    return {
        "success": True,
        "user": {"name": challenge["name"], "email": email, "role": challenge["role"]},
    }

def question(qid: str) -> dict:
    if not qid or qid not in Q.QUESTIONS:
        raise HTTPException(404, f"Unknown question id: {qid!r}. Valid ids: {list(Q.QUESTIONS.keys())}")
    return Q.QUESTIONS[qid]


def _quiz_question(session: dict) -> dict | None:
    if session["phase"] == "complete":
        return None
    qid = session["question_ids"][session["question_index"]]
    q = Q.QUESTIONS[qid]
    text = q["recovery"]["text"] if session["phase"] == "recovery" else q["text"]
    return {"subject": q["category"], "concept": q["concept"], "text": text}


def _quiz_payload(session: dict) -> dict:
    return {
        "sessionId": session["session_id"],
        "subject": session["subject"],
        "questionNumber": min(session["question_index"] + 1, len(session["question_ids"])),
        "total": len(session["question_ids"]),
        "phase": session["phase"],
        "attempts": session["attempts"],
        "score": session["score"],
        "question": _quiz_question(session),
    }


def _quiz_session(session_id: str, student_id: str) -> dict:
    session = state.get_quiz_session(session_id)
    if not session or session["student"] != student_id:
        raise HTTPException(404, "Quiz session not found.")
    return session


def _advance_quiz(session: dict, score: int) -> dict:
    next_index = session["question_index"] + 1
    phase = "complete" if next_index >= len(session["question_ids"]) else "question"
    state.update_quiz_session(session["session_id"], next_index, phase, 0, score)
    return state.get_quiz_session(session["session_id"])

VALID_MOVE_KINDS = frozenset(["first_try", "miss", "recovered", "recovery_miss"])

def move(student: str, concept: str, kind: str):
    """Small Bayesian-style mastery update. Silently no-ops on bad kind."""
    if kind not in VALID_MOVE_KINDS:
        logger.warning("move(): unknown kind %r — skipping.", kind)
        return
    try:
        m = state.get_mastery(student)[concept]
        new_val = {
            "first_try":     m + (1 - m) * 0.2,
            "miss":          m * 0.9,
            "recovered":     m + (1 - m) * 0.4,
            "recovery_miss": m + (1 - m) * 0.03,
        }[kind]
        state.set_mastery(student, concept, new_val)
    except (KeyError, RuntimeError) as exc:
        logger.warning("move() failed for student=%r concept=%r: %s", student, concept, exc)


# ── Endpoints ──────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"ok": True, "llm": llm.MODEL or "not-configured", "aiReady": bool(llm.MODEL)}


@app.post("/api/chat")
def tutor_chat(body: TutorChatIn):
    messages = [{"role": message.role, "content": message.content.strip()} for message in body.messages]
    if any(not message["content"] for message in messages):
        raise HTTPException(400, "Chat messages cannot be empty.")
    if messages[-1]["role"] != "user":
        raise HTTPException(400, "The latest chat message must be from the user.")

    return _generate_chat_reply(messages)


def _generate_chat_reply(messages: list[dict[str, str]]) -> dict:
    try:
        reply = llm.chat_reply(messages)
    except RuntimeError as exc:
        logger.warning("tutor_chat unavailable: %s", exc)
        raise HTTPException(503, str(exc)) from exc
    except Exception as exc:
        logger.error("tutor_chat failed: %s", exc, exc_info=True)
        raise HTTPException(503, "The AI tutor is temporarily unavailable.") from exc

    return {"reply": reply, "model": llm.MODEL}


@app.post("/api/chat/files")
def tutor_chat_files(
    messages: str = Form(...),
    studentId: str = Form(...),
    files: list[UploadFile] = File(...),
):
    if not files:
        raise HTTPException(400, "Attach at least one file.")
    if len(files) > 5:
        raise HTTPException(413, "Attach no more than 5 files at a time.")

    try:
        parsed_messages = json.loads(messages)
        body = TutorChatIn(messages=parsed_messages, studentId=studentId)
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(422, "Chat messages are invalid.") from exc

    chat_messages = [{"role": message.role, "content": message.content.strip()} for message in body.messages]
    if any(not message["content"] for message in chat_messages):
        raise HTTPException(400, "Chat messages cannot be empty.")
    if chat_messages[-1]["role"] != "user":
        raise HTTPException(400, "The latest chat message must be from the user.")

    attachment_context = []
    total_file_bytes = 0
    total_extracted_chars = 0
    attachment_names = []
    for uploaded_file in files:
        filename = (uploaded_file.filename or "").replace("\\", "/").split("/")[-1]
        if not filename:
            raise HTTPException(400, "Every attachment must have a filename.")
        file_bytes = uploaded_file.file.read(10 * 1024 * 1024 + 1)
        total_file_bytes += len(file_bytes)
        if len(file_bytes) > 10 * 1024 * 1024:
            raise HTTPException(413, f"{filename} exceeds the 10 MB per-file limit.")
        if total_file_bytes > 25 * 1024 * 1024:
            raise HTTPException(413, "The combined attachment size must be 25 MB or less.")
        try:
            extracted_text = uploads.extract_attachment_text(filename, file_bytes)
        except ValueError as exc:
            raise HTTPException(415, str(exc)) from exc
        except Exception as exc:
            logger.warning("Could not read uploaded file %r: %s", filename, exc, exc_info=True)
            raise HTTPException(422, f"Could not read {filename}. Try exporting it as PDF, DOCX, or PPTX.") from exc

        total_extracted_chars += len(extracted_text)
        if total_extracted_chars > 30000:
            raise HTTPException(413, "The combined extracted text must be 30,000 characters or less.")
        attachment_names.append(filename)
        attachment_context.append(f"[Attached file: {filename}]\n{extracted_text}")

    chat_messages[-1]["content"] += "\n\nUse this uploaded-file content as context:\n" + "\n\n".join(attachment_context)
    result = _generate_chat_reply(chat_messages)
    result["attachments"] = attachment_names
    return result


@app.get("/api/auth/{provider}/start")
def social_auth_start(provider: str, role: str = "student", source: str = "login"):
    provider = provider.lower()
    config = _oauth_provider(provider)
    client_id = os.getenv(config["client_id_env"])
    redirect_uri = os.getenv(config["redirect_env"]) or f"http://127.0.0.1:8000/api/auth/{provider}/callback"
    if not client_id:
        raise HTTPException(503, f"{provider.title()} OAuth is not configured. Set {config['client_id_env']}.")

    auth_state = secrets.token_urlsafe(32)
    SOCIAL_AUTH_STATES[auth_state] = {"provider": provider, "role": role, "source": source}
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": config["scope"],
        "state": auth_state,
        "prompt": "select_account",
        "access_type": "offline",
    }
    if provider == "microsoft":
        params["response_mode"] = "query"
    authorize_url = f"{config['authorize_url']}?{urlencode(params)}"
    return RedirectResponse(authorize_url)


@app.get("/api/auth/{provider}/callback")
async def social_auth_callback(provider: str, code: str | None = None, state: str | None = None, error: str | None = None, error_description: str | None = None):
    provider = provider.lower()
    if error:
        raise HTTPException(400, error_description or f"{provider.title()} authorization failed.")
    if not code or not state or state not in SOCIAL_AUTH_STATES:
        raise HTTPException(400, "OAuth callback is missing required parameters.")

    session = SOCIAL_AUTH_STATES.pop(state)
    config = _oauth_provider(provider)
    client_id = os.getenv(config["client_id_env"])
    client_secret = os.getenv(config["client_secret_env"])
    redirect_uri = os.getenv(config["redirect_env"]) or f"http://127.0.0.1:8000/api/auth/{provider}/callback"
    if not client_id or not client_secret:
        raise HTTPException(503, f"{provider.title()} OAuth is not configured. Set {config['client_id_env']} and {config['client_secret_env']}.")

    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient() as client:
        token_response = await client.post(config["token_url"], data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=30)
        if token_response.status_code >= 400:
            raise HTTPException(502, f"Could not exchange the {provider.title()} authorization code.")
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(502, f"{provider.title()} returned no access token.")
        user_response = await client.get(config["userinfo_url"], headers={"Authorization": f"Bearer {access_token}"}, timeout=30)
        if user_response.status_code >= 400:
            raise HTTPException(502, f"Could not load the {provider.title()} user profile.")
        profile = user_response.json()

    email, name = _social_user_payload(provider, profile)
    role = session.get("role", "student") if session.get("role") in ("student", "teacher") else "student"
    source = session.get("source", "login")
    page = "login_fixed.html" if source.lower().startswith("login") else "signup.html"

    existing = state.get_user(email)
    if existing:
        user = existing
        if user["role"] != role:
            state._q("update users set role=? where lower(email)=?", (role, email))
            user["role"] = role
        if not user["name"]:
            state._q("update users set name=? where lower(email)=?", (name, email))
            user["name"] = name
    else:
        temp_password = state.hash_password(f"{provider}:{email}:{secrets.token_hex(16)}")
        state.create_verified_user(email, temp_password, name, role)
        user = {"name": name, "email": email, "role": role}

    params = {
        "oauth_provider": provider,
        "oauth_name": user["name"],
        "oauth_email": user["email"],
        "oauth_role": user["role"],
    }
    return _redirect_to_frontend(page, params)


@app.post("/api/auth/social")
def social_auth(body: SocialAuthIn):
    provider = body.provider.lower()
    role = body.role if body.role in ("student", "teacher") else "student"
    name = (body.name or f"{provider.title()} User").strip() or f"{provider.title()} User"
    email = f"{provider}-{role}@reasonx.local"

    existing = state.get_user(email)
    if existing:
        user = existing
        if user["name"] != name and not user["name"]:
            state._q("update users set name=? where lower(email)=?", (name, email))
            user["name"] = name
        if user["role"] != role:
            state._q("update users set role=? where lower(email)=?", (role, email))
            user["role"] = role
        return {
            "success": True,
            "provider": provider,
            "user": {"name": user["name"], "email": user["email"], "role": user["role"]},
        }

    temp_password = state.hash_password(f"{provider}:{email}:{secrets.token_hex(16)}")
    state.create_verified_user(email, temp_password, name, role)
    return {
        "success": True,
        "provider": provider,
        "user": {"name": name, "email": email, "role": role},
    }


@app.post("/api/login")
def login_user(body: LoginIn):
    if not body.email or not body.email.strip():
        raise HTTPException(400, "Email address is required.")
    if not body.password or not body.password.strip():
        raise HTTPException(400, "Password is required.")
    if len(body.password) < 4:
        raise HTTPException(400, "Password is required and must be at least 4 characters long.")
    if body.role not in ("student", "teacher"):
        raise HTTPException(400, f"Invalid role {body.role!r}. Must be 'student' or 'teacher'.")

    try:
        user, err = state.register_or_authenticate_user(body.email, body.password, body.role, body.name)
    except Exception as exc:
        logger.error("login_user DB error: %s", exc, exc_info=True)
        raise HTTPException(503, "Authentication service unavailable. Please try again shortly.")

    if err:
        raise HTTPException(400, err)

    return {
        "success": True,
        "user": {
            "name":  user["name"],
            "email": user["email"],
            "role":  user["role"],
        },
    }


@app.post("/api/answer")
def answer(body: AnswerIn):
    if not body.answer or not body.answer.strip():
        raise HTTPException(400, "Answer cannot be empty.")
    if body.attempt < 1:
        raise HTTPException(400, "Attempt number must be at least 1.")
    if not body.studentId or not body.studentId.strip():
        raise HTTPException(400, "studentId is required.")

    q = question(body.questionId)
    a = norm(body.answer)
    correct = a in q["answers_norm"]
    label = None
    conf = 0.4

    try:
        if correct:
            if body.attempt == 1:
                move(body.studentId, q["concept"], "first_try")
        else:
            label, conf = q["wrong_norm"].get(a, ("Unclassified error", 0.4))
            state.add_misconception(body.studentId, q["concept"], label)
            move(body.studentId, q["concept"], "miss")
        state.log_attempt(body.studentId, body.questionId, body.answer, correct, body.attempt, label)
    except Exception as exc:
        logger.error("answer(): state update error: %s", exc, exc_info=True)
        # Continue — return the correctness result even if state update failed

    out = {"correct": correct, "mastery": state.get_mastery(body.studentId)}

    if not correct:
        level = min(max(body.attempt, 1), 3)
        out["misconception"] = {"label": label, "confidence": conf}
        try:
            message = llm.tutor_message(level, q, body.answer, label, q["ladder"][level - 1])
        except Exception as exc:
            logger.warning("LLM message failed, using scripted: %s", exc)
            message = q["ladder"][level - 1]
        out["intervention"] = {
            "level":   level,
            "type":    ["probe", "hint", "explanation"][level - 1],
            "message": message,
        }
    return out


@app.post("/api/recovery")
def recovery(body: RecoveryIn):
    if not body.answer or not body.answer.strip():
        raise HTTPException(400, "Recovery answer cannot be empty.")
    if not body.studentId or not body.studentId.strip():
        raise HTTPException(400, "studentId is required.")

    q = question(body.questionId)
    recovered = norm(body.answer) in q["recovery_norm"]

    try:
        if recovered:
            state.clear_misconceptions(body.studentId, q["concept"])
        move(body.studentId, q["concept"], "recovered" if recovered else "recovery_miss")
        state.log_attempt(body.studentId, body.questionId + ":recovery", body.answer, recovered, 0, None)
    except Exception as exc:
        logger.error("recovery(): state update error: %s", exc, exc_info=True)

    return {"recovered": recovered, "mastery": state.get_mastery(body.studentId)}


@app.post("/api/quizzes/start")
def start_quiz(body: QuizStartIn):
    student = body.studentId.strip()
    if not student:
        raise HTTPException(400, "studentId is required.")
    requested = body.subject.strip().lower()
    if requested in ("all", "all subjects"):
        subject = "All subjects"
        question_ids = list(Q.QUESTIONS)
    else:
        subject = next((name for name in Q.SUBJECTS if name.lower() == requested), None)
        if subject is None:
            raise HTTPException(400, f"Unknown subject. Choose one of: {list(Q.SUBJECTS)} or 'all'.")
        question_ids = list(Q.SUBJECTS[subject])
    random.shuffle(question_ids)
    session_id = secrets.token_urlsafe(24)
    state.create_quiz_session(session_id, student, subject, question_ids)
    return _quiz_payload(state.get_quiz_session(session_id))


@app.get("/api/quizzes/{session_id}")
def resume_quiz(session_id: str, studentId: str):
    return _quiz_payload(_quiz_session(session_id, studentId.strip()))


@app.post("/api/quizzes/{session_id}/answer")
def answer_quiz(session_id: str, body: QuizAnswerIn):
    student = body.studentId.strip()
    session = _quiz_session(session_id, student)
    if session["phase"] == "complete":
        raise HTTPException(409, "This quiz is already complete.")

    qid = session["question_ids"][session["question_index"]]
    q = Q.QUESTIONS[qid]
    answer_text = body.answer.strip()
    normalized_answer = norm(answer_text)
    is_correct = normalized_answer in (q["recovery_norm"] if session["phase"] == "recovery" else q["answers_norm"])

    if session["phase"] == "recovery":
        try:
            if is_correct:
                state.clear_misconceptions(student, q["concept"])
                move(student, q["concept"], "recovered")
            else:
                move(student, q["concept"], "recovery_miss")
            state.log_attempt(student, qid + ":recovery", answer_text, is_correct, 0, None)
        except Exception as exc:
            logger.warning("Quiz recovery state update failed: %s", exc, exc_info=True)
        if not is_correct:
            return {
                "correct": False,
                "stage": "recovery_retry",
                "feedback": f"Not quite. Try the recovery question again. Hint: {q['ladder'][1]}",
                "recovery": _quiz_question(session),
                "progress": _quiz_payload(session),
            }
        next_session = _advance_quiz(session, session["score"])
        return {
            "correct": True,
            "stage": "recovered",
            "feedback": "Correct. You have recovered this concept.",
            "next": _quiz_payload(next_session),
            "mastery": state.get_mastery(student),
        }

    attempt = session["attempts"] + 1
    label, _confidence = q["wrong_norm"].get(normalized_answer, ("Unclassified error", 0.4))
    try:
        if is_correct:
            if attempt == 1:
                move(student, q["concept"], "first_try")
            else:
                state.clear_misconceptions(student, q["concept"])
                move(student, q["concept"], "recovered")
        else:
            state.add_misconception(student, q["concept"], label)
            move(student, q["concept"], "miss")
        state.log_attempt(student, qid, answer_text, is_correct, attempt, None if is_correct else label)
    except Exception as exc:
        logger.warning("Quiz answer state update failed: %s", exc, exc_info=True)

    if is_correct and attempt == 1:
        next_session = _advance_quiz(session, session["score"] + 1)
        return {
            "correct": True,
            "stage": "first_try",
            "feedback": "Correct on the first attempt.",
            "next": _quiz_payload(next_session),
            "mastery": state.get_mastery(student),
        }

    if is_correct or attempt >= 3:
        score = session["score"] + int(is_correct)
        state.update_quiz_session(session_id, session["question_index"], "recovery", attempt, score)
        recovery_session = state.get_quiz_session(session_id)
        answer_line = f"The correct answer is {q['answers'][0]}. {q['ladder'][2]}"
        if is_correct:
            answer_line = f"Correct. {q['ladder'][2]}"
        return {
            "correct": is_correct,
            "stage": "recovery",
            "feedback": f"{answer_line}\nNow answer this recovery question from the same topic:",
            "recovery": _quiz_question(recovery_session),
            "progress": _quiz_payload(recovery_session),
            "mastery": state.get_mastery(student),
        }

    state.update_quiz_session(session_id, session["question_index"], "question", attempt, session["score"])
    if attempt == 1:
        feedback = "That answer is not correct yet. Try again; you have two attempts remaining."
        stage = "first_miss"
    else:
        feedback = f"That answer is still not correct. Hint: {q['ladder'][1]}"
        stage = "hint"
    return {
        "correct": False,
        "stage": stage,
        "feedback": feedback,
        "progress": _quiz_payload(state.get_quiz_session(session_id)),
    }


@app.get("/api/state/{student}")
def learner_state(student: str):
    if not student or not student.strip():
        raise HTTPException(400, "Student id cannot be empty.")
    try:
        return {"mastery": state.get_mastery(student)}
    except Exception as exc:
        logger.error("learner_state error: %s", exc, exc_info=True)
        raise HTTPException(503, "Could not retrieve learner state.")


@app.get("/api/teacher")
def teacher():
    try:
        students = []
        for s in state.real_students():
            m = state.get_mastery(s)
            students.append({"name": s, "mastery": [m[c] for c in Q.CONCEPTS]})
        mis = {}
        for k, v in state.misconception_counts().items():
            if k:  # skip null labels
                mis[k] = mis.get(k, 0) + int(v)
        return {
            "students": students,
            "misconceptions": sorted(mis.items(), key=lambda x: -x[1]),
        }
    except Exception as exc:
        logger.error("teacher() endpoint error: %s", exc, exc_info=True)
        raise HTTPException(503, "Could not load teacher data. Please try again.")


def _is_at_risk(mastery: dict[str, float]) -> bool:
    values = list(mastery.values())
    return bool(values) and (sum(values) / len(values) < 0.45 or min(values) < 0.3)


@app.post("/api/assignments")
def create_assignment(body: AssignmentIn):
    if not body.title.strip():
        raise HTTPException(400, "Give the activity a title.")
    if body.subject not in Q.SUBJECTS:
        raise HTTPException(400, f"Unknown subject {body.subject!r}. Valid: {list(Q.SUBJECTS)}")
    if not body.questionIds:
        raise HTTPException(400, "Pick at least one question.")
    invalid_ids = [qid for qid in body.questionIds if qid not in Q.SUBJECTS[body.subject]]
    if invalid_ids:
        raise HTTPException(400, f"Questions not in {body.subject}: {invalid_ids}")
    if body.mode not in ("all", "selected", "at_risk"):
        raise HTTPException(400, "mode must be 'all', 'selected' or 'at_risk'.")

    students = body.students
    if body.mode == "selected" and not students:
        raise HTTPException(400, "Select at least one student.")

    try:
        return state.create_assignment(
            body.title.strip()[:120],
            body.subject,
            body.questionIds,
            body.mode,
            students if body.mode == "selected" else [],
            body.due,
            body.note.strip()[:500],
            body.teacher,
        )
    except Exception as exc:
        logger.error("create_assignment error: %s", exc, exc_info=True)
        raise HTTPException(503, "Could not save the assignment. Please try again.")


@app.get("/api/assignments")
def list_assignments():
    return {"assignments": state.list_assignments()}


@app.get("/api/assignments/student/{student}")
def student_assignments(student: str):
    if not student.strip():
        raise HTTPException(400, "Student id cannot be empty.")
    risk = _is_at_risk(state.get_mastery(student))
    assignments = [
        assignment for assignment in state.list_assignments()
        if assignment["mode"] == "all"
        or (assignment["mode"] == "selected" and student in assignment["students"])
        or (assignment["mode"] == "at_risk" and risk)
    ]
    return {"assignments": assignments}



# ═══════════════════════════════════════════════════════════════════════════
# NEW: subjects, adaptive question picker, and analytics
# ═══════════════════════════════════════════════════════════════════════════
def _public(qid: str, q: dict) -> dict:
    """Question fields that are safe to send to a student (no answers)."""
    return {"id": qid, "subject": q["category"], "concept": q["concept"], "text": q["text"], "difficulty": q["difficulty"]}


@app.get("/api/subjects")
def subjects(studentId: str | None = None):
    mastery = state.get_mastery(studentId) if studentId else None
    out = []
    for name, bank in Q.SUBJECTS.items():
        concepts = [q["concept"] for q in bank.values()]
        item = {"name": name, "questionCount": len(bank), "concepts": concepts}
        if mastery:
            item["avgMastery"] = round(sum(mastery[c] for c in concepts) / len(concepts), 3)
        out.append(item)
    return {"subjects": out}


@app.get("/api/questions")
def list_questions(subject: str | None = None):
    if subject and subject not in Q.SUBJECTS:
        raise HTTPException(404, f"Unknown subject {subject!r}. Valid: {list(Q.SUBJECTS)}")
    pool = Q.SUBJECTS[subject] if subject else Q.QUESTIONS
    return {"questions": [_public(qid, q) for qid, q in pool.items()]}


@app.get("/api/questions/next")
def next_question(studentId: str, subject: str | None = None):
    """Adaptive pick: match difficulty to mastery, avoid repeating the last question."""
    if subject and subject not in Q.SUBJECTS:
        raise HTTPException(404, f"Unknown subject {subject!r}. Valid: {list(Q.SUBJECTS)}")
    pool = Q.SUBJECTS[subject] if subject else Q.QUESTIONS
    mastery = state.get_mastery(studentId)
    last = state.last_question(studentId)

    def target(m: float) -> int:
        return 1 if m < 0.4 else 2 if m < 0.7 else 3

    def score(item):
        qid, q = item
        m = mastery[q["concept"]]
        return (qid == last, abs(q["difficulty"] - target(m)), m)

    qid, q = min(pool.items(), key=score)
    m = mastery[q["concept"]]
    return {"question": _public(qid, q), "reason": f"Mastery in {q['concept']} is {round(m * 100)}%, so difficulty {q['difficulty']} fits."}


def _roster() -> list:
    """Return learners with recorded practice data."""
    return [(student, state.get_mastery(student)) for student in state.real_students()]


@app.get("/api/analytics/student/{student}")
def student_analytics(student: str):
    if not student or not student.strip():
        raise HTTPException(400, "Student id cannot be empty.")
    try:
        mastery = state.get_mastery(student)
        rows = state.attempts_for(student)
        real = [r for r in rows if r[0] in Q.QUESTIONS]                # skips ":recovery" rows
        first = [r for r in real if r[2] == 1]                          # first attempt per question
        recoveries = [r for r in rows if r[0].endswith(":recovery")]

        by_subject = {name: {"attempted": 0, "correct": 0} for name in Q.SUBJECTS}
        for qid, correct, _a, _l, _ts in first:
            b = by_subject[Q.QUESTIONS[qid]["category"]]
            b["attempted"] += 1
            b["correct"] += int(correct)
        for b in by_subject.values():
            b["accuracy"] = round(b["correct"] / b["attempted"], 3) if b["attempted"] else None

        streak = 0
        for r in reversed(first):
            if not r[1]:
                break
            streak += 1
        best = run = 0
        for r in first:
            run = run + 1 if r[1] else 0
            best = max(best, run)

        mis: dict = {}
        for r in real:
            if r[3]:
                mis[r[3]] = mis.get(r[3], 0) + 1

        subject_mastery = {
            name: round(sum(mastery[q["concept"]] for q in bank.values()) / len(bank), 3)
            for name, bank in Q.SUBJECTS.items()
        }
        weakest = sorted(mastery.items(), key=lambda kv: kv[1])[:3]
        first_correct = sum(int(r[1]) for r in first)
        questions_solved = len({r[0] for r in real if r[1]})
        return {
            "student": student,
            "totalAttempts": len(real),
            "questionsSolved": questions_solved,
            "firstTryAccuracy": round(first_correct / len(first), 3) if first else None,
            "currentStreak": streak,
            "bestStreak": best,
            "recoveriesCompleted": sum(int(r[1]) for r in recoveries),
            "bySubject": by_subject,
            "subjectMastery": subject_mastery,
            "weakestConcepts": [{"concept": c, "mastery": round(v, 3)} for c, v in weakest],
            "misconceptions": sorted(mis.items(), key=lambda kv: -kv[1]),
            "masteryTrend": [{"ts": ts, "overall": round(v, 3)} for ts, v in state.mastery_history(student)],
        }
    except Exception as exc:
        logger.error("student_analytics error: %s", exc, exc_info=True)
        raise HTTPException(503, "Could not compute student analytics.")


@app.get("/api/analytics/class")
def class_analytics():
    try:
        roster = _roster()
        if not roster:
            return {
                "students": 0,
                "totalAttempts": 0,
                "subjectAverages": {name: 0 for name in Q.SUBJECTS},
                "conceptAverages": [],
                "atRisk": [],
                "topMisconceptions": [],
                "hardestQuestions": [],
                "activity": [],
                "includesDemoData": False,
            }
        n = len(roster)

        subject_avgs = {
            name: round(sum(m[q["concept"]] for _, m in roster for q in bank.values()) / (n * len(bank)), 3)
            for name, bank in Q.SUBJECTS.items()
        }
        concept_avgs = sorted(
            ({"concept": c, "subject": next(q["category"] for q in Q.QUESTIONS.values() if q["concept"] == c),
              "mastery": round(sum(m[c] for _, m in roster) / n, 3)} for c in Q.CONCEPTS),
            key=lambda x: x["mastery"],
        )
        at_risk = []
        for name, m in roster:
            avg = sum(m.values()) / len(m)
            weakest = min(m, key=m.get)
            if avg < 0.45 or m[weakest] < 0.3:
                at_risk.append({"name": name, "average": round(avg, 3), "weakestConcept": weakest, "weakestMastery": round(m[weakest], 3)})
        at_risk.sort(key=lambda x: x["average"])

        mis = {}
        for k, v in state.misconception_counts().items():
            if k:
                mis[k] = mis.get(k, 0) + int(v)

        hardest = []
        for qid, (total, correct) in state.question_stats().items():
            if qid in Q.QUESTIONS:
                q = Q.QUESTIONS[qid]
                hardest.append({"id": qid, "subject": q["category"], "concept": q["concept"], "text": q["text"],
                                "attempts": total, "firstTryAccuracy": round(correct / total, 3)})
        hardest.sort(key=lambda x: (x["firstTryAccuracy"], -x["attempts"]))

        return {
            "students": len(roster),
            "totalAttempts": state.total_attempts(),
            "subjectAverages": subject_avgs,
            "conceptAverages": concept_avgs,
            "atRisk": at_risk,
            "topMisconceptions": sorted(mis.items(), key=lambda kv: -kv[1])[:8],
            "hardestQuestions": hardest[:5],
            "activity": [{"date": d, "attempts": c} for d, c in state.daily_activity()],
            "includesDemoData": False,
        }
    except Exception as exc:
        logger.error("class_analytics error: %s", exc, exc_info=True)
        raise HTTPException(503, "Could not compute class analytics.")
