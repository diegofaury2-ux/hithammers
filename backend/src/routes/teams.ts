import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const teams = await prisma.team.findMany({
    include: { members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } } },
    orderBy: { name: 'asc' },
  });
  res.json(teams);
});

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, description, color } = req.body;
  if (!name) { res.status(400).json({ error: 'Nome obrigatório' }); return; }
  const team = await prisma.team.create({ data: { name, description, color } });
  res.status(201).json(team);
});

router.put('/:id', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, description, color } = req.body;
  const team = await prisma.team.update({ where: { id: req.params.id }, data: { name, description, color } });
  res.json(team);
});

router.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await prisma.team.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.post('/:id/members', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body;
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: req.params.id, userId } },
    create: { teamId: req.params.id, userId },
    update: {},
  });
  res.json({ ok: true });
});

router.delete('/:id/members/:userId', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await prisma.teamMember.deleteMany({ where: { teamId: req.params.id, userId: req.params.userId } });
  res.json({ ok: true });
});

export default router;
