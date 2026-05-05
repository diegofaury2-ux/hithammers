import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { emitToProject, emitToAll } from '../lib/socket';
import { sendCommentNotification } from '../lib/mailer';

const router = Router();

const taskInclude = {
  assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
  checklistItems: { where: { parentItemId: null }, include: { subitems: true }, orderBy: { order: 'asc' as const } },
  comments: { include: { author: { select: { id: true, name: true, avatarUrl: true, profile: true } } }, orderBy: { createdAt: 'asc' as const } },
  dependsOn: { include: { dependencyTask: { select: { id: true, title: true, status: true } } } },
  dependedOnBy: { include: { dependentTask: { select: { id: true, title: true, status: true } } } },
  createdBy: { select: { id: true, name: true } },
};

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { projectId, status, priority, assigneeId } = req.query;
  if (!projectId) { res.status(400).json({ error: 'projectId obrigatório' }); return; }
  const where: Record<string, unknown> = { projectId, deletedAt: null };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assignees = { some: { userId: assigneeId } };

  const tasks = await prisma.task.findMany({ where, include: taskInclude, orderBy: { dueDate: 'asc' } });
  const isAdmin = req.user!.profile === 'admin';
  const filtered = tasks.map(t => ({
    ...t,
    comments: t.comments.filter(c => isAdmin || !c.isAdminOnly),
  }));
  res.json(filtered);
});

router.get('/trash', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.query;
  const where: Record<string, unknown> = { deletedAt: { not: null } };
  if (projectId) where.projectId = projectId;
  const tasks = await prisma.task.findMany({ where, include: { assignees: { include: { user: { select: { id: true, name: true } } } } }, orderBy: { deletedAt: 'desc' } });
  res.json(tasks);
});

router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: taskInclude });
  if (!task) { res.status(404).json({ error: 'Não encontrado' }); return; }
  const isAdmin = req.user!.profile === 'admin';
  res.json({ ...task, comments: task.comments.filter(c => isAdmin || !c.isAdminOnly) });
});

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { projectId, parentTaskId, title, description, priority, dueDate, assigneeIds, status } = req.body;
  if (!projectId || !title || !dueDate) {
    res.status(400).json({ error: 'projectId, título e data de entrega são obrigatórios' });
    return;
  }
  if (!assigneeIds || assigneeIds.length === 0) {
    res.status(400).json({ error: 'Ao menos um responsável é obrigatório' });
    return;
  }
  const task = await prisma.task.create({
    data: {
      projectId, parentTaskId, title, description,
      priority: priority || 'medium',
      status: status || 'todo',
      dueDate: new Date(dueDate),
      createdById: req.user!.id,
      assignees: { create: assigneeIds.map((uid: string) => ({ userId: uid })) },
    },
    include: taskInclude,
  });
  await recalcProject(projectId);
  emitToProject(projectId, 'task:created', task);
  res.status(201).json(task);
});

router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) { res.status(404).json({ error: 'Não encontrado' }); return; }

  const isAdmin = req.user!.profile === 'admin';
  const isCreator = task.createdById === req.user!.id;
  if (!isAdmin && !isCreator) { res.status(403).json({ error: 'Sem permissão' }); return; }

  const { title, description, priority, status, dueDate, assigneeIds } = req.body;
  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (priority !== undefined) data.priority = priority;
  if (status !== undefined) data.status = status;
  if (dueDate !== undefined) data.dueDate = new Date(dueDate);

  if (assigneeIds !== undefined) {
    await prisma.taskAssignee.deleteMany({ where: { taskId: req.params.id } });
    if (assigneeIds.length) {
      await prisma.taskAssignee.createMany({ data: assigneeIds.map((uid: string) => ({ taskId: req.params.id, userId: uid })) });
    }
  }

  const updated = await prisma.task.update({ where: { id: req.params.id }, data, include: taskInclude });
  await recalcProject(updated.projectId);
  emitToProject(updated.projectId, 'task:updated', updated);
  res.json(updated);
});

router.post('/:id/complete', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { timeSpentMinutes } = req.body;
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) { res.status(404).json({ error: 'Não encontrado' }); return; }

  // Check blocking dependencies
  const blockingDeps = await prisma.taskDependency.findMany({
    where: { dependentTaskId: req.params.id },
    include: { dependencyTask: true },
  });
  const blockers = blockingDeps.filter(d => d.dependencyTask.status !== 'done');
  if (blockers.length > 0) {
    res.status(400).json({ error: 'Esta tarefa depende de outras tarefas ainda não concluídas', blockers: blockers.map(b => ({ id: b.dependencyTask.id, title: b.dependencyTask.title })) });
    return;
  }

  const updated = await prisma.task.update({
    where: { id: req.params.id },
    data: { status: 'done', completedAt: new Date(), timeSpentMinutes: timeSpentMinutes ?? null },
    include: taskInclude,
  });
  await recalcProject(updated.projectId);
  emitToProject(updated.projectId, 'task:updated', updated);
  res.json(updated);
});

