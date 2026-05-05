import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { User, Project, Task, Team, Client } from '../types';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [roleTitle, setRoleTitle] = useState(user?.roleTitle || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/users/${user?.id}`, { name, roleTitle });
      await refreshUser();
      setMsg('Perfil atualizado!');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={user?.name || ''} avatarUrl={user?.avatarUrl} size="lg" />
        <div>
          <p className="font-semibold text-text-primary">{user?.name}</p>
          <p className="text-muted text-sm">{user?.profile === 'admin' ? 'Administrador' : 'Membro'}</p>
        </div>
      </div>
      <div>
        <label className="label">Nome completo</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label className="label">Cargo / Função</label>
        <input className="input" value={roleTitle} onChange={e => setRoleTitle(e.target.value)} />
      </div>
      <div>
        <label className="label">E-mail</label>
        <input className="input" value={user?.email || '—'} disabled />
      </div>
      {msg && <p className="text-green-400 text-sm">{msg}</p>}
      <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button>
    </div>
  );
}

// ─── User Form Modal ──────────────────────────────────────────────────────────
function UserFormModal({ editUser, onClose, onSaved }: { editUser?: User | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: editUser?.name || '', email: editUser?.email || '', profile: editUser?.profile || 'member', roleTitle: editUser?.roleTitle || '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!form.name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, { name: form.name, email: form.email, profile: form.profile, roleTitle: form.roleTitle });
        if (form.password) await api.post(`/users/${editUser.id}/set-password`, { password: form.password });
      } else {
        await api.post('/users', { name: form.name, email: form.email, profile: form.profile, roleTitle: form.roleTitle, password: form.password });
      }
      onSaved();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={editUser ? 'Editar Usuário' : 'Novo Usuário'} size="sm">
      <div className="p-6 space-y-4">
        <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
        <div><label className="label">E-mail</label><input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
        <div>
          <label className="label">Perfil</label>
          <select className="select" value={form.profile} onChange={e => setForm(f => ({ ...f, profile: e.target.value as 'admin' | 'member' }))}>
            <option value="member">Membro</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div><label className="label">Cargo</label><input className="input" value={form.roleTitle} onChange={e => setForm(f => ({ ...f, roleTitle: e.target.value }))} /></div>
        <div><label className="label">{editUser ? 'Redefinir senha (deixe em branco para manter)' : 'Senha inicial'}</label><input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
        {error && <p className="text-critical text-sm">{error}</p>}
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const { user: me } = useAuth();

  const load = () => api.get('/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-text-primary">Membros da plataforma</h3>
        <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>+ Novo usuário</button>
      </div>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3 card py-3">
            <Avatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{u.name}</p>
              <p className="text-xs text-muted">{u.email || <span className="italic opacity-60">Adicionar e-mail</span>} · {u.roleTitle || <span className="italic opacity-60">Adicionar cargo</span>}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${u.profile === 'admin' ? 'bg-neon/10 text-neon border border-neon/20' : 'bg-base-500/30 text-muted border border-border'}`}>{u.profile === 'admin' ? 'Admin' : 'Membro'}</span>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs" onClick={() => setEditUser(u)}>Editar</button>
              {u.id !== me?.id && <button className="btn-ghost text-xs text-critical hover:bg-critical-bg" onClick={() => setDeleteUser(u)}>Excluir</button>}
            </div>
          </div>
        ))}
      </div>
      {(showForm || editUser) && <UserFormModal editUser={editUser} onClose={() => { setShowForm(false); setEditUser(null); }} onSaved={() => { setShowForm(false); setEditUser(null); load(); }} />}
      <ConfirmDialog open={!!deleteUser} title="Excluir usuário" message={`Excluir "${deleteUser?.name}"? Esta ação não pode ser desfeita.`} confirmLabel="Excluir" danger onConfirm={async () => { if (deleteUser) { await api.delete(`/users/${deleteUser.id}`); setDeleteUser(null); load(); } }} onCancel={() => setDeleteUser(null)} />
    </div>
  );
}

