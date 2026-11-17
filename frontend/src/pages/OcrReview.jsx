import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getSubmission, rerunOcr, approveVerifiedText, rejectAnswer } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function OcrReview({ submissionId, onBack, onProceedToEvaluation }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editedTexts, setEditedTexts] = useState({});
  const [busyAnswerId, setBusyAnswerId] = useState(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState(null);

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSubmission(submissionId);
      setSubmission(data);
      const texts = {};
      data.answers.forEach((a) => {
        texts[a.id] = a.verified_text || a.ocr_text || '';
      });
      setEditedTexts(texts);
    } catch {
      setError('Failed to load submission.');
    } finally {
      setLoading(false);
    }
  };

  const handleRerunOcr = async (answerId) => {
    setBusyAnswerId(answerId);
    setError('');
    try {
      await rerunOcr(answerId);
      const data = await getSubmission(submissionId);
      setSubmission(data);
      const answer = data.answers.find((a) => a.id === answerId);
      if (answer) {
        setEditedTexts((prev) => ({ ...prev, [answerId]: answer.ocr_text || '' }));
      }
    } catch {
      setError('Re-running OCR failed.');
    } finally {
      setBusyAnswerId(null);
    }
  };

  const handleReject = async (answerId) => {
    setBusyAnswerId(answerId);
    setError('');
    try {
      await rejectAnswer(answerId);
      const data = await getSubmission(submissionId);
      setSubmission(data);
    } catch {
      setError('Rejecting answer failed.');
    } finally {
      setBusyAnswerId(null);
    }
  };

  const handleApprove = async (answerId) => {
    const text = editedTexts[answerId];
    if (!text || !text.trim()) {
      setError('Cannot approve empty text.');
      return;
    }
    setBusyAnswerId(answerId);
    setError('');
    try {
      await approveVerifiedText(answerId, text);
      const data = await getSubmission(submissionId);
      setSubmission(data);
    } catch {
      setError('Approving text failed.');
    } finally {
      setBusyAnswerId(null);
    }
  };

  const handleTextChange = (answerId, value) => {
    setEditedTexts((prev) => ({ ...prev, [answerId]: value }));
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Loading submission...</p>;
  }

  if (error && !submission) {
    return (
      <div>
        <p className="text-sm text-red-700 mb-3">{error}</p>
        <Button variant="secondary" onClick={onBack}>Back</Button>
      </div>
    );
  }

  if (!submission) return null;

  const answers = submission.answers;
  const answersWithImage = answers.filter((a) => a.image_path);
  const approvedCount = answers.filter((a) => a.verification_status === 'approved').length;
  const rejectedCount = answers.filter((a) => a.verification_status === 'rejected').length;
  const allDecided = answersWithImage.length > 0 && answersWithImage.every(
    (a) => a.verification_status === 'approved' || a.verification_status === 'rejected'
  );
  const canProceed = allDecided && approvedCount >= 1;

  return (
    <div>
      <PageHeader title={`Review OCR — ${submission.student_label}`}>
        <Button variant="secondary" onClick={onBack}>Back to Exam</Button>
      </PageHeader>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-xs p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {answers.map((answer) => {
          const hasImage = Boolean(answer.image_path);
          const isBusy = busyAnswerId === answer.id;
          const currentText = editedTexts[answer.id] || '';
          const hasUncertainMarkers = currentText.includes('[?]');

          return (
            <div key={answer.id} className="border border-stone-200 bg-white p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-stone-100">
                <span className="text-sm font-semibold text-stone-900">
                  Question {answer.question_number}
                </span>
                <span className="text-xs text-stone-500">
                  Max Marks: {answer.max_marks}
                </span>
              </div>

              <p className="text-sm text-stone-800 mb-4">{answer.question_text}</p>

              {!hasImage ? (
                <p className="text-xs text-stone-400 italic">No image uploaded.</p>
              ) : (
                <div className="space-y-4">
                  {/* Side-by-side: Image + Textarea */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Image */}
                    <div className="border border-stone-200 bg-stone-50 p-2 rounded flex flex-col items-center justify-center">
                      <span className="text-xs text-stone-500 mb-2">Original Handwriting</span>
                      <img
                        src={`${API_URL}/api/answers/${answer.id}/image`}
                        alt={`Question ${answer.question_number} answer`}
                        className="max-h-64 object-contain rounded border border-stone-200 cursor-pointer"
                        onClick={() => setZoomedImageUrl(`${API_URL}/api/answers/${answer.id}/image`)}
                      />
                      <span className="text-xs text-stone-400 mt-1">Click image to zoom</span>
                    </div>

                    {/* Editable Text */}
                    <div className="border border-stone-200 bg-stone-50 p-3 rounded flex flex-col">
                      <span className="text-xs text-stone-500 mb-2">Extracted Text</span>
                      {hasUncertainMarkers && (
                        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-2">
                          Contains uncertain markers [?]
                        </div>
                      )}
                      <textarea
                        value={currentText}
                        onChange={(e) => handleTextChange(answer.id, e.target.value)}
                        rows={8}
                        className="w-full border border-stone-300 rounded px-3 py-2 text-sm text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:border-teal-700 transition-colors duration-150 resize-vertical flex-1"
                        placeholder="OCR text will appear here..."
                      />
                    </div>
                  </div>

                  {/* OCR metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                    <span>
                      OCR Engine:{' '}
                      <span className="font-mono uppercase font-semibold text-stone-700">
                        {answer.ocr_engine || 'unknown'}
                      </span>
                    </span>
                    <span>Status:</span>
                    {answer.ocr_status === 'reliable' && <Badge variant="success">Reliable</Badge>}
                    {answer.ocr_status === 'review_required' && <Badge variant="warning">Needs Review</Badge>}
                    {answer.ocr_status === 'failed' && <Badge variant="danger">Failed</Badge>}
                    {answer.ocr_status === 'pending' && <Badge variant="neutral">Pending</Badge>}
                  </div>

                  {answer.ocr_note && (
                    <p className="text-xs text-stone-500 italic">{answer.ocr_note}</p>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone-100">
                    <Button
                      variant="secondary"
                      onClick={() => handleRerunOcr(answer.id)}
                      disabled={isBusy}
                    >
                      {isBusy && busyAnswerId === answer.id ? 'Processing...' : 'Re-run OCR'}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleReject(answer.id)}
                      disabled={isBusy}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(answer.id)}
                      disabled={isBusy}
                    >
                      Approve
                    </Button>
                  </div>

                  {/* Verification status */}
                  <div className="text-xs text-stone-600">
                    Verification:{' '}
                    {answer.verification_status === 'approved' && (
                      <Badge variant="success">Approved</Badge>
                    )}
                    {answer.verification_status === 'rejected' && (
                      <Badge variant="danger">Rejected</Badge>
                    )}
                    {answer.verification_status === 'unverified' && (
                      <Badge variant="neutral">Unverified</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="border border-stone-200 bg-white p-4 mt-6 flex items-center justify-between">
        <span className="text-sm text-stone-700">
          {approvedCount} of {answers.length} answers approved
          {rejectedCount > 0 && `, ${rejectedCount} rejected`}
        </span>
        <Button onClick={onProceedToEvaluation} disabled={!canProceed}>
          Proceed to Evaluation
        </Button>
      </div>

      {/* Zoom overlay */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-8"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={zoomedImageUrl}
              alt="Zoomed answer"
              className="max-w-full max-h-[85vh] object-contain rounded border border-stone-200 bg-white"
            />
            <button
              onClick={() => setZoomedImageUrl(null)}
              className="absolute top-2 right-2 bg-white border border-stone-300 rounded px-2 py-1 text-xs text-stone-700 hover:bg-stone-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
