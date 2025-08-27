import os
import json
from typing import Tuple

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

# Path to FAQ file
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
FAQ_PATH = os.path.join(BASE_DIR, "data", "faq.json")

# Load FAQ
with open(FAQ_PATH, "r", encoding="utf-8") as fp:
    FAQ = json.load(fp)

QUESTIONS = list(FAQ.keys())
ANSWERS = [FAQ[q] for q in QUESTIONS]

# Load local embedding model (downloads once, then cached)
MODEL = SentenceTransformer("all-MiniLM-L6-v2")

# Precompute embeddings for FAQ questions
QUESTION_EMBEDDINGS = MODEL.encode(QUESTIONS, normalize_embeddings=True)


def answer_question(user_q: str, min_score: float = 0.6) -> Tuple[str, str, float]:
    """
    Returns (answer, matched_question, similarity_score).
    Uses local semantic embeddings + cosine similarity.
    """
    try:
        user_vec = MODEL.encode([user_q], normalize_embeddings=True)
        sims = cosine_similarity(user_vec, QUESTION_EMBEDDINGS)[0]
        best_idx = int(np.argmax(sims))
        best_score = float(sims[best_idx])

        if best_score >= min_score:
            return ANSWERS[best_idx], QUESTIONS[best_idx], best_score

        # Fallback generic response
        generic = (
            "I’m not fully sure about that. Could you rephrase your question or provide a few more details? "
            "For urgent or severe symptoms, please contact a veterinarian."
        )
        return generic, "", best_score

    except Exception as e:
        print("Error in answer_question:", e)
        return "Sorry, I couldn’t process your request. Please try again.", "", 0.0