// ─── Teams Tab ────────────────────────────────────────────────────────────────
function TeamsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);

  const load = () => api.get('/teams').then(r => setTeams(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-text-primary">Times</h3>
        <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>+ Novo time</button>
      </div>
      <div className="space-y-2">
        {teams.map(t => (
          <div key={t.id} className="flex items-center gap-3 card py-3">
            <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: t.color || '#707070' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{t.name}</p>
              <p className="text-xs text-muted">{t.description || '—'} · {(t as Team & { members?: unknown[] }).members ? (t as Team & { members: unknown[] }).members.length : 0} membros</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs" onClick={() => setEditTeam(t)}>Editar</button>
              <button className="btn-ghost text-xs text-critical hover:bg-critical-bg" onClick={() => setDeleteTeam(t)}>Excluir</button>
            </div>
          </div>
        ))}
        {teams.length === 0 && <p className="text-muted text-sm text-center py-8">Nenhum time cadastrado</p>}
      </div>
      {(showForm || editTeam) && (
        <TeamFormModal
          team={editTeam}
          onClose={() => { setShowForm(false); setEditTeam(null); }}
          onSaved={() => { setShowForm(false); setEditTeam(null); load(); }}
        />
      )}
      <ConfirmDialog
        open={!!deleteTeam}
        title="Excluir time"
        message={`Excluir o time "${deleteTeam?.name}"? Os projetos associados perderão esse time.`}
        confirmLabel="Excluir"
        danger
        onConfirm={async () => { if (deleteTeam) { await api.delete(`/teams/${deleteTeam.id}`); setDeleteTeam(null); load(); } }}
        onCancel={() => setDeleteTeam(null)}
      />
    </div>
  );
}

