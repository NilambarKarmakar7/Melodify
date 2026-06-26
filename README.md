# Melodify - Spotify-Like AI Chatbot Song Recommender

Melodify is a modern, premium single-page web application featuring a functional Spotify clone layout integrated with an **AI Music Chatbot Guide**. The application leverages a Python (FastAPI + Pandas) backend querying a Kaggle-style Spotify track dataset (`songs.csv`) and serves a custom, responsive HTML/CSS/JS frontend.

## Visual Design & Aesthetics

*   **Left Sidebar**: Sleek, modern slate-grey (`#3e3e42`) panel with white text, vector icons, and gold-yellow (`#f5c518`) highlight details.
*   **Main workspace**: Clean, premium white dashboard displaying cards, circular artist avatars, song list tables, and the chat console.
*   **Right "Now Playing" Pane**: Live display of the currently playing track art, metadata, and the upcoming queue.
*   **Bottom Player Bar**: Floating dark capsule/pill-shaped bar containing playback controls, volume utility, and an animated soundwave seeker.
*   **Chatbot Console**: Integrated dialogue with the AI mascot **Melodify** to request music based on mood, actions, or genres.
*   **Analytics Screen**: Custom taste profile visualization (genres and moods) populated dynamically.

---

## File Structure

```
chatbot/
├── main.py              # FastAPI server serving API endpoints and static views
├── recommender.py       # Intent-parsing NLP recommendation logic
├── songs.csv            # Kaggle-style Spotify CSV tracks dataset
├── static/
│   ├── index.html       # Web structure (Home, Search, Chat, Stats tabs)
│   ├── styles.css       # Premium custom Spotify styles
│   └── app.js           # Client-side SPA routing, player logic & API calls
└── README.md            # Project documentation (this file)
```

---

## Getting Started

### Prerequisites
Make sure Python is installed. The required libraries are already installed in this environment:
*   `fastapi`
*   `uvicorn`
*   `pandas`

If running on a clean machine, install them using:
```bash
pip install fastapi uvicorn pandas
```

### Running the Application

1.  Start the FastAPI backend server:
    ```bash
    python main.py
    ```
2.  Open your browser and navigate to:
    [http://localhost:8000](http://localhost:8000)

---

## How to Test the Recommender Chatbot

Open the **AI Chat** tab in the sidebar and enter prompts like:
*   *"I'm feeling really stressed today, play something calm."*
*   *"Study mode activated. Need some lofi beats to concentrate."*
*   *"I want to dance, give me energetic pop!"*
*   *"Show me some sad rock tracks"*

The chatbot will detect your sentiment/mood or genre, reply with a custom message, and present interactive song cards in the chat window. Click the **Play** button on any card to load it directly into the player!
