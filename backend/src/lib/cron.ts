import cron from 'node-cron';
import prisma from './prisma';
import { emitToAll } from './socket';

export function startCronJobs(): void {
  // Mark overdue tasks every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const updated = await prisma.task.updateMany({
        where: {
          status: { in: ['todo', 'in_progress'] },
          dueDate: { lt: now },
          deletedAt: null,
        },
        data: { status: 'overdue' },
      });
      if (updated.count > 0) {
        emitToAll('tasks:overdue', { count: updated.count });
      }
    } catch {}
  });

  // Hard-delete trash items older than 7 days (runs daily at 3am)
  cron.schedule('0 3 * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await prisma.task.deleteMany({ where: { deletedAt: { lt: cutoff } } });
      await prisma.project.deleteMany({ where: { deletedAt: { lt: cutoff } } });
    } catch {}
  });
}
