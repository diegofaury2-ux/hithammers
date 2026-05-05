import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from './Avatar';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/planos', label: 'Planos de Ação', icon: '◈' },
  { to: '/cronogramas', label: 'Cronogramas', icon: '▤' },
  { to: '/tarefas', label: 'Tarefas', icon: '✓' },
  { to: '/indicadores', label: 'Indicadores', icon: '◉' },
  { to: '/configuracoes', label: 'Configurações', icon: '◌' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-56 shrink-0 bg-base-100 border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-neon text-xl font-black tracking-tighter">HIT</span>
          <span className="text-text-secondary text-sm font-light tracking-widest uppercase">Platform</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-neon/10 text-neon border border-neon/20'
                  : 'text-muted hover:text-text-primary hover:bg-base-300'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-300 cursor-pointer group" onClick={() => navigate('/configuracoes')}>
          <Avatar name={user?.name || '?'} avatarUrl={user?.avatarUrl} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate">{user?.name}</p>
            <p className="text-[10px] text-muted truncate">{user?.profile === 'admin' ? 'Administrador' : 'Membro'}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full mt-1 text-xs text-muted hover:text-critical transition-colors py-1.5 px-3 text-left rounded-lg hover:bg-base-300">
          Sair
        </button>
      </div>
    </aside>
  );
}
