# AI-Based Handwritten Examination Answer Evaluation System

A teacher-assisted evaluation prototype for handwritten English theory answers. Built with a zero-cost stack combining OCR, Gemini LLM evaluation, and a human verification layer.

---

## Prerequisites

- **Python 3.10+** (Python 3.14 supported)
- **Node.js 18+** & npm
- (Optional) **Tesseract OCR** for offline fallback

---

## Setup & Run Commands

### 1. Backend Setup

```bash
cd backend
python -m venv .venv

# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1

# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

### 2. Run Backend Server

```bash
cd backend
uvicorn app.main:app --reload
```
- API will be accessible at: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/docs`
- Health check endpoint: `http://localhost:8000/api/health`

### 3. Run Backend Tests

```bash
cd backend
pytest
```

---

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

### 5. Run Frontend Dev Server

```bash
cd frontend
npm run dev
```
- App will be accessible at: `http://localhost:5173`

### 6. Build Frontend for Production

```bash
cd frontend
npm run build
```

---

## Architecture Overview

- **Frontend**: React + Vite + Tailwind CSS (v4) + Axios
- **Backend**: FastAPI + SQLModel + SQLite
- **OCR Engine**: Gemini Vision (Primary) &rarr; Tesseract (Fallback) &rarr; Manual Typing
- **Grading Engine**: Gemini LLM (Strict Examiner mode, structured JSON output)
- **Human-in-the-loop**: Human verification is enforced in code—unverified OCR text is never sent to the grading LLM.

For details on the database setup, see [docs/database.md](file:///d:/AI%20Evaluation%20System/docs/database.md).
For implementation roadmap and progress, see [docs/progress.md](file:///d:/AI%20Evaluation%20System/docs/progress.md).

