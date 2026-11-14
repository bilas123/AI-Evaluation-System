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
      <PageHeader title="Exams Dashboard">
        <Button onClick={onCreateExam}>+ Create New Exam</Button>
      </PageHeader>

      {exams.length === 0 ? (
        <div className="border border-stone-200 bg-white p-8 text-center space-y-3">
          <p className="text-sm text-stone-700 font-medium">
            No exams created yet.
          </p>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            To upload student answers, first create an examination with your questions, maximum marks, and marking criteria.
          </p>
          <div>
            <Button onClick={onCreateExam}>Create Your First Exam</Button>
          </div>
        </div>
      ) : (
        <div className="border border-stone-200 bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase bg-stone-50">
                <th className="px-4 py-3">Exam Title</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
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
                  <td className="px-4 py-3 text-stone-600">{exam.question_count} questions</td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {new Date(exam.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      onClick={() => onViewExam(exam.id)}
                      className="text-xs py-1 px-3"
                    >
                      View & Manage Submissions &rarr;
                    </Button>
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
