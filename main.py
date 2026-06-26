import os
from typing import List, Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from recommender import SongRecommender

try:
    from groq import Groq
except Exception:
    Groq = None


load_dotenv("api.env")

app = FastAPI(title="Melodify API", description="Backend for Melodify Song Recommender")
recommender = SongRecommender("songs.csv")
os.makedirs("static", exist_ok=True)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY")) if Groq and os.getenv("GROQ_API_KEY") else None


class ChatHistoryItem(BaseModel):
    sender: Literal["user", "bot"]
    text: str
    timestamp: Optional[str] = None


class ChatMessage(BaseModel):
    message: str
    history: List[ChatHistoryItem] = []


@app.get("/")
async def read_index():
    return FileResponse("static/index.html")


@app.get("/api/songs")
async def get_songs(q: str = None):
    if q:
        return recommender.search_songs(q)
    return recommender.get_all_songs()


@app.post("/api/chat")
async def chat_recommender(chat_msg: ChatMessage):
    user_input = chat_msg.message.strip()
    context_text = " ".join(
        item.text for item in chat_msg.history[-8:] if item.sender == "user"
    )
    recommendation_query = f"{context_text} {user_input}".strip()
    response_text, recommended_songs = recommender.recommend(recommendation_query)

    ai_reply = build_fallback_reply(user_input, response_text)
    if groq_client:
        ai_reply = generate_ai_reply(chat_msg.history, user_input, response_text)

    return {
        "response": ai_reply,
        "songs": recommended_songs,
    }


@app.get("/api/analytics")
async def get_analytics(likes: str = ""):
    liked_ids = [s.strip() for s in likes.split(",") if s.strip()]
    return recommender.get_stats(liked_ids)


def generate_ai_reply(history: List[ChatHistoryItem], user_input: str, recommendation_text: str) -> str:
    messages = [
        {
            "role": "system",
            "content": (
                "You are Melodify, a warm AI music companion. Understand the user's mood, "
                "emotion, activity, and prior context. Continue the conversation naturally. "
                "If the user shares something emotional, acknowledge it first. Then, when useful, "
                "connect that feeling to music. Keep replies concise: 2-4 sentences. Do not list "
                "song names yourself because the app renders song cards separately."
            ),
        }
    ]

    for item in history[-8:]:
        role = "assistant" if item.sender == "bot" else "user"
        messages.append({"role": role, "content": item.text})

    messages.append(
        {
            "role": "user",
            "content": (
                f"{user_input}\n\n"
                f"Recommendation context from the library: {recommendation_text}"
            ),
        }
    )

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=180,
        )
        return completion.choices[0].message.content.strip()
    except Exception:
        return build_fallback_reply(user_input, recommendation_text)


def build_fallback_reply(user_input: str, recommendation_text: str) -> str:
    text = user_input.lower()
    if any(word in text for word in ["bad day", "sad", "upset", "tired", "lonely", "depressed", "stressed", "anxious"]):
        return f"I'm sorry you're feeling that way. I picked calmer tracks that can give you a little breathing room. {recommendation_text}"
    if any(word in text for word in ["gym", "workout", "run", "running", "energetic", "hype", "motivation"]):
        return f"Got it. You want something high-energy and active. {recommendation_text}"
    if any(word in text for word in ["study", "focus", "work", "concentrate"]):
        return f"I'll keep it steady and low-distraction for focus. {recommendation_text}"
    if any(word in text for word in ["happy", "good mood", "party", "dance"]):
        return f"Nice. I'll lean into brighter, more upbeat tracks. {recommendation_text}"
    return f"I understand. I'll use what you said to shape the next recommendations. {recommendation_text}"


app.mount("/", StaticFiles(directory="static"), name="static")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
