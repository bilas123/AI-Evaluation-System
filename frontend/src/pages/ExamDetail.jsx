import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Input from '../components/Input';
import { getExam, getExamSubmissions, createSubmission } from '../services/api';

export default function ExamDetail({
  examId,
  onBack,
  onUploadSubmission,
  onReviewSubmission,
  onEvaluateSubmission,
  onViewResults,
}) {
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newStudentLabel, setNewStudentLabel] = useState('');
  const [creatingSub, setCreatingSub] = useState(false);

  useEffect(() => {
    loadData();
  }, [examId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [examData, subsData] = await Promise.all([
        getExam(examId),
        getExamSubmissions(examId),
      ]);
      setExam(examData);
      setSubmissions(subsData);
    } catch (err) {
      setError('Failed to load exam details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmission = async (e) => {
    e.preventDefault();
    if (!newStudentLabel.trim()) return;

    setCreatingSub(true);
    try {
      const created = await createSubmission(examId, {
        student_label: newStudentLabel.trim(),
      });
      setNewStudentLabel('');
      setSubmissions([created, ...submissions]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create submission.');
    } finally {
      setCreatingSub(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Loading exam...</p>;
  }

  if (error && !exam) {
    return (
      <div>
        <p className="text-sm text-red-700 mb-3">{error}</p>
        <Button variant="secondary" onClick={onBack}>Back</Button>
      </div>
    );
  }

  if (!exam) return null;

  const totalMarks = exam.questions.reduce((sum, q) => sum + q.max_marks, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={exam.title}>
        <div className="flex items-center space-x-2">
          {onViewResults && (
            <Button variant="secondary" onClick={onViewResults}>
              View Results
            </Button>
          )}
          <Button variant="secondary" onClick={onBack}>Back</Button>
        </div>
      </PageHeader>

      {/* Exam meta summary */}
      <div className="border border-stone-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-6 text-sm text-stone-600">
          <span>Subject: <span className="text-stone-800 font-medium">{exam.subject}</span></span>
          <span>Questions: <span className="text-stone-800 font-medium">{exam.questions.length}</span></span>
          <span>Total Marks: <span className="text-stone-800 font-medium">{totalMarks}</span></span>
          <span className="text-xs text-stone-500">
            Created: {new Date(exam.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="border border-stone-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Student Submissions</h3>
            <p className="text-xs text-stone-500">
              Create a submission slot per student and upload answer sheets.
            </p>
          </div>

          <form onSubmit={handleCreateSubmission} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="e.g. Student 01"
              value={newStudentLabel}
              onChange={(e) => setNewStudentLabel(e.target.value)}
              className="border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-teal-700"
              required
            />
            <Button type="submit" disabled={creatingSub || !newStudentLabel.trim()}>
              {creatingSub ? 'Adding...' : '+ Add Student'}
            </Button>
          </form>
        </div>

        {submissions.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-2">
            No submissions created yet. Add a student label above to begin uploading answers.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase">
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Images Uploaded</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  const uploadedCount = sub.answers.filter((a) => a.image_path).length;
                  return (
                    <tr key={sub.id} className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-stone-800">{sub.student_label}</td>
                      <td className="px-4 py-3 text-xs capitalize text-stone-600">
                        {sub.status.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600">
                        {uploadedCount} / {sub.answers.length}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="secondary"
                            onClick={() => onUploadSubmission(sub.id)}
                            className="text-xs py-1 px-2.5"
                          >
                            Upload
                          </Button>
                          {uploadedCount > 0 && onReviewSubmission && (
                            <Button
                              variant="secondary"
                              onClick={() => onReviewSubmission(sub.id)}
                              className="text-xs py-1 px-2.5"
                            >
                              Review OCR
                            </Button>
                          )}
                          {sub.answers.some((a) => a.verification_status === 'approved') && onEvaluateSubmission && (
                            <Button
                              onClick={() => onEvaluateSubmission(sub.id)}
                              className="text-xs py-1 px-2.5"
                            >
                              Evaluate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Questions list */}
      <div>
        <h3 className="text-sm font-semibold text-stone-900 mb-3">Approved Exam Questions</h3>
        <div className="space-y-4">
          {exam.questions.map((q) => (
            <div key={q.id} className="border border-stone-200 bg-white p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-stone-800">
                  Question {q.question_number}
                </span>
                <span className="text-xs text-stone-500">
                  Max Marks: {q.max_marks}
                </span>
              </div>

              <p className="text-sm text-stone-800 mb-4">{q.question_text}</p>

              <div className="border-t border-stone-200 pt-3 space-y-3">
                <div>
                  <span className="text-xs font-medium text-stone-600">Reference Answer</span>
                  <p className="text-sm text-stone-700 mt-1">{q.reference_answer}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-stone-600">Marking Criteria</span>
                  <p className="text-sm text-stone-700 mt-1">{q.marking_criteria}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
