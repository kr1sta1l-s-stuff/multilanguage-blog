import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AxiosError } from 'axios';
import { useT } from '../hooks/useT';

export default function RegisterPage() {
  const t = useT();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordsMismatch'));
      return;
    }

    setLoading(true);
    try {
      await register(username, password);
      navigate('/login');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 409) {
        setError(t('auth.usernameTaken'));
      } else if (err instanceof AxiosError && err.response?.status === 422) {
        const detail = err.response.data?.detail;
        if (Array.isArray(detail)) {
          setError(detail.map((d: { msg: string }) => d.msg).join('. '));
        } else {
          setError(t('auth.validationError'));
        }
      } else {
        setError(t('auth.registerFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>{t('auth.registerTitle')}</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          {t('auth.username')}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={4}
            maxLength={32}
            pattern="^[a-z0-9][a-z0-9_]{2,30}[a-z0-9]$"
            title={t('auth.usernameTitle')}
          />
        </label>
        <label>
          {t('auth.password')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <label>
          {t('auth.confirmPassword')}
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? t('auth.registering') : t('auth.registerButton')}
        </button>
      </form>
      <p className="auth-link">
        {t('auth.haveAccount')} <Link to="/login">{t('auth.loginLink')}</Link>
      </p>
    </div>
  );
}
