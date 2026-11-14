import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { getExam } from '../services/api';

export default function ExamDetail({ examId, onBack }) {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getExam(examId);
      setExam(data);
    } catch (err) {
      setError('Failed to load exam.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Loading exam...</p>;
  }

  if (error) {
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
    <div>
      <PageHeader title={exam.title}>
        <Button variant="secondary" onClick={onBack}>Back</Button>
      </PageHeader>

      <div className="border border-stone-200 bg-white p-6 mb-4">
        <div className="flex items-center space-x-6 text-sm text-stone-600">
          <span>Subject: <span className="text-stone-800 font-medium">{exam.subject}</span></span>
          <span>Questions: <span className="text-stone-800 font-medium">{exam.questions.length}</span></span>
          <span>Total Marks: <span className="text-stone-800 font-medium">{totalMarks}</span></span>
          <span className="text-xs text-stone-500">
            Created {new Date(exam.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {exam.questions.map((q) => (
        <div key={q.id} className="border border-stone-200 bg-white p-6 mb-4">
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
  );
}
