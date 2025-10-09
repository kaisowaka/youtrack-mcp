/**
 * Unit tests for PerformanceMonitor utility
 */

import { PerformanceMonitor } from '../../utils/performance-monitor.js';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset performance monitor between tests
    PerformanceMonitor.reset();
  });

  describe('track', () => {
    it('should track operation duration', () => {
      PerformanceMonitor.track('test-operation', 100, true);
      
      const stats = PerformanceMonitor.getStats('test-operation');
      expect(stats.count).toBe(1);
      expect(stats.avgDuration).toBe(100);
    });

    it('should track multiple operations', () => {
      PerformanceMonitor.track('test-op', 100, true);
      PerformanceMonitor.track('test-op', 200, true);
      PerformanceMonitor.track('test-op', 300, true);
      
      const stats = PerformanceMonitor.getStats('test-op');
      expect(stats.count).toBe(3);
      expect(stats.avgDuration).toBe(200); // (100+200+300)/3
    });

    it('should track successful and failed operations separately', () => {
      PerformanceMonitor.track('mixed-op', 100, true);
      PerformanceMonitor.track('mixed-op', 200, false);
      PerformanceMonitor.track('mixed-op', 300, true);
      
      const stats = PerformanceMonitor.getStats('mixed-op');
      expect(stats.count).toBe(3);
      expect(stats.successRate).toBe(67); // 2/3 = 66.67, rounded to 67
    });

    it('should calculate success rate correctly', () => {
      PerformanceMonitor.track('rate-op', 100, true);
      PerformanceMonitor.track('rate-op', 100, true);
      PerformanceMonitor.track('rate-op', 100, true);
      PerformanceMonitor.track('rate-op', 100, false);
      
      const stats = PerformanceMonitor.getStats('rate-op');
      expect(stats.successRate).toBe(75); // 3/4 = 75%
    });
  });

  describe('trackCacheHit', () => {
    it('should track cache hits and misses', () => {
      PerformanceMonitor.trackCacheHit(true);
      PerformanceMonitor.trackCacheHit(true);
      PerformanceMonitor.trackCacheHit(false);
      
      const cacheStats = PerformanceMonitor.getCacheStats();
      expect(cacheStats.hits).toBe(2);
      expect(cacheStats.misses).toBe(1);
    });

    it('should calculate cache hit rate', () => {
      for (let i = 0; i < 8; i++) {
        PerformanceMonitor.trackCacheHit(true);
      }
      for (let i = 0; i < 2; i++) {
        PerformanceMonitor.trackCacheHit(false);
      }
      
      const cacheStats = PerformanceMonitor.getCacheStats();
      expect(cacheStats.hitRate).toBe(80); // 8/10 = 80%
    });

    it('should handle zero cache accesses', () => {
      const cacheStats = PerformanceMonitor.getCacheStats();
      expect(cacheStats.hits).toBe(0);
      expect(cacheStats.misses).toBe(0);
      expect(cacheStats.hitRate).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return empty stats for non-existent operation', () => {
      const stats = PerformanceMonitor.getStats('non-existent');
      expect(stats.count).toBe(0);
      expect(stats.avgDuration).toBe(0);
    });

    it('should calculate min and max durations', () => {
      PerformanceMonitor.track('minmax-op', 50, true);
      PerformanceMonitor.track('minmax-op', 300, true);
      PerformanceMonitor.track('minmax-op', 150, true);
      
      const stats = PerformanceMonitor.getStats('minmax-op');
      expect(stats.minDuration).toBe(50);
      expect(stats.maxDuration).toBe(300);
    });

    it('should calculate P95 latency', () => {
      // Track 100 operations with varying durations
      for (let i = 1; i <= 100; i++) {
        PerformanceMonitor.track('p95-op', i * 10, true);
      }
      
      const stats = PerformanceMonitor.getStats('p95-op');
      const p95 = stats.p95Duration;
      
      // P95 should be around 950ms (95th percentile of 10-1000ms)
      expect(p95).toBeGreaterThan(900);
      expect(p95).toBeLessThanOrEqual(1000);
    });
  });

  describe('generateReport', () => {
    it('should generate formatted report', () => {
      PerformanceMonitor.track('report-op', 150, true);
      PerformanceMonitor.track('report-op', 200, true);
      PerformanceMonitor.trackCacheHit(true);
      PerformanceMonitor.trackCacheHit(false);
      
      const report = PerformanceMonitor.generateReport();
      
      expect(report).toContain('Performance Report');
      expect(report).toContain('report-op');
      expect(report).toContain('Cache Statistics');
      expect(report).toContain('50'); // Hit rate
    });

    it('should include all tracked operations in report', () => {
      PerformanceMonitor.track('op1', 100, true);
      PerformanceMonitor.track('op2', 200, true);
      PerformanceMonitor.track('op3', 300, true);
      
      const report = PerformanceMonitor.generateReport();
      
      expect(report).toContain('op1');
      expect(report).toContain('op2');
      expect(report).toContain('op3');
    });
  });

  describe('measure', () => {
    it('should measure async function execution', async () => {
      const testFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result';
      };
      
      const result = await PerformanceMonitor.measure('async-op', testFn);
      
      expect(result).toBe('result');
      
      const stats = PerformanceMonitor.getStats('async-op');
      expect(stats.count).toBe(1);
      expect(stats.minDuration).toBeGreaterThan(40);
    });

    it('should track successful execution', async () => {
      const successFn = async () => 'success';
      
      await PerformanceMonitor.measure('success-op', successFn);
      
      const stats = PerformanceMonitor.getStats('success-op');
      expect(stats.successRate).toBe(100);
    });

    it('should track failed execution and re-throw error', async () => {
      const errorFn = async () => {
        throw new Error('Test error');
      };
      
      await expect(
        PerformanceMonitor.measure('error-op', errorFn)
      ).rejects.toThrow('Test error');
      
      const stats = PerformanceMonitor.getStats('error-op');
      expect(stats.successRate).toBe(0);
    });

    it('should measure synchronous function returning promise', async () => {
      const syncPromiseFn = () => Promise.resolve('sync result');
      
      const result = await PerformanceMonitor.measure('sync-promise-op', syncPromiseFn);
      
      expect(result).toBe('sync result');
      
      const stats = PerformanceMonitor.getStats('sync-promise-op');
      expect(stats.count).toBe(1);
    });
  });

  describe('Performance Thresholds', () => {
    it('should track slow operations (>1000ms)', () => {
      PerformanceMonitor.track('slow-op', 1500, true);
      
      const stats = PerformanceMonitor.getStats('slow-op');
      expect(stats.maxDuration).toBe(1500);
      expect(stats.maxDuration).toBeGreaterThan(1000);
    });

    it('should track fast operations (<100ms)', () => {
      PerformanceMonitor.track('fast-op', 50, true);
      
      const stats = PerformanceMonitor.getStats('fast-op');
      expect(stats.avgDuration).toBe(50);
      expect(stats.avgDuration).toBeLessThan(100);
    });
  });

  describe('Data Retention', () => {
    it('should limit stored metrics to last 1000 operations', () => {
      // Track more than 1000 operations
      for (let i = 0; i < 1200; i++) {
        PerformanceMonitor.track('retention-op', 100, true);
      }
      
      const stats = PerformanceMonitor.getStats('retention-op');
      // Should only keep last 1000
      expect(stats.count).toBeLessThanOrEqual(1000);
    });
  });

  describe('getOperations', () => {
    it('should return list of tracked operations', () => {
      PerformanceMonitor.track('op1', 100, true);
      PerformanceMonitor.track('op2', 200, true);
      PerformanceMonitor.track('op3', 300, true);
      
      const operations = PerformanceMonitor.getOperations();
      
      expect(operations).toContain('op1');
      expect(operations).toContain('op2');
      expect(operations).toContain('op3');
      expect(operations.length).toBe(3);
    });
  });
});
