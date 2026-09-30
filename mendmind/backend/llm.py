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


def chat_reply(messages: list[dict[str, str]]) -> str:
    """Generate a conversational tutoring response with the configured Ollama model."""
    if not MODEL:
        raise RuntimeError("No chat model is configured. Set OLLAMA_MODEL and restart the backend.")

    conversation = [{
        "role": "system",
        "content": (
            "You are Reason X, a patient, precise AI tutor. Explain ideas clearly, ask useful follow-up "
            "questions, and adapt to the learner's level. Show your reasoning in concise teaching steps, "
            "but do not claim certainty when you are unsure. Use plain text and readable code blocks."
        ),
    }]
    conversation.extend(messages[-16:])

    try:
        response = httpx.post(
            f"{URL}/api/chat",
            json={"model": MODEL, "messages": conversation, "stream": False},
            timeout=60,
        )
        response.raise_for_status()
        content = response.json().get("message", {}).get("content", "").strip()
    except (httpx.HTTPError, ValueError) as exc:
        raise RuntimeError("Could not reach the configured Ollama model. Check that Ollama is running and the model is available.") from exc

    if not content:
        raise RuntimeError("The configured AI model returned an empty response.")
    return content
