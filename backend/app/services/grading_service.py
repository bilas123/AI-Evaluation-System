import json
from typing import Optional, Dict, Any, List
from app.config import settings

def evaluate_answer(
    question_text: str,
    max_marks: float,
    reference_answer: str,
    marking_criteria: str,
    verified_text: str,
) -> Dict[str, Any]:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")

    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as exc:
        raise ValueError(f"Failed to initialize Gemini client: {exc}")

    prompt = (
        "You are a strict but fair academic examiner evaluating a student's answer.\n\n"
        f"QUESTION:\n{question_text}\n\n"
        f"MAXIMUM MARKS:\n{max_marks}\n\n"
        f"REFERENCE ANSWER:\n{reference_answer}\n\n"
        f"MARKING CRITERIA:\n{marking_criteria}\n\n"
        "STUDENT ANSWER (evaluate ONLY what is explicitly written within delimiters):\n"
        "=== STUDENT ANSWER START ===\n"
        f"{verified_text}\n"
        "=== STUDENT ANSWER END ===\n\n"
        "Rules:\n"
        "1. Award marks between 0.0 and maximum marks based strictly on the marking criteria.\n"
        "2. Do not assume or extrapolate unwritten student thoughts.\n"
        "3. Provide brief constructive feedback.\n"
        "4. List the key criteria points found in the student answer.\n"
        "5. List any missing criteria points.\n\n"
        "Return ONLY a JSON object with this exact structure:\n"
        "{\n"
        '  "marks": <number between 0 and max_marks>,\n'
        '  "feedback": "<concise feedback text>",\n'
        '  "key_points_found": ["point 1", "point 2"],\n'
        '  "missing_points": ["point 3"]\n'
        "}"
    )

    last_error: Optional[str] = None
    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.0,
                    response_mime_type="application/json",
                )
            )
            raw = response.text.strip()
            if raw.startswith("```"):
                lines = raw.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw = "\n".join(lines).strip()
            data = json.loads(raw)

            marks = float(data.get("marks", 0))
            if marks < 0 or marks > max_marks:
                raise ValueError(f"Awarded marks {marks} outside allowed range [0, {max_marks}]")

            feedback = str(data.get("feedback", "")).strip()
            if not feedback:
                raise ValueError("Feedback must not be empty")

            key_points_found = data.get("key_points_found", [])
            if not isinstance(key_points_found, list):
                key_points_found = [str(key_points_found)]
            key_points_found = [str(p) for p in key_points_found]

            missing_points = data.get("missing_points", [])
            if not isinstance(missing_points, list):
                missing_points = [str(missing_points)]
            missing_points = [str(p) for p in missing_points]

            return {
                "marks": marks,
                "feedback": feedback,
                "key_points_found": key_points_found,
                "missing_points": missing_points,
            }
        except Exception as exc:
            last_error = str(exc)
            continue

    raise ValueError(f"AI evaluation failed after retry: {last_error}")
