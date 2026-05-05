import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
  res.json(clients);
});

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: 'Nome obrigatório' }); return; }
  const client = await prisma.client.create({ data: { name } });
  res.status(201).json(client);
});

router.put('/:id', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;
  const client = await prisma.client.update({ where: { id: req.params.id }, data: { name } });
  res.json(client);
});

router.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await prisma.client.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
