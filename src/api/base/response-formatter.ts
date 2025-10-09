import { MCPResponse } from './base-client.js';

export type { MCPResponse };

export interface ResponseMetadata {
  cached?: boolean;
  timestamp?: string;
  duration?: number;
  source?: string;
  version?: string;
}

export interface FormattedResponse {
  success: boolean;
  data?: any;
  message?: string;
  metadata?: ResponseMetadata;
  error?: string;
  context?: any;
}

/**
 * Response Formatter - Ensures consistent MCP response formatting
 * All API responses go through this formatter for consistency
 */
export class ResponseFormatter {
  
  /**
   * Format successful API response for MCP
   */
  static formatSuccess(
    data: any, 
    message?: string, 
    metadata?: ResponseMetadata
  ): MCPResponse {
    const response: FormattedResponse = {
      success: true,
      data,
      message: message || 'Operation completed successfully',
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };
  }
  
  /**
   * Format error response for MCP
   */
  static formatError(
    error: string, 
    context?: any,
    metadata?: ResponseMetadata
  ): MCPResponse {
    const response: FormattedResponse = {
      success: false,
      error,
      context,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };
  }
  
  /**
   * Format simple data response (backward compatibility)
   */
  static formatSimple(data: any): MCPResponse {
    return {
      content: [{
        type: 'text',
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      }]
    };
  }
  
  /**
   * Format list response with summary statistics
   */
  static formatList<T>(
    items: T[], 
    entityName: string,
    metadata?: ResponseMetadata & {
      totalCount?: number;
      filteredCount?: number;
      filters?: any;
    }
  ): MCPResponse {
    const count = items.length;
    const totalCount = metadata?.totalCount || count;
    
    let message = `Found ${count} ${entityName}${count !== 1 ? 's' : ''}`;
    if (totalCount !== count) {
      message += ` (${totalCount} total)`;
    }
    
    return ResponseFormatter.formatSuccess({
      items,
      count,
      totalCount,
      entityName,
      filters: metadata?.filters
    }, message, metadata);
  }
  
  /**
   * Format analytics/report response
   */
  static formatAnalytics(
    data: any,
    summary: any,
    reportType: string,
    metadata?: ResponseMetadata
  ): MCPResponse {
    return ResponseFormatter.formatSuccess({
      reportType,
      summary,
      data,
      generatedAt: new Date().toISOString()
    }, `${reportType} report generated successfully`, metadata);
  }
  
  /**
   * Format creation response
   */
  static formatCreated(
    entity: any,
    entityType: string,
    message?: string,
    metadata?: ResponseMetadata
  ): MCPResponse {
    const defaultMessage = `${entityType} created successfully`;
    
    return ResponseFormatter.formatSuccess({
      [entityType.toLowerCase()]: entity,
      created: true,
      id: entity.id || entity.idReadable || 'unknown'
    }, message || defaultMessage, metadata);
  }
  
  /**
   * Format update response
   */
  static formatUpdated(
    entity: any,
    entityType: string,
    changes?: any,
    message?: string,
    metadata?: ResponseMetadata
  ): MCPResponse {
    const defaultMessage = `${entityType} updated successfully`;
    
    return ResponseFormatter.formatSuccess({
      [entityType.toLowerCase()]: entity,
      updated: true,
      changes,
      id: entity.id || entity.idReadable || 'unknown'
    }, message || defaultMessage, metadata);
  }
  
  /**
   * Format deletion response
   */
  static formatDeleted(
    entityId: string,
    entityType: string,
    message?: string,
    metadata?: ResponseMetadata
  ): MCPResponse {
    const defaultMessage = `${entityType} deleted successfully`;
    
    return ResponseFormatter.formatSuccess({
      deleted: true,
      entityType,
      id: entityId
    }, message || defaultMessage, metadata);
  }
  
  /**
   * Add performance metadata to existing response
   */
  static addPerformanceData(
    response: MCPResponse,
    startTime: number,
    cacheHit: boolean = false
  ): MCPResponse {
    try {
      const content = JSON.parse(response.content[0].text);
      content.metadata = {
        ...content.metadata,
        duration: Date.now() - startTime,
        cached: cacheHit,
        performance: cacheHit ? 'cache_hit' : 'api_call'
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(content, null, 2)
        }]
      };
  } catch {
      // If parsing fails, return original response
      return response;
    }
  }
}
