import { AxiosInstance } from 'axios';
import { logger, logApiCall, logError } from '../logger.js';
import { FieldSelector } from '../field-selector.js';
import { MCPResponse } from '../youtrack-client.js';

export interface QueryFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn' | 'greater' | 'less' | 'between' | 'isEmpty' | 'isNotEmpty';
  value: any;
  negate?: boolean;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryParams {
  projectId?: string;
  filters?: QueryFilter[];
  textSearch?: string;
  sorting?: SortOption[];
  pagination?: {
    limit?: number;
    offset?: number;
  };
  fields?: string[];
  includeMetadata?: boolean;
}

export interface QueryMetadata {
  totalCount: number;
  hasMore: boolean;
  queryTime: number;
  filters: QueryFilter[];
  sorting: SortOption[];
  generatedQuery: string;
}

export class AdvancedQueryEngine {
  private api: AxiosInstance;
  private queryCache: Map<string, { result: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(api: AxiosInstance) {
    this.api = api;
  }

  /**
   * Execute advanced query with comprehensive filtering and optimization
   */
  async executeQuery(params: QueryParams): Promise<MCPResponse> {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(params);
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }

      // Build YouTrack query string
      const queryString = this.buildQueryString(params);
      
      // Optimize field selection
      const fields = this.optimizeFieldSelection(params.fields);
      
      // Execute the query
      const apiParams: any = {
        fields: fields,
        $top: params.pagination?.limit || 100,
        $skip: params.pagination?.offset || 0
      };

      if (queryString.trim()) {
        apiParams.query = queryString;
      }

      // Add sorting
      if (params.sorting && params.sorting.length > 0) {
        apiParams.orderBy = params.sorting
          .map(sort => `${sort.field} ${sort.direction}`)
          .join(', ');
      }

      logApiCall('GET', '/issues', apiParams);
      const response = await this.api.get('/issues', { params: apiParams });
      
      const queryTime = Date.now() - startTime;
      const issues = response.data || [];

      // Build comprehensive response
      const result = {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issues: issues,
            metadata: params.includeMetadata ? {
              totalCount: issues.length,
              hasMore: issues.length === (params.pagination?.limit || 100),
              queryTime,
              filters: params.filters || [],
              sorting: params.sorting || [],
              generatedQuery: queryString,
              performance: this.getPerformanceMetrics(queryTime, issues.length)
            } : undefined
          }, null, 2)
        }]
      };

      // Cache the result
      this.cacheResult(cacheKey, result);
      
      return result;

    } catch (error) {
      logError(error as Error, { method: 'executeQuery', params });
      throw new Error(`Advanced query execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Build YouTrack query string from structured filters
   */
  private buildQueryString(params: QueryParams): string {
    const queryParts: string[] = [];

    // Add project filter
    if (params.projectId) {
      queryParts.push(`project: ${params.projectId}`);
    }

    // Process structured filters
    if (params.filters) {
      for (const filter of params.filters) {
        const queryPart = this.buildFilterQuery(filter);
        if (queryPart) {
          queryParts.push(queryPart);
        }
      }
    }

    // Add text search
    if (params.textSearch) {
      // Use YouTrack's full-text search
      queryParts.push(`#${params.textSearch}`);
    }

    return queryParts.join(' ');
  }

  /**
   * Build individual filter query part
   */
  private buildFilterQuery(filter: QueryFilter): string {
    const { field, operator, value, negate } = filter;
    const negation = negate ? '-' : '';

    switch (operator) {
      case 'equals':
        return `${negation}${field}: ${this.escapeValue(value, field)}`;
      
      case 'contains':
        return `${negation}${field}: ${this.escapeValue(value, field)}`;
      
      case 'in':
        if (Array.isArray(value)) {
          // Special handling for state fields - filter out invalid states with spaces
          if (field?.toLowerCase() === 'state') {
            const validStates = value.filter((state: string) => !String(state).includes(' '));
            if (validStates.length === 0) {
              throw new Error(`All provided state values contain spaces and cannot be queried in YouTrack. Use states without spaces like: Open, Done, Duplicate`);
            }
            if (validStates.length !== value.length) {
              console.warn(`Warning: Some state values with spaces were filtered out. Using: ${validStates.join(', ')}`);
            }
            if (validStates.length === 1) {
              return `${negation}${field}: ${validStates[0]}`;
            }
            // Use comma-separated syntax for multiple states (YouTrack syntax)
            return `${negation}${field}: ${validStates.join(',')}`;
          }
          
          // For other fields, use OR syntax for multiple values
          const escapedValues = value.map(v => this.escapeValue(v, field));
          if (escapedValues.length === 1) {
            return `${negation}${field}: ${escapedValues[0]}`;
          }
          return escapedValues.map(val => `${negation}${field}: ${val}`).join(' or ');
        }
        return `${negation}${field}: ${this.escapeValue(value, field)}`;
      
      case 'isEmpty':
        return `has: ${negation}-${field}`;
      
      case 'isNotEmpty':
        return `has: ${negation}${field}`;
      
      case 'greater':
        return `${negation}${field}: ${this.escapeValue(value, field)}..`;
      
      case 'less':
        return `${negation}${field}: ..${this.escapeValue(value, field)}`;
      
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          return `${negation}${field}: ${this.escapeValue(value[0], field)}..${this.escapeValue(value[1], field)}`;
        }
        break;
      
      default:
        return `${negation}${field}: ${this.escapeValue(value, field)}`;
    }

    return '';
  }

  /**
   * Escape special characters in query values
   * Note: YouTrack doesn't support quoted state or priority values
   */
  private escapeValue(value: any, fieldName?: string): string {
    const str = String(value);
    
    // Special handling for state and priority fields - YouTrack doesn't support quoted values
    if (fieldName?.toLowerCase() === 'state' || fieldName?.toLowerCase() === 'priority') {
      // Only allow states without spaces since YouTrack can't query states with spaces
      if (fieldName?.toLowerCase() === 'state' && str.includes(' ')) {
        throw new Error(`State values with spaces (like "${str}") cannot be queried in YouTrack. Use states without spaces like: Open, Done, Duplicate`);
      }
      // Priority values like "Show-stopper" are valid and should not be quoted
      return str;
    }
    
    // For other fields, use quotes for multi-word values or values with special characters
    if (str.includes(' ') || str.includes(':') || str.includes('{') || str.includes('}') || str.includes('-')) {
      return `"${str.replace(/"/g, '\\"')}"`;
    }
    return str;
  }

  /**
   * Optimize field selection based on query type
   */
  private optimizeFieldSelection(requestedFields?: string[]): string {
    if (requestedFields && requestedFields.length > 0) {
      return requestedFields.join(',');
    }

    // Return optimized default field set
    return FieldSelector.getSearchResultFields();
  }

  /**
   * Get performance metrics for query optimization
   */
  private getPerformanceMetrics(queryTime: number, resultCount: number) {
    return {
      queryTimeMs: queryTime,
      resultCount,
      performance: queryTime < 1000 ? 'excellent' : 
                  queryTime < 3000 ? 'good' : 
                  queryTime < 5000 ? 'fair' : 'slow',
      suggestions: this.getOptimizationSuggestions(queryTime, resultCount)
    };
  }

  /**
   * Get optimization suggestions based on query performance
   */
  private getOptimizationSuggestions(queryTime: number, resultCount: number): string[] {
    const suggestions: string[] = [];

    if (queryTime > 3000) {
      suggestions.push('Consider adding more specific filters to reduce result set');
    }

    if (resultCount > 500) {
      suggestions.push('Large result set detected - consider pagination');
    }

    if (queryTime > 5000) {
      suggestions.push('Query is slow - consider using cached results or background processing');
    }

    return suggestions;
  }

  /**
   * Generate cache key for query result caching
   */
  private generateCacheKey(params: QueryParams): string {
    return `advanced-query-${Buffer.from(JSON.stringify(params)).toString('base64')}`;
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult(cacheKey: string): MCPResponse | null {
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    return null;
  }

  /**
   * Cache query result
   */
  private cacheResult(cacheKey: string, result: MCPResponse): void {
    this.queryCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (this.queryCache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Get query suggestions based on project schema
   */
  async getQuerySuggestions(projectId?: string): Promise<MCPResponse> {
    try {
      const suggestions = {
        commonFields: [
          'state', 'priority', 'type', 'assignee', 'reporter',
          'created', 'updated', 'resolved', 'summary', 'description'
        ],
        operators: [
          { name: 'equals', symbol: ':', example: 'state: Open' },
          { name: 'contains', symbol: ':', example: 'summary: bug' },
          { name: 'in', symbol: '{}', example: 'priority: {High Critical}' },
          { name: 'greater', symbol: '>', example: 'created: >2025-01-01' },
          { name: 'less', symbol: '<', example: 'updated: <2025-07-01' },
          { name: 'between', symbol: '..', example: 'created: 2025-01-01 .. 2025-07-01' },
          { name: 'has', symbol: 'has:', example: 'has: assignee' },
          { name: 'negation', symbol: '-', example: '-state: Resolved' }
        ],
        exampleQueries: [
          // Basic examples
          'state: Open',
          'priority: High',
          'assignee: me',
          
          // Project-specific examples  
          'project: YTM state: Open',
          'project: PROJECT-1 assignee: john.doe',
          
          // Multi-value examples
          'state: {Open "In Progress"}',
          'priority: {High Critical}',
          'assignee: {alice bob charlie}',
          
          // Date and range examples
          'created: >2025-01-01',
          'updated: <2025-07-01',
          'created: 2025-01-01..2025-07-01',
          
          // Complex combinations
          'priority: {High Critical} -state: Resolved',
          'created: >2025-07-01 assignee: me state: Open',
          'project: YTM #authentication type: Bug',
          
          // Field existence examples
          'has: -assignee priority: High',
          'has: description -has: resolution',
          
          // Full-text search examples
          '#bug authentication',
          '#performance state: Open',
          '#crash priority: Critical'
        ],
        advancedFeatures: [
          '🔍 Full-text search with # prefix (e.g., #bug, #performance)',
          '📅 Date range queries (e.g., created: 2025-01-01..2025-07-01)',
          '🏷️ Custom field queries (use field names from your YouTrack setup)',
          '🔀 Multi-field sorting (priority desc, created asc)',
          '📄 Smart pagination (limit/offset with performance optimization)',
          '⚡ Performance monitoring (query time tracking and suggestions)',
          '💾 Intelligent caching (60-second TTL with automatic cleanup)',
          '✅ Query validation (prevents invalid queries before execution)',
          '🎯 Field optimization (minimal data transfer for better performance)',
          '📊 Rich metadata (performance metrics and optimization hints)'
        ],
        usageTips: [
          '💡 Always include project filter for best performance',
          '🚀 Use "in" operator for multiple values: priority: {High Critical}',
          '📋 Use "has:" for field existence: has: assignee, has: -description',
          '📅 Date formats: YYYY-MM-DD or relative like ">2025-01-01"',
          '🔍 Text search with #: #bug finds "bug" in summary and description',
          '⚠️ Quote multi-word values: state: "In Progress"',
          '🔄 Use pagination for large result sets: limit 100, offset 0',
          '📈 Enable metadata to see performance and optimization suggestions'
        ]
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(suggestions, null, 2)
        }]
      };

    } catch (error) {
      logError(error as Error, { method: 'getQuerySuggestions', projectId });
      throw new Error(`Failed to get query suggestions: ${(error as Error).message}`);
    }
  }

  /**
   * Validate query syntax before execution
   */
  validateQuery(params: QueryParams): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for potential performance issues
    if (!params.projectId && !params.filters?.some(f => f.field === 'project')) {
      warnings.push('No project filter specified - query may be slow');
    }

    if (params.pagination?.limit && params.pagination.limit > 1000) {
      warnings.push('Large limit specified - consider pagination for better performance');
    }

    // Validate filters
    if (params.filters) {
      for (const filter of params.filters) {
        if (!filter.field || filter.value === undefined) {
          errors.push(`Invalid filter: ${JSON.stringify(filter)}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
