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

// Enhanced interfaces for consolidated client
export interface ProjectInfo {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  leader?: {
    login: string;
    fullName: string;
  };
  archived?: boolean;
  template?: boolean;
}

export interface CustomField {
  name: string;
  type: string;
  values?: any[];
  sample?: string;
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

  async listProjects(fields: string = 'id,name,shortName,description'): Promise<any[]> {
    try {
      const cacheKey = `projects-list-${fields}`;
      const cached = this.cache.get<any[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Use issues endpoint approach for reliable project discovery
      const params = { 
        query: 'project: *',
        fields: `project(${fields})`,
        '$top': 100
      };
      logApiCall('GET', '/issues', params);
      
      const response = await this.api.get('/issues', { params });
      
      // Extract unique projects from issues
      const projectsMap = new Map<string, any>();
      response.data.forEach((issue: any) => {
        if (issue.project) {
          projectsMap.set(issue.project.id, issue.project);
        }
      });

      const projects = Array.from(projectsMap.values());
      this.cache.set(cacheKey, projects);
      return projects;
    } catch (error) {
      logError(error as Error, { fields });
      throw new Error(`Failed to list projects: ${(error as Error).message}`);
    }
  }

  async validateProject(projectId: string): Promise<{exists: boolean, accessible: boolean, project?: any, message: string, suggestions?: string[]}> {
    try {
      const cacheKey = `project-validation-${projectId}`;
      const cached = this.cache.get<any>(cacheKey);
      if (cached) {
        return cached;
      }

      // Use issues endpoint approach for reliable project validation
      logApiCall('GET', '/issues', { query: `project: ${projectId}` });
      
      try {
        const response = await this.api.get('/issues', {
          params: {
            query: `project: ${projectId}`,
            fields: 'project(id,name,shortName,description)',
            '$top': 1
          }
        });

        if (response.data && response.data.length > 0 && response.data[0].project) {
          const result = {
            exists: true,
            accessible: true,
            project: response.data[0].project,
            message: `Project '${projectId}' is valid and accessible`
          };

          this.cache.set(cacheKey, result, 60000); // Cache for 1 minute
          return result;
        } else {
          // Project might exist but user has no access to issues
          const allProjects = await this.listProjects();
          const foundProject = allProjects.find(p => 
            p.id === projectId || 
            p.shortName === projectId || 
            p.name === projectId
          );

          if (foundProject) {
            const result = {
              exists: true,
              accessible: false,
              project: foundProject,
              message: `Project '${projectId}' exists but you may not have access to its issues`,
              suggestions: ['Check your project permissions', 'Contact project administrator']
            };
            this.cache.set(cacheKey, result, 60000);
            return result;
          } else {
            const result = {
              exists: false,
              accessible: false,
              message: `Project '${projectId}' not found`,
              suggestions: [
                'Check the project ID/shortName spelling',
                'Verify the project exists in YouTrack',
                'Ensure you have access to the project'
              ]
            };
            this.cache.set(cacheKey, result, 60000);
            return result;
          }
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          const result = {
            exists: false,
            accessible: false,
            message: `Project '${projectId}' not found. Please check the project ID.`,
            suggestions: [
              'Verify the project ID is correct',
              'Check if you have access to this project',
              'Use list_projects to see available projects'
            ]
          };
          return result;
        } else if (error.response?.status === 403) {
          const result = {
            exists: true,
            accessible: false,
            message: `Access denied to project '${projectId}'. You may not have sufficient permissions.`,
            suggestions: [
              'Contact your YouTrack administrator for access',
              'Check if your token has the required permissions',
              'Verify you are part of this project'
            ]
          };
          return result;
        }
        throw error;
      }
    } catch (error) {
      logError(error as Error, { projectId });
      throw new Error(`Failed to validate project: ${(error as Error).message}`);
    }
  }

  /**
   * Resolve project identifier - try different formats for YouTrack API compatibility
   */
  private async resolveProjectId(projectIdentifier: string): Promise<string> {
    // First, try to find the project by querying issues to get the correct ID format
    try {
      const issues = await this.api.get('/issues', {
        params: {
          query: `project: ${projectIdentifier}`,
          fields: 'project(id,shortName)',
          limit: 1
        }
      });
      
      if (issues.data && issues.data.length > 0) {
        const project = issues.data[0].project;
        // Return the actual project ID that works with the API
        return project.shortName || project.id || projectIdentifier;
      }
    } catch (error) {
      // If issue query fails, fall back to original identifier
    }
    
    return projectIdentifier;
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

  // === ENHANCED METHODS (Consolidated from enhanced-youtrack-client.ts) ===

  /**
   * Get project statistics using enhanced approach
   */
  async getProjectStats(projectId: string): Promise<any> {
    try {
      const cacheKey = `project-stats-${projectId}`;
      const cached = this.cache.get<any>(cacheKey);
      if (cached) {
        return cached;
      }

      // Validate project first
      const projectValidation = await this.validateProject(projectId);
      if (!projectValidation.exists) {
        throw new Error(`Project '${projectId}' not found`);
      }

      // Get all issues for statistics
      logApiCall('GET', '/issues', { project: projectId });
      const response = await this.api.get('/issues', {
        params: {
          query: `project: ${projectId}`,
          fields: 'id,summary,state(name),priority(name),type(name),assignee(login,fullName),created,resolved',
          '$top': 1000 // Get more issues for better statistics
        }
      });

      const issues = response.data;
      const stats = {
        project: projectValidation.project,
        totalIssues: issues.length,
        byState: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        recentActivity: {
          created: 0,
          resolved: 0
        }
      };

      // Calculate statistics
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      issues.forEach((issue: any) => {
        // By state
        const stateName = issue.state?.name || 'Unknown';
        stats.byState[stateName] = (stats.byState[stateName] || 0) + 1;

        // By priority
        const priorityName = issue.priority?.name || 'Unknown';
        stats.byPriority[priorityName] = (stats.byPriority[priorityName] || 0) + 1;

        // By type
        const typeName = issue.type?.name || 'Unknown';
        stats.byType[typeName] = (stats.byType[typeName] || 0) + 1;

        // Recent activity
        if (issue.created) {
          const createdDate = new Date(issue.created);
          if (createdDate >= sevenDaysAgo) {
            stats.recentActivity.created++;
          }
        }

        if (issue.resolved) {
          const resolvedDate = new Date(issue.resolved);
          if (resolvedDate >= sevenDaysAgo) {
            stats.recentActivity.resolved++;
          }
        }
      });

      this.cache.set(cacheKey, stats, 300000); // Cache for 5 minutes
      return stats;
    } catch (error) {
      logError(error as Error, { projectId });
      throw new Error(`Failed to get project statistics: ${(error as Error).message}`);
    }
  }

  /**
   * Get project custom fields by analyzing existing issues
   */
  async getProjectCustomFields(projectId: string): Promise<CustomField[]> {
    try {
      const cacheKey = `project-custom-fields-${projectId}`;
      const cached = this.cache.get<CustomField[]>(cacheKey);
      if (cached) {
        return cached;
      }

      logApiCall('GET', '/issues', { project: projectId, customFields: true });
      const response = await this.api.get('/issues', {
        params: {
          query: `project: ${projectId}`,
          fields: 'customFields(name,value($type,name,id,login,fullName),field($type,name))',
          '$top': 50 // Get enough issues to discover most custom fields
        }
      });

      const customFieldsMap = new Map<string, CustomField>();
      
      response.data.forEach((issue: any) => {
        if (issue.customFields) {
          issue.customFields.forEach((field: any) => {
            const fieldName = field.name || field.field?.name;
            if (fieldName && !customFieldsMap.has(fieldName)) {
              const customField: CustomField = {
                name: fieldName,
                type: field.field?.$type || field.value?.$type || 'Unknown',
                values: [],
                sample: field.value?.name || field.value?.login || field.value?.fullName || JSON.stringify(field.value)
              };

              // Collect sample values for enum-like fields
              if (field.value?.name) {
                customField.values = [field.value.name];
              }

              customFieldsMap.set(fieldName, customField);
            } else if (fieldName && customFieldsMap.has(fieldName)) {
              // Add to values if it's a new value
              const existingField = customFieldsMap.get(fieldName)!;
              if (field.value?.name && !existingField.values?.includes(field.value.name)) {
                existingField.values = existingField.values || [];
                existingField.values.push(field.value.name);
              }
            }
          });
        }
      });

      const customFields = Array.from(customFieldsMap.values());
      this.cache.set(cacheKey, customFields, 300000); // Cache for 5 minutes
      return customFields;
    } catch (error) {
      logError(error as Error, { projectId });
      throw new Error(`Failed to get project custom fields: ${(error as Error).message}`);
    }
  }

  // === EPIC & MILESTONE MANAGEMENT METHODS ===

  /**
   * Create an epic issue
   */
  async createEpic(params: {
    projectId: string;
    title: string;
    description?: string;
    priority?: string;
    assignee?: string;
  }): Promise<MCPResponse> {
    try {
      const epicData = {
        project: { id: params.projectId },
        summary: `[EPIC] ${params.title}`,
        description: params.description || '',
        customFields: [
          {
            name: 'Type',
            value: { name: 'Epic' }
          }
        ] as any[]
      };

      if (params.priority) {
        epicData.customFields.push({
          name: 'Priority',
          value: { name: params.priority }
        });
      }

      if (params.assignee) {
        epicData.customFields.push({
          name: 'Assignee',
          value: { login: params.assignee }
        });
      }

      logApiCall('POST', '/issues', epicData);
      const response = await this.api.put('/issues', epicData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            epic: response.data,
            message: `Epic created successfully: ${response.data.id}`
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to create epic: ${(error as Error).message}`);
    }
  }

  /**
   * Link an issue to an epic
   */
  async linkIssueToEpic(params: {
    issueId: string;
    epicId: string;
  }): Promise<MCPResponse> {
    try {
      const linkData = {
        linkType: { name: 'subtask of' },
        issues: [{ id: params.epicId }]
      };

      logApiCall('POST', `/issues/${params.issueId}/links`, linkData);
      const response = await this.api.post(`/issues/${params.issueId}/links`, linkData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Issue ${params.issueId} linked to epic ${params.epicId}`
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to link issue to epic: ${(error as Error).message}`);
    }
  }

  /**
   * Get epic progress
   */
  async getEpicProgress(epicId: string): Promise<MCPResponse> {
    try {
      // Get epic details
      const epicResponse = await this.api.get(`/issues/${epicId}`, {
        params: {
          fields: 'id,summary,description,state(name),created,customFields(name,value)'
        }
      });

      // Get linked issues
      const linkedIssuesResponse = await this.api.get('/issues', {
        params: {
          query: `parent: ${epicId}`,
          fields: 'id,summary,state(name),priority(name),assignee(login,fullName),created,resolved',
          '$top': 100
        }
      });

      const epic = epicResponse.data;
      const childIssues = linkedIssuesResponse.data;

      const totalIssues = childIssues.length;
      const completedIssues = childIssues.filter((issue: any) => 
        issue.state?.name === 'Done' || 
        issue.state?.name === 'Closed' || 
        issue.state?.name === 'Resolved'
      ).length;

      const progressPercentage = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

      const progressReport = {
        epic: {
          id: epic.id,
          name: epic.summary.replace(/^\[EPIC\]\s*/, ''),
          description: epic.description,
          state: epic.state?.name
        },
        progress: {
          totalIssues,
          completedIssues,
          progressPercentage,
          inProgress: childIssues.filter((issue: any) => 
            issue.state?.name === 'In Progress'
          ).length,
          open: childIssues.filter((issue: any) => 
            issue.state?.name === 'Open' || issue.state?.name === 'To Do'
          ).length
        },
        childIssues: childIssues.map((issue: any) => ({
          id: issue.id,
          summary: issue.summary,
          state: issue.state?.name,
          assignee: issue.assignee?.login
        }))
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(progressReport, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, { epicId });
      throw new Error(`Failed to get epic progress: ${(error as Error).message}`);
    }
  }

  /**
   * Create a milestone
   */
  async createMilestone(params: {
    projectId: string;
    name: string;
    targetDate: string;
    description?: string;
    criteria?: string[];
  }): Promise<MCPResponse> {
    try {
      const milestoneDescription = [
        params.description || '',
        '',
        `**Target Date:** ${params.targetDate}`,
        '',
        ...(params.criteria ? [
          '**Success Criteria:**',
          ...params.criteria.map(criterion => `- ${criterion}`)
        ] : [])
      ].join('\n');

      const milestoneData = {
        project: { id: params.projectId },
        summary: `[MILESTONE] ${params.name}`,
        description: milestoneDescription,
        customFields: [
          {
            name: 'Type',
            value: { name: 'Milestone' }
          },
          {
            name: 'Due Date',
            value: params.targetDate
          }
        ]
      };

      logApiCall('POST', '/issues', milestoneData);
      const response = await this.api.put('/issues', milestoneData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            milestone: response.data,
            message: `Milestone created successfully: ${response.data.id}`
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to create milestone: ${(error as Error).message}`);
    }
  }

  /**
   * Assign issues to milestone
   */
  async assignIssuesToMilestone(params: {
    milestoneId: string;
    issueIds: string[];
  }): Promise<MCPResponse> {
    try {
      const results = [];
      
      for (const issueId of params.issueIds) {
        try {
          const linkData = {
            linkType: { name: 'relates to' },
            issues: [{ id: params.milestoneId }]
          };

          await this.api.post(`/issues/${issueId}/links`, linkData);
          results.push({ issueId, success: true });
        } catch (error) {
          results.push({ issueId, success: false, error: (error as Error).message });
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            milestoneId: params.milestoneId,
            results,
            summary: `${results.filter(r => r.success).length}/${results.length} issues assigned successfully`
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to assign issues to milestone: ${(error as Error).message}`);
    }
  }

  /**
   * Get milestone progress
   */
  async getMilestoneProgress(milestoneId: string): Promise<MCPResponse> {
    try {
      // Get milestone details
      const milestoneResponse = await this.api.get(`/issues/${milestoneId}`, {
        params: {
          fields: 'id,summary,description,state(name),created,customFields(name,value)'
        }
      });

      // Get linked issues
      const linkedIssuesResponse = await this.api.get('/issues', {
        params: {
          query: `linked issue: ${milestoneId}`,
          fields: 'id,summary,state(name),priority(name),assignee(login,fullName),created,resolved',
          '$top': 100
        }
      });

      const milestone = milestoneResponse.data;
      const linkedIssues = linkedIssuesResponse.data;

      const totalIssues = linkedIssues.length;
      const completedIssues = linkedIssues.filter((issue: any) => 
        issue.state?.name === 'Done' || 
        issue.state?.name === 'Closed' || 
        issue.state?.name === 'Resolved'
      ).length;

      const progressPercentage = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

      // Extract target date
      let targetDate = 'Not specified';
      const dueDateField = milestone.customFields?.find((field: any) => 
        field.name === 'Due Date'
      );
      if (dueDateField?.value) {
        targetDate = dueDateField.value;
      }

      const progressReport = {
        milestone: {
          id: milestone.id,
          name: milestone.summary.replace(/^\[MILESTONE\]\s*/, ''),
          description: milestone.description,
          targetDate,
          state: milestone.state?.name
        },
        progress: {
          totalIssues,
          completedIssues,
          progressPercentage,
          inProgress: linkedIssues.filter((issue: any) => 
            issue.state?.name === 'In Progress'
          ).length,
          open: linkedIssues.filter((issue: any) => 
            issue.state?.name === 'Open' || issue.state?.name === 'To Do'
          ).length
        },
        linkedIssues: linkedIssues.map((issue: any) => ({
          id: issue.id,
          summary: issue.summary,
          state: issue.state?.name,
          assignee: issue.assignee?.login
        }))
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(progressReport, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, { milestoneId });
      throw new Error(`Failed to get milestone progress: ${(error as Error).message}`);
    }
  }

  /**
   * Log work time for an issue
   */
  async logWorkTime(params: {
    issueId: string;
    duration: string;
    description?: string;
    date?: string;
    workType?: string;
  }): Promise<MCPResponse> {
    try {
      const workItemData = {
        duration: params.duration,
        description: params.description || 'Work logged via MCP',
        date: params.date || new Date().toISOString().split('T')[0],
        type: params.workType ? { name: params.workType } : undefined
      };

      logApiCall('POST', `/issues/${params.issueId}/timeTracking/workItems`, workItemData);
      const response = await this.api.post(`/issues/${params.issueId}/timeTracking/workItems`, workItemData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            workItem: response.data,
            message: `Work time logged successfully: ${params.duration}`
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to log work time: ${(error as Error).message}`);
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

  // Getter for enhanced client access
  get apiInstance(): AxiosInstance {
    return this.api;
  }
}
