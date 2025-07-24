import * as fs from 'fs';
import * as path from 'path';

export interface Config {
  youtrackUrl: string;
  youtrackToken: string;
  defaultProjectId?: string;
  cache?: {
    enabled: boolean;
    ttl: number;
  };
  rateLimiting?: {
    maxRequests: number;
    windowMs: number;
  };
  customFields?: {
    mappings: Record<string, string>;
  };
}

export class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    // Priority: Environment variables > config file > defaults
    const configPath = process.env.YOUTRACK_MCP_CONFIG || './config.json';
    
    let fileConfig: any = {};
    if (fs.existsSync(configPath)) {
      try {
        fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch (error) {
        console.warn('Failed to load config file:', error);
      }
    }

    return {
      youtrackUrl: process.env.YOUTRACK_URL || fileConfig.youtrackUrl || '',
      youtrackToken: process.env.YOUTRACK_TOKEN || fileConfig.youtrackToken || '',
      defaultProjectId: process.env.PROJECT_ID || fileConfig.defaultProjectId,
      cache: {
        enabled: process.env.CACHE_ENABLED !== 'false',
        ttl: parseInt(process.env.CACHE_TTL || '300000'),
        ...fileConfig.cache,
      },
      rateLimiting: {
        maxRequests: 100,
        windowMs: 60000,
        ...fileConfig.rateLimiting,
      },
      customFields: fileConfig.customFields || {},
    };
  }

  get(): Config {
    return this.config;
  }

  validate(): void {
    if (!this.config.youtrackUrl || !this.config.youtrackToken) {
      throw new Error('YOUTRACK_URL and YOUTRACK_TOKEN are required');
    }
  }
}
