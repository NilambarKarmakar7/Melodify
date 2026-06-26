"""
recommender.py
──────────────
Lyrics-aware recommendation engine for Melodify.
Works with the enriched songs.csv produced by setup_dataset.py
(columns: track_id, track_name, artist_name, album_name, genre, mood,
          danceability, energy, valence, acousticness,
          audio_url, image_url, lyrics_snippet)
"""

import pandas as pd
import re
import random

class SongRecommender:
    def __init__(self, csv_path='songs.csv'):
        try:
            self.df = pd.read_csv(csv_path)
            # Normalise text columns to lowercase for fast matching
            self.df['_genre_lc'] = self.df['genre'].str.lower().fillna('')
            self.df['_mood_lc']  = self.df['mood'].str.lower().fillna('')
            self.df['_artist_lc']= self.df['artist_name'].str.lower().fillna('')
            self.df['_title_lc'] = self.df['track_name'].str.lower().fillna('')
            self.df['_lyrics_lc']= self.df.get('lyrics_snippet', pd.Series([''] * len(self.df))).str.lower().fillna('')
            print(f"[Recommender] Loaded {len(self.df)} tracks.")
        except Exception as e:
            print(f"[Recommender] Error loading CSV: {e}")
            self.df = pd.DataFrame(columns=[
                'track_id','track_name','artist_name','album_name',
                'genre','mood','danceability','energy','valence',
                'acousticness','audio_url','image_url','lyrics_snippet'
            ])

    # ── Public API ──────────────────────────────────────────────

    def get_all_songs(self):
        return self._to_records(self.df)

    def search_songs(self, query):
        if self.df.empty or not query:
            return []
        q = query.lower().strip()
        mask = (
            self.df['_title_lc'].str.contains(q, na=False, regex=False) |
            self.df['_artist_lc'].str.contains(q, na=False, regex=False) |
            self.df['_genre_lc'].str.contains(q, na=False, regex=False) |
            self.df['_mood_lc'].str.contains(q, na=False, regex=False) |
            self.df['_lyrics_lc'].str.contains(q, na=False, regex=False)
        )
        return self._to_records(self.df[mask].head(50))

    def get_stats(self, liked_ids=None):
        if self.df.empty:
            return {"genres": {}, "moods": {}, "total_songs": 0, "liked_count": 0}

        liked_df = self.df[self.df['track_id'].isin(liked_ids)] if liked_ids else self.df
        return {
            "genres":      {k: int(v) for k, v in liked_df['genre'].value_counts().items()},
            "moods":       {k: int(v) for k, v in liked_df['mood'].value_counts().items()},
            "total_songs": len(self.df),
            "liked_count": len(liked_ids) if liked_ids else 0,
        }

    def recommend(self, user_input):
        if self.df.empty:
            return "Sorry, my music library is currently offline.", []

        text = user_input.lower().strip()

        # ── Intent Detection ─────────────────────────────────
        detected_genres = self._detect_genres(text)
        detected_moods  = self._detect_moods(text)
        detected_artist = self._detect_artist(text)
        threshold_filters = self._detect_thresholds(text)

        # ── Filter ───────────────────────────────────────────
        filtered = self.df.copy()

        # Artist match takes priority
        if detected_artist:
            artist_df = filtered[filtered['_artist_lc'].str.contains(detected_artist, regex=False)]
            if not artist_df.empty:
                tracks = self._to_records(artist_df.head(5))
                return f"Here are tracks by **{artist_df.iloc[0]['artist_name']}** I found in our library:", tracks

        if detected_genres:
            filtered = filtered[filtered['_genre_lc'].isin(detected_genres)]

        if detected_moods:
            mood_filtered = filtered[filtered['_mood_lc'].isin(detected_moods)]
            if not mood_filtered.empty:
                filtered = mood_filtered

        for col, op, val in threshold_filters:
            if col in filtered.columns:
                if op == '>':
                    filtered = filtered[filtered[col] > val]
                elif op == '<':
                    filtered = filtered[filtered[col] < val]

        # Lyrics keyword boost: rank by lyric match count
        if text and 'lyrics_snippet' in filtered.columns:
            words = re.findall(r'\b\w{4,}\b', text)
            if words:
                filtered = filtered.copy()
                filtered['_lyric_score'] = filtered['_lyrics_lc'].apply(
                    lambda lyr: sum(1 for w in words if w in lyr)
                )
                filtered = filtered.sort_values('_lyric_score', ascending=False)

        if filtered.empty:
            # Fallback: random sample
            sample = self.df.sample(min(5, len(self.df)))
            return "I couldn't find an exact match, but you might enjoy these tracks:", self._to_records(sample)

        # Sample up to 5, with some randomness so it's not always the same
        picks = filtered.head(20).sample(min(5, len(filtered)))
        tracks = self._to_records(picks)

        response = self._build_response(detected_genres, detected_moods, threshold_filters)
        return response, tracks

    # ── Private Helpers ──────────────────────────────────────

    def _detect_genres(self, text):
        GENRE_MAP = {
            'pop':        ['pop', 'popular'],
            'rock':       ['rock', 'guitar', 'metal', 'punk', 'grunge'],
            'hip-hop':    ['hip hop', 'hip-hop', 'rap', 'rapper', 'beats', 'rhyme', 'flow'],
            'jazz':       ['jazz', 'swing', 'blues'],
            'classical':  ['classical', 'orchestra', 'symphony', 'piano', 'violin'],
            'electronic': ['electronic', 'edm', 'techno', 'house', 'synth', 'rave', 'club'],
            'r&b':        ['r&b', 'rnb', 'soul', 'rhythm and blues'],
            'country':    ['country', 'cowboy', 'southern', 'bluegrass'],
            'lofi':       ['lofi', 'lo-fi', 'lo fi', 'chill beats', 'study music'],
            'indie':      ['indie', 'alternative', 'alt'],
        }
        found = set()
        for genre, keywords in GENRE_MAP.items():
            if any(kw in text for kw in keywords):
                found.add(genre)
        return list(found)

    def _detect_moods(self, text):
        MOOD_MAP = {
            'happy':     ['happy', 'joy', 'joyful', 'cheerful', 'uplifting', 'feel good', 'positive', 'sunshine', 'bright', 'good mood'],
            'sad':       ['sad', 'sadness', 'bad day', 'depressed', 'crying', 'cry', 'gloomy', 'lonely', 'heartbroken', 'melancholy', 'blue', 'upset', 'hurt'],
            'energetic': ['energetic', 'energy', 'hype', 'workout', 'gym', 'run', 'running', 'party', 'upbeat', 'high energy', 'power', 'active', 'motivation'],
            'calm':      ['calm', 'chill', 'relax', 'relaxing', 'peaceful', 'quiet', 'soothing', 'soft', 'serene', 'sleep', 'meditate', 'stressed', 'stress', 'anxious', 'anxiety', 'overwhelmed', 'tired'],
            'romantic':  ['romantic', 'romance', 'love', 'date', 'night', 'intimate', 'sweet nothings', 'candlelight'],
            'focus':     ['focus', 'study', 'studying', 'work', 'working', 'concentrate', 'reading', 'deep work', 'productivity'],
        }
        found = set()
        for mood, keywords in MOOD_MAP.items():
            if any(kw in text for kw in keywords):
                found.add(mood)
        return list(found)

    def _detect_artist(self, text):
        """Check if any known artist name is mentioned in the user query."""
        if self.df.empty:
            return None
        for artist_lc in self.df['_artist_lc'].unique():
            if len(artist_lc) >= 4 and artist_lc in text:
                return artist_lc
        return None

    def _detect_thresholds(self, text):
        """Return list of (column, operator, value) tuples for numeric filters."""
        filters = []
        if any(w in text for w in ['acoustic', 'acoustic guitar', 'unplugged']):
            filters.append(('acousticness', '>', 0.6))
        if any(w in text for w in ['danceable', 'dance', 'dancing']):
            filters.append(('danceability', '>', 0.7))
        if any(w in text for w in ['slow', 'slow tempo', 'ballad']):
            filters.append(('energy', '<', 0.4))
        if any(w in text for w in ['fast', 'fast tempo', 'intense']):
            filters.append(('energy', '>', 0.75))
        if any(w in text for w in ['positive', 'uplifting', 'feel good']):
            filters.append(('valence', '>', 0.65))
        return filters

    def _build_response(self, genres, moods, thresholds):
        g = ' & '.join(g.title() for g in genres) if genres else ''
        m = ' & '.join(m.title() for m in moods)  if moods  else ''
        th_desc = []
        for col, op, val in thresholds:
            labels = {'acousticness': 'acoustic', 'danceability': 'danceable',
                      'energy': 'energetic' if op == '>' else 'slow', 'valence': 'uplifting'}
            th_desc.append(labels.get(col, col))
        th = ' & '.join(th_desc)

        parts = [p for p in [g, m, th] if p]

        if parts:
            desc = ', '.join(parts)
            return f"🎵 Here are some **{desc}** tracks I picked for you from our library of {len(self.df):,} songs:"
        return f"🎵 Here are some handpicked tracks from our library of {len(self.df):,} songs:"

    def _to_records(self, df):
        """Return safe dict records, filling missing optional columns."""
        DISPLAY_COLS = [
            'track_id', 'track_name', 'artist_name', 'album_name',
            'genre', 'mood', 'danceability', 'energy', 'valence',
            'acousticness', 'audio_url', 'image_url', 'lyrics_snippet'
        ]
        out = df.copy()
        for col in DISPLAY_COLS:
            if col not in out.columns:
                out[col] = ''
        return out[DISPLAY_COLS].fillna('').to_dict(orient='records')
