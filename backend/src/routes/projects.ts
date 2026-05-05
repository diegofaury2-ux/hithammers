import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { emitToAll } from '../lib/socket';

const router = Router();

const projectInclude = {
  client: true,
  projectTeams: { include: { team: true } },
  _count: { select: { tasks: { where: { deletedAt: null } } } },
};

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { teamId, status, priority, clientId, search } = req.query;
  const where: Record<string, unknown> = { deletedAt: null, archivedAt: null };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (clientId) where.clientId = clientId;
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (teamId) where.projectTeams = { some: { teamId } };

  const projects = await prisma.project.findMany({
    where,
    include: projectInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json(projects);
});

router.get('/trash', requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const projects = await prisma.project.findMany({
    where: { deletedAt: { not: null } },
    include: projectInclude,
    orderBy: { deletedAt: 'desc' },
  });
  res.json(projects);
});

router.get('/archived', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const projects = await prisma.project.findMany({
    where: { archivedAt: { not: null }, deletedAt: null },
    include: projectInclude,
    orderBy: { archivedAt: 'desc' },
  });
  res.json(projects);
});

router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { ...projectInclude, tasks: { where: { deletedAt: null }, include: { assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } }, orderBy: { dueDate: 'asc' } } },
  });
  if (!project) { res.status(404).json({ error: 'Não encontrado' }); return; }
  res.json(project);
});

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { name, description, whatWhy, howWhere, budget, clientId, projectType, priority, status, startDate, endDate, teamIds } = req.body;
  if (!name) { res.status(400).json({ error: 'Nome obrigatório' }); return; }
  const project = await prisma.project.create({
    data: {
      name, description, whatWhy, howWhere, budget: budget ? parseFloat(budget) : undefined,
      clientId, projectType, priority: priority || 'medium', status: status || 'active',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      createdById: req.user!.id,
      projectTeams: teamIds?.length ? { create: teamIds.map((tid: string) => ({ teamId: tid })) } : undefined,
    },
    include: projectInclude,
  });
  emitToAll('project:created', project);
  res.status(201).json(project);
});

router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { name, description, whatWhy, howWhere, budget, clientId, projectType, priority, status, startDate, endDate, teamIds } = req.body;
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (whatWhy !== undefined) data.whatWhy = whatWhy;
  if (howWhere !== undefined) data.howWhere = howWhere;
  if (budget !== undefined) data.budget = budget ? parseFloat(budget) : null;
  if (clientId !== undefined) data.clientId = clientId;
  if (projectType !== undefined) data.projectType = projectType;
  if (priority !== undefined) data.priority = priority;
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (status !== undefined) {
    data.status = status;
    if (status === 'archived') data.archivedAt = new Date();
    else data.archivedAt = null;
  }

  if (teamIds !== undefined) {
    await prisma.projectTeam.deleteMany({ where: { projectId: req.params.id } });
    if (teamIds.length) {
      await prisma.projectTeam.createMany({ data: teamIds.map((tid: string) => ({ projectId: req.params.id, teamId: tid })) });
    }
  }

  const project = await prisma.project.update({ where: { id: req.params.id }, data, include: projectInclude });
  emitToAll('project:updated', project);
  res.json(project);
});

router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  await prisma.project.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  emitToAll('project:deleted', { id: req.params.id });
  res.json({ ok: true });
});

router.post('/:id/restore', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: { deletedAt: null, archivedAt: null, status: 'active' },
    include: projectInclude,
  });
  res.json(project);
});

router.delete('/:id/permanent', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.post('/:id/archive', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: { status: 'archived', archivedAt: new Date() },
    include: projectInclude,
  });
  res.json(project);
});

// Excluir TODOS os projetos (soft delete) — requer senha do admin
router.post('/delete-all', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;
  if (!password) { res.status(400).json({ error: 'Senha obrigatória' }); return; }

  const admin = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!admin?.passwordHash) { res.status(400).json({ error: 'Erro de autenticação' }); return; }
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) { res.status(403).json({ error: 'Senha incorreta' }); return; }

  await prisma.project.updateMany({
    where: { deletedAt: null },
    data: { deletedAt: new Date() },
  });
  emitToAll('project:deleted', { all: true });
  res.json({ ok: true });
});

router.post('/:id/duplicate', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const original = await prisma.project.findUnique({ where: { id: req.params.id }, include: { projectTeams: true } });
  if (!original) { res.status(404).json({ error: 'Não encontrado' }); return; }
  const copy = await prisma.project.create({
    data: {
      name: `${original.name} (cópia)`,
      description: original.description,
      whatWhy: original.whatWhy,
      howWhere: original.howWhere,
      budget: original.budget,
      clientId: original.clientId,
      projectType: original.projectType,
      priority: original.priority,
      status: 'active',
      createdById: req.user!.id,
      projectTeams: { create: original.projectTeams.map(pt => ({ teamId: pt.teamId })) },
    },
    include: projectInclude,
  });
  res.status(201).json(copy);
});

export default router;
