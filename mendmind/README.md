# Reason x – adaptive tutor (frontend + backend)

## 1. Backend (Python 3.10+)
    cd backend
    python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
Check http://localhost:8000/api/health and http://localhost:8000/docs

Optional real LLM wording (free, local): install Ollama, `ollama pull qwen2.5:3b`, then
    OLLAMA_MODEL=qwen2.5:3b uvicorn main:app --reload --port 8000
Without it, the scripted probe/hint/explanation ladder is used. Correctness and mastery are always deterministic.

## 2. Frontend (Node 18+)
    cd frontend
    npm install
    npm run dev          # http://localhost:3000
`frontend/.env.local` starts with NEXT_PUBLIC_USE_MOCK=true (no backend needed).
Set it to false to use the FastAPI backend.

## Demo path
Practice -> "Fill a wrong answer" -> Check (probe) x3 -> "Try a fresh question" -> answer correctly -> mastery rises.
Then open Teacher view: your row updates live (auto-refreshes every 4 s in backend mode).

## Files that matter
- backend/questions.py  question bank + misconceptions (change subject here AND in frontend/src/lib/mock.ts)
- backend/main.py       endpoints: POST /api/answer, POST /api/recovery, GET /api/teacher, GET /api/state/{id}
- backend/state.py      SQLite learner state (mastery, misconception counts, attempt log)
- backend/llm.py        optional Ollama wording layer
- frontend/src/lib/api.ts  the only place the UI talks to the backend
