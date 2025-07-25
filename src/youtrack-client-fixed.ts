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

// Corrected interfaces based on YouTrack OpenAPI specification
export interface Issue {
  id: string;
  summary: string;
  description?: string;
  project: { id: string; name?: string; shortName?: string };
  customFields?: ProjectCustomFieldValue[];
  created?: number;
  updated?: number;
  resolved?: number;
  reporter?: User;
  assignee?: User;
  state?: { name: string };
  priority?: { name: string };
  type?: { name: string };
}

export interface User {
  id: string;
  login: string;
  fullName?: string;
  email?: string;
}

export interface ProjectCustomField {
  id: string;
  field: {
    id: string;
    name: string;
    fieldType: { id: string };
  };
  canBeEmpty: boolean;
  defaultValues?: any[];
  emptyFieldText?: string;
  bundle?: Bundle;
}

export interface ProjectCustomFieldValue {
  id: string;
  name: string;
  value: any;
}

export interface Bundle {
  id: string;
  values?: BundleElement[];
}

export interface BundleElement {
  id: string;
  name: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  leader?: User;
  archived?: boolean;
  customFields?: ProjectCustomField[];
}

export interface CreateIssueParams {
  projectId: string;
  summary: string;
  description?: string;
  type?: string;
  priority?: string;
  state?: string;
  assignee?: string;
}

export interface UpdateIssueParams {
  summary?: string;
  description?: string;
  state?: string;
  priority?: string;
  type?: string;
  assignee?: string;
  subsystem?: string;
  dueDate?: string;
  estimation?: number;
  tags?: string[];
}

export interface Agile {
  id: string;
  name: string;
  owner?: User;
  projects?: Project[];
  columnSettings?: {
    columns: Column[];
    field: FilterField;
  };
  sprints?: Sprint[];
}

export interface Sprint {
  id: string;
  name: string;
  start?: number;
  finish?: number;
  archived?: boolean;
  isDefault?: boolean;
  issues?: Issue[];
}

export interface Column {
  id: string;
  presentation?: string;
}

export interface FilterField {
  id: string;
  name: string;
  presentation?: string;
}

export interface Article {
  id: string;
  summary: string;
  content?: string;
  created?: number;
  updated?: number;
  project?: Project;
  parentArticle?: Article;
}

// Helper function for error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

