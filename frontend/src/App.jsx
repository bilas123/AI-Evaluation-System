import React, { useState, useEffect } from 'react';
import { getHealth } from './services/api';

function App() {
  const [healthStatus, setHealthStatus] = useState('checking');
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
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md border border-stone-200 bg-white p-6">
        <h1 className="text-base font-semibold text-stone-800 mb-1">
          Handwritten Exam Evaluation System
        </h1>
        <p className="text-xs text-stone-500 mb-6">
          Teacher-assisted evaluation prototype
        </p>

        <div className="border border-stone-200 bg-stone-50 p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-600">Backend connection:</span>
            {healthStatus === 'checking' && (
              <span className="text-stone-500">Checking...</span>
            )}
            {healthStatus === 'connected' && (
              <span className="text-stone-800 font-medium">Backend: connected</span>
            )}
            {healthStatus === 'unreachable' && (
              <span className="text-red-700 font-medium">Backend: unreachable</span>
            )}
          </div>

          {healthStatus === 'connected' && details && (
            <div className="mt-3 pt-3 border-t border-stone-200 text-xs text-stone-600 space-y-1">
              <div>API status: {details.status}</div>
              <div>Database: {details.database}</div>
            </div>
          )}

          {healthStatus === 'unreachable' && (
            <div className="mt-3 pt-3 border-t border-stone-200 text-xs text-red-700">
              {errorDetails || 'Could not reach backend service.'}
            </div>
          )}
        </div>

        <button
          onClick={checkHealth}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium py-2 px-4 rounded transition-colors duration-150"
        >
          Check connection
        </button>
      </div>
    </div>
  );
}

export default App;
