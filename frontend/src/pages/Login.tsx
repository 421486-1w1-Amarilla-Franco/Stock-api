import { useState } from 'react';
import { Package } from 'lucide-react';
import axios from 'axios';
import { api } from '../lib/api';
import type { LoginResponse } from '../types/api';

interface LoginProps {
  onLogin: (response: LoginResponse) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('admin@stockapi.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password });
      onLogin(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Email o contraseña incorrectos.');
      } else {
        setError('Error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-head">
          <div className="login-brand">
            <div className="brand-mark" aria-hidden="true">
              <Package size={18} strokeWidth={1.6} />
            </div>
            <div className="brand-name" style={{ fontSize: 16 }}>Stock</div>
          </div>
          <h1 className="login-title">Iniciá sesión</h1>
          <p className="login-sub">Taller · Av. Mitre 2340</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@stockapi.com"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
