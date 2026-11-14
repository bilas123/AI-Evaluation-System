import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getSubmission, uploadAnswerImage, rerunOcr } from '../services/api';

export default function Upload({ submissionId, onBack }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingQuestionId, setUploadingQuestionId] = useState(null);
  const [rerunningAnswerId, setRerunningAnswerId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});

  useEffect(() => {
    loadSubmissionData();
  }, [submissionId]);

  const loadSubmissionData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSubmission(submissionId);
      setSubmission(data);
    } catch (err) {
      setError('Failed to load submission.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (questionId, file) => {
    setSelectedFiles((prev) => ({ ...prev, [questionId]: file }));
  };

  const handleUpload = async (questionId) => {
    const file = selectedFiles[questionId];
    if (!file) return;

    setUploadingQuestionId(questionId);
    setError('');
    try {
      await uploadAnswerImage(submissionId, questionId, file);
      // Reload submission to refresh answer state
      const updated = await getSubmission(submissionId);
      setSubmission(updated);
      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Image upload or OCR failed.';
      setError(msg);
    } finally {
      setUploadingQuestionId(null);
    }
  };

  const handleRerunOcr = async (answerId) => {
    setRerunningAnswerId(answerId);
    setError('');
    try {
      await rerunOcr(answerId);
      const updated = await getSubmission(submissionId);
      setSubmission(updated);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Re-running OCR failed.';
      setError(msg);
    } finally {
      setRerunningAnswerId(null);
    }
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

  return (
    <div>
      <PageHeader title={`Upload Answers — ${submission.student_label}`}>
        <Button variant="secondary" onClick={onBack}>Back to Exam</Button>
      </PageHeader>

      <div className="border border-stone-200 bg-white p-4 mb-6 text-sm text-stone-600 flex items-center justify-between">
        <div>
          <span>Status: <span className="font-medium text-stone-800 capitalize">{submission.status.replace('_', ' ')}</span></span>
          <span className="mx-3 text-stone-300">|</span>
          <span>Questions to answer: <span className="font-medium text-stone-800">{submission.answers.length}</span></span>
        </div>
        <span className="text-xs text-stone-400">Accepted formats: JPEG, PNG (Max 5 MB)</span>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-xs p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {submission.answers.map((answer) => {
          const isUploading = uploadingQuestionId === answer.question_id;
          const isRerunning = rerunningAnswerId === answer.id;
          const hasImage = Boolean(answer.image_path);
          const fileSelected = selectedFiles[answer.question_id];

          return (
            <div key={answer.id} className="border border-stone-200 bg-white p-6">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-stone-100">
                <span className="text-sm font-semibold text-stone-900">
                  Question {answer.question_number}
                </span>
                <span className="text-xs text-stone-500">
                  Max Marks: {answer.max_marks}
                </span>
              </div>

              <p className="text-sm text-stone-800 mb-4">{answer.question_text}</p>

              {/* Upload input slot */}
              <div className="bg-stone-50 border border-stone-200 p-4 rounded mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      {hasImage ? 'Replace Answer Image' : 'Select Handwritten Answer Image'}
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/jpg"
                      onChange={(e) => handleFileChange(answer.question_id, e.target.files?.[0])}
                      className="text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-stone-300 file:text-xs file:font-medium file:bg-white file:text-stone-700 hover:file:bg-stone-100 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Button
                      onClick={() => handleUpload(answer.question_id)}
                      disabled={isUploading || !fileSelected}
                      className="w-full sm:w-auto"
                    >
                      {isUploading ? 'Extracting OCR...' : hasImage ? 'Re-upload & OCR' : 'Upload & Run OCR'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Uploaded image and extracted OCR text */}
              {hasImage && (
                <div className="border border-stone-200 p-4 bg-white mt-4 space-y-4">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-stone-500">OCR Engine:</span>
                      <span className="font-mono uppercase font-semibold text-stone-700">
                        {answer.ocr_engine || 'unknown'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-stone-500">Reliability:</span>
                      {answer.ocr_status === 'reliable' && (
                        <Badge variant="success">Reliable</Badge>
                      )}
                      {answer.ocr_status === 'review_required' && (
                        <Badge variant="warning">Needs Review</Badge>
                      )}
                      {answer.ocr_status === 'failed' && (
                        <Badge variant="danger">Failed</Badge>
                      )}
                      {answer.ocr_status === 'pending' && (
                        <Badge variant="neutral">Pending</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Thumbnail */}
                    <div className="border border-stone-200 bg-stone-50 p-2 rounded flex flex-col items-center justify-center">
                      <span className="text-xs text-stone-500 mb-2">Original Handwriting</span>
                      <img
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/answers/${answer.id}/image`}
                        alt={`Question ${answer.question_number} answer`}
                        className="max-h-48 object-contain rounded border border-stone-200"
                      />
                    </div>

                    {/* Extracted Text */}
                    <div className="border border-stone-200 bg-stone-50 p-3 rounded flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-stone-500">Extracted Text Preview</span>
                        <button
                          onClick={() => handleRerunOcr(answer.id)}
                          disabled={isRerunning}
                          className="text-xs text-teal-700 hover:text-teal-800 disabled:opacity-50 transition-colors"
                        >
                          {isRerunning ? 'Re-running...' : 'Re-run OCR'}
                        </button>
                      </div>
                      <div className="text-sm font-mono text-stone-800 bg-white p-3 rounded border border-stone-200 flex-1 overflow-auto whitespace-pre-wrap max-h-40">
                        {answer.ocr_text || <span className="text-stone-400 italic">No text extracted.</span>}
                      </div>
                      {answer.ocr_note && (
                        <p className="text-xs text-stone-500 mt-2 italic">{answer.ocr_note}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
