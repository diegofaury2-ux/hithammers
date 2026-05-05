import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, profile: true, roleTitle: true, avatarUrl: true, isOnline: true, mustChangePassword: true, createdAt: true, lastLogin: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
});

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, profile, roleTitle } = req.body;
  if (!name) { res.status(400).json({ error: 'Nome obrigatório' }); return; }
  const data: Record<string, unknown> = { name, profile: profile || 'member', roleTitle, mustChangePassword: true };
  if (email) data.email = email;
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }
  const user = await prisma.user.create({ data: data as Parameters<typeof prisma.user.create>[0]['data'] });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, profile: user.profile });
});

router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, email: true, profile: true, roleTitle: true, avatarUrl: true, isOnline: true, mustChangePassword: true, createdAt: true, lastLogin: true, teamMemberships: { include: { team: true } } },
  });
  if (!user) { res.status(404).json({ error: 'Não encontrado' }); return; }
  res.json(user);
});

router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const isAdmin = req.user!.profile === 'admin';
  const isSelf = req.user!.id === req.params.id;
  if (!isAdmin && !isSelf) { res.status(403).json({ error: 'Sem permissão' }); return; }

  const { name, email, roleTitle, profile, avatarUrl } = req.body;
  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
  if (isAdmin) {
    if (email !== undefined) data.email = email;
    if (roleTitle !== undefined) data.roleTitle = roleTitle;
    if (profile) data.profile = profile;
  } else {
    if (roleTitle !== undefined) data.roleTitle = roleTitle;
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data });
  res.json({ id: user.id, name: user.name, email: user.email, profile: user.profile });
});

router.post('/:id/set-password', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;
  if (!password || password.length < 4) { res.status(400).json({ error: 'Senha muito curta' }); return; }
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash: hash, mustChangePassword: true } });
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  if (req.params.id === req.user!.id) { res.status(400).json({ error: 'Não pode excluir a si mesmo' }); return; }
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
