import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from typing import List, Dict, Optional
from .storage import REPORT_DIR, register_report
from fastapi import HTTPException
from services.dog_detector import is_dog_image
from services.breed_classifier import predict_breed
from services.health_advice import get_health_report


def analyze_dog_image(image_path: str) -> dict:
    # Step 1: Detect dog
    if not is_dog_image(image_path):
        raise HTTPException(status_code=400, detail="No dog detected in image")

    # Step 2: Predict breed (now includes confidence)
    breed, confidence = predict_breed(image_path)

    # Step 3: Generate health report
    report = get_health_report(breed)

    return {
        "breed": breed,
        "breed_confidence": confidence,
        "health_report": report
    }


def create_session_report_pdf(
    session_id: str,
    data: Dict,
) -> str:
    """
    Generate a PDF report for a single session safely,
    handling different chat history formats.
    """
    filename = f"{session_id}.pdf"
    filepath = os.path.join(REPORT_DIR, filename)

    c = canvas.Canvas(filepath, pagesize=A4)
    w, h = A4
    y = h - 72

    # Header
    c.setFont("Helvetica-Bold", 18)
    c.drawString(72, y, f"Dog Health AI Report (Session {session_id})")
    y -= 24
    c.setFont("Helvetica", 10)
    c.drawString(72, y, "This report covers only this session.")
    y -= 32

    # --- Image Analyses ---
    analyses = data.get("image_history", [])
    if analyses:
        for idx, item in enumerate(analyses, 1):
            c.setFont("Helvetica-Bold", 14)
            c.drawString(72, y, f"Image Analysis {idx}")
            y -= 20
            analysis = item.get("analysis", {})
            c.setFont("Helvetica", 10)
            for k, v in analysis.items():
                for wrap in _wrap_line(f"{k}: {v}", 90):
                    c.drawString(72, y, wrap)
                    y -= 14
            y -= 10
            if y < 150:
                c.showPage()
                y = h - 72

    # --- Chat History ---
    chats = data.get("chat_history", [])
    c.setFont("Helvetica-Bold", 14)
    c.drawString(72, y, "Chat History")
    y -= 20
    c.setFont("Helvetica", 10)

    for item in chats:
        q = a = ""
        # Handle string messages
        if isinstance(item, str):
            q = f"Q: {item}"
        # Handle dict with question/answer
        elif isinstance(item, dict):
            if "question" in item:
                q = f"Q: {item['question']}"
                a = f"A: {item.get('answer','')}"
            else:
                role = item.get("role", "Unknown")
                content = item.get("text", item.get("content", ""))
                q = f"{role}: {content}"
        else:
            continue

        for ln in (q, a):
            if not ln:
                continue
            for wrap in _wrap_line(ln, 90):
                if y < 72:
                    c.showPage()
                    y = h - 72
                    c.setFont("Helvetica", 10)
                c.drawString(72, y, wrap)
                y -= 14
        y -= 6

    c.showPage()
    c.save()
    return filepath


def _wrap_line(text: str, width: int) -> List[str]:
    """Word-wrap helper for long lines in PDF"""
    words = text.split()
    out, line = [], []
    for w in words:
        if len(" ".join(line + [w])) > width:
            out.append(" ".join(line))
            line = [w]
        else:
            line.append(w)
    if line:
        out.append(" ".join(line))
    return out
