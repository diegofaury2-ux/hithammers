import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useFilter } from '../contexts/FilterContext';
import { Project, Client, Team, ProjectStatus, ProjectPriority, ProjectType } from '../types';
import { PriorityBadge, StatusBadge, TeamColorDot } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeLabel: Record<ProjectType, string> = {
  branding: 'Branding', campanha_digital: 'Campanha Digital', growth: 'Growth', eventos: 'Eventos',
};

function ProjectFormModal({ project, onClose, onSaved }: { project?: Project | null; onClose: () => void; onSaved: () => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    whatWhy: project?.whatWhy || '',
    howWhere: project?.howWhere || '',
    budget: project?.budget?.toString() || '',
    clientId: project?.clientId || '',
    projectType: project?.projectType || '',
    priority: project?.priority || 'medium',
    status: project?.status || 'active',
    startDate: project?.startDate?.split('T')[0] || '',
    endDate: project?.endDate?.split('T')[0] || '',
    teamIds: project?.projectTeams.map(pt => pt.teamId) || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [savingClient, setSavingClient] = useState(false);

  const reloadClients = () => api.get('/clients').then(r => setClients(r.data));

  useEffect(() => {
    reloadClients();
    api.get('/teams').then(r => setTeams(r.data));
  }, []);

  const handleAddClient = async () => {
    if (!newClientName.trim()) return;
    setSavingClient(true);
    try {
      const { data } = await api.post('/clients', { name: newClientName.trim() });
      await reloadClients();
      setForm(f => ({ ...f, clientId: data.id }));
      setNewClientName('');
      setShowNewClient(false);
    } catch {
      // silent
    } finally {
      setSavingClient(false);
    }
  };

  const toggleTeam = (id: string) => {
    setForm(f => ({ ...f, teamIds: f.teamIds.includes(id) ? f.teamIds.filter(t => t !== id) : [...f.teamIds, id] }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const payload = { ...form, budget: form.budget ? parseFloat(form.budget) : null };
      if (project) await api.put(`/projects/${project.id}`, payload);
      else await api.post('/projects', payload);
      onSaved();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={project ? 'Editar Projeto' : 'Novo Projeto'} size="lg">
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome do Projeto *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do projeto" />
          </div>
          <div>
            <label className="label">Cliente</label>
            <div className="flex gap-2">
              <select className="select flex-1" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                <option value="">Sem cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" title="Novo cliente" className="btn-secondary px-2.5 text-lg leading-none" onClick={() => setShowNewClient(v => !v)}>+</button>
            </div>
            {showNewClient && (
              <div className="flex gap-2 mt-2">
                <input
                  className="input text-sm flex-1"
                  placeholder="Nome do novo cliente..."
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddClient()}
                  autoFocus
                />
                <button className="btn-primary text-xs px-3" onClick={handleAddClient} disabled={savingClient}>
                  {savingClient ? '...' : 'Criar'}
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="label">Tipo de Projeto</label>
            <select className="select" value={form.projectType} onChange={e => setForm(f => ({ ...f, projectType: e.target.value }))}>
              <option value="">Selecionar</option>
              {Object.entries(typeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Prioridade</label>
            <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as ProjectPriority }))}>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}>
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
              <option value="completed">Concluído</option>
            </select>
          </div>
          <div>
            <label className="label">Data de Início</label>
            <input type="date" className="input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Data de Entrega</label>
            <input type="date" className="input" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Orçamento (R$)</label>
            <input type="number" className="input" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0.00" />
          </div>
          <div className="col-span-2">
            <label className="label">Equipes</label>
            <div className="flex gap-2 flex-wrap">
              {teams.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTeam(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.teamIds.includes(t.id) ? 'border-neon text-neon bg-neon/10' : 'border-border text-muted hover:border-subtle'}`}
                >
                  <TeamColorDot color={t.color} /> {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <label className="label">Descrição</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descrição do projeto" />
          </div>
          <div className="col-span-2">
            <label className="label">O quê / Por quê</label>
            <textarea className="input resize-none" rows={2} value={form.whatWhy} onChange={e => setForm(f => ({ ...f, whatWhy: e.target.value }))} placeholder="Objetivo e justificativa do projeto" />
          </div>
          <div className="col-span-2">
            <label className="label">Como / Onde</label>
            <textarea className="input resize-none" rows={2} value={form.howWhere} onChange={e => setForm(f => ({ ...f, howWhere: e.target.value }))} placeholder="Metodologia e canais" />
          </div>
        </div>
        {error && <p className="text-critical text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </Modal>
  );
}

function ProjectCard({ project, onEdit, onDelete, onArchive }: { project: Project; onEdit: () => void; onDelete: () => void; onArchive: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const isOverdue = project.endDate && new Date(project.endDate) < new Date() && project.status !== 'completed';

  return (
    <div className={`card border transition-colors ${isOverdue ? 'border-critical/40 bg-critical-bg/10' : 'border-border hover:border-subtle'}`}>
      {/* Main row */}
      <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-sm font-semibold ${isOverdue ? 'text-critical' : 'text-text-primary'}`}>{project.name}</span>
            {project.projectType && <span className="text-[10px] text-muted bg-base-500/50 px-1.5 py-0.5 rounded">{typeLabel[project.projectType]}</span>}
            {isOverdue && <span className="text-[10px] text-critical bg-critical-bg px-1.5 py-0.5 rounded border border-critical/30">● ATRASADO</span>}
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted">
            {project.client && <span>{project.client.name}</span>}
            {project.projectTeams.map(pt => (
              <span key={pt.teamId} className="flex items-center gap-1"><TeamColorDot color={pt.team.color} /> {pt.team.name}</span>
            ))}
            {project.endDate && <span>Entrega: {format(new Date(project.endDate), 'dd/MM/yy', { locale: ptBR })}</span>}
            {project.budget && <span>R$ {project.budget.toLocaleString('pt-BR')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PriorityBadge priority={project.priority} />
          <StatusBadge status={project.status} />
          <span className="text-muted text-xs">{Math.round(project.completionPct)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-base-500 rounded-full overflow-hidden">
        <div className="h-full bg-neon rounded-full transition-all" style={{ width: `${project.completionPct}%` }} />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {project.description && <p className="text-text-secondary text-sm">{project.description}</p>}
          {project.whatWhy && (
            <div>
              <span className="text-xs text-muted font-medium uppercase tracking-wide">O quê / Por quê</span>
              <p className="text-text-secondary text-sm mt-0.5">{project.whatWhy}</p>
            </div>
          )}
          {project.howWhere && (
            <div>
              <span className="text-xs text-muted font-medium uppercase tracking-wide">Como / Onde</span>
              <p className="text-text-secondary text-sm mt-0.5">{project.howWhere}</p>
            </div>
          )}
          {project.budget && (
            <div className="inline-flex items-center gap-2 bg-warning-bg border border-warning/30 rounded-lg px-3 py-1.5">
              <span className="text-xs text-muted">Orçamento previsto:</span>
              <span className="text-warning font-bold text-sm">R$ {project.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button className="btn-primary" onClick={() => navigate(`/cronogramas?projectId=${project.id}`)}>
              Ver Cronograma →
            </button>
            <button className="btn-secondary" onClick={e => { e.stopPropagation(); onEdit(); }}>Editar</button>
            <button className="btn-secondary" onClick={e => { e.stopPropagation(); onArchive(); }}>Arquivar</button>
            <button className="btn-danger ml-auto" onClick={e => { e.stopPropagation(); onDelete(); }}>Excluir</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlanosPage() {
  const { selectedTeamId } = useFilter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [archiveProject, setArchiveProject] = useState<Project | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTeamId) params.set('teamId', selectedTeamId);
      if (filterStatus) params.set('status', filterStatus);
      if (filterPriority) params.set('priority', filterPriority);
      if (search) params.set('search', search);
      const { data } = await api.get(`/projects?${params}`);
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId, filterStatus, filterPriority, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteProject) return;
    await api.delete(`/projects/${deleteProject.id}`);
    setDeleteProject(null);
    load();
  };

  const handleArchive = async () => {
    if (!archiveProject) return;
    await api.post(`/projects/${archiveProject.id}/archive`);
    setArchiveProject(null);
    load();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Planos de Ação</h1>
          <p className="text-muted text-sm mt-0.5">{projects.length} projeto{projects.length !== 1 ? 's' : ''} encontrado{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Novo Projeto</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input className="input !w-48" placeholder="Buscar projeto..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="select !w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="paused">Pausado</option>
          <option value="completed">Concluído</option>
        </select>
        <select className="select !w-36" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">Todas as prioridades</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
      </div>

      {/* Projects */}
      {loading ? (
        <div className="text-muted text-sm text-center py-12">Carregando...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted">Nenhum projeto encontrado</p>
          <button className="btn-primary mt-4" onClick={() => setShowForm(true)}>+ Criar primeiro projeto</button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onEdit={() => setEditProject(p)}
              onDelete={() => setDeleteProject(p)}
              onArchive={() => setArchiveProject(p)}
            />
          ))}
        </div>
      )}

      {(showForm || editProject) && (
        <ProjectFormModal
          project={editProject}
          onClose={() => { setShowForm(false); setEditProject(null); }}
          onSaved={() => { setShowForm(false); setEditProject(null); load(); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteProject}
        title="Excluir Projeto"
        message={`Tem certeza que deseja excluir "${deleteProject?.name}"? O projeto ficará na lixeira por 7 dias.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteProject(null)}
      />

      <ConfirmDialog
        open={!!archiveProject}
        title="Arquivar Projeto"
        message={`Deseja arquivar "${archiveProject?.name}"? O projeto poderá ser restaurado nas Configurações.`}
        confirmLabel="Arquivar"
        onConfirm={handleArchive}
        onCancel={() => setArchiveProject(null)}
      />
    </div>
  );
}
