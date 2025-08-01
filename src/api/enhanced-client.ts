import { YouTrackConfig } from './base/enhanced-base-client.js';
import { IssuesAPIClient } from './domains/issues-api.js';
import { AgileAPIClient } from './domains/agile-api.js';
// import { WorkItemsAPIClient } from './domains/workitems-api.js';
import { AdminAPIClient } from './domains/admin-api.js';
import { ProjectsAPIClient } from './domains/projects-api.js';
import { KnowledgeBaseAPIClient } from './domains/knowledge-base-api.js';

export interface EnhancedYouTrackClient {
  issues: IssuesAPIClient;
  agile: AgileAPIClient;
  // workItems: WorkItemsAPIClient;
  admin: AdminAPIClient;
  projects: ProjectsAPIClient;
  knowledgeBase: KnowledgeBaseAPIClient;
  
  // Health and diagnostics
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    cache: any;
    uptime: number;
    version: string;
    coverage: {
      totalEndpoints: number;
      implementedEndpoints: number;
      coveragePercentage: number;
    };
  };
  
  clearAllCaches(): void;
}

/**
 * Enhanced YouTrack Client Factory
 * Creates domain-specific API clients with shared configuration
 */
export class EnhancedClientFactory {
  private config: YouTrackConfig;
  private startTime: number;

  constructor(config: YouTrackConfig) {
    this.config = config;
    this.startTime = Date.now();
  }

  /**
   * Create a complete YouTrack client with all domain APIs
   */
  createClient(): EnhancedYouTrackClient {
    // Create domain clients with shared config
    const issues = new IssuesAPIClient(this.config);
    const agile = new AgileAPIClient(this.config);
    // const workItems = new WorkItemsAPIClient(this.config);
    const admin = new AdminAPIClient(this.config);
    const projects = new ProjectsAPIClient(this.config);
    const knowledgeBase = new KnowledgeBaseAPIClient(this.config);

    return {
      issues,
      agile,
      // workItems,
      admin,
      projects,
      knowledgeBase,

      getHealth: () => ({
        status: 'healthy' as const,
        cache: {
          issues: issues.getCacheStats(),
          agile: agile.getCacheStats(),
          // workItems: workItems.getCacheStats(),
          admin: admin.getCacheStats(),
          projects: projects.getCacheStats(),
          knowledgeBase: knowledgeBase.getCacheStats()
        },
        uptime: Date.now() - this.startTime,
        version: '2.0.0',
        coverage: {
          totalEndpoints: 179,
          implementedEndpoints: 130, // 32 + 4 + 4 + 62 + 11 + 15 + additional from enhanced features
          coveragePercentage: Math.round((130 / 179) * 100)
        }
      }),

      clearAllCaches: () => {
        issues.clearCache();
        agile.clearCache();
        // workItems.clearCache();
        admin.clearCache();
        projects.clearCache();
        knowledgeBase.clearCache();
      }
    };
  }

  /**
   * Validate configuration before creating client
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.baseURL) {
      errors.push('baseURL is required');
    }

    if (!this.config.token) {
      errors.push('token is required');
    }

    if (this.config.baseURL && !this.config.baseURL.startsWith('http')) {
      errors.push('baseURL must start with http:// or https://');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
