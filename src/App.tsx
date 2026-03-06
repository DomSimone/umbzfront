import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

interface Response {
  response: string;
  prompt: string;
}

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/query`, {
        prompt,
        max_tokens: 512
      });
      setResponse(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Umbuzo - LLM Query Interface</h1>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your question..."
          rows={4}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Submit'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      
      {response && (
        <div className="response">
          <h3>Response:</h3>
          <p>{response.response}</p>
        </div>
      )}
    </div>
  );
}

export default App;