import React, { useState } from 'react';
import Input from '../components/Input';
import Button from '../components/Button';
import { loginUser } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser({ username, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      onLoginSuccess(data.username);
    } catch (err) {
      const message = err.response?.data?.detail || 'Connection failed. Please check backend.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-stone-800">
      <div className="w-full max-w-sm mb-6 text-center">
        <h1 className="text-lg font-semibold text-stone-900">
          Handwritten Exam Evaluation System
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Teacher Sign In
        </p>
      </div>

      <div className="w-full max-w-sm border border-stone-200 bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="username"
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="teacher"
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="border border-red-200 bg-red-50 text-red-700 text-xs p-3 rounded">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
