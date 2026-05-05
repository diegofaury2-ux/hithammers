import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../lib/api';
import { Task, Project, Team } from '../types';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { AvatarGroup } from '../components/ui/Avatar';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }), getDay, locales: { 'pt-BR': ptBR } });

const STATUS_COLORS: Record<string, string> = { todo: '#707070', in_progress: '#3b82f6', done: '#22c55e', overdue: '#ef4444' };

// ─── Gantt View ───────────────────────────────────────────────────────────────
function GanttView({ tasks, projectStart, onTaskClick }: { tasks: Task[]; projectStart: Date; onTaskClick: (t: Task) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dayWidth = 28;
  const rowH = 40;
  const labelW = 220;

  const today = new Date();
  const minDate = tasks.reduce((min, t) => {
    const d = new Date(t.dueDate);
    return d < min ? d : min;
  }, projectStart);
  const maxDate = tasks.reduce((max, t) => {
    const d = new Date(t.dueDate);
    return d > max ? d : max;
  }, addDays(today, 14));

  const totalDays = Math.max(differenceInDays(maxDate, minDate) + 10, 30);
  const ganttWidth = totalDays * dayWidth;

  const taskById = Object.fromEntries(tasks.map(t => [t.id, t]));

  const getLeft = (date: Date) => Math.max(0, differenceInDays(date, minDate)) * dayWidth;
  const todayLeft = differenceInDays(today, minDate) * dayWidth;

  const days: Date[] = [];
  for (let i = 0; i < totalDays; i++) days.push(addDays(minDate, i));

  return (
    <div className="overflow-x-auto" ref={containerRef}>
      <div style={{ width: labelW + ganttWidth, minWidth: '100%' }}>
        {/* Header */}
        <div className="flex sticky top-0 z-10 bg-base-200 border-b border-border">
          <div style={{ width: labelW, minWidth: labelW }} className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wide shrink-0">Tarefa</div>
          <div className="flex relative" style={{ width: ganttWidth }}>
            {days.filter((_, i) => i % 7 === 0).map((d, i) => (
              <div key={i} className="absolute text-[10px] text-muted border-l border-border py-2 pl-1" style={{ left: i * 7 * dayWidth, width: 7 * dayWidth }}>
                {format(d, 'dd/MM', { locale: ptBR })}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="relative">
          {/* Today line */}
          <div className="absolute top-0 bottom-0 border-l-2 border-warning/60 z-10 pointer-events-none" style={{ left: labelW + todayLeft }} />

          {/* Dependency arrows SVG */}
          <svg className="absolute inset-0 pointer-events-none z-20" style={{ width: labelW + ganttWidth, height: tasks.length * rowH }}>
            {tasks.map((task, rowIdx) =>
              task.dependsOn.map(dep => {
                const depTaskIdx = tasks.findIndex(t => t.id === dep.dependencyTaskId);
                if (depTaskIdx < 0) return null;
                const depTask = taskById[dep.dependencyTaskId];
                if (!depTask) return null;
                const barW = dayWidth * 3;
                const x1 = labelW + getLeft(new Date(depTask.dueDate)) + barW;
                const y1 = depTaskIdx * rowH + rowH / 2;
                const x2 = labelW + getLeft(new Date(task.dueDate));
                const y2 = rowIdx * rowH + rowH / 2;
                return (
                  <g key={`${task.id}-${dep.dependencyTaskId}`}>
                    <polyline
                      points={`${x1},${y1} ${x1 + 10},${y1} ${x1 + 10},${y2} ${x2},${y2}`}
                      fill="none" stroke="#FF9900" strokeWidth={1.5} strokeDasharray="4 2" markerEnd="url(#arrow)"
                    />
                  </g>
                );
              })
            )}
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#FF9900" />
              </marker>
            </defs>
          </svg>

          {tasks.map((task, i) => {
            const left = getLeft(new Date(task.dueDate));
            const barW = dayWidth * 3;
            const isOverdue = task.status === 'overdue' || (task.status !== 'done' && new Date(task.dueDate) < today);
            return (
              <div key={task.id} className="flex items-center border-b border-border/50 group" style={{ height: rowH }}>
                <div
                  style={{ width: labelW, minWidth: labelW }}
                  className="px-3 flex items-center gap-1.5 shrink-0 cursor-pointer"
                  onClick={() => onTaskClick(task)}
                >
                  <span className={`text-xs truncate group-hover:text-neon transition-colors ${isOverdue ? 'text-critical' : 'text-text-secondary'}`}>{task.title}</span>
                </div>
                <div className="relative flex-1" style={{ height: rowH }}>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded flex items-center px-2 text-[10px] font-medium text-white cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ left, width: barW, height: 24, backgroundColor: STATUS_COLORS[task.status] || '#707070' }}
                    title={task.title}
                    onClick={() => onTaskClick(task)}
                  >
                    {format(new Date(task.dueDate), 'dd/MM', { locale: ptBR })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Milestones View ──────────────────────────────────────────────────────────
function MilestonesView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  const sorted = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const today = new Date();

  return (
    <div className="space-y-0 relative">
      <div className="absolute left-32 top-0 bottom-0 w-px bg-border" />
      {sorted.map(task => {
        const isOverdue = task.status !== 'done' && new Date(task.dueDate) < today;
        const isPast = new Date(task.dueDate) < today;
        return (
          <div
            key={task.id}
            className="flex items-center gap-4 py-3 relative cursor-pointer hover:bg-base-300/30 rounded-lg px-1 transition-colors"
            onClick={() => onTaskClick(task)}
          >
            <div className="text-right w-28 shrink-0">
              <span className={`text-xs ${isOverdue ? 'text-critical font-semibold' : 'text-muted'}`}>
                {format(new Date(task.dueDate), 'dd MMM', { locale: ptBR })}
              </span>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 z-10 shrink-0 ${
              task.status === 'done' ? 'bg-green-500 border-green-500' :
              isOverdue ? 'bg-critical border-critical' :
              task.priority === 'critical' ? 'bg-transparent border-critical rotate-45' :
              isPast ? 'bg-warning border-warning' : 'bg-transparent border-neon'
            }`} />
            <div className={`flex items-center gap-2 flex-wrap ${isOverdue ? 'opacity-100' : isPast && task.status !== 'done' ? 'opacity-70' : ''}`}>
              <span className={`text-sm font-medium ${isOverdue ? 'text-critical' : 'text-text-primary'}`}>{task.title}</span>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <AvatarGroup users={task.assignees.map(a => a.user)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Task List Below ──────────────────────────────────────────────────────────
function TaskListBelow({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  return (
    <div className="mt-4 border-t border-border pt-4">
      <h3 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">Lista de Tarefas</h3>
      <div className="space-y-1">
        <div className="grid grid-cols-[1fr_100px_100px_120px_100px] gap-2 px-3 text-xs text-muted font-medium uppercase tracking-wide pb-1">
          <span>Tarefa</span><span>Responsável</span><span>Status</span><span>Entrega</span><span>Prioridade</span>
        </div>
        {tasks.map(task => {
          const isOverdue = task.status !== 'done' && new Date(task.dueDate) < new Date();
          return (
            <div
              key={task.id}
              className={`grid grid-cols-[1fr_100px_100px_120px_100px] gap-2 items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${isOverdue ? 'bg-critical-bg/10 border border-critical/20 hover:border-critical/40' : 'bg-base-200 border border-transparent hover:border-border'}`}
              onClick={() => onTaskClick(task)}
            >
              <span className={`text-sm truncate ${isOverdue ? 'text-critical' : 'text-text-secondary'}`}>{task.title}</span>
              <span><AvatarGroup users={task.assignees.map(a => a.user)} /></span>
              <span><StatusBadge status={task.status} /></span>
              <span className={`text-xs ${isOverdue ? 'text-critical' : 'text-muted'}`}>{format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
              <span><PriorityBadge priority={task.priority} /></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CronogramasPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('projectId') || '');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'gantt' | 'milestones' | 'calendar'>('gantt');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/teams').then(r => {
      setTeams(r.data);
      if (r.data.length > 0) setActiveTab(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!activeTab) return;
    api.get(`/projects?teamId=${activeTab}`).then(r => {
      setProjects(r.data);
      const fromUrl = searchParams.get('projectId');
      if (fromUrl && r.data.some((p: Project) => p.id === fromUrl)) setSelectedProjectId(fromUrl);
      else if (r.data.length > 0) setSelectedProjectId(r.data[0].id);
      else setSelectedProjectId('');
    });
  }, [activeTab]);

  const loadTasks = useCallback(async () => {
    if (!selectedProjectId) { setTasks([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/tasks?projectId=${selectedProjectId}`);
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleTaskClick = (task: Task) => {
    navigate(`/tarefas?projectId=${task.projectId}&taskId=${task.id}`);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectStart = selectedProject?.startDate ? new Date(selectedProject.startDate) : new Date();

  const calEvents = tasks.map(t => ({
    id: t.id,
    title: t.title,
    start: new Date(t.dueDate),
    end: new Date(t.dueDate),
    resource: t,
  }));

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cronogramas</h1>
        {/* View toggle */}
        <div className="flex bg-base-300 rounded-lg p-1 gap-1">
          {(['gantt', 'milestones', 'calendar'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${view === v ? 'bg-base-500 text-text-primary' : 'text-muted hover:text-text-primary'}`}>
              {v === 'gantt' ? 'Gantt' : v === 'milestones' ? 'Marcos' : 'Calendário'}
            </button>
          ))}
        </div>
      </div>

      {/* Team tabs */}
      <div className="flex gap-1 border-b border-border">
        {teams.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === t.id ? 'border-neon text-neon' : 'border-transparent text-muted hover:text-text-primary'}`}>
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: t.color || '#707070' }} />
            {t.name}
          </button>
        ))}
      </div>

      {/* Project selector */}
      <div className="flex items-center gap-3">
        <select className="select !w-64" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
          <option value="">Selecionar projeto...</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} {p.client ? `— ${p.client.name}` : ''}</option>)}
        </select>
        {selectedProject && (
          <span className="text-muted text-xs">
            {selectedProject.startDate ? format(new Date(selectedProject.startDate), 'dd/MM/yy', { locale: ptBR }) : '?'}
            {' → '}
            {selectedProject.endDate ? format(new Date(selectedProject.endDate), 'dd/MM/yy', { locale: ptBR }) : '?'}
          </span>
        )}
        {tasks.length > 0 && (
          <span className="text-xs text-muted ml-auto">Clique em qualquer tarefa para abrir no módulo de Tarefas</span>
        )}
      </div>

      {/* Content */}
      {!selectedProjectId ? (
        <div className="flex items-center justify-center py-16 text-muted text-sm">Selecione um projeto</div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 text-muted text-sm">Carregando...</div>
      ) : tasks.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted text-sm">Nenhuma tarefa neste projeto</div>
      ) : (
        <div className="card">
          {view === 'gantt' && <GanttView tasks={tasks} projectStart={projectStart} onTaskClick={handleTaskClick} />}
          {view === 'milestones' && <MilestonesView tasks={tasks} onTaskClick={handleTaskClick} />}
          {view === 'calendar' && (
            <div className="h-[500px]" style={{ '--rbc-today-bg': 'rgba(204,255,0,0.05)' } as React.CSSProperties}>
              <style>{`
                .rbc-calendar { background: transparent; color: #e0e0e0; }
                .rbc-header { background: #1a1a1a; border-color: #2e2e2e; color: #929292; font-size: 11px; }
                .rbc-month-view, .rbc-time-view { border-color: #2e2e2e; }
                .rbc-day-bg { border-color: #2e2e2e; }
                .rbc-off-range-bg { background: #111; }
                .rbc-today { background: rgba(204,255,0,0.04) !important; }
                .rbc-event { font-size: 11px; border-radius: 4px; border: none; }
                .rbc-toolbar button { color: #e0e0e0 !important; background: #1e1e1e; border-color: #2e2e2e; font-size: 12px; }
                .rbc-toolbar button.rbc-active { background: #2e2e2e; color: #fff !important; }
                .rbc-toolbar button:hover { color: #fff !important; background: #2a2a2a; }
                .rbc-date-cell { color: #929292; font-size: 11px; }
                .rbc-date-cell a { color: #929292 !important; }
                .rbc-date-cell.rbc-now a { color: #CCFF00 !important; }
                .rbc-month-row { border-color: #2e2e2e; }
                .rbc-show-more { color: #CCFF00; background: transparent; font-size: 11px; }
                .rbc-toolbar-label { color: #e0e0e0; }
                .rbc-btn-group button svg, .rbc-toolbar button svg { fill: #e0e0e0 !important; }
                .rbc-nav-icon { color: #e0e0e0 !important; fill: #e0e0e0 !important; }
              `}</style>
              <Calendar
                localizer={localizer}
                events={calEvents}
                startAccessor="start"
                endAccessor="end"
                culture="pt-BR"
                messages={{ next: '›', previous: '‹', today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia', agenda: 'Agenda' }}
                eventPropGetter={event => ({
                  style: { backgroundColor: STATUS_COLORS[(event.resource as Task).status] || '#707070', cursor: 'pointer' },
                })}
                onSelectEvent={event => handleTaskClick(event.resource as Task)}
              />
            </div>
          )}
          <TaskListBelow tasks={tasks} onTaskClick={handleTaskClick} />
        </div>
      )}
    </div>
  );
}
