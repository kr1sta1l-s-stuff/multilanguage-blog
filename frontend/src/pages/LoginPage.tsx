import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AxiosError } from 'axios';
import { useT } from '../hooks/useT';

export default function LoginPage() {
  const t = useT();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/publications');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        setError(t('auth.invalidCredentials'));
      } else {
        setError(t('auth.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>{t('auth.loginTitle')}</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          {t('auth.username')}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          {t('auth.password')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? t('auth.loggingIn') : t('auth.loginButton')}
        </button>
      </form>
      <p className="auth-link">
        {t('auth.noAccount')} <Link to="/register">{t('auth.registerLink')}</Link>
      </p>
    </div>
  );
}
