import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { getExams } from '../services/api';

export default function Dashboard({ onCreateExam, onViewExam }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getExams();
      setExams(data);
    } catch (err) {
      setError('Failed to load exams.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Loading exams...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  return (
    <div>
      <PageHeader title="Exams">
        <Button onClick={onCreateExam}>Create Exam</Button>
      </PageHeader>

      {exams.length === 0 ? (
        <div className="border border-stone-200 bg-white p-6 text-center">
          <p className="text-sm text-stone-600 mb-3">
            No exams yet. Create your first exam.
          </p>
          <Button onClick={onCreateExam}>Create Exam</Button>
        </div>
      ) : (
        <div className="border border-stone-200 bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr
                  key={exam.id}
                  className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50 transition-colors duration-150"
                >
                  <td className="px-4 py-3 font-medium text-stone-800">{exam.title}</td>
                  <td className="px-4 py-3 text-stone-600">{exam.subject}</td>
                  <td className="px-4 py-3 text-stone-600">{exam.question_count}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {new Date(exam.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onViewExam(exam.id)}
                      className="text-teal-700 hover:text-teal-800 text-xs font-medium transition-colors duration-150"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
