import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5174',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO(): Server {
  return io;
}

export function emitToProject(projectId: string, event: string, data: unknown): void {
  if (io) io.to(`project:${projectId}`).emit(event, data);
}

export function emitToAll(event: string, data: unknown): void {
  if (io) io.emit(event, data);
}
