import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

function taskWhere(query: Record<string, unknown>): Record<string, unknown> {
  const { teamId, projectId, from, to, userId } = query;
  const w: Record<string, unknown> = { deletedAt: null };
  if (projectId) w.projectId = projectId;
  else if (teamId) w.project = { projectTeams: { some: { teamId } }, deletedAt: null };
  if (userId) w.assignees = { some: { userId } };
  if (from || to) {
    w.dueDate = {};
    if (from) (w.dueDate as Record<string, unknown>).gte = new Date(from as string);
    if (to) (w.dueDate as Record<string, unknown>).lte = new Date(to as string);
  }
  return w;
}

router.get('/overview', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const w = taskWhere(req.query as Record<string, unknown>);
  const [byStatus, byPriority, totalProjects, onTimeProjects] = await Promise.all([
    prisma.task.groupBy({ by: ['status'], where: w, _count: true }),
    prisma.task.groupBy({ by: ['priority'], where: w, _count: true }),
    prisma.project.count({ where: { deletedAt: null, archivedAt: null } }),
    prisma.project.count({ where: { deletedAt: null, status: 'completed', endDate: { not: null } } }),
  ]);
  res.json({ byStatus, byPriority, totalProjects, onTimeProjects });
});

router.get('/by-project', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { teamId } = req.query;
  const projectWhere: Record<string, unknown> = { deletedAt: null, archivedAt: null };
  if (teamId) projectWhere.projectTeams = { some: { teamId } };

  const projects = await prisma.project.findMany({
    where: projectWhere,
    include: {
      _count: { select: { tasks: { where: { deletedAt: null } } } },
      tasks: {
        where: { deletedAt: null },
        select: { status: true, priority: true },
      },
    },
  });

  const result = projects.map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    priority: p.priority,
    completionPct: p.completionPct,
    total: p._count.tasks,
    todo: p.tasks.filter(t => t.status === 'todo').length,
    inProgress: p.tasks.filter(t => t.status === 'in_progress').length,
    done: p.tasks.filter(t => t.status === 'done').length,
    overdue: p.tasks.filter(t => t.status === 'overdue').length,
  }));
  res.json(result);
});

router.get('/by-assignee', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const w = taskWhere(req.query as Record<string, unknown>);
  const tasks = await prisma.task.findMany({ where: w, include: { assignees: { include: { user: { select: { id: true, name: true } } } } } });

  const map: Record<string, { name: string; todo: number; inProgress: number; done: number; overdue: number; totalMinutes: number }> = {};
  for (const task of tasks) {
    for (const a of task.assignees) {
      if (!map[a.userId]) map[a.userId] = { name: a.user.name, todo: 0, inProgress: 0, done: 0, overdue: 0, totalMinutes: 0 };
      const entry = map[a.userId];
      if (task.status === 'todo') entry.todo++;
      if (task.status === 'in_progress') entry.inProgress++;
      if (task.status === 'done') { entry.done++; if (task.timeSpentMinutes) entry.totalMinutes += task.timeSpentMinutes; }
      if (task.status === 'overdue') entry.overdue++;
    }
  }
  res.json(Object.entries(map).map(([userId, data]) => ({ userId, ...data })));
});

router.get('/by-type', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { teamId } = req.query;
  const projectWhere: Record<string, unknown> = { deletedAt: null };
  if (teamId) projectWhere.projectTeams = { some: { teamId } };
  const projects = await prisma.project.groupBy({ by: ['projectType'], where: projectWhere, _count: true });
  res.json(projects);
});

router.get('/timeline', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { teamId, projectId, from, to } = req.query;
  const base = new Date(from as string || Date.now() - 90 * 86400000);
  const end = new Date(to as string || Date.now());

  const w: Record<string, unknown> = { deletedAt: null, completedAt: { gte: base, lte: end } };
  if (projectId) w.projectId = projectId;
  else if (teamId) w.project = { projectTeams: { some: { teamId } }, deletedAt: null };

  const tasks = await prisma.task.findMany({ where: w, select: { completedAt: true } });

  // Group by week
  const weeks: Record<string, number> = {};
  for (const t of tasks) {
    if (!t.completedAt) continue;
    const weekStart = new Date(t.completedAt);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const key = weekStart.toISOString().split('T')[0];
    weeks[key] = (weeks[key] || 0) + 1;
  }
  res.json(Object.entries(weeks).map(([week, count]) => ({ week, count })).sort((a, b) => a.week.localeCompare(b.week)));
});

export default router;
