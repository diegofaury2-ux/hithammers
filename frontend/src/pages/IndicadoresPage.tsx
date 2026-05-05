import React, { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../lib/api';
import { useFilter } from '../contexts/FilterContext';
import { Team, User } from '../types';

const COLORS = ['#2C5A52', '#CCFF00', '#FF9900', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function IndicadoresPage() {
  const { selectedTeamId, selectedProjectId } = useFilter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [localTeam, setLocalTeam] = useState('');
  const [localProject, setLocalProject] = useState('');
  const [localUser, setLocalUser] = useState('');
  const [period, setPeriod] = useState('90');
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [byProject, setByProject] = useState<unknown[]>([]);
  const [byAssignee, setByAssignee] = useState<unknown[]>([]);
  const [byType, setByType] = useState<unknown[]>([]);
  const [timeline, setTimeline] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/teams').then(r => setTeams(r.data));
    api.get('/users').then(r => setUsers(r.data));
  }, []);

  useEffect(() => {
    setLocalTeam(selectedTeamId || '');
    setLocalProject(selectedProjectId || '');
  }, [selectedTeamId, selectedProjectId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (localTeam) params.set('teamId', localTeam);
      if (localProject) params.set('projectId', localProject);
      if (localUser) params.set('userId', localUser);
      const from = new Date(Date.now() - parseInt(period) * 86400000).toISOString();
      params.set('from', from);

      const [ov, bp, ba, bt, tl] = await Promise.all([
        api.get(`/indicators/overview?${params}`),
        api.get(`/indicators/by-project?${params}`),
        api.get(`/indicators/by-assignee?${params}`),
        api.get(`/indicators/by-type?${params}`),
        api.get(`/indicators/timeline?${params}`),
      ]);
      setOverview(ov.data);
      setByProject(bp.data);
      setByAssignee(ba.data);
      setByType(bt.data);
      setTimeline(tl.data);
    } finally {
      setLoading(false);
    }
  }, [localTeam, localProject, localUser, period]);

  useEffect(() => { load(); }, [load]);

  const typeLabel: Record<string, string> = { branding: 'Branding', campanha_digital: 'Campanha Digital', growth: 'Growth', eventos: 'Eventos' };
  const statusLabel: Record<string, string> = { todo: 'A Fazer', in_progress: 'Em Andamento', done: 'Concluída', overdue: 'Atrasada' };
  const statusColors: Record<string, string> = { todo: '#707070', in_progress: '#3b82f6', done: '#22c55e', overdue: '#ef4444' };

  const byStatusData = (overview?.byStatus as { status: string; _count: number }[] || []).map(s => ({
    name: statusLabel[s.status] || s.status, value: s._count, color: statusColors[s.status] || '#707070',
  }));
  const byPriorityData = (overview?.byPriority as { priority: string; _count: number }[] || []).map(p => ({
    name: { critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa' }[p.priority] || p.priority,
    value: p._count,
  }));
  const byTypeData = (byType as { projectType: string; _count: number }[]).map(t => ({
    name: typeLabel[t.projectType || ''] || t.projectType || 'Outro', value: t._count,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Indicadores</h1>
          <p className="text-muted text-sm mt-0.5">Análise detalhada de desempenho</p>
        </div>
        <button onClick={load} className="btn-secondary">↻ Atualizar</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap card">
        <div>
          <label className="label">Equipe</label>
          <select className="select !w-36" value={localTeam} onChange={e => setLocalTeam(e.target.value)}>
            <option value="">Todas</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Responsável</label>
          <select className="select !w-36" value={localUser} onChange={e => setLocalUser(e.target.value)}>
            <option value="">Todos</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Período</label>
          <select className="select !w-36" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="180">Últimos 6 meses</option>
            <option value="365">Último ano</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted text-sm">Carregando indicadores...</div>
      ) : (
        <>
          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-sm font-semibold mb-4">Tarefas por Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byStatusData} layout="vertical" margin={{ right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#929292' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#d8d8d8' }} width={110} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }} formatter={(value) => [value, 'Tarefas']} />
                  <Bar dataKey="value" name="Tarefas" radius={[0, 4, 4, 0]} maxBarSize={36}>
                    {byStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold mb-4">Velocidade Semanal (concluídas)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={timeline as { week: string; count: number }[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#929292' }} tickFormatter={d => d?.slice(5) || ''} />
                  <YAxis tick={{ fontSize: 10, fill: '#929292' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#CCFF00" fill="#CCFF00" fillOpacity={0.15} strokeWidth={2} name="Concluídas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="text-sm font-semibold mb-4">Por Prioridade</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byPriorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                    {byPriorityData.map((_, i) => <Cell key={i} fill={['#ef4444', '#f97316', '#eab308', '#22c55e'][i] || COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold mb-4">Por Tipo de Projeto</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                    {byTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold mb-4">Projetos</h3>
              <div className="space-y-2">
                {(overview as { totalProjects?: number; onTimeProjects?: number } | null)?.totalProjects !== undefined && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Total de projetos</span>
                      <span className="font-bold text-text-primary">{(overview as { totalProjects: number }).totalProjects}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Concluídos no prazo</span>
                      <span className="font-bold text-green-400">{(overview as { onTimeProjects: number }).onTimeProjects}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Row 3 - By project */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Tarefas por Projeto</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={(byProject as { name: string; done: number; inProgress: number; todo: number; overdue: number }[])} barCategoryGap="45%">
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#929292' }} />
                <YAxis tick={{ fontSize: 10, fill: '#929292' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="done" name="Concluídas" stackId="a" fill="#22c55e" />
                <Bar dataKey="inProgress" name="Em Andamento" stackId="a" fill="#3b82f6" />
                <Bar dataKey="todo" name="A Fazer" stackId="a" fill="#707070" />
                <Bar dataKey="overdue" name="Atrasadas" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Row 4 - By assignee */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Tarefas por Responsável</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, (byAssignee as unknown[]).length * 40)}>
              <BarChart data={(byAssignee as { name: string; done: number; inProgress: number; todo: number; overdue: number; totalMinutes: number }[])} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#929292' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#929292' }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="done" name="Concluídas" stackId="a" fill="#22c55e" />
                <Bar dataKey="inProgress" name="Em Andamento" stackId="a" fill="#3b82f6" />
                <Bar dataKey="todo" name="A Fazer" stackId="a" fill="#707070" />
                <Bar dataKey="overdue" name="Atrasadas" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
