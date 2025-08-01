import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { logger, logApiCall, logError } from '../../logger.js';
import { CacheManager } from './cache-manager.js';

export interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface APIClientConfig {
  baseUrl: string;
  token: string;
  cache?: SimpleCache;
  timeout?: number;
  retries?: number;
}

/**
 * Base API Client - Common functionality for all YouTrack API interactions
 * Provides consistent error handling, caching, and response formatting
 */
export class BaseAPIClient {
  protected api: AxiosInstance;
  protected cache: SimpleCache;
  protected baseUrl: string;

  constructor(config: APIClientConfig) {
    this.baseUrl = config.baseUrl;
    this.cache = config.cache || new SimpleCache();
    
    // Configure axios instance with common settings
    this.api = axios.create({
      baseURL: `${config.baseUrl}/api`,
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'YouTrack-MCP-Server/1.0.0'
      }
    });

    // Configure retry logic
    axiosRetry(this.api, {
      retries: config.retries || 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return Boolean(axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response?.status && error.response.status >= 500));
      }
    });

    // Add request interceptor for logging
    this.api.interceptors.request.use((config) => {
      logApiCall(config.method?.toUpperCase() || 'GET', config.url || '', config.params);
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => this.handleApiError(error)
    );
  }

  /**
   * Unified error handling for all API calls
   */
  protected handleApiError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      let message = `YouTrack API Error (${status})`;
      
      if (data?.error_description) {
        message += `: ${data.error_description}`;
      } else if (data?.error) {
        message += `: ${data.error}`;
      } else if (data?.message) {
        message += `: ${data.message}`;
      } else {
        message += `: ${error.message}`;
      }
      
      logError(new Error(message), { 
        status, 
        url: error.config?.url,
        method: error.config?.method,
        data: data 
      });
      
      throw new Error(message);
    } else if (error.request) {
      const message = 'Network error: Unable to reach YouTrack server';
      logError(new Error(message), { error: error.message });
      throw new Error(message);
    } else {
      logError(error, { context: 'API request setup' });
      throw error;
    }
  }

  /**
   * Standard response formatting for MCP
   */
  protected formatResponse(data: any, message?: string): MCPResponse {
    const text = message || JSON.stringify(data, null, 2);
    
    return {
      content: [{
        type: 'text',
        text
      }]
    };
  }

  /**
   * Standard success response with data
   */
  protected formatSuccessResponse(data: any, message?: string): MCPResponse {
    const response = {
      success: true,
      data,
      message: message || 'Operation completed successfully'
    };
    
    return this.formatResponse(response);
  }

  /**
   * Standard error response
   */
  protected formatErrorResponse(error: string, context?: any): MCPResponse {
    const response = {
      success: false,
      error,
      context
    };
    
    return this.formatResponse(response);
  }

  /**
   * Get data with caching support
   */
  protected async getCached<T>(
    endpoint: string, 
    params?: any, 
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<T> {
    // Generate cache key if not provided
    const key = cacheKey || `${endpoint}:${JSON.stringify(params || {})}`;
    
    // Check cache first
    const cached = this.cache.get<T>(key);
    if (cached) {
      logger.debug('Cache hit', { key });
      return cached;
    }
    
    // Fetch from API
    const response = await this.api.get(endpoint, { params });
    const data = response.data;
    
    // Cache the result
    this.cache.set(key, data, cacheTTL);
    logger.debug('Cache miss, data cached', { key });
    
    return data;
  }

  /**
   * Post data with standard error handling
   */
  protected async post<T>(endpoint: string, data?: any, params?: any): Promise<T> {
    const response = await this.api.post(endpoint, data, { params });
    return response.data;
  }

  /**
   * Put data with standard error handling
   */
  protected async put<T>(endpoint: string, data?: any, params?: any): Promise<T> {
    const response = await this.api.put(endpoint, data, { params });
    return response.data;
  }

  /**
   * Delete with standard error handling
   */
  protected async delete<T>(endpoint: string, params?: any): Promise<T> {
    const response = await this.api.delete(endpoint, { params });
    return response.data;
  }

  /**
   * Clear cache for specific pattern or all
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      // Cache statistics would be implemented based on SimpleCache interface
      message: 'Cache statistics available'
    };
  }
}
