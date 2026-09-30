# Reason x – adaptive tutor (frontend + backend)

## 1. Backend (Python 3.10+)
    cd backend
    python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
Check http://localhost:8000/api/health and http://localhost:8000/docs

AI Tutor conversation uses a local Ollama chat model. Install Ollama and download a model once:
    ollama pull llama3.2

In PowerShell, from `backend`, set the model before starting the API:
    $env:OLLAMA_MODEL = "llama3.2:latest"
    python -m uvicorn main:app --reload --port 8000

Ollama defaults to `http://localhost:11434`; set `OLLAMA_URL` if it runs elsewhere. Verify `/api/health` reports `aiReady: true`. Without `OLLAMA_MODEL`, general chat is unavailable and the tutor explains how to configure it; deterministic answer checking and the probe/hint/explanation ladder remain available.

## 2. Frontend (Node 18+)
    cd frontend
    npm install
    npm run dev          # http://localhost:3000
The supplied eight-page HTML experience is served from `frontend/public`. Login, tutor practice, student analytics, teacher analytics, and assignments use the FastAPI backend; the browser keeps the returned user session in localStorage. Open http://localhost:3000; the short paths `/login`, `/signup`, and `/student` also redirect to the matching HTML pages.

Signup sends a one-time verification code by email. Configure SMTP in the backend process before starting it; signup fails clearly if delivery is not configured:

```powershell
$env:SMTP_HOST = "smtp.gmail.com"
$env:SMTP_PORT = "587"
$env:SMTP_USERNAME = "your-sender@gmail.com"
$env:SMTP_PASSWORD = "your-app-password"
$env:SMTP_FROM = "your-sender@gmail.com"
$env:SMTP_STARTTLS = "true"
$env:OTP_HASH_SECRET = "a-long-random-secret"
```

The six-digit code expires after 10 minutes, resend is limited to once every 45 seconds, and five incorrect attempts invalidate the challenge. New accounts are saved only after successful verification. Google/Microsoft sign-in remain placeholders. Course enrollment, learning time, attendance, and lecture scheduling are not provided by the current API, so those parts are not live data. The older React practice/auth pages remain in the source tree but are not used by these static HTML routes.

## Getting started
Create a student or teacher account, verify the email code, then sign in to the role-specific dashboard. New accounts start with empty progress, no assignments, and no scheduled sessions. Practice data appears after the student completes quiz questions.

## Files that matter
- backend/questions.py  question bank + misconceptions (change subject here AND in frontend/src/lib/mock.ts)
- backend/main.py       endpoints: POST /api/chat, POST /api/answer, POST /api/recovery, GET /api/teacher, GET /api/state/{id}
- backend/state.py      SQLite learner state (mastery, misconception counts, attempt log)
- backend/llm.py        optional Ollama wording layer
- frontend/src/lib/api.ts  the only place the UI talks to the backend
