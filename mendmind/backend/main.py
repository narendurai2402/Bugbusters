"""Reason x API. Run: uvicorn main:app --reload --port 8000"""
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import questions as Q, state, llm

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Reason x API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


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

class AnswerIn(BaseModel):
    questionId: str
    answer: str
    attempt: int = 1
    studentId: str = "demo"

class RecoveryIn(BaseModel):
    questionId: str
    answer: str
    studentId: str = "demo"


# ── Helpers ────────────────────────────────────────────────────────────────
norm = lambda s: "".join(s.split()).lower()

def question(qid: str) -> dict:
    if not qid or qid not in Q.QUESTIONS:
        raise HTTPException(404, f"Unknown question id: {qid!r}. Valid ids: {list(Q.QUESTIONS.keys())}")
    return Q.QUESTIONS[qid]

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
    return {"ok": True, "llm": llm.MODEL or "scripted"}


@app.post("/api/login")
def login_user(body: LoginIn):
    if not body.email or not body.email.strip():
        raise HTTPException(400, "Email address is required.")
    if not body.password or not body.password.strip():
        raise HTTPException(400, "Password is required.")
    if len(body.password.strip()) < 4:
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
    correct = a in q["answers"]
    label = None
    conf = 0.4

    try:
        if correct:
            if body.attempt == 1:
                move(body.studentId, q["concept"], "first_try")
        else:
            label, conf = q["wrong"].get(a, ("Unclassified error", 0.4))
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
    recovered = norm(body.answer) in q["recovery"]["answers"]

    try:
        if recovered:
            state.clear_misconceptions(body.studentId, q["concept"])
        move(body.studentId, q["concept"], "recovered" if recovered else "recovery_miss")
        state.log_attempt(body.studentId, body.questionId + ":recovery", body.answer, recovered, 0, None)
    except Exception as exc:
        logger.error("recovery(): state update error: %s", exc, exc_info=True)

    return {"recovered": recovered, "mastery": state.get_mastery(body.studentId)}


@app.get("/api/state/{student}")
def learner_state(student: str):
    if not student or not student.strip():
        raise HTTPException(400, "Student id cannot be empty.")
    try:
        return {"mastery": state.get_mastery(student)}
    except Exception as exc:
        logger.error("learner_state error: %s", exc, exc_info=True)
        raise HTTPException(503, "Could not retrieve learner state.")


# Seeded demo class so teacher dashboard is never empty
SEED = [
    (n, [max(0.1, min(0.95, 0.25 + ((i * 37 + j * 53) % 60) / 100)) for j in range(len(Q.CONCEPTS))])
    for i, n in enumerate(["Aarav","Divya","Karthik","Meena","Ravi","Sneha","Arjun","Lakshmi","Vikram","Nisha","Suresh","Priya"])
]
SEED_MIS = {
    "Adds tops and bottoms": 14,
    "Bigger denominator means bigger fraction": 9,
    "Divides only the numerator": 6,
    "Cross-multiplies when adding": 3,
}


@app.get("/api/teacher")
def teacher():
    try:
        students = [{"name": n, "mastery": m} for n, m in SEED]
        for s in state.real_students():
            m = state.get_mastery(s)
            label = "You (live)" if s == "demo" else s
            students.append({"name": label, "mastery": [m[c] for c in Q.CONCEPTS]})
        mis = dict(SEED_MIS)
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
