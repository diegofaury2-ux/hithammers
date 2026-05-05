import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function ChangePasswordPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { setError('As senhas não coincidem'); return; }
    if (next.length < 6) { setError('A nova senha deve ter ao menos 6 caracteres'); return; }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      await refreshUser();
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-neon text-3xl font-black">HIT</span>
          <p className="text-muted text-sm mt-1">Alterar senha</p>
        </div>
        <div className="card p-8">
          <h1 className="text-xl font-semibold mb-1">Defina sua senha</h1>
          <p className="text-muted text-sm mb-6">Por segurança, defina uma nova senha para continuar.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Senha atual</label>
              <input type="password" className="input" value={current} onChange={e => setCurrent(e.target.value)} />
            </div>
            <div>
              <label className="label">Nova senha</label>
              <input type="password" className="input" value={next} onChange={e => setNext(e.target.value)} required />
            </div>
            <div>
              <label className="label">Confirmar nova senha</label>
              <input type="password" className="input" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            {error && <p className="text-critical text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full btn-primary py-3 rounded-xl">
              {loading ? 'Salvando...' : 'Salvar senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
