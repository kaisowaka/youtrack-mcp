#!/usr/bin/env node

// Enable MCP server logging before other imports
process.env.MCP_SERVER = 'true';

import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { Request, Response } from 'express';
import { logger } from './logger.js';
import { YouTrackMCPServer } from './server-core.js';

interface McpSession {
  server: YouTrackMCPServer;
  transport: SSEServerTransport;
}

const sessions = new Map<string, McpSession>();

const port = Number.parseInt(process.env.PORT ?? '3001', 10);
const basePath = process.env.MCP_BASE_PATH ?? '/mcp';

const app = express();
app.disable('x-powered-by');

function normalizeSessionId(sessionId: unknown): string | null {
  if (typeof sessionId === 'string' && sessionId.length > 0) {
    return sessionId;
  }

  if (Array.isArray(sessionId) && sessionId.length > 0) {
    const [first] = sessionId;
    return typeof first === 'string' ? first : null;
  }

  return null;
}

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.get(`${basePath}/sse`, async (req: Request, res: Response) => {
  logger.info('Incoming MCP SSE connection', { ip: req.ip });

  let youTrackServer: YouTrackMCPServer;
  try {
    youTrackServer = new YouTrackMCPServer();
  } catch (error) {
    logger.error('Failed to initialize YouTrack MCP server for session', error);
    res.status(500).json({ error: 'Failed to initialize YouTrack MCP server' });
    return;
  }

  const transport = new SSEServerTransport(`${basePath}/messages`, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server: youTrackServer, transport });

  youTrackServer.onConnectionClose(async () => {
    sessions.delete(sessionId);
    try {
      await youTrackServer.cleanup();
    } catch (closeError) {
      logger.warn('Error while cleaning up MCP session after close', {
        sessionId,
        error: closeError instanceof Error ? closeError.message : closeError,
      });
    }
    logger.info('MCP SSE session closed', { sessionId });
  });

  youTrackServer.onConnectionError((error) => {
    logger.error('MCP SSE session encountered transport error', {
      sessionId,
      error: error.message,
    });
  });

  try {
    await youTrackServer.connect(transport);
    logger.info('MCP SSE session established', {
      sessionId,
      ip: req.ip,
    });
  } catch (error) {
    sessions.delete(sessionId);
    logger.error('Failed to establish MCP SSE session', {
      sessionId,
      error: error instanceof Error ? error.message : error,
    });
    try {
      await transport.close();
    } catch (closeError) {
      logger.warn('Error while closing failed MCP transport', {
        sessionId,
        error: closeError instanceof Error ? closeError.message : closeError,
      });
    }
  }
});

app.post(`${basePath}/messages`, async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.query.sessionId);

  if (!sessionId) {
    res.status(400).json({ error: 'Missing sessionId query parameter' });
    return;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Unknown MCP session' });
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    logger.error('Failed to handle MCP message', {
      sessionId,
      error: error instanceof Error ? error.message : error,
    });
  }
});

const httpServer = app.listen(port, () => {
  logger.info('YouTrack MCP remote server listening', {
    port,
    basePath,
  });
});

let shuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  logger.info(`Received ${signal}, shutting down remote MCP server`);

  const closeHttpServer = new Promise<void>((resolve) => {
    httpServer.close((error) => {
      if (error) {
        logger.error('Error while closing HTTP server', error);
      }
      resolve();
    });
  });

  const closeSessions = Promise.allSettled(
    Array.from(sessions.entries()).map(async ([sessionId, session]) => {
      sessions.delete(sessionId);
      try {
        await session.server.cleanup({ disconnect: true });
      } catch (error) {
        logger.warn('Error while cleaning up MCP session during shutdown', {
          sessionId,
          error: error instanceof Error ? error.message : error,
        });
      }
    })
  );

  Promise.allSettled([closeSessions, closeHttpServer]).finally(() => {
    process.exit(0);
  });
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
