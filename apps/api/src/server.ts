import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { initSocketServer } from './sockets/socketServer';
import { initMqttService } from './services/mqtt/mqttService';
import { seedInitialAdminAndDevice } from './scripts/seed';
import { logger } from './utils/logger';

const startServer = async () => {
  logger.info('========================================================');
  logger.info('   SMART PARCEL BOX — INDUSTRIAL MONITORING PLATFORM    ');
  logger.info('========================================================');

  // 1. Connect Database
  await connectDatabase();

  // 2. Seed initial data
  await seedInitialAdminAndDevice();

  // 3. Create Express App & HTTP Server
  const app = createApp();
  const server = http.createServer(app);

  // 4. Initialize Socket.IO
  initSocketServer(server);

  // 5. Initialize MQTT Service
  await initMqttService();

  // 6. Start Listening
  server.listen(env.PORT, () => {
    logger.info(`REST API Server listening on: http://localhost:${env.PORT}`);
    logger.info(`Health check endpoint:        http://localhost:${env.PORT}/api/health`);
    logger.info(`API Base route:               http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`Socket.IO Endpoint:           ws://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error('Fatal crash on server bootstrap:', err);
  process.exit(1);
});

