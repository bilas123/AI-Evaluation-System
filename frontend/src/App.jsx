import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Button from './components/Button';
import { getMe, logoutUser } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('username'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => {
        setCurrentUser(data.username);
      })
      .catch(() => {
        logoutUser();
        setCurrentUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
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

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <header className="border-b border-stone-200 bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-sm text-stone-900">
            Handwritten Exam Evaluation System
          </span>
          <span className="text-stone-300">|</span>
          <span className="text-xs text-stone-500">Teacher: {currentUser}</span>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          Sign Out
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="border border-stone-200 bg-white p-6">
          <h2 className="text-base font-semibold text-stone-900 mb-2">
            Welcome, {currentUser}
          </h2>
          <p className="text-sm text-stone-600">
            Authentication verified. Teacher session is active.
          </p>
        </div>
      </main>
    </div>
  );
}
