"""
setup_dataset.py
────────────────
Downloads the Spotify Million Song Dataset from Kaggle via kagglehub,
then intelligently processes it into a enriched songs.csv that Melodify
uses for recommendations.

Columns produced:
    track_id, track_name, artist_name, album_name, genre, mood,
    danceability, energy, valence, acousticness, audio_url, image_url, lyrics_snippet
"""

import kagglehub
import pandas as pd
import hashlib
import re
import os
import random

# ─── 1. Download Dataset ──────────────────────────────────────
print("📥 Downloading dataset from Kaggle...")
path = kagglehub.dataset_download("notshrirang/spotify-million-song-dataset")
print(f"✅ Dataset downloaded to: {path}")

# ─── 2. Load CSV ──────────────────────────────────────────────
csv_path = os.path.join(path, "spotify_millsongdata.csv")
if not os.path.exists(csv_path):
    # Try locating any CSV in the folder
    for f in os.listdir(path):
        if f.endswith(".csv"):
            csv_path = os.path.join(path, f)
            break

print(f"📂 Loading: {csv_path}")
df = pd.read_csv(csv_path)
print(f"   Shape: {df.shape}")
print(f"   Columns: {list(df.columns)}")

# ─── 3. Clean & Normalise ─────────────────────────────────────
df = df.dropna(subset=["song", "artist", "text"])
df = df.drop_duplicates(subset=["song", "artist"])
df = df.reset_index(drop=True)

# Rename to consistent names
df = df.rename(columns={"song": "track_name", "artist": "artist_name", "text": "lyrics"})

# ─── 4. NLP: Genre + Mood from Lyrics ────────────────────────
GENRE_KEYWORDS = {
    "Pop":        ["baby", "love you", "yeah yeah", "oh oh", "heart", "kiss", "dance", "music", "star"],
    "Rock":       ["rock", "guitar", "loud", "thunder", "storm", "rebel", "wild", "fire", "electric", "roll"],
    "Hip-Hop":    ["rap", "rhyme", "beat", "hustle", "street", "flow", "mic", "verse", "hood", "money"],
    "Jazz":       ["jazz", "blues", "swing", "trumpet", "piano", "soul", "groove", "melody", "smooth"],
    "Classical":  ["symphony", "orchestra", "sonata", "opus", "concerto", "aria", "classical", "choir"],
    "Electronic": ["electronic", "synth", "wave", "pulse", "digital", "bass", "drop", "edm", "club", "neon"],
    "R&B":        ["r&b", "rhythm", "blues", "silky", "smooth", "groove", "bedroom", "tears"],
    "Country":    ["country", "truck", "farm", "cowboy", "highway", "boots", "southern", "dirt road", "creek"],
    "Lofi":       ["lo-fi", "lofi", "chill", "peaceful", "quiet", "study", "haze", "breeze", "drizzle"],
    "Indie":      ["indie", "alternative", "bedroom", "dreamy", "nostalgia", "wandering", "coffee"],
}

MOOD_KEYWORDS = {
    "Happy":     ["happy", "joy", "sunshine", "smiling", "laugh", "celebrate", "bright", "wonderful", "amazing"],
    "Sad":       ["sad", "cry", "tears", "alone", "lonely", "broken", "empty", "pain", "miss", "hurt", "gone"],
    "Energetic": ["run", "power", "strong", "jump", "fire", "speed", "rush", "fight", "wild", "electric"],
    "Calm":      ["calm", "peace", "quiet", "still", "soft", "gentle", "breathe", "rest", "dream", "slow"],
    "Romantic":  ["love", "kiss", "heart", "together", "forever", "darling", "beautiful", "hold", "close"],
    "Focus":     ["study", "think", "mind", "focus", "deep", "work", "clear", "concentration", "flow"],
}

def detect_genre(lyrics_lower):
    scores = {}
    for genre, kws in GENRE_KEYWORDS.items():
        scores[genre] = sum(1 for kw in kws if kw in lyrics_lower)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else random.choice(list(GENRE_KEYWORDS.keys()))

def detect_mood(lyrics_lower):
    scores = {}
    for mood, kws in MOOD_KEYWORDS.items():
        scores[mood] = sum(1 for kw in kws if kw in lyrics_lower)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else random.choice(list(MOOD_KEYWORDS.keys()))

def pseudo_feature(seed, low, high):
    """Deterministic pseudo-random float in [low, high] based on seed string."""
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    return round(low + (h % 1000) / 1000 * (high - low), 2)

print("🔍 Running NLP classification (genre + mood)...")
genres, moods, danceabilities, energies, valences, acousticnesses = [], [], [], [], [], []

for i, row in df.iterrows():
    lyr = str(row["lyrics"]).lower()[:2000]  # first 2000 chars for speed
    seed = f"{row['track_name']}{row['artist_name']}"
    
    g = detect_genre(lyr)
    m = detect_mood(lyr)
    
    genres.append(g)
    moods.append(m)
    danceabilities.append(pseudo_feature(seed + "d", 0.3, 0.95))
    energies.append(pseudo_feature(seed + "e", 0.2, 0.98))
    valences.append(pseudo_feature(seed + "v", 0.1, 0.99))
    acousticnesses.append(pseudo_feature(seed + "a", 0.1, 0.9))

