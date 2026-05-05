import 'dotenv/config';
import http from 'http';
import app from './app';
import { initSocket } from './lib/socket';
import { startCronJobs } from './lib/cron';

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

initSocket(server);
startCronJobs();

server.listen(PORT, () => {
  console.log(`\n🔥 HIT Platform API rodando em http://localhost:${PORT}`);
  console.log(`   Banco: ${process.env.DATABASE_URL?.split('@')[1] || 'configurado'}`);
});
