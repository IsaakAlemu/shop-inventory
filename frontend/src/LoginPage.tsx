// Renders the centered login card with email/password sign-in and a demo owner button.

import { useState, type SubmitEvent } from 'react';
import { login } from './api';

export interface Session {
  token: string;
  role: string;
  fullName: string;
}

interface LoginPageProps {
  onLogin: (session: Session) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitLogin(loginEmail: string, loginPassword: string) {
    setError('');
    setLoading(true);
    try {
      const data = await login(loginEmail, loginPassword);
      onLogin({
        token: data.access_token,
        role: data.role,
        fullName: data.full_name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    submitLogin(email, password);
  }

  function handleDemoLogin() {
    submitLogin('owner@demo.shop', 'demo1234');
  }

  return (
    <div className="page-container">
      <div className="card">
        <h1 className="card-title">Shop Inventory</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Sign in
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              Demo login as Owner
            </button>
          </div>
        </form>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