df["genre"] = genres
df["mood"] = moods
df["danceability"] = danceabilities
df["energy"] = energies
df["valence"] = valences
df["acousticness"] = acousticnesses

# ─── 5. Assign IDs & Metadata ────────────────────────────────
# track_id: deterministic short hash
df["track_id"] = df.apply(lambda r: "S" + hashlib.md5(f"{r['track_name']}{r['artist_name']}".encode()).hexdigest()[:7].upper(), axis=1)

# album_name: derive from artist and genre (cosmetic)
df["album_name"] = df["artist_name"].str.title() + " — " + df["genre"] + " Collection"

# ─── 6. Audio URLs (SoundHelix — 16 royalty-free tracks, cycled) ─
AUDIO_POOL = [f"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{i}.mp3" for i in range(1, 17)]
df["audio_url"] = [AUDIO_POOL[i % len(AUDIO_POOL)] for i in range(len(df))]

# ─── 7. Album Art URLs (Unsplash — genre-themed) ─────────────
GENRE_IMAGES = {
    "Pop":        ["photo-1470225620780-dba8ba36b745", "photo-1493225457124-a3eb161ffa5f", "photo-1535712376625-d8a2b73db0c3"],
    "Rock":       ["photo-1508700115892-45ecd05ae2ad", "photo-1525201548942-d8732f6617a0", "photo-1498038432885-c6f3f1b912ee"],
    "Hip-Hop":    ["photo-1518609878373-06d740f60d8b", "photo-1571609804773-8de8cb63e7c2", "photo-1600703099756-17b7695e4bb1"],
    "Jazz":       ["photo-1415201364774-f6f0bb35f28f", "photo-1511192336575-5a79af67a629", "photo-1514320291840-2e0a9bf2a9ae"],
    "Classical":  ["photo-1507838153414-b4b713384a76", "photo-1543722530-d2c3201371e7", "photo-1535016120720-40c646be5580"],
    "Electronic": ["photo-1470229538611-16ba8c7ffbd7", "photo-1574169208507-84376144848b", "photo-1516450360452-9312f5e86fc7"],
    "R&B":        ["photo-1459749411175-04bf5292ceea", "photo-1552581234-26160f608093", "photo-1513829596324-4bb2800c5efb"],
    "Country":    ["photo-1516280440614-37939bbacd81", "photo-1511379938547-c1f69419868d", "photo-1506157786151-b8491531f063"],
    "Lofi":       ["photo-1508700115892-45ecd05ae2ad", "photo-1485579149621-3123dd979885", "photo-1528715471579-d1bcf0ba5e83"],
    "Indie":      ["photo-1484876065684-b1cf98bd0268", "photo-1524368535928-5b5e00ddc76b", "photo-1485579149621-3123dd979885"],
}

def pick_image(genre, track_name):
    pool = GENRE_IMAGES.get(genre, GENRE_IMAGES["Pop"])
    idx = int(hashlib.md5(track_name.encode()).hexdigest(), 16) % len(pool)
    photo_id = pool[idx]
    return f"https://images.unsplash.com/{photo_id}?w=300&auto=format&fit=crop"

df["image_url"] = df.apply(lambda r: pick_image(r["genre"], r["track_name"]), axis=1)

# ─── 8. Lyrics Snippet (first 3 non-empty lines) ─────────────
def snippet(lyrics, n=3):
    lines = [l.strip() for l in str(lyrics).split("\n") if l.strip()]
    return " / ".join(lines[:n])

df["lyrics_snippet"] = df["lyrics"].apply(snippet)

# ─── 9. Select & Sample ──────────────────────────────────────
# Take 5000 representative songs (balanced across genres)
SAMPLE_PER_GENRE = 500
samples = []
for genre in GENRE_KEYWORDS:
    chunk = df[df["genre"] == genre].head(SAMPLE_PER_GENRE)
    samples.append(chunk)

df_final = pd.concat(samples).drop_duplicates("track_id").reset_index(drop=True)
print(f"📊 Final dataset size: {len(df_final)} tracks across {df_final['genre'].nunique()} genres")

# ─── 10. Save ─────────────────────────────────────────────────
OUTPUT_COLS = [
    "track_id", "track_name", "artist_name", "album_name",
    "genre", "mood", "danceability", "energy", "valence", "acousticness",
    "audio_url", "image_url", "lyrics_snippet"
]

# Only keep columns that exist
OUTPUT_COLS = [c for c in OUTPUT_COLS if c in df_final.columns]
df_final[OUTPUT_COLS].to_csv("songs.csv", index=False, encoding="utf-8")
print("✅ songs.csv saved with", len(df_final), "tracks!")
print("🎵 Genre distribution:")
print(df_final["genre"].value_counts().to_string())
print("\n🎭 Mood distribution:")
print(df_final["mood"].value_counts().to_string())
