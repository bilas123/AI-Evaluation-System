import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getSubmission, evaluateAnswer, overrideMarks } from '../services/api';

export default function Evaluation({ submissionId, onBack, onViewResults }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluatingAnswerId, setEvaluatingAnswerId] = useState(null);
  const [savingAnswerId, setSavingAnswerId] = useState(null);
  const [overrideInputs, setOverrideInputs] = useState({});

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSubmission(submissionId);
      setSubmission(data);
      const inputs = {};
      data.answers.forEach((a) => {
        if (a.final_marks !== null && a.final_marks !== undefined) {
          inputs[a.id] = a.final_marks;
        } else if (a.ai_marks !== null && a.ai_marks !== undefined) {
          inputs[a.id] = a.ai_marks;
        }
      });
      setOverrideInputs(inputs);
    } catch {
      setError('Failed to load submission for evaluation.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (answerId) => {
    setEvaluatingAnswerId(answerId);
    setError('');
    try {
      await evaluateAnswer(answerId);
      const data = await getSubmission(submissionId);
      setSubmission(data);
      const updated = data.answers.find((a) => a.id === answerId);
      if (updated && updated.final_marks !== null) {
        setOverrideInputs((prev) => ({ ...prev, [answerId]: updated.final_marks }));
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'AI evaluation failed.';
      setError(msg);
    } finally {
      setEvaluatingAnswerId(null);
    }
  };

  const handleSaveMarks = async (answerId, maxMarks) => {
    const val = parseFloat(overrideInputs[answerId]);
    if (isNaN(val) || val < 0 || val > maxMarks) {
      setError(`Marks must be between 0 and ${maxMarks}.`);
      return;
    }
    setSavingAnswerId(answerId);
    setError('');
    try {
      await overrideMarks(answerId, val);
      const data = await getSubmission(submissionId);
      setSubmission(data);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save final marks.';
      setError(msg);
    } finally {
      setSavingAnswerId(null);
    }
  };

  const parseJsonList = (raw) => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return [];
    }
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Loading answers for evaluation...</p>;
  }

  if (error && !submission) {
    return (
      <div>
        <p className="text-sm text-red-700 mb-3">{error}</p>
        <Button variant="secondary" onClick={onBack}>Back to Review</Button>
      </div>
    );
  }

  if (!submission) return null;

  const answers = submission.answers;
  const approvedAnswers = answers.filter((a) => a.verification_status === 'approved');
  const evaluatedCount = approvedAnswers.filter(
    (a) => a.evaluation_status === 'evaluated' || a.evaluation_status === 'finalized'
  ).length;

  const totalMaxMarks = answers.reduce((acc, a) => acc + (a.max_marks || 0), 0);
  const totalFinalMarks = answers.reduce((acc, a) => acc + (a.final_marks || 0), 0);
  const totalAiMarks = answers.reduce((acc, a) => acc + (a.ai_marks || 0), 0);

  return (
    <div>
      <PageHeader title={`Evaluate Answers — ${submission.student_label}`}>
        <div className="flex items-center space-x-2">
          {onViewResults && (
            <Button variant="secondary" onClick={onViewResults}>
              View Results
            </Button>
          )}
          <Button variant="secondary" onClick={onBack}>
            Back to Review
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-xs p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Progress header banner */}
      <div className="border border-stone-200 bg-white p-4 mb-6 flex items-center justify-between text-sm text-stone-600">
        <div>
          <span>Approved Answers: <span className="font-semibold text-stone-900">{approvedAnswers.length}</span></span>
          <span className="mx-3 text-stone-300">|</span>
          <span>Evaluated: <span className="font-semibold text-stone-900">{evaluatedCount} of {approvedAnswers.length}</span></span>
        </div>
        <div className="text-right">
          <span className="text-xs text-stone-500">Total Marks: </span>
          <span className="font-semibold text-teal-700 text-base">{totalFinalMarks.toFixed(1)}</span>
          <span className="text-stone-400"> / {totalMaxMarks.toFixed(1)}</span>
        </div>
      </div>

      <div className="space-y-6">
        {answers.map((answer) => {
          const isApproved = answer.verification_status === 'approved';
          const isRejected = answer.verification_status === 'rejected';
          const isEvaluating = evaluatingAnswerId === answer.id;
          const isSaving = savingAnswerId === answer.id;
          const isEvaluated = answer.evaluation_status === 'evaluated' || answer.evaluation_status === 'finalized';
          const isFinalized = answer.evaluation_status === 'finalized';

          const pointsFound = parseJsonList(answer.key_points_found);
          const missingPoints = parseJsonList(answer.missing_points);

          if (isRejected) {
            return (
              <div key={answer.id} className="border border-stone-200 bg-white p-6 opacity-75">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-900">
                    Question {answer.question_number}
                  </span>
                  <Badge variant="danger">Rejected</Badge>
                </div>
                <p className="text-xs text-stone-500 mt-2">
                  Answer text was rejected during OCR review. Skipped from AI evaluation.
                </p>
              </div>
            );
          }

          if (!isApproved) {
            return (
              <div key={answer.id} className="border border-stone-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-900">
                    Question {answer.question_number}
                  </span>
                  <Badge variant="neutral">Not Verified</Badge>
                </div>
                <p className="text-xs text-stone-500 mt-2">
                  OCR text has not been approved yet. Please review and approve text before evaluation.
                </p>
              </div>
            );
          }

          return (
            <div key={answer.id} className="border border-stone-200 bg-white p-6 space-y-4">
              {/* Question header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-sm font-semibold text-stone-900">
                  Question {answer.question_number}
                </span>
                <span className="text-xs text-stone-500">
                  Max Marks: {answer.max_marks}
                </span>
              </div>

              <p className="text-sm text-stone-800">{answer.question_text}</p>

              {/* Student answer verified text */}
              <div className="bg-stone-50 border border-stone-200 p-3 rounded">
                <span className="text-xs font-medium text-stone-500 block mb-1">
                  Verified Student Answer
                </span>
                <p className="text-sm text-stone-900 font-mono whitespace-pre-wrap">
                  {answer.verified_text}
                </p>
              </div>

              {/* Action: Evaluate with AI */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  onClick={() => handleEvaluate(answer.id)}
                  disabled={isEvaluating}
                >
                  {isEvaluating
                    ? 'Evaluating with AI...'
                    : isEvaluated
                    ? 'Re-evaluate with AI'
                    : 'Evaluate with AI'}
                </Button>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-stone-500">Status:</span>
                  {answer.evaluation_status === 'finalized' && (
                    <Badge variant="success">Finalized</Badge>
                  )}
                  {answer.evaluation_status === 'evaluated' && (
                    <Badge variant="warning">Evaluated (Pending Review)</Badge>
                  )}
                  {answer.evaluation_status === 'failed' && (
                    <Badge variant="danger">Evaluation Failed</Badge>
                  )}
                  {answer.evaluation_status === 'not_evaluated' && (
                    <Badge variant="neutral">Not Evaluated</Badge>
                  )}
                </div>
              </div>

              {/* AI Evaluation details */}
              {isEvaluated && (
                <div className="border border-stone-200 bg-stone-50 p-4 rounded space-y-3 mt-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                      AI Suggested Marks
                    </span>
                    <span className="text-sm font-bold text-teal-800">
                      {answer.ai_marks} / {answer.max_marks}
                    </span>
                  </div>

                  {answer.ai_feedback && (
                    <div>
                      <span className="text-xs font-medium text-stone-600 block mb-1">Feedback:</span>
                      <p className="text-xs text-stone-800 bg-white p-2.5 rounded border border-stone-200">
                        {answer.ai_feedback}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Key points found */}
                    <div className="bg-white p-2.5 rounded border border-stone-200">
                      <span className="font-semibold text-emerald-800 block mb-1">Key Points Found</span>
                      {pointsFound.length > 0 ? (
                        <ul className="space-y-1 text-stone-700">
                          {pointsFound.map((pt, i) => (
                            <li key={i} className="flex items-start space-x-1.5">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-stone-400 italic">No criteria points identified.</span>
                      )}
                    </div>

                    {/* Missing points */}
                    <div className="bg-white p-2.5 rounded border border-stone-200">
                      <span className="font-semibold text-amber-800 block mb-1">Missing Points</span>
                      {missingPoints.length > 0 ? (
                        <ul className="space-y-1 text-stone-700">
                          {missingPoints.map((pt, i) => (
                            <li key={i} className="flex items-start space-x-1.5">
                              <span className="text-amber-600 font-bold">✗</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-stone-400 italic">None</span>
                      )}
                    </div>
                  </div>

                  {/* Teacher Override section */}
                  <div className="pt-3 border-t border-stone-200">
                    <span className="text-xs font-semibold text-stone-700 block mb-2">
                      Teacher Override & Final Marks
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs text-stone-600">Final Marks:</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={answer.max_marks}
                          value={overrideInputs[answer.id] ?? ''}
                          onChange={(e) =>
                            setOverrideInputs((prev) => ({
                              ...prev,
                              [answer.id]: e.target.value,
                            }))
                          }
                          className="w-24 border border-stone-300 rounded px-2 py-1 text-sm text-stone-800 bg-white focus:outline-none focus:border-teal-700"
                        />
                        <span className="text-xs text-stone-400">/ {answer.max_marks}</span>
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() => handleSaveMarks(answer.id, answer.max_marks)}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save Final Marks'}
                      </Button>

                      {isFinalized && answer.teacher_marks !== null && (
                        <span className="text-xs text-stone-500 italic">
                          (Teacher final: {answer.teacher_marks} | AI suggested: {answer.ai_marks})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Summary */}
      <div className="border border-stone-200 bg-white p-4 mt-6 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-stone-900">
            Total Final Marks: {totalFinalMarks.toFixed(1)} / {totalMaxMarks.toFixed(1)}
          </span>
          {evaluatedCount > 0 && (
            <span className="text-xs text-stone-500 ml-3">
              (AI suggested total: {totalAiMarks.toFixed(1)})
            </span>
          )}
        </div>
        <Button variant="secondary" onClick={onBack}>
          Back to Review
        </Button>
      </div>
    </div>
  );
}
