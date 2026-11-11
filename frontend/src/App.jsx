import React, { useState, useEffect } from 'react';
import { getHealth } from './services/api';

function App() {
  const [healthStatus, setHealthStatus] = useState('checking'); // 'checking' | 'connected' | 'unreachable'
  const [details, setDetails] = useState(null);
  const [errorDetails, setErrorDetails] = useState('');

  const checkHealth = async () => {
    setHealthStatus('checking');
    setErrorDetails('');
    try {
      const data = await getHealth();
      if (data && data.status === 'ok') {
        setHealthStatus('connected');
        setDetails(data);
      } else {
        setHealthStatus('unreachable');
        setErrorDetails('Unexpected response format');
      }
    } catch (err) {
      setHealthStatus('unreachable');
      setErrorDetails(err.message || 'Network error');
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-6 text-stone-800">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-lg p-6 shadow-xs">
        <h1 className="text-lg font-semibold text-stone-900 mb-1">
          Handwritten Exam Evaluation System
        </h1>
        <p className="text-xs text-stone-500 mb-6">
          Teacher-Assisted Evaluation Prototype
        </p>

        <div className="rounded-md border border-stone-200 bg-stone-50 p-4 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">System Status:</span>
            {healthStatus === 'checking' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-700">
                Checking...
              </span>
            )}
            {healthStatus === 'connected' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Backend: connected
              </span>
            )}
            {healthStatus === 'unreachable' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                Backend: unreachable
              </span>
            )}
          </div>

          {healthStatus === 'connected' && details && (
            <div className="mt-3 pt-3 border-t border-stone-200 text-xs text-stone-600 space-y-1">
              <div>API Status: <span className="font-mono">{details.status}</span></div>
              <div>Database: <span className="font-mono">{details.database}</span></div>
            </div>
          )}

          {healthStatus === 'unreachable' && (
            <div className="mt-3 pt-3 border-t border-stone-200 text-xs text-rose-700">
              {errorDetails || 'Could not connect to FastAPI server.'}
            </div>
          )}
        </div>

        <button
          onClick={checkHealth}
          className="w-full bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
        >
          Check Connection
        </button>
      </div>
    </div>
  );
}

export default App;

