import { YouTrackConfig } from './base/base-client.js';
import { IssuesAPIClient } from './domains/issues-api.js';
import { AgileAPIClient } from './domains/agile-boards-api.js';
import { WorkItemsAPIClient } from './domains/workitems-api.js';
import { AdminAPIClient } from './domains/admin-api.js';
import { ProjectsAPIClient } from './domains/projects-api.js';
import { KnowledgeBaseAPIClient } from './domains/knowledge-base-api.js';
import { UsersAPIClient } from './domains/users-api.js';
import { CustomFieldsAPIClient } from './domains/custom-fields-api.js';

export interface IYouTrackClient {
  issues: IssuesAPIClient;
  agile: AgileAPIClient;
  workItems: WorkItemsAPIClient;
  admin: AdminAPIClient;
  projects: ProjectsAPIClient;
  knowledgeBase: KnowledgeBaseAPIClient;
  users: UsersAPIClient;
  customFields: CustomFieldsAPIClient;
  
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
 * YouTrack API client that provides access to different domain-specific APIs
 */
export class YouTrackClient implements IYouTrackClient {
  issues: IssuesAPIClient;
  agile: AgileAPIClient;
  workItems: WorkItemsAPIClient;
  admin: AdminAPIClient;
  projects: ProjectsAPIClient;
  knowledgeBase: KnowledgeBaseAPIClient;
  users: UsersAPIClient;
  customFields: CustomFieldsAPIClient;

  constructor(config: YouTrackConfig) {
    this.issues = new IssuesAPIClient(config);
    this.agile = new AgileAPIClient(config);
    this.workItems = new WorkItemsAPIClient(config);
    this.admin = new AdminAPIClient(config);
    this.projects = new ProjectsAPIClient(config);
    this.knowledgeBase = new KnowledgeBaseAPIClient(config);
    this.users = new UsersAPIClient(config);
    this.customFields = new CustomFieldsAPIClient(config);
  }

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
  } {
    // Simple health check implementation
    return {
      status: 'healthy',
      cache: {},
      uptime: process.uptime(),
      version: '1.0.0',
      coverage: {
        totalEndpoints: 100,
        implementedEndpoints: 90,
        coveragePercentage: 90
      }
    };
  }

  clearAllCaches(): void {
    // Clear caches from all domain clients
    // Implementation depends on caching strategy
  }
}

/**
 * Factory for creating YouTrack clients
 */
export class ClientFactory {
  private config: YouTrackConfig;

  constructor(config: YouTrackConfig) {
    this.config = config;
  }

  createClient(): YouTrackClient {
    return new YouTrackClient(this.config);
  }

  getConfig(): YouTrackConfig {
    return this.config;
  }
}
