Current milestone: Day 1 - Complete
Completed:
- Repository structure, .gitignore, config, SQLite engine, health endpoint
- Teacher model, bcrypt password hashing, JWT auth (login + protected routes)
- Exam and Question models with one-to-many relationship
- POST /api/exams (create exam with questions), GET /api/exams (list), GET /api/exams/{id} (detail)
- Frontend Login page with error handling and session persistence
- Frontend Dashboard page with exams table and empty state
- Frontend ExamForm page with dynamic question builder and validation
- Frontend ExamDetail page showing exam info and all questions
- Simple page navigation with breadcrumbs (Dashboard → Create Exam → Exam Detail)
- Shared components: Button, Input, Textarea, PageHeader
- Backend tests: 10 passing (auth + exams + health)
Working:
- Full Day 1 flow: Login → Dashboard → Create Exam → View Exam
Known issues:
- None
Next task:
- Day 2: Submission creation, image upload with validation, preprocessing, OCR service with Gemini → Tesseract → manual fallback chain
Verification:
- Backend pytest: 10 passed in 9.63s
- Frontend production build succeeded
