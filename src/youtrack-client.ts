import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { logger, logApiCall, logError } from './logger.js';
import { SimpleCache } from './cache.js';

export interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface Issue {
  id: string;
  summary: string;
  description?: string;
  state?: any;
  priority?: any;
  reporter?: any;
  assignee?: any;
  customFields?: any[];
  created?: string;
  updated?: string;
}

export interface CreateIssueParams {
  projectId: string;
  summary: string;
  description?: string;
  type?: string;
  priority?: string;
}

export interface UpdateIssueParams {
  summary?: string;
  description?: string;
  state?: string;
  assignee?: string;
  priority?: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  leader?: any;
}

// Helper function for error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

export class YouTrackClient {
  private api: AxiosInstance;
  private cache: SimpleCache;

  constructor(baseUrl: string, token: string) {
    this.cache = new SimpleCache();
    
    this.api = axios.create({
      baseURL: `${baseUrl}/api`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Add retry logic for transient failures
    axiosRetry(this.api, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          error.response?.status === 429; // Rate limit
      },
    });

    // Add response interceptor for better error messages
    this.api.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response) {
          const errorData = error.response.data as any;
          const message = errorData?.error || errorData?.message || error.message;
          logError(new Error(`YouTrack API Error (${error.response.status}): ${message}`));
          throw new Error(`YouTrack API Error (${error.response.status}): ${message}`);
        } else if (error.request) {
          const networkError = new Error('Network error: Unable to reach YouTrack server');
          logError(networkError);
          throw networkError;
        }
        throw error;
      }
    );
  }

  async getProjectStatus(projectId: string, includeIssues: boolean = true): Promise<MCPResponse> {
    try {
      const cacheKey = `project-status-${projectId}-${includeIssues}`;
      const cached = this.cache.get<MCPResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      logApiCall('GET', `/projects/${projectId}`, { includeIssues });

      // Get project details
      const projectResponse = await this.api.get(`/projects/${projectId}`, {
        params: {
          fields: 'id,name,shortName,description,leader(login,fullName)',
        },
      });

      const result: any = {
        project: projectResponse.data,
      };

      if (includeIssues) {
        // Get issue statistics
        const issuesResponse = await this.api.get('/issues', {
          params: {
            query: `project: ${projectId}`,
            fields: 'id,state(name)',
            $top: 1000,
          },
        });

        // Group issues by state
        const issuesByState: Record<string, number> = {};
        issuesResponse.data.forEach((issue: any) => {
          const state = issue.state?.name || 'Unknown';
          issuesByState[state] = (issuesByState[state] || 0) + 1;
        });

        result.issueStatistics = {
          total: issuesResponse.data.length,
          byState: issuesByState,
        };
      }

      const response = { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      this.cache.set(cacheKey, response, 300000); // Cache for 5 minutes
      return response;
    } catch (error) {
      logError(error as Error, { projectId, includeIssues });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get project status: ${errorMessage}`);
    }
  }

  async createIssue(params: CreateIssueParams): Promise<MCPResponse> {
    try {
      logApiCall('POST', '/issues', params);

      const issueData: any = {
        project: { id: params.projectId },
        summary: params.summary,
      };

      if (params.description) {
        issueData.description = params.description;
      }

      // Handle custom fields for type and priority
      const customFields: any[] = [];
      if (params.type) {
        customFields.push({ name: 'Type', value: { name: params.type } });
      }
      if (params.priority) {
        customFields.push({ name: 'Priority', value: { name: params.priority } });
      }

      if (customFields.length > 0) {
        issueData.customFields = customFields;
      }

      const response = await this.api.post('/issues', issueData, {
        params: {
          fields: 'id,summary,description,project(id,name)',
        },
      });

      // Clear project-related cache
      this.cache.clearPattern(`project-.*-${params.projectId}`);

      return {
        content: [{
          type: 'text',
          text: `Issue created successfully: ${response.data.id}\n${JSON.stringify(response.data, null, 2)}`,
        }],
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to create issue: ${getErrorMessage(error)}`);
    }
  }

  async queryIssues(query: string, fields?: string, limit: number = 50): Promise<MCPResponse> {
    try {
      const cacheKey = `query-${query}-${fields || 'default'}-${limit}`;
      const cached = this.cache.get<MCPResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      logApiCall('GET', '/issues', { query, fields, limit });

      const response = await this.api.get('/issues', {
        params: {
          query,
          fields: fields || 'id,summary,description,state(name),priority(name),reporter(login,fullName),assignee(login,fullName)',
          $top: limit,
        },
      });

      const result = {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        }],
      };

      this.cache.set(cacheKey, result, 120000); // Cache for 2 minutes
      return result;
    } catch (error) {
      logError(error as Error, { query, fields, limit });
      throw new Error(`Failed to query issues: ${getErrorMessage(error)}`);
    }
  }

  async updateIssue(issueId: string, updates: UpdateIssueParams): Promise<MCPResponse> {
    try {
      logApiCall('POST', `/issues/${issueId}`, updates);

      const updateData: any = {};
      const customFields: any[] = [];

      if (updates.summary) {
        updateData.summary = updates.summary;
      }
      if (updates.description) {
        updateData.description = updates.description;
      }
      if (updates.state) {
        customFields.push({ name: 'State', value: { name: updates.state } });
      }
      if (updates.priority) {
        customFields.push({ name: 'Priority', value: { name: updates.priority } });
      }
      if (updates.assignee) {
        customFields.push({ name: 'Assignee', value: { login: updates.assignee } });
      }

      if (customFields.length > 0) {
        updateData.customFields = customFields;
      }

      const response = await this.api.post(`/issues/${issueId}`, updateData, {
        params: {
          fields: 'id,summary,description,state(name),priority(name),assignee(login,fullName)',
        },
      });

      // Clear related cache
      this.cache.clearPattern(`query-.*`);
      this.cache.clearPattern(`project-.*`);

      return {
        content: [{
          type: 'text',
          text: `Issue updated successfully: ${issueId}\n${JSON.stringify(response.data, null, 2)}`,
        }],
      };
    } catch (error) {
      logError(error as Error, { issueId, updates });
      throw new Error(`Failed to update issue: ${getErrorMessage(error)}`);
    }
  }

  async getProjectIssuesSummary(projectId: string): Promise<MCPResponse> {
    try {
      const cacheKey = `project-summary-${projectId}`;
      const cached = this.cache.get<MCPResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      logApiCall('GET', '/issues', { projectId });

      const response = await this.api.get('/issues', {
        params: {
          query: `project: ${projectId}`,
          fields: 'id,state(name),priority(name),type(name)',
          $top: 1000,
        },
      });

      // Generate summary statistics
      const summary = {
        total: response.data.length,
        byState: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byType: {} as Record<string, number>,
      };

      response.data.forEach((issue: any) => {
        // Count by state
        const state = issue.state?.name || 'Unknown';
        summary.byState[state] = (summary.byState[state] || 0) + 1;

        // Count by priority
        const priority = issue.priority?.name || 'Unknown';
        summary.byPriority[priority] = (summary.byPriority[priority] || 0) + 1;

        // Count by type
        const type = issue.type?.name || 'Unknown';
        summary.byType[type] = (summary.byType[type] || 0) + 1;
      });

      const result = {
        content: [{
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        }],
      };

      this.cache.set(cacheKey, result, 300000); // Cache for 5 minutes
      return result;
    } catch (error) {
      logError(error as Error, { projectId });
      throw new Error(`Failed to get project issues summary: ${getErrorMessage(error)}`);
    }
  }

  // Additional methods for enhanced functionality
  async getIssueComments(issueId: string): Promise<MCPResponse> {
    try {
      logApiCall('GET', `/issues/${issueId}/comments`);

      const response = await this.api.get(`/issues/${issueId}/comments`, {
        params: {
          fields: 'id,text,author(login,fullName),created',
        },
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        }],
      };
    } catch (error) {
      logError(error as Error, { issueId });
      throw new Error(`Failed to get issue comments: ${getErrorMessage(error)}`);
    }
  }

  async addIssueComment(issueId: string, text: string): Promise<MCPResponse> {
    try {
      logApiCall('POST', `/issues/${issueId}/comments`, { text });

      const response = await this.api.post(`/issues/${issueId}/comments`, {
        text,
      });

      return {
        content: [{
          type: 'text',
          text: `Comment added successfully to issue ${issueId}\n${JSON.stringify(response.data, null, 2)}`,
        }],
      };
    } catch (error) {
      logError(error as Error, { issueId, text });
      throw new Error(`Failed to add comment: ${getErrorMessage(error)}`);
    }
  }

  async searchUsers(query: string): Promise<MCPResponse> {
    try {
      logApiCall('GET', '/users', { query });

      const response = await this.api.get('/users', {
        params: {
          query,
          fields: 'login,fullName,email',
          $top: 20,
        },
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        }],
      };
    } catch (error) {
      logError(error as Error, { query });
      throw new Error(`Failed to search users: ${getErrorMessage(error)}`);
    }
  }

  async getProjectTimeline(projectId: string, days: number = 7): Promise<MCPResponse> {
    try {
      const cacheKey = `timeline-${projectId}-${days}`;
      const cached = this.cache.get<MCPResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      logApiCall('GET', '/activities', { projectId, days });

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await this.api.get('/activities', {
        params: {
          categories: 'IssueCreatedCategory,IssueUpdatedCategory',
          issueQuery: `project: ${projectId}`,
          start: fromDate.getTime(),
          fields: 'id,timestamp,category(id),target(id,summary)',
          $top: 100,
        },
      });

      const result = {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        }],
      };

      this.cache.set(cacheKey, result, 600000); // Cache for 10 minutes
      return result;
    } catch (error) {
      logError(error as Error, { projectId, days });
      throw new Error(`Failed to get project timeline: ${getErrorMessage(error)}`);
    }
  }

  async bulkUpdateIssues(issueIds: string[], updates: UpdateIssueParams): Promise<MCPResponse> {
    try {
      logApiCall('POST', '/commands', { issueIds, updates });

      const results = [];
      for (const issueId of issueIds) {
        try {
          const result = await this.updateIssue(issueId, updates);
          results.push({ issueId, success: true, result });
        } catch (error) {
          results.push({ issueId, success: false, error: getErrorMessage(error) });
        }
      }

      return {
        content: [{
          type: 'text',
          text: `Bulk update completed\n${JSON.stringify(results, null, 2)}`,
        }],
      };
    } catch (error) {
      logError(error as Error, { issueIds, updates });
      throw new Error(`Failed to bulk update issues: ${getErrorMessage(error)}`);
    }
  }

  // Cache management methods
  clearCache(pattern?: string): void {
    if (pattern) {
      this.cache.clearPattern(pattern);
    } else {
      this.cache.clear();
    }
  }
}
