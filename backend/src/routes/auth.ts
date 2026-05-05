import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { signAccess, signRefresh, verifyRefresh, hashToken } from '../lib/jwt';
import { requireAuth } from '../middleware/auth';
import { sendForgotPassword } from '../lib/mailer';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha obrigatórios' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date(), isOnline: true } });
  const accessToken = signAccess({ userId: user.id, profile: user.profile });
  const refreshToken = signRefresh({ userId: user.id, profile: user.profile });
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      roleTitle: user.roleTitle,
      avatarUrl: user.avatarUrl,
      mustChangePassword: user.mustChangePassword,
    },
  });
});

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token obrigatório' });
    return;
  }
  try {
    const payload = verifyRefresh(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Refresh token inválido' });
      return;
    }
    await prisma.refreshToken.delete({ where: { tokenHash } });
    const newAccess = signAccess({ userId: payload.userId, profile: payload.profile });
    const newRefresh = signRefresh({ userId: payload.userId, profile: payload.profile });
    await prisma.refreshToken.create({
      data: {
        userId: payload.userId,
        tokenHash: hashToken(newRefresh),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Refresh token inválido' });
  }
});

router.post('/logout', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
  }
  await prisma.user.update({ where: { id: req.user!.id }, data: { isOnline: false } });
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) { res.status(404).json({ error: 'Não encontrado' }); return; }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    roleTitle: user.roleTitle,
    avatarUrl: user.avatarUrl,
    mustChangePassword: user.mustChangePassword,
  });
});

router.post('/change-password', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Nova senha deve ter ao menos 6 caracteres' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) { res.status(404).json({ error: 'Não encontrado' }); return; }
  if (user.passwordHash && currentPassword) {
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: 'Senha atual incorreta' });
      return;
    }
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash, mustChangePassword: false } });
  res.json({ ok: true });
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: 'E-mail obrigatório' }); return; }

  const user = await prisma.user.findUnique({ where: { email } });
  // Sempre retorna 200 para não vazar informação sobre usuários existentes
  if (!user) { res.json({ ok: true }); return; }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
  const tempPassword = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const hash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash, mustChangePassword: true },
  });

  try {
    await sendForgotPassword(user.email!, user.name, tempPassword);
  } catch (err) {
    console.error('Erro ao enviar e-mail de recuperação:', err);
  }

  res.json({ ok: true });
});

export default router;
