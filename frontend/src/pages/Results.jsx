import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getExamResults } from '../services/api';

export default function Results({ examId, onBack, onEvaluateSubmission }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResults();
  }, [examId]);

  const loadResults = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getExamResults(examId);
      setData(res);
    } catch {
      setError('Failed to load exam results.');
    } finally {
      setLoading(false);
    }
  };

  // Simple client-side CSV download
  const handleExportCsv = () => {
    if (!data || !data.submissions.length) return;

    let csv = 'Student,Status,Final Marks,AI Marks,Total Max\n';
    data.submissions.forEach((s) => {
      const finalM = s.total_final_marks !== null ? s.total_final_marks : 'N/A';
      const aiM = s.total_ai_marks !== null ? s.total_ai_marks : 'N/A';
      csv += `"${s.student_label}","${s.status}",${finalM},${aiM},${s.total_max_marks}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title.replace(/\s+/g, '_')}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Loading exam results...</p>;
  }

  if (error || !data) {
    return (
      <div>
        <p className="text-sm text-red-700 mb-3">{error || 'No results found.'}</p>
        <Button variant="secondary" onClick={onBack}>Back to Exam</Button>
      </div>
    );
  }

  const subs = data.submissions;
  const evaluatedSubs = subs.filter((s) => s.total_final_marks !== null);
  const avgMarks = evaluatedSubs.length
    ? (evaluatedSubs.reduce((acc, s) => acc + s.total_final_marks, 0) / evaluatedSubs.length).toFixed(1)
    : 'N/A';
  const highestMarks = evaluatedSubs.length
    ? Math.max(...evaluatedSubs.map((s) => s.total_final_marks)).toFixed(1)
    : 'N/A';

  return (
    <div>
      <PageHeader title={`Results — ${data.title}`}>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" onClick={handleExportCsv} disabled={!subs.length}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={onBack}>
            Back to Exam
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="border border-stone-200 bg-white p-4 rounded">
          <span className="text-xs text-stone-500 block">Total Students</span>
          <span className="text-xl font-bold text-stone-900">{subs.length}</span>
        </div>

        <div className="border border-stone-200 bg-white p-4 rounded">
          <span className="text-xs text-stone-500 block">Class Average</span>
          <span className="text-xl font-bold text-teal-800">
            {avgMarks} <span className="text-xs text-stone-400 font-normal">/ {data.total_max_marks}</span>
          </span>
        </div>

        <div className="border border-stone-200 bg-white p-4 rounded">
          <span className="text-xs text-stone-500 block">Highest Score</span>
          <span className="text-xl font-bold text-stone-900">
            {highestMarks} <span className="text-xs text-stone-400 font-normal">/ {data.total_max_marks}</span>
          </span>
        </div>
      </div>

      {/* Students Results Table */}
      <div className="border border-stone-200 bg-white rounded overflow-hidden">
        {subs.length === 0 ? (
          <p className="text-xs text-stone-400 italic p-6">No submissions recorded for this exam yet.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase bg-stone-50">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">AI Suggested</th>
                <th className="px-4 py-3">Teacher Final</th>
                <th className="px-4 py-3">Question Breakdown</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub) => {
                const isEvaluated = sub.total_final_marks !== null;
                const isOverridden = isEvaluated && sub.total_ai_marks !== null && sub.total_ai_marks !== sub.total_final_marks;

                return (
                  <tr key={sub.submission_id} className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50">
                    <td className="px-4 py-3 font-medium text-stone-800">{sub.student_label}</td>
                    <td className="px-4 py-3">
                      {isEvaluated ? (
                        <Badge variant="success">Evaluated</Badge>
                      ) : (
                        <Badge variant="neutral">Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-600">
                      {sub.total_ai_marks !== null ? `${sub.total_ai_marks} / ${sub.total_max_marks}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-stone-900">
                      {isEvaluated ? (
                        <span>
                          {sub.total_final_marks} / {sub.total_max_marks}
                          {isOverridden && (
                            <span className="text-[10px] text-teal-700 ml-1 font-normal">(overridden)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-stone-400 font-normal">Not graded</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      <div className="flex flex-wrap gap-1.5">
                        {sub.answers.map((ans) => (
                          <span
                            key={ans.answer_id}
                            className="bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded text-[11px]"
                          >
                            Q{ans.question_number}: {ans.final_marks !== null ? ans.final_marks : '—'}/{ans.max_marks}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {onEvaluateSubmission && (
                        <Button
                          variant="secondary"
                          className="text-xs py-1 px-2.5"
                          onClick={() => onEvaluateSubmission(sub.submission_id)}
                        >
                          Review / Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