router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const task = await prisma.task.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  await recalcProject(task.projectId);
  emitToProject(task.projectId, 'task:deleted', { id: req.params.id });
  res.json({ ok: true });
});

router.post('/:id/restore', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const task = await prisma.task.update({ where: { id: req.params.id }, data: { deletedAt: null } });
  await recalcProject(task.projectId);
  res.json(task);
});

router.delete('/:id/permanent', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Dependencies
router.post('/:id/dependencies', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { dependencyTaskId } = req.body;
  if (dependencyTaskId === req.params.id) { res.status(400).json({ error: 'Uma tarefa não pode depender de si mesma' }); return; }
  await prisma.taskDependency.upsert({
    where: { dependentTaskId_dependencyTaskId: { dependentTaskId: req.params.id, dependencyTaskId } },
    create: { dependentTaskId: req.params.id, dependencyTaskId },
    update: {},
  });
  res.json({ ok: true });
});

router.delete('/:id/dependencies/:depId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  await prisma.taskDependency.deleteMany({ where: { dependentTaskId: req.params.id, dependencyTaskId: req.params.depId } });
  res.json({ ok: true });
});

// Checklist
router.post('/:id/checklist', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { text, parentItemId } = req.body;
  const count = await prisma.taskChecklistItem.count({ where: { taskId: req.params.id } });
  const item = await prisma.taskChecklistItem.create({ data: { taskId: req.params.id, text, parentItemId, order: count } });
  res.status(201).json(item);
});

router.patch('/:id/checklist/:itemId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { text, isDone } = req.body;
  const item = await prisma.taskChecklistItem.update({ where: { id: req.params.itemId }, data: { text, isDone } });
  res.json(item);
});

router.delete('/:id/checklist/:itemId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  await prisma.taskChecklistItem.delete({ where: { id: req.params.itemId } });
  res.json({ ok: true });
});

// Comments
router.post('/:id/comments', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { content, isAdminOnly } = req.body;
  const isAdmin = req.user!.profile === 'admin';
  const comment = await prisma.taskComment.create({
    data: { taskId: req.params.id, authorId: req.user!.id, content, isAdminOnly: isAdmin ? !!isAdminOnly : false },
    include: { author: { select: { id: true, name: true, avatarUrl: true, profile: true } } },
  });

  // Notifica responsáveis por email quando admin posta comentário público
  if (isAdmin) {
    try {
      const task = await prisma.task.findUnique({
        where: { id: req.params.id },
        include: { assignees: { include: { user: { select: { id: true, name: true, email: true } } } } },
      });
      const author = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
      if (task && author) {
        for (const assignee of task.assignees) {
          if (assignee.user.email && assignee.user.id !== req.user!.id) {
            sendCommentNotification(
              assignee.user.email,
              assignee.user.name,
              task.title,
              author.name,
              content,
            ).catch(err => console.error('Erro ao enviar notificação de comentário:', err));
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados para notificação:', err);
    }
  }

  res.status(201).json(comment);
});

router.delete('/:id/comments/:commentId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const comment = await prisma.taskComment.findUnique({ where: { id: req.params.commentId } });
  if (!comment) { res.status(404).json({ error: 'Não encontrado' }); return; }
  const isAdmin = req.user!.profile === 'admin';
  if (!isAdmin && comment.authorId !== req.user!.id) { res.status(403).json({ error: 'Sem permissão' }); return; }
  await prisma.taskComment.delete({ where: { id: req.params.commentId } });
  res.json({ ok: true });
});

// Assignees
router.post('/:id/assignees', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body;
  await prisma.taskAssignee.upsert({
    where: { taskId_userId: { taskId: req.params.id, userId } },
    create: { taskId: req.params.id, userId },
    update: {},
  });
  res.json({ ok: true });
});

router.delete('/:id/assignees/:userId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  await prisma.taskAssignee.deleteMany({ where: { taskId: req.params.id, userId: req.params.userId } });
  res.json({ ok: true });
});

async function recalcProject(projectId: string): Promise<void> {
  const total = await prisma.task.count({ where: { projectId, deletedAt: null } });
  const done = await prisma.task.count({ where: { projectId, deletedAt: null, status: 'done' } });
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  await prisma.project.update({ where: { id: projectId }, data: { completionPct: pct } });
}

export default router;
