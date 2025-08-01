import { ResponseMetadata } from './response-formatter.js';

export interface CacheConfig {
  defaultTTL: number;     // Default time to live in seconds
  checkperiod: number;    // How often to check for expired keys
  maxKeys: number;        // Maximum number of keys to store
  useClones: boolean;     // Whether to clone objects when getting/setting
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  hits?: number;
}

// Simple in-memory cache implementation
class SimpleCache {
  private data: Map<string, CacheEntry> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private maxKeys: number;

  constructor(options: { maxKeys: number }) {
    this.maxKeys = options.maxKeys;
  }

  get<T>(key: string): T | undefined {
    const entry = this.data.get(key);
    if (entry && Date.now() - entry.timestamp < entry.ttl * 1000) {
      return entry.data as T;
    }
    this.data.delete(key);
    return undefined;
  }

  set<T>(key: string, value: T, ttl: number): boolean {
    // Remove oldest entries if at capacity
    if (this.data.size >= this.maxKeys && !this.data.has(key)) {
      const firstKey = this.data.keys().next().value;
      if (firstKey) {
        this.delete(firstKey);
      }
    }

    const entry: CacheEntry = {
      data: value,
      timestamp: Date.now(),
      ttl,
      hits: 0
    };

    this.data.set(key, entry);

    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set expiration timer
    const timer = setTimeout(() => {
      this.data.delete(key);
      this.timers.delete(key);
    }, ttl * 1000);

    this.timers.set(key, timer);
    return true;
  }

  has(key: string): boolean {
    const entry = this.data.get(key);
    if (entry && Date.now() - entry.timestamp < entry.ttl * 1000) {
      return true;
    }
    this.data.delete(key);
    return false;
  }

  delete(key: string): number {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    return this.data.delete(key) ? 1 : 0;
  }

  keys(): string[] {
    return Array.from(this.data.keys());
  }

  flushAll(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.data.clear();
  }
}

/**
 * Cache Manager - Intelligent caching for YouTrack API responses
 * Provides domain-specific cache strategies and performance optimization
 */
export class CacheManager {
  private cache: SimpleCache;
  private config: CacheConfig;
  private stats: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTTL: 300,        // 5 minutes default
      checkperiod: 60,        // Check every minute
      maxKeys: 1000,          // Store up to 1000 items
      useClones: false,       // Don't clone for performance
      ...config
    };

    this.cache = new SimpleCache({
      maxKeys: this.config.maxKeys
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Generate cache key with domain and parameters
   */
  generateKey(domain: string, endpoint: string, params?: any): string {
    const paramKey = params ? JSON.stringify(params) : '';
    const hash = this.simpleHash(paramKey);
    return `${domain}:${endpoint}:${hash}`;
  }

  /**
   * Get cached data with metadata
   */
  get(key: string): { data: any; metadata: ResponseMetadata } | null {
    const cached = this.cache.get<CacheEntry>(key);
    
    if (cached) {
      this.stats.hits++;
      // Update hit count for this entry
      cached.hits = (cached.hits || 0) + 1;
      this.cache.set(key, cached, cached.ttl);
      
      return {
        data: cached.data,
        metadata: {
          cached: true,
          timestamp: new Date(cached.timestamp).toISOString(),
          source: 'cache'
        }
      };
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Set cache data with domain-specific TTL
   */
  set(key: string, data: any, customTTL?: number): boolean {
    const ttl = customTTL || this.getDomainTTL(key);
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    };

    this.stats.sets++;
    return this.cache.set(key, entry, ttl);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete specific cache key
   */
  delete(key: string): number {
    const result = this.cache.delete(key);
    if (result > 0) {
      this.stats.deletes++;
    }
    return result;
  }

  /**
   * Delete all keys matching pattern
   */
  deletePattern(pattern: string): number {
    const keys = this.cache.keys().filter((key: string) => key.includes(pattern));
    let deleted = 0;
    keys.forEach(key => {
      deleted += this.cache.delete(key);
    });
    this.stats.deletes += deleted;
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = this.cache.keys();
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    
    return {
      ...this.stats,
      totalKeys: keys.length,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: process.memoryUsage(),
      cacheKeys: keys.length > 50 ? keys.slice(0, 50) : keys
    };
  }

  /**
   * Get domain-specific TTL based on cache key
   */
  private getDomainTTL(key: string): number {
    const domain = key.split(':')[0];
    
    // Domain-specific cache strategies
    switch (domain) {
      case 'issues':
        return 180;           // 3 minutes - issues change frequently
      case 'projects':
        return 900;           // 15 minutes - projects are more stable
      case 'users':
        return 1800;          // 30 minutes - user data rarely changes
      case 'articles':
        return 600;           // 10 minutes - knowledge base updates
      case 'agile':
        return 120;           // 2 minutes - sprints/boards change often
      case 'workitems':
        return 300;           // 5 minutes - time tracking data
      case 'admin':
        return 3600;          // 1 hour - admin settings rarely change
      case 'customfields':
        return 1800;          // 30 minutes - field configs are stable
      default:
        return this.config.defaultTTL;
    }
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    if (!str) return 'default';
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Warm up cache with common queries
   */
  async warmUp(warmupQueries: Array<{ key: string; fetcher: () => Promise<any> }>): Promise<void> {
    const promises = warmupQueries.map(async ({ key, fetcher }) => {
      try {
        if (!this.has(key)) {
          const data = await fetcher();
          this.set(key, data);
        }
      } catch (error) {
        console.warn(`Cache warmup failed for ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Create cache wrapper for async functions
   */
  createWrapper<T>(
    domain: string, 
    endpoint: string, 
    fetcher: (...args: any[]) => Promise<T>,
    ttl?: number
  ) {
    return async (...args: any[]): Promise<{ data: T; metadata: ResponseMetadata }> => {
      const key = this.generateKey(domain, endpoint, args);
      
      // Try cache first
      const cached = this.get(key);
      if (cached) {
        return cached;
      }
      
      // Fetch fresh data
      const startTime = Date.now();
      const data = await fetcher(...args);
      this.set(key, data, ttl);
      
      return {
        data,
        metadata: {
          cached: false,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          source: 'api'
        }
      };
    };
  }

  /**
   * Invalidate cache for a specific domain
   */
  invalidateDomain(domain: string): number {
    return this.deletePattern(domain + ':');
  }

  /**
   * Get cache health metrics
   */
  getHealthMetrics() {
    const stats = this.getStats();
    const hitRate = stats.hitRate;
    
    return {
      status: hitRate > 0.7 ? 'healthy' : hitRate > 0.4 ? 'warning' : 'poor',
      hitRate,
      recommendations: this.getCacheRecommendations(stats)
    };
  }

  /**
   * Get cache optimization recommendations
   */
  private getCacheRecommendations(stats: any): string[] {
    const recommendations: string[] = [];
    
    if (stats.hitRate < 0.4) {
      recommendations.push('Consider increasing cache TTL for frequently accessed data');
    }
    
    if (stats.totalKeys > this.config.maxKeys * 0.9) {
      recommendations.push('Cache is near capacity, consider increasing maxKeys or reducing TTL');
    }
    
    if (stats.hits < stats.misses) {
      recommendations.push('High cache miss rate detected, review caching strategy');
    }
    
    return recommendations;
  }
}
