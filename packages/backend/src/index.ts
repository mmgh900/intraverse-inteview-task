import { app } from './api/server';
import { env } from './config/env';
import { logger } from './utils/logger';
import { startIndexer } from './indexer/indexer';
import { initWebSocket } from './ws/broadcast';

const start = async () => {
  try {
    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
    });

    initWebSocket(server);

    // Start indexer non-blocking
    startIndexer().catch((err) => {
      logger.error(err, 'Fatal indexer error');
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
};

start();
