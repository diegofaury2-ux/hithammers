import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useFilter } from '../contexts/FilterContext';
import { useAuth } from '../contexts/AuthContext';
import { Task, Project, Team, User, TaskStatus, TaskPriority } from '../types';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { AvatarGroup } from '../components/ui/Avatar';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── TimeSpent Modal ─────────────────────────────────────────────────────────
function TimeSpentModal({ onConfirm, onSkip }: { onConfirm: (minutes: number) => void; onSkip: () => void }) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'minutes' | 'hours' | 'days'>('hours');

  const handleConfirm = () => {
    const n = parseFloat(value);
    if (!n) { onSkip(); return; }
    const minutes = unit === 'minutes' ? n : unit === 'hours' ? n * 60 : n * 60 * 8;
    onConfirm(Math.round(minutes));
  };

  return (
    <Modal open onClose={onSkip} title="Tempo utilizado" size="sm">
      <div className="p-6">
        <p className="text-text-secondary text-sm mb-4">Quanto tempo você levou para concluir esta tarefa?</p>
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            className="input flex-1"
            placeholder="0"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
            min={0}
          />
          <select className="select !w-32" value={unit} onChange={e => setUnit(e.target.value as 'minutes' | 'hours' | 'days')}>
            <option value="minutes">Minutos</option>
            <option value="hours">Horas</option>
            <option value="days">Dias</option>
          </select>
        </div>
        <div className="flex gap-3 justify-end">
          <button className="btn-ghost" onClick={onSkip}>Pular</button>
          <button className="btn-primary" onClick={handleConfirm}>Confirmar</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Task Form Modal ──────────────────────────────────────────────────────────
function TaskFormModal({ task, projectId, users, onClose, onSaved }: {
  task?: Task | null;
  projectId: string;
  users: User[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium' as TaskPriority,
    status: task?.status || 'todo' as TaskStatus,
    dueDate: task?.dueDate?.split('T')[0] || '',
    assigneeIds: task?.assignees.map(a => a.userId) || (user?.id ? [user.id] : []),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleAssignee = (uid: string) => {
    setForm(f => ({ ...f, assigneeIds: f.assigneeIds.includes(uid) ? f.assigneeIds.filter(id => id !== uid) : [...f.assigneeIds, uid] }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Título obrigatório'); return; }
    if (!form.dueDate) { setError('Data de entrega obrigatória'); return; }
    if (form.assigneeIds.length === 0) { setError('Ao menos um responsável é obrigatório'); return; }
    setSaving(true);
    try {
      if (task) await api.put(`/tasks/${task.id}`, { ...form, projectId });
      else await api.post('/tasks', { ...form, projectId });
      onSaved();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={task ? 'Editar Tarefa' : 'Nova Tarefa'} size="md">
      <div className="p-6 space-y-4">
        <div>
          <label className="label">Título *</label>
          <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Prioridade</label>
            <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}>
              <option value="todo">A Fazer</option>
              <option value="in_progress">Em Andamento</option>
              <option value="done">Concluída</option>
              <option value="overdue">Atrasada</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Data de Entrega *</label>
            <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="label">Responsáveis *</label>
          {users.length === 0 ? (
            <p className="text-muted text-xs">Carregando membros...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleAssignee(u.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${form.assigneeIds.includes(u.id) ? 'border-neon text-neon bg-neon/10' : 'border-border text-muted hover:border-subtle'}`}
                >
                  <Avatar name={u.name} size="xs" />
                  {u.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Descrição</label>
          <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        {error && <p className="text-critical text-sm">{error}</p>}
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────
function TaskDetailModal({ task, users, allTasks, onClose, onUpdated }: {
  task: Task;
  users: User[];
  allTasks: Task[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { user } = useAuth();
  const [t, setT] = useState(task);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [showDepModal, setShowDepModal] = useState(false);
  const [depTaskId, setDepTaskId] = useState('');
  const [showTimeSpent, setShowTimeSpent] = useState(false);
  const [editingAssignees, setEditingAssignees] = useState(false);
  const [depError, setDepError] = useState('');
  const isAdmin = user?.profile === 'admin';

  const refresh = async () => {
    const { data } = await api.get(`/tasks/${t.id}`);
    setT(data);
    onUpdated();
  };

  const handleStatusChange = async (status: TaskStatus) => {
    if (status === 'done') { setShowTimeSpent(true); return; }
    await api.put(`/tasks/${t.id}`, { status });
    await refresh();
  };

  const handleComplete = async (minutes?: number) => {
    setShowTimeSpent(false);
    try {
      await api.post(`/tasks/${t.id}/complete`, { timeSpentMinutes: minutes });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg) alert(msg);
    }
    await refresh();
  };

  const handleCheckItem = async (itemId: string, isDone: boolean) => {
    await api.patch(`/tasks/${t.id}/checklist/${itemId}`, { isDone });
    await refresh();
  };

  const addCheckItem = async () => {
    if (!newCheckItem.trim()) return;
    await api.post(`/tasks/${t.id}/checklist`, { text: newCheckItem.trim() });
    setNewCheckItem('');
    await refresh();
  };

  const deleteCheckItem = async (itemId: string) => {
    await api.delete(`/tasks/${t.id}/checklist/${itemId}`);
    await refresh();
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    await api.post(`/tasks/${t.id}/comments`, { content: newComment.trim(), isAdminOnly });
    setNewComment('');
    await refresh();
  };

  const deleteComment = async (commentId: string) => {
    await api.delete(`/tasks/${t.id}/comments/${commentId}`);
    await refresh();
  };

  const addDependency = async () => {
    if (!depTaskId) { setDepError('Selecione uma tarefa'); return; }
    setDepError('');
    try {
      await api.post(`/tasks/${t.id}/dependencies`, { dependencyTaskId: depTaskId });
      setDepTaskId('');
      setShowDepModal(false);
      await refresh();
    } catch (e: unknown) {
      setDepError((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao adicionar');
    }
  };

  const removeDep = async (depId: string) => {
    await api.delete(`/tasks/${t.id}/dependencies/${depId}`);
    await refresh();
  };

  const toggleAssignee = async (uid: string) => {
    const alreadyAssigned = t.assignees.some(a => a.userId === uid);
    if (alreadyAssigned) {
      await api.delete(`/tasks/${t.id}/assignees/${uid}`);
    } else {
      await api.post(`/tasks/${t.id}/assignees`, { userId: uid });
    }
    await refresh();
  };

  const checkedCount = t.checklistItems.filter(c => c.isDone).length;
  const totalCheck = t.checklistItems.length;
  const isOverdue = t.status === 'overdue' || (t.status !== 'done' && new Date(t.dueDate) < new Date());

  // All tasks except current, for dependency selection
  const availableForDep = allTasks.filter(at => at.id !== t.id && !t.dependsOn.some(d => d.dependencyTaskId === at.id));

  return (
    <Modal open onClose={onClose} title="" size="xl">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h2 className={`text-xl font-bold ${isOverdue && t.status !== 'done' ? 'text-critical' : 'text-text-primary'}`}>{t.title}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <select
                className="select !w-40 text-xs"
                value={t.status}
                onChange={e => handleStatusChange(e.target.value as TaskStatus)}
              >
                <option value="todo">A Fazer</option>
                <option value="in_progress">Em Andamento</option>
                <option value="done">Concluída</option>
              </select>
              <PriorityBadge priority={t.priority} />
              <span className={`text-xs ${isOverdue ? 'text-critical font-semibold' : 'text-muted'}`}>
                {format(new Date(t.dueDate), "dd 'de' MMM yyyy", { locale: ptBR })}
              </span>
              {t.timeSpentMinutes ? (
                <span className="text-xs text-muted">
                  {t.timeSpentMinutes >= 60 ? `${Math.floor(t.timeSpentMinutes / 60)}h${t.timeSpentMinutes % 60 ? `${t.timeSpentMinutes % 60}m` : ''}` : `${t.timeSpentMinutes}m`}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Assignees */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="label mb-0">Responsáveis</p>
            <button
              className="text-xs text-muted hover:text-neon transition-colors"
              onClick={() => setEditingAssignees(v => !v)}
            >
              {editingAssignees ? 'Concluir' : 'Editar'}
            </button>
          </div>
          {editingAssignees ? (
            <div className="flex flex-wrap gap-2">
              {users.map(u => {
                const assigned = t.assignees.some(a => a.userId === u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAssignee(u.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${assigned ? 'border-neon text-neon bg-neon/10' : 'border-border text-muted hover:border-subtle'}`}
                  >
                    <Avatar name={u.name} size="xs" />
                    {u.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {t.assignees.length === 0 ? (
                <span className="text-muted text-xs">Nenhum responsável — clique em Editar para adicionar</span>
              ) : t.assignees.map(a => (
                <div key={a.userId} className="flex items-center gap-1.5 bg-base-300 px-2 py-1 rounded-lg">
                  <Avatar name={a.user.name} avatarUrl={a.user.avatarUrl} size="xs" />
                  <span className="text-xs text-text-secondary">{a.user.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {t.description && (
          <div>
            <p className="label">Descrição</p>
            <p className="text-text-secondary text-sm">{t.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Checklist */}
          <div>
            <p className="label">
              Checklist{' '}
              {totalCheck > 0 && <span className="text-neon ml-1">{checkedCount}/{totalCheck}</span>}
            </p>
            {totalCheck > 0 && (
              <div className="h-1 bg-base-500 rounded-full mb-2 overflow-hidden">
                <div className="h-full bg-neon rounded-full" style={{ width: `${(checkedCount / totalCheck) * 100}%` }} />
              </div>
            )}
            <div className="space-y-1 mb-2 max-h-40 overflow-y-auto">
              {t.checklistItems.length === 0 && (
                <p className="text-muted text-xs">Nenhum item — adicione abaixo</p>
              )}
              {t.checklistItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={item.isDone}
                    onChange={e => handleCheckItem(item.id, e.target.checked)}
                    className="accent-neon flex-shrink-0"
                  />
                  <span className={`text-sm flex-1 ${item.isDone ? 'line-through text-muted' : 'text-text-secondary'}`}>{item.text}</span>
                  <button className="opacity-0 group-hover:opacity-100 text-muted hover:text-critical text-xs" onClick={() => deleteCheckItem(item.id)}>×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input text-xs flex-1"
                placeholder="Novo item de checklist..."
                value={newCheckItem}
                onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCheckItem()}
              />
              <button className="btn-secondary text-xs px-2.5" onClick={addCheckItem}>+</button>
            </div>
          </div>

          {/* Dependencies */}
          <div>
            <p className="label">Dependências</p>
            <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
              {t.dependsOn.length === 0 && t.dependedOnBy.length === 0 && (
                <p className="text-muted text-xs">Nenhuma dependência</p>
              )}
              {t.dependsOn.map(d => (
                <div key={d.dependencyTaskId} className="flex items-center gap-2 text-xs bg-base-300 px-2 py-1.5 rounded">
                  <span className="text-muted shrink-0">↳ Depende de:</span>
                  <span className={`flex-1 truncate ${d.dependencyTask?.status !== 'done' ? 'text-warning' : 'text-green-400'}`}>
                    {d.dependencyTask?.title}
                  </span>
                  <button className="text-muted hover:text-critical flex-shrink-0" onClick={() => removeDep(d.dependencyTaskId)}>×</button>
                </div>
              ))}
              {t.dependedOnBy.map(d => (
                <div key={d.dependentTaskId} className="flex items-center gap-2 text-xs bg-base-300 px-2 py-1.5 rounded">
                  <span className="text-muted shrink-0">← Bloqueia:</span>
                  <span className="flex-1 truncate text-text-secondary">{d.dependentTask?.title}</span>
                </div>
              ))}
            </div>
            <button className="btn-secondary text-xs w-full" onClick={() => { setShowDepModal(v => !v); setDepError(''); }}>
              {showDepModal ? 'Cancelar' : '+ Adicionar dependência'}
            </button>
            {showDepModal && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-2">
                  <select
                    className="select text-xs flex-1"
                    value={depTaskId}
                    onChange={e => setDepTaskId(e.target.value)}
                  >
                    <option value="">Selecionar tarefa...</option>
                    {availableForDep.map(at => (
                      <option key={at.id} value={at.id}>{at.title}</option>
                    ))}
                  </select>
                  <button className="btn-primary text-xs px-3" onClick={addDependency}>OK</button>
                </div>
                {depError && <p className="text-critical text-xs">{depError}</p>}
                {availableForDep.length === 0 && (
                  <p className="text-muted text-xs">Todas as tarefas já são dependências</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <div>
          <p className="label">Comentários</p>
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {t.comments.length === 0 && (
              <p className="text-muted text-xs">Nenhum comentário ainda</p>
            )}
            {t.comments.map(c => (
              <div key={c.id} className={`p-3 rounded-lg ${c.isAdminOnly ? 'bg-warning-bg border border-warning/30' : 'bg-base-300'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Avatar name={c.author.name} size="xs" />
                    <span className="text-xs font-medium text-text-secondary">{c.author.name}</span>
                    {c.isAdminOnly && <span className="text-[10px] text-warning bg-warning-bg px-1.5 rounded border border-warning/20">Admin only</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted">{format(new Date(c.createdAt), 'dd/MM HH:mm')}</span>
                    {(isAdmin || c.authorId === user?.id) && (
                      <button className="text-muted hover:text-critical text-xs" onClick={() => deleteComment(c.id)}>×</button>
                    )}
                  </div>
                </div>
                <p className="text-text-secondary text-sm">{c.content}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Escrever comentário..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <div className="flex items-center justify-between gap-3">
              {isAdmin ? (
                <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAdminOnly}
                    onChange={e => setIsAdminOnly(e.target.checked)}
                    className="accent-warning"
                  />
                  Somente administradores
                  <span className="text-[10px] text-warning">(gera notificação por e-mail ao responsável)</span>
                </label>
              ) : (
                <span />
              )}
              <button className="btn-primary text-xs" onClick={addComment} disabled={!newComment.trim()}>Comentar</button>
            </div>
          </div>
        </div>
      </div>

      {showTimeSpent && (
        <TimeSpentModal
          onConfirm={handleComplete}
          onSkip={() => handleComplete(undefined)}
        />
      )}
    </Modal>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({ status, tasks, onTaskClick }: { status: TaskStatus; tasks: Task[]; onTaskClick: (t: Task) => void }) {
  const labels = { todo: 'A Fazer', in_progress: 'Em Andamento', done: 'Concluídas', overdue: 'Atrasadas' };
  const headerColors = { todo: 'text-muted border-border', in_progress: 'text-blue-400 border-blue-800/40', done: 'text-green-400 border-green-800/40', overdue: 'text-critical border-critical/40' };

  return (
    <div className="flex flex-col min-w-[260px] w-full">
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg border-b font-semibold text-sm ${headerColors[status]}`}>
        <span>{labels[status]}</span>
        <span className="text-xs font-normal opacity-70">{tasks.length}</span>
      </div>
      <div className="flex-1 space-y-2 mt-2">
        {tasks.map(task => {
          const isOverdue = task.status === 'overdue' || (task.status !== 'done' && new Date(task.dueDate) < new Date());
          return (
            <div
              key={task.id}
              className={`card cursor-pointer hover:border-subtle transition-colors ${isOverdue ? 'border-critical/30 bg-critical-bg/5' : ''}`}
              onClick={() => onTaskClick(task)}
            >
              <p className={`text-sm font-medium mb-2 leading-snug ${isOverdue ? 'text-critical' : 'text-text-primary'}`}>{task.title}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  <PriorityBadge priority={task.priority} />
                  {isOverdue && task.status !== 'overdue' && <span className="badge-critical">Atrasada</span>}
                </div>
                <AvatarGroup users={task.assignees.map(a => a.user)} />
              </div>
              {task.checklistItems.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-base-500 rounded-full overflow-hidden">
                    <div className="h-full bg-neon rounded-full" style={{ width: `${(task.checklistItems.filter(c => c.isDone).length / task.checklistItems.length) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-muted">{task.checklistItems.filter(c => c.isDone).length}/{task.checklistItems.length}</span>
                </div>
              )}
              {task.dependsOn.length > 0 && (
                <p className="text-[10px] mt-1 text-warning">↳ depende de {task.dependsOn.length} tarefa{task.dependsOn.length > 1 ? 's' : ''}</p>
              )}
              {task.dependedOnBy && task.dependedOnBy.length > 0 && (
                <p className="text-[10px] mt-0.5 text-blue-300">← bloqueia {task.dependedOnBy.length} tarefa{task.dependedOnBy.length > 1 ? 's' : ''}</p>
              )}
              <p className={`text-[10px] mt-1.5 ${isOverdue ? 'text-critical' : 'text-muted'}`}>
                {format(new Date(task.dueDate), 'dd/MM/yy', { locale: ptBR })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── List View ───────────────────────────────────────────────────────────────
function TaskListView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_100px_100px_120px_100px] gap-2 px-3 py-1.5 text-xs text-muted font-medium uppercase tracking-wide">
        <span>Tarefa</span><span>Prioridade</span><span>Status</span><span>Entrega</span><span>Responsáveis</span>
      </div>
      {tasks.map(task => {
        const isOverdue = task.status === 'overdue' || (task.status !== 'done' && new Date(task.dueDate) < new Date());
        return (
          <div
            key={task.id}
            className={`grid grid-cols-[1fr_100px_100px_120px_100px] gap-2 items-center px-3 py-3 rounded-lg cursor-pointer transition-colors ${isOverdue ? 'bg-critical-bg/10 border border-critical/20 hover:border-critical/40' : 'bg-base-200 border border-transparent hover:border-border'}`}
            onClick={() => onTaskClick(task)}
          >
            <span className="min-w-0">
              <span className={`text-sm font-medium truncate block ${isOverdue ? 'text-critical' : 'text-text-primary'}`}>{task.title}</span>
              <span className="flex gap-2 flex-wrap mt-0.5">
                {task.dependsOn.length > 0 && <span className="text-[10px] text-warning">↳ depende de {task.dependsOn.length}</span>}
                {task.dependedOnBy && task.dependedOnBy.length > 0 && <span className="text-[10px] text-blue-300">← bloqueia {task.dependedOnBy.length}</span>}
              </span>
            </span>
            <span><PriorityBadge priority={task.priority} /></span>
            <span><StatusBadge status={task.status} /></span>
            <span className={`text-xs ${isOverdue ? 'text-critical' : 'text-muted'}`}>{format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
            <span><AvatarGroup users={task.assignees.map(a => a.user)} /></span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TarefasPage() {
  const [searchParams] = useSearchParams();
  const { selectedTeamId } = useFilter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('projectId') || '');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const pendingTaskId = searchParams.get('taskId');

  useEffect(() => {
    api.get('/teams').then(r => {
      setTeams(r.data);
      if (r.data.length > 0 && !selectedTeamId) setActiveTab(r.data[0].id);
    });
    api.get('/users').then(r => setUsers(r.data));
  }, []);

  useEffect(() => {
    if (selectedTeamId) setActiveTab(selectedTeamId);
  }, [selectedTeamId]);

  useEffect(() => {
    if (!activeTab) return;
    api.get(`/projects?teamId=${activeTab}`).then(r => {
      setProjects(r.data);
      const fromUrl = searchParams.get('projectId');
      if (fromUrl && r.data.some((p: Project) => p.id === fromUrl)) {
        setSelectedProjectId(fromUrl);
      } else if (!selectedProjectId && r.data.length > 0) {
        setSelectedProjectId(r.data[0].id);
      }
    });
  }, [activeTab]);

  const loadTasks = useCallback(async () => {
    if (!selectedProjectId) { setTasks([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ projectId: selectedProjectId });
      if (filterAssignee) params.set('assigneeId', filterAssignee);
      if (filterPriority) params.set('priority', filterPriority);
      const { data } = await api.get(`/tasks?${params}`);
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, filterAssignee, filterPriority]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Auto-open task when navigating from Cronogramas
  useEffect(() => {
    if (pendingTaskId && tasks.length > 0) {
      const found = tasks.find(t => t.id === pendingTaskId);
      if (found) setDetailTask(found);
    }
  }, [pendingTaskId, tasks]);

  // Auto-select correct team tab when coming from URL
  useEffect(() => {
    const urlProjectId = searchParams.get('projectId');
    if (!urlProjectId || teams.length === 0) return;
    // find project and its team
    api.get(`/projects/${urlProjectId}`).then(r => {
      const teamId = r.data?.projectTeams?.[0]?.teamId;
      if (teamId) setActiveTab(teamId);
    }).catch(() => {});
  }, [teams]);

  const handleDelete = async () => {
    if (!deleteTask) return;
    await api.delete(`/tasks/${deleteTask.id}`);
    setDeleteTask(null);
    loadTasks();
  };

  const kanbanCols: TaskStatus[] = ['todo', 'in_progress', 'done', 'overdue'];

  return (
    <div className="p-6 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-base-300 rounded-lg p-1 gap-1">
            <button className={`px-3 py-1 text-xs rounded-md transition-colors ${view === 'kanban' ? 'bg-base-500 text-text-primary' : 'text-muted hover:text-text-primary'}`} onClick={() => setView('kanban')}>Kanban</button>
            <button className={`px-3 py-1 text-xs rounded-md transition-colors ${view === 'list' ? 'bg-base-500 text-text-primary' : 'text-muted hover:text-text-primary'}`} onClick={() => setView('list')}>Lista</button>
          </div>
          {selectedProjectId && <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>+ Nova Tarefa</button>}
        </div>
      </div>

      {/* Team tabs */}
      <div className="flex gap-1 border-b border-border">
        {teams.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === t.id ? 'border-neon text-neon' : 'border-transparent text-muted hover:text-text-primary'}`}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: t.color || '#707070' }} />
            {t.name}
          </button>
        ))}
      </div>

      {/* Project + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select className="select !w-56" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
          <option value="">Selecionar projeto...</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="select !w-40" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
          <option value="">Todos os membros</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select className="select !w-36" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">Todas as prioridades</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
      </div>

      {/* Task content */}
      {!selectedProjectId ? (
        <div className="flex items-center justify-center flex-1 text-muted text-sm">Selecione um projeto para ver as tarefas</div>
      ) : loading ? (
        <div className="flex items-center justify-center flex-1 text-muted text-sm">Carregando...</div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <p className="text-muted text-sm">Nenhuma tarefa encontrada</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Criar primeira tarefa</button>
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto flex-1 pb-2">
          {kanbanCols.map(col => (
            <KanbanColumn
              key={col}
              status={col}
              tasks={tasks.filter(t => t.status === col)}
              onTaskClick={t => setDetailTask(t)}
            />
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <TaskListView tasks={tasks} onTaskClick={t => setDetailTask(t)} />
        </div>
      )}

      {/* Modals */}
      {(showForm || editTask) && selectedProjectId && (
        <TaskFormModal
          task={editTask}
          projectId={selectedProjectId}
          users={users}
          onClose={() => { setShowForm(false); setEditTask(null); }}
          onSaved={() => { setShowForm(false); setEditTask(null); loadTasks(); }}
        />
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          users={users}
          allTasks={tasks}
          onClose={() => setDetailTask(null)}
          onUpdated={loadTasks}
        />
      )}

      <ConfirmDialog
        open={!!deleteTask}
        title="Excluir Tarefa"
        message={`Excluir "${deleteTask?.title}"? A tarefa ficará na lixeira por 7 dias.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTask(null)}
      />
    </div>
  );
}
