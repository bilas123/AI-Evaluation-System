Current milestone: Day 2 - Upload + OCR Complete
Completed:
- Submission & Answer database tables with relationships and status values in models.py
- Image service with Pillow validation, EXIF auto-rotation, downscaling to <= 2000px, and UUID file naming
- Uploads directory backend/uploads/ configured and gitignored
- OCR service with Gemini Vision primary -> Tesseract fallback -> Manual fallback chain
- Deterministic OCR reliability check (reliable / review_required / failed)
- Endpoints: POST /exams/{id}/submissions, GET /exams/{id}/submissions, GET /submissions/{id}
- Endpoints: POST /submissions/{id}/answers/{question_id}/image, POST /answers/{id}/ocr, GET /answers/{id}/image
- Backend test suite: 19 tests passing covering auth, exams, OCR reliability checks, and submission lifecycle
- Frontend Upload screen with question slots, accepted file indicators, and OCR text/reliability preview
- Frontend ExamDetail updated with Student Submissions list and creation form
- Shared Badge component for reliability indicators
- Pinned requirements in backend/requirements.txt (pillow, python-multipart, google-genai, pytesseract)
Working:
- Full Day 2 flow: Create Submission -> Upload answer image per question -> Automatic OCR extraction & preview
Known issues:
- None
Next task:
- Day 3: Teacher OCR Verification screen (side-by-side image + editable text + approve/reject) and Gemini Grading service (enforcing grading only for approved text)
Verification:
- Backend pytest: 19 passed in 7.28s
- Frontend production build succeeded (`npm run build` in 3.89s)
