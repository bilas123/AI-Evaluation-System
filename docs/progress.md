Current milestone: Day 4 - Results Dashboard & CSV Export Complete
Completed:
- Dedicated Results page (frontend/src/pages/Results.jsx) displaying:
  - Class statistics: Total students, Class average, Highest score
  - Scorecard table: Student name, Status badge, AI Suggested Total, Teacher Final Total, Question breakdown
  - 1-click client-side CSV Export button (downloads .csv directly for spreadsheets/Excel)
- Navigation integration in App.jsx and ExamDetail.jsx:
  - "View Results" button added to Exam Detail and Evaluation screens
  - "Review / Edit" action button on each student row to navigate directly to their evaluation
- Fast image preprocessor with 1400px resize and 85 quality, reducing OCR turnaround to ~3 seconds
- Pinned Gemini model to stable `gemini-3.5-flash-lite` for high availability and zero 503 errors
Working:
- Complete Core P0 Lifecycle:
  1. Teacher Login
  2. Create Exam & Questions
  3. Create Student Submissions
  4. Upload Handwritten Answer Images (~3s processing)
  5. Review & Edit OCR Text
  6. Teacher Approval
  7. AI Rubric Evaluation
  8. Teacher Override & Final Marks
  9. Results Dashboard & CSV Export
Next task:
- Whole Question Paper & Whole Answer Sheet PDF upload & auto-splitting (P1 Expansion)
Verification:
- Backend pytest: 22 passed in 4.52s
- Frontend production build succeeded (`npm run build` in 0.88s)
