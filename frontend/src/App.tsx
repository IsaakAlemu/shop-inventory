// Root component that holds the active session in state and shows login or products UI.

import { useCallback, useState } from 'react';
import LoginPage, { type Session } from './LoginPage';
import ProductsPage from './ProductsPage';
import './App.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  const handleLogout = useCallback(() => {
    setSession(null);
  }, []);

  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  return <ProductsPage session={session} onLogout={handleLogout} />;
}

export default App;
