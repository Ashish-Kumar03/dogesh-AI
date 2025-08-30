from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os, io, json
from PIL import Image

from services.nutrient_service import calculate_nutrients
from services.location_service import enrich_with_location
from services.llm_service import generate_dynamic_answer


from services.dog_detector import is_dog_image
from services.breed_classifier import predict_breed
from services.session_store import SessionStore
from models.schemas import ChatRequest, ChatAnswer, ImageAnalysis
from services import chat_service
from services.image_service import analyze_image
from services.report_service import create_session_report_pdf
from services.storage import (
    ensure_dirs,
    UPLOAD_DIR,
    REPORT_DIR,
    register_image,
)

app = FastAPI(title="Dog Health AI Backend", version="1.0.0")
sessions = SessionStore()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static folders
ensure_dirs()
app.mount("/reports", StaticFiles(directory=REPORT_DIR), name="reports")
app.mount("/images", StaticFiles(directory=UPLOAD_DIR), name="images")


@app.get("/")
def root():
    return {"status": "ok", "message": "Dog Health AI API running"}


# ----------------- SESSION MANAGEMENT -----------------
@app.post("/session/start")
def start_session(existing_session_id: str = None):
    """
    Start a new session or return existing session if provided.
    """
    if existing_session_id and sessions.exists(existing_session_id):
        return {"session_id": existing_session_id}
    session_id = sessions.create_session()
    return {"session_id": session_id}


@app.get("/session/{session_id}/history")
def get_session_history(session_id: str):
    if not sessions.exists(session_id):
        path = os.path.join(SessionStore.SESSIONS_DIR, f"{session_id}.json")
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
            return raw_data.get("chat_history", [])
    return sessions.get_history(session_id).get("chat_history", [])


# ----------------- CHAT IN SESSION -----------------
@app.post("/session/{session_id}/chat", response_model=ChatAnswer)
def chat_in_session(session_id: str, req: ChatRequest):
    """
    Handles user chat in a session with:
    - LLM-powered conversational flow (ChatGPT-style)
    - Nutrient calculator integration
    - Location-based enrichment
    - Dynamic follow-up questions
    """
    if not sessions.exists(session_id):
        sessions.create_session_with_id(session_id)

    user_msg = req.question.strip()
    location = getattr(req, "location", None)
    history = sessions.get_history(session_id).get("chat_history", [])

    # --- 1. Generate answer with LLM ---
    answer = generate_dynamic_answer(user_msg, history, location)

    # --- 2. Nutrient calculation if triggered ---
    if "nutrient" in user_msg.lower() or "diet" in user_msg.lower() or "calorie" in user_msg.lower():
        nutrient_data = calculate_nutrients(user_msg)
        answer += f"\n\n📊 Nutrient Analysis:\n{nutrient_data}"

    # --- 3. Location enrichment ---
    if location:
        location_note = enrich_with_location(location, user_msg)
        if location_note:
            answer += f"\n\n🌍 Location-based advice:\n{location_note}"

    # --- 4. Save conversation ---
    sessions.add_chat(session_id, "user", user_msg)
    sessions.add_chat(session_id, "bot", answer)

    return ChatAnswer(answer=answer, matched_question=None, score=1.0)


# ----------------- IMAGE UPLOAD & ANALYSIS -----------------
@app.post("/session/{session_id}/upload/analyze", response_model=ImageAnalysis)
async def upload_and_analyze_in_session(session_id: str, file: UploadFile = File(...)):
    if not sessions.exists(session_id):
        sessions.create_session_with_id(session_id)

    raw = await file.read()
    try:
        pil_img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    ok, label, conf = is_dog_image(pil_img, threshold=0.30)
    if not ok:
        raise HTTPException(
            status_code=400,
            detail=f"This looks like '{label}' ({conf:.2f}). Please upload a clear dog photo."
        )

    dst = os.path.join(UPLOAD_DIR, file.filename)
    with open(dst, "wb") as f:
        f.write(raw)

    img_meta = register_image(file.filename, dst)

    brightness, clarity, color_balance, summary, nutrition = analyze_image(dst)
    breed, breed_conf = predict_breed(pil_img)

    analysis = {
        "breed": breed,
        "breed_confidence": round(breed_conf, 3),
        "brightness": round(brightness, 3),
        "clarity": round(clarity, 3),
        "color_balance": round(color_balance, 3),
        "summary": summary,
        "nutrition_tips": nutrition,
    }

    sessions.add_image_analysis(session_id, file.filename, analysis)

    return ImageAnalysis(
        image_id=img_meta["id"],
        breed=breed,
        breed_confidence=round(breed_conf, 3),
        brightness=round(brightness, 3),
        clarity=round(clarity, 3),
        color_balance=round(color_balance, 3),
        summary=summary,
        nutrition_tips=nutrition,
    )


# ----------------- END SESSION & GENERATE REPORT -----------------
@app.post("/session/{session_id}/end")
def end_session(session_id: str):
    data = sessions.end_session(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Invalid or already ended session")

    pdf_path = create_session_report_pdf(session_id, data)
    return {
        "session_id": session_id,
        "created_at": data.get("created_at"),
        "chat_summary": data.get("chat_history", []),
        "image_analyses": data.get("image_history", []),
        "report_url": f"/reports/{os.path.basename(pdf_path)}",
        "message": "Session ended. Report generated for this session only."
    }


# ----------------- ON-DEMAND SESSION REPORT -----------------
@app.get("/session/{session_id}/report")
def get_session_report(session_id: str):
    # Load session data safely
    if not sessions.exists(session_id):
        path = os.path.join(sessions.SESSIONS_DIR, f"{session_id}.json")
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Session not found")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = sessions.get_history(session_id)

    # Ensure chat_history and image_history are lists
    if "chat_history" not in data or not isinstance(data["chat_history"], list):
        data["chat_history"] = []
    if "image_history" not in data or not isinstance(data["image_history"], list):
        data["image_history"] = []

    # Always generate PDF if not exists
    pdf_path = os.path.join(REPORT_DIR, f"{session_id}.pdf")
    if not os.path.exists(pdf_path):
        pdf_path = create_session_report_pdf(session_id, data)

    return {
        "session_id": session_id,
        "report_url": f"/reports/{os.path.basename(pdf_path)}",
        "chat_count": len(data.get("chat_history", [])),
        "image_count": len(data.get("image_history", [])),  # fixed typo
    }



