import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../lib/jwt';
import prisma from '../lib/prisma';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token ausente' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccess(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }
    req.user = { id: user.id, profile: user.profile, email: user.email, name: user.name };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.profile !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito a administradores' });
    return;
  }
  next();
}
