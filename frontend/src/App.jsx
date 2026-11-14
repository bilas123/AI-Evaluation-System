import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ExamForm from './pages/ExamForm';
import ExamDetail from './pages/ExamDetail';
import Upload from './pages/Upload';
import Button from './components/Button';
import { getMe, logoutUser } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('username'));
  const [loading, setLoading] = useState(true);

  // Page state:
  // { name: 'dashboard' }
  // { name: 'create-exam' }
  // { name: 'exam-detail', examId: 1 }
  // { name: 'upload', submissionId: 1, examId: 1 }
  const [page, setPage] = useState({ name: 'dashboard' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => setCurrentUser(data.username))
      .catch(() => {
        logoutUser();
        setCurrentUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-sm text-stone-500">
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={(username) => setCurrentUser(username)} />;
  }

  const renderPage = () => {
    switch (page.name) {
      case 'create-exam':
        return (
          <ExamForm
            onBack={() => setPage({ name: 'dashboard' })}
            onCreated={() => setPage({ name: 'dashboard' })}
          />
        );
      case 'exam-detail':
        return (
          <ExamDetail
            examId={page.examId}
            onBack={() => setPage({ name: 'dashboard' })}
            onUploadSubmission={(subId) => setPage({ name: 'upload', submissionId: subId, examId: page.examId })}
          />
        );
      case 'upload':
        return (
          <Upload
            submissionId={page.submissionId}
            onBack={() => setPage({ name: 'exam-detail', examId: page.examId })}
          />
        );
      default:
        return (
          <Dashboard
            onCreateExam={() => setPage({ name: 'create-exam' })}
            onViewExam={(examId) => setPage({ name: 'exam-detail', examId })}
          />
        );
    }
  };

  const breadcrumb = () => {
    switch (page.name) {
      case 'create-exam':
        return 'Exams > Create Exam';
      case 'exam-detail':
        return 'Exams > Exam Detail';
      case 'upload':
        return 'Exams > Exam Detail > Upload Answers';
      default:
        return 'Exams';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <header className="border-b border-stone-200 bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPage({ name: 'dashboard' })}
            className="font-semibold text-sm text-stone-900 hover:text-teal-700 transition-colors duration-150"
          >
            Exam Evaluation
          </button>
          <span className="text-stone-300">|</span>
          <span className="text-xs text-stone-500">{breadcrumb()}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-stone-500">Teacher: {currentUser}</span>
          <Button variant="secondary" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {renderPage()}
      </main>
    </div>
  );
}
