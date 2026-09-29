import 'dotenv/config';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const port = Number(process.env.PORT || 4000);

await connectDatabase();
const { app, apollo } = await createApp();
const httpServer = app.listen(port, '0.0.0.0', () => {
  console.info(`API lista en http://localhost:${port}/graphql`);
});

async function shutdown(signal) {
  console.info(`\n${signal}: cerrando servidor...`);
  httpServer.close(async () => {
    await apollo.stop();
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
