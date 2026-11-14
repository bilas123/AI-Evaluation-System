import json
from dataclasses import dataclass
from typing import Optional, Tuple, List
from PIL import Image
from app.config import settings

@dataclass
class OcrResult:
    text: str
    engine: str  # "gemini" | "tesseract" | "manual"
    status: str  # "reliable" | "review_required" | "failed"
    note: Optional[str] = None

def check_reliability(text: str, uncertain_words: List[str], legible: bool, engine: str) -> str:
    cleaned = text.strip()
    if not cleaned:
        return "failed"
    word_count = len(cleaned.split())
    # Deterministic signals per AGENTS.md Section 8
    if "[?]" in cleaned or bool(uncertain_words) or not legible or word_count < 15 or engine == "tesseract":
        return "review_required"
    return "reliable"

def _extract_with_gemini(image_path: str) -> Optional[Tuple[str, List[str], bool]]:
    if not settings.GEMINI_API_KEY:
        return None
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception:
        return None

    prompt = (
        "Transcribe the handwritten English text from this image exactly as written. "
        "Do not correct spelling or grammar mistakes. "
        "Mark any illegible or unreadable words with [?]. "
        "Return ONLY a JSON object with this exact format:\n"
        '{"text": "transcribed text", "uncertain_words": ["word1"], "legible": true}'
    )

    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
    except Exception:
        return None

    # Retry up to 2 times
    for _ in range(2):
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    prompt,
                ],
                config=types.GenerateContentConfig(
                    temperature=0.0,
                    response_mime_type="application/json",
                )
            )
            raw_text = response.text.strip()
            data = json.loads(raw_text)
            text = str(data.get("text", "")).strip()
            uncertain_words = list(data.get("uncertain_words", []))
            legible = bool(data.get("legible", True))
            return text, uncertain_words, legible
        except Exception:
            continue
    return None

def _extract_with_tesseract(image_path: str) -> Optional[str]:
    try:
        import pytesseract
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        if text and text.strip():
            return text.strip()
    except Exception:
        pass
    return None

def extract_text(image_path: str) -> OcrResult:
    # 1. Try Gemini Vision
    gemini_out = _extract_with_gemini(image_path)
    if gemini_out:
        text, uncertain_words, legible = gemini_out
        status = check_reliability(text, uncertain_words, legible, engine="gemini")
        note = (
            "Extracted using Gemini Vision"
            if status == "reliable"
            else "Review recommended: uncertain words or short text detected"
        )
        return OcrResult(text=text, engine="gemini", status=status, note=note)

    # 2. Try Tesseract
    tesseract_text = _extract_with_tesseract(image_path)
    if tesseract_text:
        return OcrResult(
            text=tesseract_text,
            engine="tesseract",
            status="review_required",
            note="Extracted using offline Tesseract fallback. Human review required."
        )

    # 3. Manual typing fallback
    return OcrResult(
        text="",
        engine="manual",
        status="failed",
        note="Automatic OCR unavailable. Please type the answer manually."
    )