export class YouTrackClientFixed {
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
      timeout: 30000,
    });

    // Add retry logic for transient failures
    axiosRetry(this.api, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          error.response?.status === 429;
      },
    });

    // Enhanced error interceptor based on API spec
    this.api.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response) {
          const errorData = error.response.data as any;
          let message = errorData?.error || errorData?.message || error.message;
          
          // Handle specific error codes from YouTrack API
          if (error.response.status === 400) {
            message = `Bad Request: ${message}`;
          } else if (error.response.status === 403) {
            message = `Access Denied: ${message}`;
          } else if (error.response.status === 404) {
            message = `Not Found: ${message}`;
          }
          
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

  /**
   * List projects using admin endpoint with fallback to issue discovery
   */
  async listProjects(fields: string = 'id,name,shortName,description,leader(id,login,fullName)'): Promise<Project[]> {
    try {
      const cacheKey = `projects-list-${fields}`;
      const cached = this.cache.get<Project[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Try admin endpoint first (requires Read Project permission)
      try {
        logApiCall('GET', '/admin/projects', { fields });
        const response = await this.api.get('/admin/projects', {
          params: { 
            fields,
            '$top': 100
          }
        });
        
        if (response.data && Array.isArray(response.data)) {
          this.cache.set(cacheKey, response.data, 300000); // 5 minutes
          return response.data;
        }
      } catch (adminError) {
        // Fall back to issue discovery if admin access denied
        logger.info('Admin access denied, using issue discovery for projects');
      }

      // Fallback: discover projects through issues
      const params = { 
        query: 'project: *',
        fields: `project(${fields})`,
        '$top': 100
      };
      logApiCall('GET', '/issues', params);
      
      const response = await this.api.get('/issues', { params });
      
      // Extract unique projects from issues
      const projectsMap = new Map<string, Project>();
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((issue: any) => {
          if (issue.project) {
            projectsMap.set(issue.project.id, issue.project);
          }
        });
      }

      const projects = Array.from(projectsMap.values());
      this.cache.set(cacheKey, projects, 300000);
      return projects;
    } catch (error) {
      logError(error as Error, { fields });
      throw new Error(`Failed to list projects: ${(error as Error).message}`);
    }
  }

  /**
   * Get project custom fields using the correct API endpoint
   */
  async getProjectCustomFields(projectId: string): Promise<ProjectCustomField[]> {
    try {
      const cacheKey = `project-custom-fields-${projectId}`;
      const cached = this.cache.get<ProjectCustomField[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const fields = 'id,field(id,name,fieldType(id)),canBeEmpty,defaultValues($type,id,name),bundle(id)';
      logApiCall('GET', `/admin/projects/${projectId}/customFields`, { fields });
      
      const response = await this.api.get(`/admin/projects/${projectId}/customFields`, {
        params: { fields }
      });

      if (response.data && Array.isArray(response.data)) {
        this.cache.set(cacheKey, response.data, 300000); // 5 minutes
        return response.data;
      }

      return [];
    } catch (error) {
      logError(error as Error, { projectId });
      throw new Error(`Failed to get project custom fields: ${(error as Error).message}`);
    }
  }

  /**
   * Create issue using proper custom fields format
   */
  async createIssue(params: CreateIssueParams): Promise<MCPResponse> {
    try {
      logApiCall('POST', '/issues', params);

      // Get project custom fields to map user inputs
      const customFields = await this.getProjectCustomFields(params.projectId);
      
      const issueData: any = {
        project: { id: params.projectId },
        summary: params.summary,
      };

      if (params.description?.trim()) {
        issueData.description = params.description.trim();
      }

      // Map user inputs to custom fields
      const customFieldValues = [];
      
      if (params.type) {
        const typeField = customFields.find(f => 
          f.field.name.toLowerCase() === 'type' || 
          f.field.name.toLowerCase() === 'issue type'
        );
        if (typeField) {
          customFieldValues.push({
            name: typeField.field.name,
            value: { name: params.type }
          });
        }
      }

      if (params.priority) {
        const priorityField = customFields.find(f => 
          f.field.name.toLowerCase() === 'priority'
        );
        if (priorityField) {
          customFieldValues.push({
            name: priorityField.field.name,
            value: { name: params.priority }
          });
        }
      }

      if (params.state) {
        const stateField = customFields.find(f => 
          f.field.name.toLowerCase() === 'state' ||
          f.field.name.toLowerCase() === 'status'
        );
        if (stateField) {
          customFieldValues.push({
            name: stateField.field.name,
            value: { name: params.state }
          });
        }
      }

      if (params.assignee) {
        const assigneeField = customFields.find(f => 
          f.field.name.toLowerCase() === 'assignee'
        );
        if (assigneeField) {
          customFieldValues.push({
            name: assigneeField.field.name,
            value: { login: params.assignee }
          });
        }
      }

      if (customFieldValues.length > 0) {
        issueData.customFields = customFieldValues;
      }

      const response = await this.api.post('/issues', issueData, {
        params: {
          fields: 'id,summary,description,project(id,name,shortName),customFields(name,value($type,id,name,login))',
        },
      });

      // Clear project-related cache
      this.cache.clearPattern(`project-.*-${params.projectId}`);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issue: response.data,
            message: `Issue created successfully: ${response.data.id}`
          }, null, 2)
        }],
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to create issue: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Update issue using proper custom fields format
   */
  async updateIssue(issueId: string, updates: UpdateIssueParams): Promise<MCPResponse> {
    try {
      logApiCall('POST', `/issues/${issueId}`, updates);

      // Get current issue to determine project
      const issueResponse = await this.api.get(`/issues/${issueId}`, {
        params: { fields: 'project(id)' }
      });
      
      const projectId = issueResponse.data?.project?.id;
      if (!projectId) {
        throw new Error('Could not determine project for issue');
      }

      // Get project custom fields
      const customFields = await this.getProjectCustomFields(projectId);
      
      const updateData: any = {};

      if (updates.summary) {
        updateData.summary = updates.summary;
      }
      if (updates.description) {
        updateData.description = updates.description;
      }

      // Map user inputs to custom fields
      const customFieldValues = [];
      
      if (updates.state) {
        const stateField = customFields.find(f => 
          f.field.name.toLowerCase() === 'state' ||
          f.field.name.toLowerCase() === 'status'
        );
        if (stateField) {
          customFieldValues.push({
            name: stateField.field.name,
            value: { name: updates.state }
          });
        }
      }

      if (updates.priority) {
        const priorityField = customFields.find(f => 
          f.field.name.toLowerCase() === 'priority'
        );
        if (priorityField) {
          customFieldValues.push({
            name: priorityField.field.name,
            value: { name: updates.priority }
          });
        }
      }

      if (updates.type) {
        const typeField = customFields.find(f => 
          f.field.name.toLowerCase() === 'type' ||
          f.field.name.toLowerCase() === 'issue type'
        );
        if (typeField) {
          customFieldValues.push({
            name: typeField.field.name,
            value: { name: updates.type }
          });
        }
      }

      if (updates.assignee !== undefined) {
        const assigneeField = customFields.find(f => 
          f.field.name.toLowerCase() === 'assignee'
        );
        if (assigneeField) {
          customFieldValues.push({
            name: assigneeField.field.name,
            value: updates.assignee ? { login: updates.assignee } : null
          });
        }
      }

      if (customFieldValues.length > 0) {
        updateData.customFields = customFieldValues;
      }

      const response = await this.api.post(`/issues/${issueId}`, updateData, {
        params: {
          fields: 'id,summary,description,customFields(name,value($type,id,name,login))',
        },
      });

      // Clear related cache
      this.cache.clearPattern(`query-.*`);
      this.cache.clearPattern(`project-.*-${projectId}`);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issue: response.data,
            message: `Issue updated successfully: ${issueId}`
          }, null, 2),
        }],
      };
    } catch (error) {
      logError(error as Error, { issueId, updates });
      throw new Error(`Failed to update issue: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Query issues with proper field specification
   */
  async queryIssues(query: string, fields?: string, limit: number = 50): Promise<MCPResponse> {
    try {
      const cacheKey = `query-${query}-${fields || 'default'}-${limit}`;
      const cached = this.cache.get<MCPResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      const defaultFields = 'id,summary,description,project(id,name,shortName),customFields(name,value($type,id,name,login,fullName)),created,updated,resolved';
      
      logApiCall('GET', '/issues', { query, fields: fields || defaultFields, limit });

      const response = await this.api.get('/issues', {
        params: {
          query,
          fields: fields || defaultFields,
          '$top': limit,
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

  /**
   * List agile boards
   */
  async listAgileBoards(projectId?: string, includeDetails?: boolean): Promise<MCPResponse> {
    try {
      const cacheKey = `agile-boards-${projectId || 'all'}-${includeDetails}`;
      const cached = this.cache.get<MCPResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      let fields = 'id,name,owner(id,login,fullName),projects(id,name,shortName)';
      if (includeDetails) {
        fields += ',columnSettings(columns(id),field(id,name)),sprints(id,name,start,finish,archived)';
      }

      logApiCall('GET', '/agiles', { fields, projectId });
      
      const response = await this.api.get('/agiles', {
        params: { fields }
      });

      let boards = response.data || [];
      
      // Filter by project if specified
      if (projectId && Array.isArray(boards)) {
        boards = boards.filter((board: any) => 
          board.projects?.some((p: any) => p.id === projectId || p.shortName === projectId)
        );
      }

      const result = {
        content: [{
          type: 'text',
          text: JSON.stringify(boards, null, 2),
        }],
      };

      this.cache.set(cacheKey, result, 300000); // 5 minutes
      return result;
    } catch (error) {
      logError(error as Error, { projectId, includeDetails });
      throw new Error(`Failed to list agile boards: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get board details
   */
  async getBoardDetails(boardId: string, includeColumns?: boolean, includeSprints?: boolean): Promise<MCPResponse> {
    try {
      let fields = 'id,name,owner(id,login,fullName),projects(id,name,shortName)';
      if (includeColumns) {
        fields += ',columnSettings(columns(id),field(id,name))';
      }
      if (includeSprints) {
        fields += ',sprints(id,name,start,finish,archived,isDefault)';
      }

      logApiCall('GET', `/agiles/${boardId}`, { fields });
      
      const response = await this.api.get(`/agiles/${boardId}`, {
        params: { fields }
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        }],
      };
    } catch (error) {
      logError(error as Error, { boardId });
      throw new Error(`Failed to get board details: ${getErrorMessage(error)}`);
    }
  }

  /**
   * List articles from knowledge base
   */
  async listArticles(projectId?: string, query?: string, includeContent?: boolean): Promise<MCPResponse> {
    try {
      let fields = 'id,summary,created,updated,project(id,name,shortName),parentArticle(id,summary)';
      if (includeContent) {
        fields += ',content';
      }

      const params: any = { fields };
      
      // Add project filter if specified
      if (projectId) {
        params.query = `project: ${projectId}`;
      }

      logApiCall('GET', '/articles', params);
      
      const response = await this.api.get('/articles', { params });

      let articles = response.data || [];
      
      // Apply text search if specified
      if (query && Array.isArray(articles)) {
        const searchTerm = query.toLowerCase();
        articles = articles.filter((article: any) => 
          article.summary?.toLowerCase().includes(searchTerm) ||
          article.content?.toLowerCase().includes(searchTerm)
        );
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(articles, null, 2),
        }],
      };
    } catch (error) {
      logError(error as Error, { projectId, query });
      throw new Error(`Failed to list articles: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create article in knowledge base
   */
  async createArticle(params: {
    title: string;
    content: string;
    summary?: string;
    projectId?: string;
    tags?: string[];
  }): Promise<MCPResponse> {
    try {
      const articleData: any = {
        summary: params.title,
        content: params.content,
      };

      if (params.projectId) {
        articleData.project = { id: params.projectId };
      }

      // Add summary as description if provided
      if (params.summary) {
        articleData.content = `${params.summary}\n\n${params.content}`;
      }

      logApiCall('POST', '/articles', articleData);
      
      const response = await this.api.post('/articles', articleData, {
        params: {
          fields: 'id,summary,content,project(id,name),created',
        },
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            article: response.data,
            message: `Article created successfully: ${response.data.id}`
          }, null, 2)
        }],
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to create article: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Log work time using proper work items API
   */
  async logWorkTime(params: {
    issueId: string;
    duration: string;
    description?: string;
    date?: string;
    workType?: string;
  }): Promise<MCPResponse> {
    try {
      // Parse duration to minutes
      const durationMinutes = this.parseDurationToMinutes(params.duration);
      
      // Convert date to timestamp if provided
      let dateTimestamp: number | undefined;
      if (params.date) {
        dateTimestamp = new Date(params.date).getTime();
      }

      const workItemData: any = {
        duration: { minutes: durationMinutes },
        text: params.description || '',
      };

      if (dateTimestamp) {
        workItemData.date = dateTimestamp;
      }

      if (params.workType) {
        workItemData.type = { name: params.workType };
      }

      logApiCall('POST', `/issues/${params.issueId}/timeTracking/workItems`, workItemData);
      
      const response = await this.api.post(`/issues/${params.issueId}/timeTracking/workItems`, workItemData, {
        params: {
          fields: 'id,duration(minutes),text,date,type(name),author(login,fullName)',
        },
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            workItem: response.data,
            message: `Work time logged successfully: ${params.duration}`
          }, null, 2)
        }],
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to log work time: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Parse duration string to minutes
   */
  private parseDurationToMinutes(duration: string): number {
    const cleanDuration = duration.toLowerCase().trim();
    
    // Handle different duration formats
    let totalMinutes = 0;
    
    // Parse days (1d, 2 days)
    const daysMatch = cleanDuration.match(/(\d+(?:\.\d+)?)\s*d(?:ays?)?/);
    if (daysMatch) {
      totalMinutes += parseFloat(daysMatch[1]) * 8 * 60; // 8 hours per day
    }
    
    // Parse hours (1h, 2.5h, 2 hours)
    const hoursMatch = cleanDuration.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?/);
    if (hoursMatch) {
      totalMinutes += parseFloat(hoursMatch[1]) * 60;
    }
    
    // Parse minutes (30m, 45 minutes)
    const minutesMatch = cleanDuration.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?)?/);
    if (minutesMatch) {
      totalMinutes += parseFloat(minutesMatch[1]);
    }
    
    // If no matches, try to parse as decimal hours
    if (totalMinutes === 0) {
      const decimalMatch = cleanDuration.match(/^(\d+(?:\.\d+)?)$/);
      if (decimalMatch) {
        totalMinutes = parseFloat(decimalMatch[1]) * 60; // Assume hours
      }
    }
    
    return Math.max(1, Math.round(totalMinutes)); // At least 1 minute
  }

  // Additional methods maintained for compatibility...
  async getIssueComments(issueId: string): Promise<MCPResponse> {
    try {
      logApiCall('GET', `/issues/${issueId}/comments`);

      const response = await this.api.get(`/issues/${issueId}/comments`, {
        params: {
          fields: 'id,text,author(login,fullName),created,updated',
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
      }, {
        params: {
          fields: 'id,text,author(login,fullName),created',
        },
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            comment: response.data,
            message: `Comment added successfully to issue ${issueId}`
          }, null, 2),
        }],
      };
    } catch (error) {
      logError(error as Error, { issueId, text });
      throw new Error(`Failed to add comment: ${getErrorMessage(error)}`);
    }
  }

  async validateProject(projectId: string): Promise<{exists: boolean, accessible: boolean, project?: any, message: string, suggestions?: string[]}> {
    try {
      const cacheKey = `project-validation-${projectId}`;
      const cached = this.cache.get<any>(cacheKey);
      if (cached) {
        return cached;
      }

      // Try to get project directly
      try {
        logApiCall('GET', `/admin/projects/${projectId}`);
        const response = await this.api.get(`/admin/projects/${projectId}`, {
          params: {
            fields: 'id,name,shortName,description,archived'
          }
        });

        const result = {
          exists: true,
          accessible: true,
          project: response.data,
          message: `Project '${projectId}' is valid and accessible`
        };

        this.cache.set(cacheKey, result, 60000);
        return result;
      } catch (directError: any) {
        if (directError.response?.status === 404) {
          // Try to find project in list
          const projects = await this.listProjects();
          const foundProject = projects.find(p => 
            p.id === projectId || 
            p.shortName === projectId || 
            p.name === projectId
          );

          if (foundProject) {
            const result = {
              exists: true,
              accessible: true,
              project: foundProject,
              message: `Project '${projectId}' found and accessible`
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
        } else if (directError.response?.status === 403) {
          const result = {
            exists: true,
            accessible: false,
            message: `Access denied to project '${projectId}'`,
            suggestions: [
              'Contact your YouTrack administrator for access',
              'Check if your token has the required permissions'
            ]
          };
          this.cache.set(cacheKey, result, 60000);
          return result;
        }
        throw directError;
      }
    } catch (error) {
      logError(error as Error, { projectId });
      const result = {
        exists: false,
        accessible: false,
        message: `Error validating project '${projectId}': ${(error as Error).message}`,
        suggestions: ['Check your connection and try again']
      };
      return result;
    }
  }
}
