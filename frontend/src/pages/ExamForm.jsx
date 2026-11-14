import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import { createExam } from '../services/api';

const emptyQuestion = () => ({
  question_text: '',
  max_marks: '',
  reference_answer: '',
  marking_criteria: '',
});

export default function ExamForm({ onBack, onCreated }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, emptyQuestion()]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const body = {
      title: title.trim(),
      subject: subject.trim(),
      questions: questions.map((q) => ({
        question_text: q.question_text.trim(),
        max_marks: parseFloat(q.max_marks),
        reference_answer: q.reference_answer.trim(),
        marking_criteria: q.marking_criteria.trim(),
      })),
    };

    // Basic validation
    if (!body.title || !body.subject) {
      setError('Title and subject are required.');
      setLoading(false);
      return;
    }
    for (let i = 0; i < body.questions.length; i++) {
      const q = body.questions[i];
      if (!q.question_text || !q.reference_answer || !q.marking_criteria) {
        setError(`Question ${i + 1}: all fields are required.`);
        setLoading(false);
        return;
      }
      if (isNaN(q.max_marks) || q.max_marks <= 0) {
        setError(`Question ${i + 1}: max marks must be a positive number.`);
        setLoading(false);
        return;
      }
    }

    try {
      await createExam(body);
      onCreated();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to create exam.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Create Exam">
        <Button variant="secondary" onClick={onBack}>Back</Button>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="border border-stone-200 bg-white p-6 mb-4 space-y-4">
          <Input
            id="exam-title"
            label="Exam Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Data Structures - Unit Test 1"
            required
          />
          <Input
            id="exam-subject"
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Computer Science"
            required
          />
        </div>

        {questions.map((q, index) => (
          <div key={index} className="border border-stone-200 bg-white p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-stone-800">
                Question {index + 1}
              </span>
              {questions.length > 1 && (
                <Button variant="danger" onClick={() => removeQuestion(index)}>
                  Remove
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <Textarea
                id={`q-${index}-text`}
                label="Question Text"
                value={q.question_text}
                onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                placeholder="Explain the time complexity of QuickSort."
                required
                rows={2}
              />

              <Input
                id={`q-${index}-marks`}
                label="Max Marks"
                type="number"
                value={q.max_marks}
                onChange={(e) => updateQuestion(index, 'max_marks', e.target.value)}
                placeholder="10"
                required
              />

              <Textarea
                id={`q-${index}-ref`}
                label="Reference Answer"
                value={q.reference_answer}
                onChange={(e) => updateQuestion(index, 'reference_answer', e.target.value)}
                placeholder="Best/average O(n log n), worst O(n^2). Uses divide and conquer..."
                required
              />

              <Textarea
                id={`q-${index}-criteria`}
                label="Marking Criteria"
                value={q.marking_criteria}
                onChange={(e) => updateQuestion(index, 'marking_criteria', e.target.value)}
                placeholder="2 marks for definition, 4 marks for analysis, 4 marks for example"
                required
                rows={2}
              />
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <Button type="button" variant="secondary" onClick={addQuestion}>
            + Add Question
          </Button>

          <div className="flex items-center space-x-3">
            {error && (
              <span className="text-xs text-red-700">{error}</span>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Exam'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
