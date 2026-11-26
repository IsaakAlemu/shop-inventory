// Root component that holds the active session in state and shows login or welcome UI.

import { useState } from 'react';
import LoginPage, { type Session } from './LoginPage';
import './App.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  return (
    <div className="page-container">
      <div className="card welcome-card">
        <h1 className="welcome-text">
          Welcome, {session.fullName} ({session.role})
        </h1>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setSession(null)}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default App;
