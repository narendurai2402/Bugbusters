"""Optional LLM wording. Set OLLAMA_MODEL (e.g. qwen2.5:3b) to enable; otherwise scripted messages are used.
Correctness and mastery are ALWAYS decided by deterministic code, never by the LLM."""
import os
import httpx

MODEL = os.getenv("OLLAMA_MODEL")
URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
STYLE = {1: "Ask ONE short question that makes them explain their reasoning. Do not reveal the answer.",
         2: "Give ONE hint that nudges them. Do not reveal the answer.",
         3: "Explain the correct solution step by step in at most 3 short sentences."}

def tutor_message(level: int, question: dict, answer: str, label: str, scripted: str) -> str:
    if not MODEL:
        return scripted
    prompt = (f"You are a kind maths tutor. Question: {question['text']}. Student answered: {answer}. "
              f"Likely misconception: {label}. {STYLE[level]} Max 50 words.")
    try:
        r = httpx.post(f"{URL}/api/generate", json={"model": MODEL, "prompt": prompt, "stream": False}, timeout=20)
        return r.json().get("response", "").strip() or scripted
    except Exception:
        return scripted
