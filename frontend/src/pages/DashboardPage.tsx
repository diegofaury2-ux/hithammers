import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../lib/api';
import { useFilter } from '../contexts/FilterContext';
import { DashboardSummary, Task } from '../types';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { AvatarGroup } from '../components/ui/Avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PIE_COLORS = { todo: '#707070', in_progress: '#3b82f6', done: '#22c55e', overdue: '#ef4444' };
const PRIO_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };

function KpiCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="card flex flex-col gap-1 min-w-0">
      <span className="text-muted text-xs font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-3xl font-black ${color}`}>{value}</span>
      {sub && <span className="text-muted text-xs">{sub}</span>}
    </div>
  );
}

export default function DashboardPage() {
  const { selectedTeamId, selectedProjectId } = useFilter();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTeamId) params.set('teamId', selectedTeamId);
      if (selectedProjectId) params.set('projectId', selectedProjectId);
      const { data: d } = await api.get(`/dashboard/summary?${params}`);
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId, selectedProjectId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted text-sm">Carregando...</div>;
  if (!data) return null;

  const statusChartData = [
    { name: 'A Fazer', value: data.todo, color: PIE_COLORS.todo },
    { name: 'Em Andamento', value: data.inProgress, color: PIE_COLORS.in_progress },
    { name: 'Concluídas', value: data.done, color: PIE_COLORS.done },
    { name: 'Atrasadas', value: data.overdue, color: PIE_COLORS.overdue },
  ];

  const priorityChartData = data.priorityDist.map(p => ({
    name: { critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa' }[p.priority] || p.priority,
    value: p._count,
    color: PRIO_COLORS[p.priority] || '#707070',
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-muted text-sm mt-0.5">Visão geral dos projetos e tarefas</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          ↻ Atualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Total" value={data.total} color="text-text-primary" />
        <KpiCard label="A Fazer" value={data.todo} color="text-muted" />
        <KpiCard label="Em Andamento" value={data.inProgress} color="text-blue-400" />
        <KpiCard label="Concluídas" value={data.done} sub={`${data.completionRate}% de conclusão`} color="text-green-400" />
        <KpiCard label="Atrasadas" value={data.overdue} color="text-critical" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Donut */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2}>
                {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Completions 30d */}
        <div className="card col-span-2">
          <h3 className="text-sm font-semibold mb-4">Tarefas concluídas (últimos 30 dias)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.completionsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#929292' }} tickFormatter={d => d.slice(5)} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#929292' }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#CCFF00" strokeWidth={2} dot={false} name="Concluídas" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Priority Donut */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Distribuição por Prioridade</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={priorityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2}>
                {priorityChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By Assignee */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Tarefas por Responsável</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.byAssignee} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#929292' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#d8d8d8' }} width={120} />
              <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#2C5A52" radius={[0, 4, 4, 0]} name="Tarefas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Critical Tasks */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-critical animate-pulse inline-block" />
          Tarefas Críticas e Atrasadas
        </h3>
        {data.criticalTasks.length === 0 ? (
          <p className="text-muted text-sm text-center py-6">Nenhuma tarefa crítica no momento 🎉</p>
        ) : (
          <div className="space-y-2">
            {data.criticalTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-base-300 border border-border hover:border-critical/40 cursor-pointer transition-colors group"
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${task.status === 'overdue' ? 'text-critical' : 'text-text-primary'}`}>{task.title}</span>
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                    <span>📁 {(task as Task & { project?: { name: string } }).project?.name}</span>
                    <span>📅 {format(new Date(task.dueDate), 'dd/MM/yy', { locale: ptBR })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AvatarGroup users={task.assignees.map(a => a.user)} />
                  <span className="text-muted text-xs group-hover:text-neon transition-colors">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task quick view modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedTask(null)} />
          <div className="relative card max-w-md w-full p-6 z-10">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-semibold">{selectedTask.title}</h3>
              <button onClick={() => setSelectedTask(null)} className="text-muted hover:text-white ml-2">×</button>
            </div>
            <div className="flex gap-2 flex-wrap mb-3">
              <StatusBadge status={selectedTask.status} />
              <PriorityBadge priority={selectedTask.priority} />
            </div>
            <p className="text-muted text-sm mb-4">
              Entrega: {format(new Date(selectedTask.dueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <button
              className="btn-primary w-full"
              onClick={() => {
                navigate('/tarefas');
                setSelectedTask(null);
              }}
            >
              Ver na aba Tarefas →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
