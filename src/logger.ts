import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'youtrack-mcp' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production' && !process.env.MCP_SERVER) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
} else if (process.env.MCP_SERVER) {
  // For MCP server mode, use plain JSON output without colors
  logger.add(new winston.transports.Console({
    format: winston.format.json()
  }));
}

// Helper function for logging API calls
export function logApiCall(method: string, endpoint: string, params?: any): void {
  logger.info('API Call', {
    method,
    endpoint,
    params: params ? JSON.stringify(params) : undefined,
    timestamp: new Date().toISOString(),
  });
}

// Helper function for logging errors
export function logError(error: Error, context?: any): void {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
