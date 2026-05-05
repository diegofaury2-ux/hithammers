import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/summary', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { teamId, projectId } = req.query;

  const taskWhere: Record<string, unknown> = { deletedAt: null };
  if (projectId) {
    taskWhere.projectId = projectId;
  } else if (teamId) {
    taskWhere.project = { projectTeams: { some: { teamId } }, deletedAt: null };
  }

  const [total, todo, inProgress, done, overdue] = await Promise.all([
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({ where: { ...taskWhere, status: 'todo' } }),
    prisma.task.count({ where: { ...taskWhere, status: 'in_progress' } }),
    prisma.task.count({ where: { ...taskWhere, status: 'done' } }),
    prisma.task.count({ where: { ...taskWhere, status: 'overdue' } }),
  ]);

  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  // Completions last 30 days (by day)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentDone = await prisma.task.findMany({
    where: { ...taskWhere, status: 'done', completedAt: { gte: thirtyDaysAgo } },
    select: { completedAt: true },
  });

  const byDay: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay[d.toISOString().split('T')[0]] = 0;
  }
  for (const t of recentDone) {
    if (t.completedAt) {
      const key = t.completedAt.toISOString().split('T')[0];
      if (key in byDay) byDay[key]++;
    }
  }
  const completionsByDay = Object.entries(byDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Critical tasks (overdue + critical priority)
  const criticalTasks = await prisma.task.findMany({
    where: { ...taskWhere, status: { in: ['overdue', 'in_progress', 'todo'] }, priority: { in: ['critical', 'high'] } },
    include: {
      assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
    take: 20,
  });

  // Priority distribution
  const priorityDist = await prisma.task.groupBy({
    by: ['priority'],
    where: taskWhere,
    _count: true,
  });

  // Tasks by assignee
  const assigneeTasks = await prisma.taskAssignee.groupBy({
    by: ['userId'],
    where: { task: { ...taskWhere as Parameters<typeof prisma.task.findMany>[0]['where'] } },
    _count: true,
  });

  const userIds = assigneeTasks.map(a => a.userId);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
  const byAssignee = assigneeTasks.map(a => ({
    userId: a.userId,
    name: users.find(u => u.id === a.userId)?.name || 'Desconhecido',
    count: a._count,
  }));

  res.json({
    total, todo, inProgress, done, overdue, completionRate,
    completionsByDay, criticalTasks, priorityDist, byAssignee,
  });
});

export default router;