function TeamFormModal({ team, onClose, onSaved }: { team?: Team | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: team?.name || '', description: team?.description || '', color: team?.color || '#CCFF00' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  useEffect(() => {
    api.get('/users').then(r => setAllUsers(r.data));
    if (team) {
      api.get('/teams').then(r => {
        const found = (r.data as { id: string; members?: { userId: string }[] }[]).find(t => t.id === team.id);
        if (found?.members) setMemberIds(found.members.map(m => m.userId));
      });
    }
  }, [team]);

  const toggleMember = async (userId: string) => {
    if (!team) return;
    if (memberIds.includes(userId)) {
      await api.delete(`/teams/${team.id}/members/${userId}`);
      setMemberIds(ids => ids.filter(id => id !== userId));
    } else {
      await api.post(`/teams/${team.id}/members`, { userId });
      setMemberIds(ids => [...ids, userId]);
    }
  };

  const save = async () => {
    if (!form.name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      if (team) await api.put(`/teams/${team.id}`, form);
      else await api.post('/teams', form);
      onSaved();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={team ? 'Editar Time' : 'Novo Time'} size="md">
      <div className="p-6 space-y-4">
        <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
        <div><label className="label">Descrição</label><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
        <div>
          <label className="label">Cor</label>
          <div className="flex items-center gap-3">
            <input type="color" className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            <input className="input flex-1" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="#CCFF00" />
          </div>
        </div>
        {team && (
          <div>
            <label className="label">Membros ({memberIds.length})</label>
            <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-1">
              {allUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleMember(u.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${memberIds.includes(u.id) ? 'border-neon text-neon bg-neon/10' : 'border-border text-muted hover:border-subtle'}`}
                >
                  <Avatar name={u.name} size="xs" />
                  {u.name}
                </button>
              ))}
              {allUsers.length === 0 && <p className="text-muted text-xs">Carregando...</p>}
            </div>
          </div>
        )}
        {error && <p className="text-critical text-sm">{error}</p>}
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Clients Tab ──────────────────────────────────────────────────────────────
function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  const load = () => api.get('/clients').then(r => setClients(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-text-primary">Clientes</h3>
        <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>+ Novo cliente</button>
      </div>
      <div className="space-y-2">
        {clients.map(c => (
          <div key={c.id} className="flex items-center gap-3 card py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{c.name}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs" onClick={() => setEditClient(c)}>Editar</button>
              <button className="btn-ghost text-xs text-critical hover:bg-critical-bg" onClick={() => setDeleteClient(c)}>Excluir</button>
            </div>
          </div>
        ))}
        {clients.length === 0 && <p className="text-muted text-sm text-center py-8">Nenhum cliente cadastrado</p>}
      </div>
      {(showForm || editClient) && (
        <ClientFormModal
          client={editClient}
          onClose={() => { setShowForm(false); setEditClient(null); }}
          onSaved={() => { setShowForm(false); setEditClient(null); load(); }}
        />
      )}
      <ConfirmDialog
        open={!!deleteClient}
        title="Excluir cliente"
        message={`Excluir "${deleteClient?.name}"? Os projetos associados ficarão sem cliente.`}
        confirmLabel="Excluir"
        danger
        onConfirm={async () => { if (deleteClient) { await api.delete(`/clients/${deleteClient.id}`); setDeleteClient(null); load(); } }}
        onCancel={() => setDeleteClient(null)}
      />
    </div>
  );
}

function ClientFormModal({ client, onClose, onSaved }: { client?: Client | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(client?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      if (client) await api.put(`/clients/${client.id}`, { name });
      else await api.post('/clients', { name });
      onSaved();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={client ? 'Editar Cliente' : 'Novo Cliente'} size="sm">
      <div className="p-6 space-y-4">
        <div><label className="label">Nome *</label><input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && save()} /></div>
        {error && <p className="text-critical text-sm">{error}</p>}
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Archived Tab ─────────────────────────────────────────────────────────────
function ArchivedTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const load = () => api.get('/projects/archived').then(r => setProjects(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-2">
      {projects.length === 0 && <p className="text-muted text-sm text-center py-8">Nenhum projeto arquivado</p>}
      {projects.map(p => (
        <div key={p.id} className="card flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">{p.name}</p>
            <p className="text-xs text-muted">Arquivado em {p.archivedAt ? format(new Date(p.archivedAt), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</p>
          </div>
          <button className="btn-secondary text-xs" onClick={async () => { await api.post(`/projects/${p.id}/restore`); load(); }}>Restaurar</button>
        </div>
      ))}
    </div>
  );
}

// ─── Trash Tab ────────────────────────────────────────────────────────────────
function TrashTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTrash, setActiveTrash] = useState<'projects' | 'tasks'>('projects');

  const load = async () => {
    const [p, t] = await Promise.all([api.get('/projects/trash'), api.get('/tasks/trash')]);
    setProjects(p.data);
    setTasks(t.data);
  };
  useEffect(() => { load(); }, []);

  const daysLeft = (deletedAt: string) => Math.max(0, 7 - differenceInDays(new Date(), new Date(deletedAt)));

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button className={`btn-${activeTrash === 'projects' ? 'primary' : 'secondary'} text-xs`} onClick={() => setActiveTrash('projects')}>Projetos ({projects.length})</button>
        <button className={`btn-${activeTrash === 'tasks' ? 'primary' : 'secondary'} text-xs`} onClick={() => setActiveTrash('tasks')}>Tarefas ({tasks.length})</button>
      </div>
      {activeTrash === 'projects' && (
        <div className="space-y-2">
          {projects.length === 0 && <p className="text-muted text-sm text-center py-8">Lixeira de projetos vazia</p>}
          {projects.map(p => (
            <div key={p.id} className="card flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-warning">Expira em {daysLeft(p.deletedAt!)} dias</p>
              </div>
              <button className="btn-secondary text-xs" onClick={async () => { await api.post(`/projects/${p.id}/restore`); load(); }}>Restaurar</button>
              <button className="btn-danger text-xs" onClick={async () => { await api.delete(`/projects/${p.id}/permanent`); load(); }}>Excluir permanentemente</button>
            </div>
          ))}
        </div>
      )}
      {activeTrash === 'tasks' && (
        <div className="space-y-2">
          {tasks.length === 0 && <p className="text-muted text-sm text-center py-8">Lixeira de tarefas vazia</p>}
          {tasks.map(t => (
            <div key={t.id} className="card flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-warning">Expira em {daysLeft(t.deletedAt!)} dias</p>
              </div>
              <button className="btn-secondary text-xs" onClick={async () => { await api.post(`/tasks/${t.id}/restore`); load(); }}>Restaurar</button>
              <button className="btn-danger text-xs" onClick={async () => { await api.delete(`/tasks/${t.id}/permanent`); load(); }}>Excluir permanentemente</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Danger Zone Tab ──────────────────────────────────────────────────────────
function DangerZoneTab() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDeleteAll = async () => {
    if (!password) { setError('Digite sua senha para confirmar'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/projects/delete-all', { password });
      setSuccess('Todos os projetos foram movidos para a lixeira.');
      setPassword('');
      setShowConfirm(false);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao excluir projetos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="card border-critical/30 bg-critical-bg/5">
        <h3 className="font-semibold text-critical mb-1">Zona de Perigo</h3>
        <p className="text-muted text-sm mb-4">Estas ações são irreversíveis. Prossiga com cuidado.</p>

        <div className="border-t border-border pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Excluir todos os projetos</p>
              <p className="text-xs text-muted mt-0.5">Move todos os projetos ativos para a lixeira (recuperável por 7 dias).</p>
            </div>
            <button
              className="btn-danger text-sm flex-shrink-0"
              onClick={() => { setShowConfirm(true); setError(''); setSuccess(''); }}
            >
              Excluir tudo
            </button>
          </div>

          {success && (
            <div className="mt-4 bg-green-900/20 border border-green-500/30 text-green-400 text-sm rounded-lg px-3 py-2">
              {success}
            </div>
          )}

          {showConfirm && (
            <div className="mt-4 p-4 bg-base-300 rounded-xl border border-critical/30 space-y-3">
              <p className="text-sm text-text-secondary">
                Para confirmar, digite sua senha de administrador:
              </p>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Sua senha..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? '👁' : '👁‍🗨'}
                </button>
              </div>
              {error && <p className="text-critical text-sm">{error}</p>}
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => { setShowConfirm(false); setPassword(''); setError(''); }}>
                  Cancelar
                </button>
                <button className="btn-danger flex-1" onClick={handleDeleteAll} disabled={loading}>
                  {loading ? 'Excluindo...' : 'Confirmar exclusão'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const isAdmin = user?.profile === 'admin';
  type TabKey = 'profile' | 'users' | 'teams' | 'clients' | 'archived' | 'trash' | 'danger';
  const [tab, setTab] = useState<TabKey>('profile');

  const tabs: { key: TabKey; label: string; adminOnly?: boolean }[] = [
    { key: 'profile', label: 'Perfil' },
    { key: 'users', label: 'Usuários', adminOnly: true },
    { key: 'teams', label: 'Times', adminOnly: true },
    { key: 'clients', label: 'Clientes', adminOnly: true },
    { key: 'archived', label: 'Arquivados', adminOnly: true },
    { key: 'trash', label: 'Lixeira', adminOnly: true },
    { key: 'danger', label: 'Zona de Perigo', adminOnly: true },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      <div className="flex gap-1 border-b border-border mb-6 flex-wrap">
        {tabs.filter(t => !t.adminOnly || isAdmin).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? t.key === 'danger' ? 'border-critical text-critical' : 'border-neon text-neon'
                : 'border-transparent text-muted hover:text-text-primary'
            }`}
          >
            {t.key === 'danger' ? '⚠ ' : ''}{t.label}
          </button>
        ))}
      </div>
      {tab === 'profile' && <ProfileTab />}
      {tab === 'users' && isAdmin && <UsersTab />}
      {tab === 'teams' && isAdmin && <TeamsTab />}
      {tab === 'clients' && isAdmin && <ClientsTab />}
      {tab === 'archived' && isAdmin && <ArchivedTab />}
      {tab === 'trash' && isAdmin && <TrashTab />}
      {tab === 'danger' && isAdmin && <DangerZoneTab />}
    </div>
  );
}
