#!/usr/bin/env node

// Set MCP server mode FIRST, before any imports that use logger
process.env.MCP_SERVER = 'true';

import { logger } from './logger.js';
import { YouTrackMCPServer } from './server-core.js';

const skipRuntime = process.env.SKIP_CONFIG_VALIDATION === 'true' || process.env.CI === 'true';

let server: YouTrackMCPServer | null = null;

try {
  server = new YouTrackMCPServer();

  if (skipRuntime) {
    logger.info('Configuration missing or CI mode detected - skipping runtime server startup');
  } else {
    const handleShutdown = (signal: NodeJS.Signals) => {
      logger.info(`Received ${signal}, shutting down`);

      if (!server) {
        process.exit(0);
        return;
      }

      server
        .cleanup({ disconnect: true })
        .catch((error) => {
          logger.warn('Error while cleaning up server during shutdown', error);
        })
        .finally(() => process.exit(0));
    };

    process.once('SIGINT', handleShutdown);
    process.once('SIGTERM', handleShutdown);

    server.run().catch((error) => {
      logger.error('Server failed to start', error);
      process.exit(1);
    });
  }
} catch (error) {
  logger.error('Failed to initialize server', error);
  if (!skipRuntime) {
    process.exit(1);
  }
}
