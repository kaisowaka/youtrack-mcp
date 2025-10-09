/**
 * Integration Tests for Core System Modules
 * Tests configuration and logging utilities
 */

import { ConfigManager, type Config } from '../../config.js';
import { logger, logApiCall, logError } from '../../logger.js';

describe('Configuration Module', () => {
  describe('ConfigManager', () => {
    test('should create config manager instance', () => {
      const configManager = new ConfigManager();
      
      expect(configManager).toBeInstanceOf(ConfigManager);
    });

    test('should load configuration', () => {
      const configManager = new ConfigManager();
      const config = configManager['config'];
      
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    test('should have youtrackUrl property', () => {
      const configManager = new ConfigManager();
      const config = configManager['config'] as Config;
      
      expect(config).toHaveProperty('youtrackUrl');
      expect(typeof config.youtrackUrl).toBe('string');
    });

    test('should have youtrackToken property', () => {
      const configManager = new ConfigManager();
      const config = configManager['config'] as Config;
      
      expect(config).toHaveProperty('youtrackToken');
      expect(typeof config.youtrackToken).toBe('string');
    });

    test('should have cache configuration', () => {
      const configManager = new ConfigManager();
      const config = configManager['config'] as Config;
      
      expect(config).toHaveProperty('cache');
      expect(config.cache).toHaveProperty('enabled');
      expect(config.cache).toHaveProperty('ttl');
    });

    test('should have rate limiting configuration', () => {
      const configManager = new ConfigManager();
      const config = configManager['config'] as Config;
      
      expect(config).toHaveProperty('rateLimiting');
    });

    test('should handle missing environment variables', () => {
      // Should not throw even if env vars are missing
      expect(() => new ConfigManager()).not.toThrow();
    });

    test('should provide default configuration values', () => {
      const configManager = new ConfigManager();
      const config = configManager['config'] as Config;
      
      // Defaults should be present
      expect(config.cache?.enabled).toBeDefined();
      expect(config.cache?.ttl).toBeDefined();
    });
  });
});

describe('Logger Module', () => {
  describe('Logger Instance', () => {
    test('should export logger instance', () => {
      expect(logger).toBeDefined();
    });

    test('should have standard logging methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    test('should have winston logger properties', () => {
      expect(logger).toHaveProperty('level');
      expect(logger).toHaveProperty('transports');
    });
  });

  describe('Logging Functions', () => {
    test('logApiCall should not throw', () => {
      expect(() => logApiCall('GET', '/issues')).not.toThrow();
    });

    test('logApiCall should accept params', () => {
      expect(() => logApiCall('POST', '/issues', { project: 'TEST' })).not.toThrow();
    });

    test('logError should not throw', () => {
      const error = new Error('Test error');
      expect(() => logError(error)).not.toThrow();
    });

    test('logError should accept context', () => {
      const error = new Error('Test error');
      const context = { operation: 'test', issueId: 'TEST-1' };
      expect(() => logError(error, context)).not.toThrow();
    });

    test('logger.info should work', () => {
      expect(() => logger.info('Test message')).not.toThrow();
    });

    test('logger.error should work', () => {
      expect(() => logger.error('Error message')).not.toThrow();
    });

    test('logger.warn should work', () => {
      expect(() => logger.warn('Warning message')).not.toThrow();
    });

    test('logger.debug should work', () => {
      expect(() => logger.debug('Debug message')).not.toThrow();
    });
  });

  describe('Log Formatting', () => {
    test('should handle string messages', () => {
      expect(() => {
        logger.info('Simple string');
        logger.error('Error string');
        logger.warn('Warning string');
        logger.debug('Debug string');
      }).not.toThrow();
    });

    test('should handle objects in log messages', () => {
      expect(() => {
        logger.info('Test', { key: 'value' });
        logger.error('Error', { code: 500 });
      }).not.toThrow();
    });

    test('should handle Error objects', () => {
      const error = new Error('Test error');
      expect(() => logger.error('An error occurred', error)).not.toThrow();
    });

    test('should handle null and undefined', () => {
      expect(() => {
        logger.info('Test with null', null);
        logger.info('Test with undefined', undefined);
      }).not.toThrow();
    });
  });
});

describe('Module Integration', () => {
  describe('Config and Logger Integration', () => {
    test('should log configuration loading', () => {
      expect(() => {
        logger.info('Loading configuration');
        const configManager = new ConfigManager();
        const config = configManager['config'] as Config;
        logger.info('Configuration loaded', { url: config.youtrackUrl });
      }).not.toThrow();
    });

    test('should log API calls with context', () => {
      expect(() => {
        const configManager = new ConfigManager();
        const config = configManager['config'] as Config;
        logApiCall('GET', `${config.youtrackUrl}/issues`, { query: 'project: TEST' });
      }).not.toThrow();
    });

    test('should log errors with configuration context', () => {
      expect(() => {
        const configManager = new ConfigManager();
        const config = configManager['config'] as Config;
        const error = new Error('Configuration error');
        logError(error, { config: config.youtrackUrl });
      }).not.toThrow();
    });
  });
});

describe('Environment Handling', () => {
  describe('Environment Variables', () => {
    test('should read from environment', () => {
      const configManager = new ConfigManager();
      const config = configManager['config'] as Config;
      
      // Config should be loaded from env or have defaults
      expect(config.youtrackUrl).toBeDefined();
    });

    test('should handle missing environment variables gracefully', () => {
      // Should not throw even if env vars are missing
      expect(() => new ConfigManager()).not.toThrow();
    });
  });

  describe('Default Values', () => {
    test('should provide default configuration', () => {
      const configManager = new ConfigManager();
      const config = configManager['config'] as Config;
      
      expect(config).toHaveProperty('youtrackUrl');
      expect(config).toHaveProperty('youtrackToken');
    });

    test('should have sensible cache defaults', () => {
      const configManager = new ConfigManager();
      const config = configManager['config'] as Config;
      
      if (config.cache) {
        expect(typeof config.cache.enabled).toBe('boolean');
        expect(typeof config.cache.ttl).toBe('number');
        expect(config.cache.ttl).toBeGreaterThan(0);
      }
    });

    test('should have rate limiting defaults', () => {
      const configManager = new ConfigManager();
      const config = configManager['config'] as Config;
      
      if (config.rateLimiting) {
        expect(config.rateLimiting).toHaveProperty('maxRequests');
        expect(config.rateLimiting).toHaveProperty('windowMs');
      }
    });
  });
});
