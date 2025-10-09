/**
 * Performance Monitor
 * Tracks API performance metrics and cache statistics
 */

import { logger } from '../logger.js';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  cached?: boolean;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static readonly MAX_METRICS = 1000; // Keep last 1000 metrics
  private static cacheHits = 0;
  private static cacheMisses = 0;

  /**
   * Track operation duration
   */
  static track(operation: string, duration: number, success: boolean = true, cached: boolean = false): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      cached
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log slow operations
    if (duration > 1000) {
      logger.warn('Slow operation detected', {
        operation,
        duration: `${duration}ms`,
        cached
      });
    }
  }

  /**
   * Track cache hit/miss
   */
  static trackCacheHit(hit: boolean): void {
    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { hits: number; misses: number; hitRate: number } {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;

    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Get performance statistics
   */
  static getStats(operation?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    successRate: number;
  } {
    let filtered = this.metrics;
    
    if (operation) {
      filtered = this.metrics.filter(m => m.operation === operation);
    }

    if (filtered.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        successRate: 100
      };
    }

    const durations = filtered.map(m => m.duration).sort((a, b) => a - b);
    const successes = filtered.filter(m => m.success).length;

    return {
      count: filtered.length,
      avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      successRate: Math.round((successes / filtered.length) * 100)
    };
  }

  /**
   * Get all operation names
   */
  static getOperations(): string[] {
    return [...new Set(this.metrics.map(m => m.operation))];
  }

  /**
   * Reset all metrics
   */
  static reset(): void {
    this.metrics = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Generate performance report
   */
  static generateReport(): string {
    const operations = this.getOperations();
    const cacheStats = this.getCacheStats();
    
    let report = '\n📊 Performance Report\n';
    report += '='.repeat(50) + '\n\n';
    
    report += `Cache Statistics:\n`;
    report += `  Hits: ${cacheStats.hits}\n`;
    report += `  Misses: ${cacheStats.misses}\n`;
    report += `  Hit Rate: ${cacheStats.hitRate}%\n\n`;
    
    report += `Operation Statistics:\n`;
    
    for (const op of operations) {
      const stats = this.getStats(op);
      report += `\n  ${op}:\n`;
      report += `    Count: ${stats.count}\n`;
      report += `    Avg: ${stats.avgDuration}ms\n`;
      report += `    P95: ${stats.p95Duration}ms\n`;
      report += `    Min/Max: ${stats.minDuration}ms / ${stats.maxDuration}ms\n`;
      report += `    Success Rate: ${stats.successRate}%\n`;
    }
    
    return report;
  }

  /**
   * Measure async operation
   */
  static async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    cached: boolean = false
  ): Promise<T> {
    const start = Date.now();
    let success = true;
    
    try {
      const result = await fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - start;
      this.track(operation, duration, success, cached);
    }
  }
}
