import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { logger, logApiCall, logError } from './logger.js';
import { SimpleCache } from './cache.js';
import { CustomFieldsManager, CustomFieldValue } from './custom-fields-manager.js';
import { FieldSelector } from './field-selector.js';
import { ProjectFieldManager, ProjectFieldsInfo } from './field-manager.js';
import { GanttChartManager } from './utils/gantt-chart-manager.js';

export interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface Issue {
  // Core identification
  id: string;
  idReadable: string;
  numberInProject: number;
  
  // Basic content
  summary: string;
  description?: string;
  wikifiedDescription?: string;
  
  // Project and ownership
  project: {
    id: string;
    name: string;
    shortName: string;
  };
  reporter?: User;
  updater?: User;
  draftOwner?: User;
  
  // Status and workflow
  isDraft: boolean;
  resolved?: number; // timestamp
  
  // Custom fields and properties
  customFields: IssueCustomField[];
  
  // Temporal information
  created: number; // timestamp
  updated: number; // timestamp
  
  // Relationships
  parent?: IssueLink;
  subtasks?: IssueLink[];
  links?: IssueLink[];
  externalIssue?: ExternalIssue;
  
  // Social features
  tags?: Tag[];
  votes: number;
  voters?: IssueVoters;
  watchers?: IssueWatchers;
  
  // Comments and communication
  comments?: IssueComment[];
  commentsCount: number;
  pinnedComments?: IssueComment[];
  
  // Attachments
  attachments?: IssueAttachment[];
  
  // Visibility and permissions
  visibility?: Visibility;
}

export interface User {
  id?: string;
  login: string;
  fullName?: string;
  email?: string;
  jabberAccountName?: string;
  ringId?: string;
  guest?: boolean;
  online?: boolean;
  banned?: boolean;
  tags?: Tag[];
  savedQueries?: SavedQuery[];
  avatarUrl?: string;
  profiles?: GeneralUserProfile;
}

export interface IssueCustomField {
  $type?: string;
  id?: string;
  name: string;
  value?: any;
  projectCustomField?: ProjectCustomField;
}

export interface IssueLink {
  id?: string;
  direction?: string;
  linkType?: IssueLinkType;
  issues?: Issue[];
  trimmedIssues?: Issue[];
}

export interface IssueLinkType {
  id?: string;
  name?: string;
  localizedName?: string;
  sourceToTarget?: string;
  localizedSourceToTarget?: string;
  targetToSource?: string;
  localizedTargetToSource?: string;
  directed?: boolean;
  aggregation?: boolean;
  readOnly?: boolean;
}

export interface ExternalIssue {
  id?: string;
  name?: string;
  url?: string;
  key?: string;
}

export interface Tag {
  id?: string;
  name: string;
  query?: string;
  color?: FieldStyle;
  untagOnResolve?: boolean;
  owner?: User;
  updateableBy?: UserGroup;
  visibleFor?: UserGroup;
}

export interface FieldStyle {
  id?: string;
  background?: string;
  foreground?: string;
}

export interface UserGroup {
  id?: string;
  name?: string;
  ringId?: string;
  usersCount?: number;
  icon?: string;
}

export interface IssueVoters {
  id?: string;
  hasVote?: boolean;
  original?: Issue;
  duplicate?: Issue[];
}

export interface IssueWatchers {
  id?: string;
  hasStar?: boolean;
  issueWatchers?: User[];
  duplicateWatchers?: User[];
}

export interface IssueComment {
  id?: string;
  text?: string;
  textPreview?: string;
  wikifiedText?: string;
  created?: number;
  updated?: number;
  author?: User;
  issue?: Issue;
  parent?: IssueComment;
  replies?: IssueComment[];
  deleted?: boolean;
  visibility?: Visibility;
  attachments?: IssueAttachment[];
}

export interface IssueAttachment {
  id?: string;
  name?: string;
  url?: string;
  size?: number;
  extension?: string;
  charset?: string;
  mimeType?: string;
  metaData?: string;
  created?: number;
  updated?: number;
  author?: User;
  issue?: Issue;
  comment?: IssueComment;
  visibility?: Visibility;
  removed?: boolean;
  base64Content?: string;
  thumbnailURL?: string;
}

export interface Visibility {
  $type?: string;
  permittedGroups?: UserGroup[];
  permittedUsers?: User[];
}

export interface SavedQuery {
  id?: string;
  name?: string;
  query?: string;
  issues?: Issue[];
  owner?: User;
}

export interface GeneralUserProfile {
  id?: string;
  locale?: Locale;
  general?: GeneralUserProfile;
  timeTracking?: TimeTrackingUserProfile;
  notifications?: NotificationsUserProfile;
}

export interface Locale {
  id?: string;
  language?: string;
  country?: string;
  locale?: string;
}

export interface TimeTrackingUserProfile {
  id?: string;
  timeFormat?: string;
}

export interface NotificationsUserProfile {
  id?: string;
  autoWatch?: boolean;
  jabberNotificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  mentionNotificationsEnabled?: boolean;
  duplicateClusterNotificationsEnabled?: boolean;
  mailboxIntegrationNotificationsEnabled?: boolean;
  usePlainTextEmails?: boolean;
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

export interface ProjectCustomField {
  field: {
    id: string;
    name: string;
    fieldType: {
      valueType: string;
    };
  };
  hasOtherValues?: boolean;
  canBeEmpty?: boolean;
  bundle?: {
    id: string;
    values?: Array<{
      id: string;
      name: string;
    }>;
  };
}

export interface CreateIssueParams {
  projectId: string;
  summary: string;
  description?: string;
  type?: string;
  priority?: string;
  state?: string;
  assignee?: string;
  customFields?: Record<string, any>;
  tags?: string[];
}

export interface CreateEpicParams {
  projectId: string;
  summary: string;
  description?: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
}

export interface UpdateIssueParams {
  summary?: string;
  description?: string;
  state?: string;
  assignee?: string;
  priority?: string;
  type?: string;
  subsystem?: string;
  dueDate?: string;
  estimation?: number;
  tags?: string[];
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
  private customFieldsManager: CustomFieldsManager;
  private dynamicFieldManager: ProjectFieldManager;
  private ganttChartManager: GanttChartManager;

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

    // Initialize field managers
    this.customFieldsManager = new CustomFieldsManager(this.api, this.cache);
    this.dynamicFieldManager = new ProjectFieldManager(this.api, this.cache);
    this.ganttChartManager = new GanttChartManager(this);

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
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((issue: any) => {
          if (issue.project) {
            projectsMap.set(issue.project.id, issue.project);
          }
        });
      }

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

      // First, check if project exists by listing all projects
      logApiCall('GET', '/admin/projects', { fields: 'id,name,shortName,description' });
      const allProjectsResponse = await this.api.get('/admin/projects', {
        params: {
          fields: 'id,name,shortName,description'
        }
      });

      const foundProject = allProjectsResponse.data.find((p: any) => 
        p.id === projectId || 
        p.shortName === projectId || 
        p.name === projectId
      );

      if (foundProject) {
        // Project exists, now check if we can access its issues
        try {
          logApiCall('GET', '/issues', { query: `project: ${projectId}` });
          const issuesResponse = await this.api.get('/issues', {
            params: {
              query: `project: ${projectId}`,
              fields: 'id',
              '$top': 1
            }
          });

          const result = {
            exists: true,
            accessible: true,
            project: foundProject,
            message: `Project '${projectId}' is valid and accessible`
          };

          this.cache.set(cacheKey, result, 60000); // Cache for 1 minute
          return result;
        } catch (issueError) {
          // Can't access issues, but project exists
          const result = {
            exists: true,
            accessible: false,
            project: foundProject,
            message: `Project '${projectId}' exists but you may not have access to its issues`,
            suggestions: ['Check your project permissions', 'Contact project administrator']
          };
          this.cache.set(cacheKey, result, 60000);
          return result;
        }
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
  }

  /**
   * Resolve project identifier - try different formats for YouTrack API compatibility
   */
  private async resolveProjectId(projectIdentifier: string): Promise<string> {
    // If it's already in the right format (like "0-1"), return as-is
    if (/^\d+-\d+$/.test(projectIdentifier)) {
      return projectIdentifier;
    }

    // Try to validate the project to get the correct ID
    try {
      const validation = await this.validateProject(projectIdentifier);
      if (validation.exists && validation.project) {
        return validation.project.id;
      }
    } catch (error) {
      logger.warn(`Failed to validate project ${projectIdentifier}:`, (error as Error).message);
    }

    // Try to get projects list to find the correct ID as fallback
    try {
      const projects = await this.listProjects();
      const project = projects.find(p => 
        p.shortName === projectIdentifier || 
        p.id === projectIdentifier ||
        p.name === projectIdentifier
      );
      if (project) {
        return project.id;
      }
    } catch (error) {
      logger.warn(`Failed to resolve project ID for ${projectIdentifier}:`, (error as Error).message);
    }
    
    // Fall back to original identifier
    return projectIdentifier;
  }

  async createIssue(params: CreateIssueParams): Promise<MCPResponse> {
    try {
      logApiCall('POST', '/issues', params);

      // Resolve project shortName to ID
      const projectId = await this.resolveProjectId(params.projectId);

      // Prepare custom fields from both direct parameters and custom fields
      const fieldMappings: Record<string, any> = {};
      
      // Map standard fields to custom fields
      if (params.type) fieldMappings.type = params.type;
      if (params.priority) fieldMappings.priority = params.priority;
      if (params.state) fieldMappings.state = params.state;
      if (params.assignee) fieldMappings.assignee = params.assignee;
      
      // Add any additional custom fields
      if (params.customFields) {
        Object.assign(fieldMappings, params.customFields);
      }

      // Create issue with proper structure
      const issueData: any = {
        project: { id: projectId },
        summary: params.summary
      };

      if (params.description?.trim()) {
        issueData.description = params.description.trim();
      }

      // Only process custom fields if we have any to process
      if (Object.keys(fieldMappings).length > 0) {
        try {
          // Get custom fields for the project first
          await this.customFieldsManager.getProjectCustomFields(projectId);

          // Convert to proper custom fields format
          const customFields = this.customFieldsManager.convertToCustomFields(projectId, fieldMappings);

          // Validate custom fields
          const validation = await this.customFieldsManager.validateCustomFields(projectId, customFields);
          if (!validation.valid) {
            throw new Error(`Custom field validation failed: ${validation.errors.join(', ')}`);
          }

          issueData.customFields = customFields;

          logger.info('Creating issue with proper custom fields structure', { 
            projectId, 
            summary: params.summary,
            customFieldsCount: customFields.length 
          });
        } catch (customFieldError) {
          // Log the error but continue with basic issue creation
          logError(customFieldError as Error, { message: 'Custom field processing failed, creating basic issue', projectId, fieldMappings });
          logger.warn('Proceeding with basic issue creation without custom fields');
        }
      } else {
        logger.info('Creating basic issue without custom fields', { 
          projectId, 
          summary: params.summary
        });
      }

      const response = await this.api.post('/issues', issueData, {
        params: {
          fields: 'id,summary,description,project(id,name,shortName),customFields(name,value(name,id))',
        },
      });

      const issueId = response.data.id;

      // Add tags separately if provided (YouTrack requires separate API calls for tags)
      const tagsAdded: string[] = [];
      if (params.tags && params.tags.length > 0) {
        for (const tagName of params.tags) {
          try {
            await this.addTagToIssue(issueId, tagName);
            tagsAdded.push(tagName);
          } catch (tagError) {
            // Log error but don't fail the whole operation
            logError(tagError as Error, { message: 'Failed to add tag to issue', issueId, tagName });
          }
        }
      }

      // Clear related cache
      this.cache.clearPattern(`query-.*`);
      this.cache.clearPattern(`project-.*`);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issue: response.data,
            message: `Issue created successfully: ${response.data.id}`,
            tagsAdded: tagsAdded
          }, null, 2),
        }],
      };
    } catch (error) {
      logError(error as Error, { 
        method: 'createIssue', 
        params,
        errorDetails: error instanceof AxiosError ? {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        } : undefined
      });
      
      // Don't mask errors - let them bubble up to MCP properly
      throw error;
    }
  }

  async createEpic(params: CreateEpicParams): Promise<MCPResponse> {
    try {
      logApiCall('POST', '/issues', params);

      // Resolve project shortName to ID
      const projectId = await this.resolveProjectId(params.projectId);

      const issueData: any = {
        project: { id: projectId },
        summary: params.summary,
        type: { name: 'Epic' }, // Explicitly set type to Epic
      };

      if (params.description?.trim()) {
        issueData.description = params.description.trim();
      }

      // Add priority if specified
      if (params.priority?.trim()) {
        issueData.priority = { name: params.priority.trim() };
      }

      // Add assignee if specified
      if (params.assignee?.trim()) {
        issueData.assignee = { login: params.assignee.trim() };
      }

      // Add due date if specified
      if (params.dueDate?.trim()) {
        issueData.dueDate = params.dueDate.trim();
      }

      const response = await this.api.post('/issues', issueData, {
        params: {
          fields: 'id,summary,description,project(id,name),type(name),priority(name),assignee(login,name),dueDate',
        },
      });

      // Clear project-related cache
      this.cache.clearPattern(`project-.*-${params.projectId}`);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            epic: response.data,
            message: `Epic created successfully: ${response.data.id}`
          }, null, 2)
        }],
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to create epic: ${getErrorMessage(error)}`);
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

      // Get issue to determine project ID for custom field mapping
      const issueResponse = await this.api.get(`/issues/${issueId}`, {
        params: { fields: 'id,project(id)' }
      });
      const projectId = issueResponse.data.project.id;

      const updateData: any = {};

      // Handle basic fields
      if (updates.summary) {
        updateData.summary = updates.summary;
      }
      if (updates.description) {
        updateData.description = updates.description;
      }

      // Handle custom fields properly
      const customFieldMappings: Record<string, any> = {};
      
      if (updates.state) customFieldMappings.state = updates.state;
      if (updates.priority) customFieldMappings.priority = updates.priority;
      if (updates.type) customFieldMappings.type = updates.type;
      if (updates.assignee) customFieldMappings.assignee = updates.assignee;
      if (updates.subsystem) customFieldMappings.subsystem = updates.subsystem;
      if (updates.dueDate) customFieldMappings.dueDate = updates.dueDate;
      if (updates.estimation) customFieldMappings.estimation = updates.estimation;

      // Convert to proper custom fields format
      if (Object.keys(customFieldMappings).length > 0) {
        const customFields = await this.customFieldsManager.convertToCustomFields(projectId, customFieldMappings);
        updateData.customFields = customFields;
      }

      logger.info('Updating issue with proper custom fields structure', { 
        issueId, 
        projectId,
        customFieldsCount: updateData.customFields?.length || 0 
      });

      const response = await this.api.post(`/issues/${issueId}`, updateData, {
        params: {
          fields: 'id,summary,description,customFields(name,value(name,id)),tags(name)',
        },
      });

      // Handle tags separately using the correct two-step process
      if (updates.tags && updates.tags.length > 0) {
        for (const tagName of updates.tags) {
          try {
            await this.addTagToIssue(issueId, tagName);
          } catch (tagError) {
            // Log error but don't fail the whole operation
            logError(tagError as Error, { message: 'Failed to add tag to issue', issueId, tagName });
          }
        }
      }

      // Clear related cache
      this.cache.clearPattern(`query-.*`);
      this.cache.clearPattern(`project-.*`);

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
      logError(error as Error, { 
        method: 'updateIssue',
        issueId, 
        updates,
        errorDetails: error instanceof AxiosError ? {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        } : undefined
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: getErrorMessage(error),
            details: error instanceof AxiosError ? error.response?.data : null
          }, null, 2),
        }],
      };
    }
  }

  /**
   * Get a single issue with comprehensive field selection
   */
  async getIssue(issueId: string, includeAllFields: boolean = false): Promise<MCPResponse> {
    try {
      logApiCall('GET', `/issues/${issueId}`, { issueId, includeAllFields });

      const fields = includeAllFields 
        ? FieldSelector.getCompleteIssueFields()
        : FieldSelector.getEssentialIssueFields();

      const response = await this.api.get(`/issues/${issueId}`, {
        params: { fields }
      });

      const issue = response.data;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issue: issue,
            fieldsIncluded: includeAllFields ? 'complete' : 'essential',
            metadata: {
              customFieldsCount: issue.customFields?.length || 0,
              attachmentsCount: issue.attachments?.length || 0,
              commentsCount: issue.commentsCount || 0,
              linksCount: issue.links?.length || 0,
              tags: issue.tags?.map((t: any) => t.name) || []
            }
          }, null, 2)
        }]
      };

    } catch (error) {
      logError(error as Error, { method: 'getIssue', issueId });
      throw new Error(`Failed to get issue ${issueId}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Search issues with comprehensive field selection and advanced filtering
   */
  async searchIssues(params: {
    query?: string;
    projectId?: string;
    assignee?: string;
    reporter?: string;
    state?: string;
    priority?: string;
    type?: string;
    tags?: string[];
    includeAllFields?: boolean;
    limit?: number;
    skip?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<MCPResponse> {
    try {
      logApiCall('GET', '/issues', params);

      // Build YouTrack query
      const queryParts: string[] = [];
      
      if (params.projectId) {
        queryParts.push(`project: ${params.projectId}`);
      }
      
      if (params.assignee) {
        queryParts.push(`Assignee: ${params.assignee}`);
      }
      
      if (params.reporter) {
        queryParts.push(`Reporter: ${params.reporter}`);
      }
      
      if (params.state) {
        queryParts.push(`State: ${params.state}`);
      }
      
      if (params.priority) {
        queryParts.push(`Priority: ${params.priority}`);
      }
      
      if (params.type) {
        queryParts.push(`Type: ${params.type}`);
      }
      
      if (params.tags && params.tags.length > 0) {
        queryParts.push(`tag: {${params.tags.join(' ')}}`);
      }
      
      if (params.query) {
        queryParts.push(params.query);
      }

      const searchQuery = queryParts.join(' ');
      
      const fields = params.includeAllFields 
        ? FieldSelector.getCompleteIssueFields()
        : FieldSelector.getSearchResultFields();

      const apiParams: any = {
        fields: fields,
        $top: params.limit || 50,
        $skip: params.skip || 0
      };

      // Only add query if it's not empty
      if (searchQuery && searchQuery.trim()) {
        apiParams.query = searchQuery;
      }

      if (params.sortBy) {
        apiParams.orderBy = `${params.sortBy} ${params.sortOrder || 'asc'}`;
      }

      const response = await this.api.get('/issues', { params: apiParams });
      const issues = response.data;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issues: issues,
            query: searchQuery,
            fieldsIncluded: params.includeAllFields ? 'complete' : 'search_optimized',
            metadata: {
              totalCount: issues.length,
              hasMore: issues.length === (params.limit || 50),
              filters: {
                projectId: params.projectId,
                assignee: params.assignee,
                reporter: params.reporter,
                state: params.state,
                priority: params.priority,
                type: params.type,
                tags: params.tags
              }
            }
          }, null, 2)
        }]
      };

    } catch (error) {
      logError(error as Error, { method: 'searchIssues', params });
      throw new Error(`Failed to search issues: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get issues for a project with comprehensive filtering
   */
  async getProjectIssues(params: {
    projectId: string;
    state?: string;
    assignee?: string;
    includeAllFields?: boolean;
    limit?: number;
    skip?: number;
  }): Promise<MCPResponse> {
    return this.searchIssues({
      projectId: params.projectId,
      state: params.state,
      assignee: params.assignee,
      includeAllFields: params.includeAllFields,
      limit: params.limit,
      skip: params.skip
    });
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
        projectId: projectId,
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
   * Get project custom fields using the new custom fields manager
   */
  async getProjectCustomFields(projectId: string): Promise<ProjectCustomField[]> {
    try {
      const resolvedProjectId = await this.resolveProjectId(projectId);
      const customFields = await this.customFieldsManager.getProjectCustomFields(resolvedProjectId);
      
      // Convert to the legacy format for backwards compatibility
      return customFields.map(cf => ({
        field: {
          id: cf.field.id,
          name: cf.field.name,
          fieldType: {
            valueType: cf.field.fieldType.id
          }
        },
        bundle: cf.bundle ? {
          id: cf.bundle.id,
          values: cf.bundle.values?.map(v => ({
            id: v.id || v.name,
            name: v.name
          }))
        } : undefined
      }));
    } catch (error) {
      // Fallback to legacy method if custom fields manager fails
      logger.warn('Custom fields manager failed, falling back to legacy method', { error: getErrorMessage(error) });
      return this.getProjectCustomFieldsLegacy(projectId);
    }
  }

  private async getProjectCustomFieldsLegacy(projectId: string): Promise<ProjectCustomField[]> {
    try {
      logApiCall('GET', '/issues', { project: projectId, customFields: true });
      const response = await this.api.get('/issues', {
        params: {
          query: `project: ${projectId}`,
          fields: 'customFields(name,value($type,name,id,login,fullName),field($type,name))',
          '$top': 50 // Get enough issues to discover most custom fields
        }
      });

      const customFieldsMap = new Map<string, ProjectCustomField>();
      
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((issue: any) => {
          if (issue.customFields) {
            issue.customFields.forEach((field: any) => {
              const fieldName = field.name || field.field?.name;
              if (fieldName && !customFieldsMap.has(fieldName)) {
                const customField: ProjectCustomField = {
                  field: {
                    id: field.field?.id || fieldName,
                    name: fieldName,
                    fieldType: {
                      valueType: field.field?.$type || field.value?.$type || 'Unknown'
                    }
                  }
                };

                customFieldsMap.set(fieldName, customField);
              }
            });
          }
        });
      }

      const customFields = Array.from(customFieldsMap.values());
      return customFields;
    } catch (error) {
      logError(error as Error, { projectId });
      throw new Error(`Failed to get project custom fields: ${(error as Error).message}`);
    }
  }

  // === MILESTONE MANAGEMENT METHODS ===

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
      // Resolve project shortName to ID
      const projectId = await this.resolveProjectId(params.projectId);
      
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
        project: { id: projectId },
        summary: params.name,
        description: milestoneDescription,
        type: { name: 'Task' }, // Use Task type for milestones
        dueDate: params.targetDate
      };

      logApiCall('POST', '/issues', milestoneData);
      const response = await this.api.post('/issues', milestoneData);

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
      // Parse duration string to minutes
      const durationMinutes = this.parseDurationToMinutes(params.duration);
      
      // Prepare work item data in YouTrack's expected format
      const workItemData: any = {
        duration: {
          presentation: params.duration,
          minutes: durationMinutes
        },
        description: params.description || 'Work logged via MCP'
      };

      // Add date as timestamp if provided
      if (params.date) {
        const dateObj = new Date(params.date);
        workItemData.date = dateObj.getTime();
      }

      // Add work type if provided - try to resolve to ID first
      if (params.workType) {
        try {
          // Get available work types to map name to ID
          const workTypesResponse = await this.api.get('/admin/timeTrackingSettings/workItemTypes', {
            params: { fields: 'id,name' }
          });
          
          const workType = workTypesResponse.data.find((type: any) => 
            type.name?.toLowerCase() === params.workType?.toLowerCase()
          );
          
          if (workType) {
            workItemData.type = { id: workType.id };
          } else {
            // Fallback to name if ID lookup fails
            workItemData.type = { name: params.workType };
          }
        } catch (error) {
          // If work type lookup fails, use name as fallback
          workItemData.type = { name: params.workType };
        }
      }

      logApiCall('POST', `/issues/${params.issueId}/timeTracking/workItems`, workItemData);
      const response = await this.api.post(`/issues/${params.issueId}/timeTracking/workItems`, workItemData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            workItem: response.data,
            duration: params.duration,
            message: `Work time logged successfully: ${params.duration}`,
            issueId: params.issueId
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to log work time: ${(error as Error).message}`);
    }
  }

  /**
   * Parse duration string to minutes
   * Supports formats like: "1h", "30m", "2h 30m", "1.5h", "90m"
   */
  private parseDurationToMinutes(duration: string): number {
    let totalMinutes = 0;
    
    // Remove extra spaces and convert to lowercase
    const normalized = duration.toLowerCase().trim();
    
    // Match hours (h) and minutes (m)
    const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*h/);
    const minuteMatch = normalized.match(/(\d+)\s*m/);
    
    if (hourMatch) {
      totalMinutes += parseFloat(hourMatch[1]) * 60;
    }
    
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1]);
    }
    
    // If no matches, try parsing as just a number (assume minutes)
    if (!hourMatch && !minuteMatch) {
      const numberMatch = normalized.match(/(\d+(?:\.\d+)?)/);
      if (numberMatch) {
        totalMinutes = parseFloat(numberMatch[1]);
      }
    }
    
    return Math.round(totalMinutes);
  }

  // ========================================
  // PHASE 1: REPORTS & ENHANCED TIMESHEET
  // ========================================

  /**
   * Get time tracking report for a project or user
   */
  async getTimeTrackingReport(params: {
    projectId?: string;
    userId?: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    groupBy?: 'user' | 'issue' | 'date' | 'workType';
  }): Promise<MCPResponse> {
    try {
      const cacheKey = `time-report-${JSON.stringify(params)}`;
      const cached = this.cache.get<MCPResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      // Build query for work items
      let query = `created: ${params.startDate} .. ${params.endDate}`;
      
      if (params.projectId) {
        query += ` project: ${params.projectId}`;
      }
      
      if (params.userId) {
        query += ` work author: ${params.userId}`;
      }

      const workItemsParams = {
        query: query,
        fields: 'id,issue(id,summary,project(name)),author(login,fullName),date,duration(minutes,presentation),description,type(name)',
        $top: 1000
      };

      logApiCall('GET', '/workItems', workItemsParams);
      const response = await this.api.get('/workItems', { params: workItemsParams });

      // Process and group the data
      const workItems = response.data || [];
      const report = this.processTimeReport(workItems, params.groupBy || 'user');

      const result = {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            reportPeriod: { startDate: params.startDate, endDate: params.endDate },
            groupBy: params.groupBy || 'user',
            totalItems: workItems.length,
            totalTime: report.totalMinutes,
            totalTimeFormatted: this.formatMinutesToDuration(report.totalMinutes),
            groups: report.groups,
            workItems: workItems
          }, null, 2)
        }]
      };

      this.cache.set(cacheKey, result, 300000); // 5 minutes cache
      return result;
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to get time tracking report: ${(error as Error).message}`);
    }
  }

  /**
   * Get user timesheet for a specific period
   */
  async getUserTimesheet(params: {
    userId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    includeDetails?: boolean;
  }): Promise<MCPResponse> {
    try {
      const query = `work author: ${params.userId} created: ${params.startDate} .. ${params.endDate}`;
      
      const workItemsParams = {
        query: query,
        fields: 'id,issue(id,summary,project(name,shortName)),date,duration(minutes,presentation),description,type(name)',
        $top: 1000
      };

      logApiCall('GET', '/workItems', workItemsParams);
      const response = await this.api.get('/workItems', { params: workItemsParams });

      const workItems = response.data || [];
      
      // Group by date for timesheet view
      const timesheetData = this.groupWorkItemsByDate(workItems);
      const totalMinutes = workItems.reduce((sum: number, item: any) => sum + (item.duration?.minutes || 0), 0);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            userId: params.userId,
            period: { startDate: params.startDate, endDate: params.endDate },
            totalHours: Math.round((totalMinutes / 60) * 100) / 100,
            totalMinutes: totalMinutes,
            dailyBreakdown: timesheetData,
            workItems: params.includeDetails ? workItems : undefined
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to get user timesheet: ${(error as Error).message}`);
    }
  }

  /**
   * Get project statistics and metrics
   */
  async getProjectStatistics(params: {
    projectId: string;
    period?: { startDate: string; endDate: string };
    includeTimeTracking?: boolean;
  }): Promise<MCPResponse> {
    try {
      const projectId = await this.resolveProjectId(params.projectId);
      
      // Get basic issue statistics
      let issueQuery = `project: ${params.projectId}`;
      if (params.period) {
        issueQuery += ` created: ${params.period.startDate} .. ${params.period.endDate}`;
      }

      const issuesParams = {
        query: issueQuery,
        fields: 'id,state(name),priority(name),type(name),assignee(login),created,resolved',
        $top: 2000
      };

      logApiCall('GET', '/issues', issuesParams);
      const issuesResponse = await this.api.get('/issues', { params: issuesParams });
      
      const issues = issuesResponse.data || [];
      const stats = this.calculateProjectStatistics(issues);

      // Add time tracking statistics if requested
      if (params.includeTimeTracking && params.period) {
        const timeReport = await this.getTimeTrackingReport({
          projectId: params.projectId,
          startDate: params.period.startDate,
          endDate: params.period.endDate,
          groupBy: 'issue'
        });
        
        const timeData = JSON.parse(timeReport.content[0].text);
        stats.timeTracking = {
          totalTime: timeData.totalTimeFormatted,
          totalMinutes: timeData.totalMinutes,
          averageTimePerIssue: Math.round(timeData.totalMinutes / Math.max(issues.length, 1))
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            projectId: params.projectId,
            period: params.period,
            statistics: stats
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to get project statistics: ${(error as Error).message}`);
    }
  }

  // Helper methods for report processing
  private processTimeReport(workItems: any[], groupBy: string) {
    const groups: Record<string, any> = {};
    let totalMinutes = 0;

    workItems.forEach(item => {
      const minutes = item.duration?.minutes || 0;
      totalMinutes += minutes;

      let groupKey: string;
      switch (groupBy) {
        case 'user':
          groupKey = item.author?.fullName || item.author?.login || 'Unknown';
          break;
        case 'issue':
          groupKey = `${item.issue?.id} - ${item.issue?.summary}`;
          break;
        case 'date':
          groupKey = new Date(item.date).toISOString().split('T')[0];
          break;
        case 'workType':
          groupKey = item.type?.name || 'No Type';
          break;
        default:
          groupKey = 'All';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          totalMinutes: 0,
          totalHours: 0,
          itemCount: 0,
          items: []
        };
      }

      groups[groupKey].totalMinutes += minutes;
      groups[groupKey].totalHours = Math.round((groups[groupKey].totalMinutes / 60) * 100) / 100;
      groups[groupKey].itemCount++;
      groups[groupKey].items.push(item);
    });

    return { totalMinutes, groups };
  }

  private groupWorkItemsByDate(workItems: any[]) {
    const dailyData: Record<string, any> = {};
    
    workItems.forEach(item => {
      const date = new Date(item.date).toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          totalMinutes: 0,
          totalHours: 0,
          items: []
        };
      }
      
      dailyData[date].totalMinutes += item.duration?.minutes || 0;
      dailyData[date].totalHours = Math.round((dailyData[date].totalMinutes / 60) * 100) / 100;
      dailyData[date].items.push(item);
    });
    
    return Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }

  private calculateProjectStatistics(issues: any[]) {
    const stats: any = {
      total: issues.length,
      byState: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      byAssignee: {} as Record<string, number>,
      resolved: 0,
      averageResolutionTime: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    issues.forEach(issue => {
      // Count by state
      const state = issue.state?.name || 'No State';
      stats.byState[state] = (stats.byState[state] || 0) + 1;

      // Count by priority
      const priority = issue.priority?.name || 'No Priority';
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

      // Count by type
      const type = issue.type?.name || 'No Type';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count by assignee
      const assignee = issue.assignee?.login || 'Unassigned';
      stats.byAssignee[assignee] = (stats.byAssignee[assignee] || 0) + 1;

      // Calculate resolution time
      if (issue.resolved && issue.created) {
        const created = new Date(issue.created).getTime();
        const resolved = new Date(issue.resolved).getTime();
        totalResolutionTime += resolved - created;
        resolvedCount++;
        stats.resolved++;
      }
    });

    if (resolvedCount > 0) {
      stats.averageResolutionTime = Math.round(totalResolutionTime / resolvedCount / (1000 * 60 * 60 * 24)); // days
    }

    return stats;
  }

  private formatMinutesToDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes}m`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
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
  // ========================
  // PHASE 2: AGILE BOARDS
  // ========================

  /**
   * List all agile boards
   */
  async listAgileBoards(params: {
    projectId?: string;
    includeDetails?: boolean;
  }): Promise<MCPResponse> {
    try {
      let fieldsParam = 'id,name,projects(id,name,shortName)';
      if (params.includeDetails) {
        fieldsParam += ',sprints(id,name,start,finish,archived),columns(id,presentation),currentSprint(id,name)';
      }

      const agilesParams = { fields: fieldsParam };
      logApiCall('GET', '/agiles', agilesParams);
      const response = await this.api.get('/agiles', { params: agilesParams });

      let boards = response.data || [];
      
      // Filter by project if specified
      if (params.projectId) {
        boards = boards.filter((board: any) => 
          board.projects?.some((p: any) => p.shortName === params.projectId || p.id === params.projectId)
        );
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            boards: boards,
            count: boards.length,
            projectFilter: params.projectId || null
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to list agile boards: ${(error as Error).message}`);
    }
  }

  /**
   * Get detailed information about a specific agile board
   */
  async getBoardDetails(params: {
    boardId: string;
    includeColumns?: boolean;
    includeSprints?: boolean;
  }): Promise<MCPResponse> {
    try {
      let fieldsParam = 'id,name,projects(id,name,shortName),estimationField,hideOrphansSwimlane,colorCoding';
      
      if (params.includeColumns) {
        fieldsParam += ',columns(id,presentation,fieldValues(name,presentation),ordinal)';
      }
      
      if (params.includeSprints) {
        fieldsParam += ',sprints(id,name,start,finish,archived,isDefault),currentSprint(id,name)';
      }

      const boardParams = { fields: fieldsParam };
      logApiCall('GET', `/agiles/${params.boardId}`, boardParams);
      const response = await this.api.get(`/agiles/${params.boardId}`, { params: boardParams });

      const board = response.data;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            board: board,
            summary: {
              name: board.name,
              projectCount: board.projects?.length || 0,
              columnCount: board.columns?.length || 0,
              sprintCount: board.sprints?.length || 0,
              currentSprint: board.currentSprint?.name || 'None'
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to get board details: ${(error as Error).message}`);
    }
  }

  /**
   * List sprints for an agile board
   */
  async listSprints(params: {
    boardId: string;
    includeArchived?: boolean;
    includeIssues?: boolean;
  }): Promise<MCPResponse> {
    try {
      let fieldsParam = 'id,name,start,finish,goal,archived,isDefault';
      
      if (params.includeIssues) {
        fieldsParam += ',issues(id,summary,state(name))';
      }

      const sprintsParams = { fields: fieldsParam };
      logApiCall('GET', `/agiles/${params.boardId}/sprints`, sprintsParams);
      const response = await this.api.get(`/agiles/${params.boardId}/sprints`, { params: sprintsParams });

      let sprints = response.data || [];
      
      // Filter archived sprints if not requested
      if (!params.includeArchived) {
        sprints = sprints.filter((sprint: any) => !sprint.archived);
      }

      // Process dates and add metrics
      const processedSprints = sprints.map((sprint: any) => ({
        ...sprint,
        startDate: sprint.start ? new Date(sprint.start).toISOString().split('T')[0] : null,
        finishDate: sprint.finish ? new Date(sprint.finish).toISOString().split('T')[0] : null,
        issueCount: sprint.issues?.length || 0,
        duration: sprint.start && sprint.finish ? 
          Math.ceil((sprint.finish - sprint.start) / (1000 * 60 * 60 * 24)) : null
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            boardId: params.boardId,
            sprints: processedSprints,
            count: processedSprints.length,
            summary: {
              activeSprints: processedSprints.filter((s: any) => !s.archived).length,
              archivedSprints: processedSprints.filter((s: any) => s.archived).length,
              totalIssues: processedSprints.reduce((sum: number, s: any) => sum + s.issueCount, 0)
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to list sprints: ${(error as Error).message}`);
    }
  }

  /**
   * Get detailed information about a specific sprint
   */
  async getSprintDetails(params: {
    boardId: string;
    sprintId: string;
    includeIssues?: boolean;
  }): Promise<MCPResponse> {
    try {
      let fieldsParam = 'id,name,start,finish,goal,archived,isDefault,board(id,name)';
      
      if (params.includeIssues) {
        fieldsParam += ',issues(id,summary,state(name),priority(name),assignee(login,fullName),estimation)';
      }

      const sprintParams = { fields: fieldsParam };
      logApiCall('GET', `/agiles/${params.boardId}/sprints/${params.sprintId}`, sprintParams);
      const response = await this.api.get(`/agiles/${params.boardId}/sprints/${params.sprintId}`, { params: sprintParams });

      const sprint = response.data;
      
      // Process sprint data
      const processedSprint = {
        ...sprint,
        startDate: sprint.start ? new Date(sprint.start).toISOString().split('T')[0] : null,
        finishDate: sprint.finish ? new Date(sprint.finish).toISOString().split('T')[0] : null,
        duration: sprint.start && sprint.finish ? 
          Math.ceil((sprint.finish - sprint.start) / (1000 * 60 * 60 * 24)) : null,
        issueCount: sprint.issues?.length || 0
      };

      // Calculate sprint metrics if issues are included
      let metrics = null;
      if (params.includeIssues && sprint.issues) {
        const issues = sprint.issues;
        metrics = {
          totalIssues: issues.length,
          byState: this.groupBy(issues, (issue: any) => issue.state?.name || 'Unknown'),
          byPriority: this.groupBy(issues, (issue: any) => issue.priority?.name || 'Unknown'),
          byAssignee: this.groupBy(issues, (issue: any) => issue.assignee?.login || 'Unassigned'),
          totalEstimation: issues.reduce((sum: number, issue: any) => 
            sum + (issue.estimation || 0), 0)
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            sprint: processedSprint,
            metrics: metrics
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to get sprint details: ${(error as Error).message}`);
    }
  }

  /**
   * Assign issue to sprint
   */
  async assignIssueToSprint(params: {
    issueId: string;
    sprintId: string;
    boardId?: string;
  }): Promise<MCPResponse> {
    try {
      // If boardId is not provided, we need to find the board that contains the sprint
      let boardId = params.boardId;
      if (!boardId) {
        // Get all boards and find the one with this sprint
        const boardsResponse = await this.api.get('/agiles', { params: { fields: 'id,sprints(id)' } });
        const boards = boardsResponse.data || [];
        for (const board of boards) {
          if (board.sprints?.some((sprint: any) => sprint.id === params.sprintId)) {
            boardId = board.id;
            break;
          }
        }
        if (!boardId) {
          throw new Error(`Could not find board containing sprint ${params.sprintId}`);
        }
      }

      // Use the agile board assignment API
      const assignData = {
        commands: [`Sprint ${params.sprintId}`],
        issues: [{ id: params.issueId }]
      };

      logApiCall('POST', `/agiles/${boardId}`, assignData);
      await this.api.post(`/agiles/${boardId}`, assignData);

      // Verify the assignment by checking the sprint
      const verifyParams = { 
        fields: 'id,name,issues(id,summary)' 
      };
      const verifyResponse = await this.api.get(`/agiles/${boardId}/sprints/${params.sprintId}`, { params: verifyParams });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issueId: params.issueId,
            sprintId: params.sprintId,
            boardId: boardId,
            message: `Issue ${params.issueId} assigned to sprint ${params.sprintId}`,
            sprintIssues: verifyResponse.data.issues?.length || 0
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to assign issue to sprint: ${(error as Error).message}`);
    }
  }

  /**
   * Remove issue from sprint
   */
  async removeIssueFromSprint(params: {
    issueId: string;
    sprintId?: string;
  }): Promise<MCPResponse> {
    try {
      // To remove from sprint, we assign it to "Unscheduled" 
      // First find all boards to locate the correct one
      const boardsResponse = await this.api.get('/agiles', { params: { fields: 'id,sprints(id,name,isDefault)' } });
      const boards = boardsResponse.data || [];
      
      let boardId = null;
      let unscheduledSprintId = null;
      
      for (const board of boards) {
        // Look for unscheduled sprint
        const unscheduledSprint = board.sprints?.find((sprint: any) => sprint.isDefault || sprint.name?.toLowerCase().includes('unscheduled'));
        if (unscheduledSprint) {
          boardId = board.id;
          unscheduledSprintId = unscheduledSprint.id;
          break;
        }
      }

      if (!boardId || !unscheduledSprintId) {
        throw new Error('Could not find unscheduled sprint to move issue to');
      }

      // Move to unscheduled sprint
      const removeData = {
        commands: [`Sprint ${unscheduledSprintId}`],
        issues: [{ id: params.issueId }]
      };

      logApiCall('POST', `/agiles/${boardId}`, removeData);
      await this.api.post(`/agiles/${boardId}`, removeData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issueId: params.issueId,
            message: `Issue ${params.issueId} removed from sprint and moved to unscheduled`,
            movedToSprint: unscheduledSprintId,
            boardId: boardId
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to remove issue from sprint: ${(error as Error).message}`);
    }
  }

  /**
   * Get sprint progress and metrics
   */
  async getSprintProgress(params: {
    boardId: string;
    sprintId: string;
    includeBurndown?: boolean;
  }): Promise<MCPResponse> {
    try {
      // Get sprint with all issues
      const sprintParams = {
        fields: 'id,name,start,finish,goal,issues(id,summary,state(name),priority(name),estimation,resolved,created)'
      };
      
      logApiCall('GET', `/agiles/${params.boardId}/sprints/${params.sprintId}`, sprintParams);
      const sprintResponse = await this.api.get(`/agiles/${params.boardId}/sprints/${params.sprintId}`, { params: sprintParams });

      const sprint = sprintResponse.data;
      const issues = sprint.issues || [];

      // Calculate progress metrics
      const totalIssues = issues.length;
      const resolvedIssues = issues.filter((issue: any) => issue.resolved).length;
      const inProgressIssues = issues.filter((issue: any) => 
        issue.state?.name && !issue.resolved && issue.state.name.toLowerCase().includes('progress')).length;
      const openIssues = totalIssues - resolvedIssues - inProgressIssues;

      const completionPercentage = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

      // Calculate time metrics
      const now = Date.now();
      const sprintStart = sprint.start || now;
      const sprintEnd = sprint.finish || now;
      const sprintDuration = sprintEnd - sprintStart;
      const timeElapsed = now - sprintStart;
      const timeRemaining = sprintEnd - now;
      const progressPercentage = sprintDuration > 0 ? Math.round((timeElapsed / sprintDuration) * 100) : 0;

      let burndownData = null;
      if (params.includeBurndown) {
        // Generate simplified burndown chart data
        burndownData = this.generateBurndownData(issues, sprintStart, sprintEnd);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            sprintId: params.sprintId,
            sprintName: sprint.name,
            progress: {
              completion: {
                percentage: completionPercentage,
                resolved: resolvedIssues,
                inProgress: inProgressIssues,
                open: openIssues,
                total: totalIssues
              },
              timeline: {
                percentage: progressPercentage,
                daysElapsed: Math.ceil(timeElapsed / (1000 * 60 * 60 * 24)),
                daysRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)),
                startDate: new Date(sprintStart).toISOString().split('T')[0],
                endDate: new Date(sprintEnd).toISOString().split('T')[0]
              }
            },
            burndownData: burndownData,
            recommendation: this.getSprintRecommendation(completionPercentage, progressPercentage)
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to get sprint progress: ${(error as Error).message}`);
    }
  }

  /**
   * Helper method to generate burndown chart data
   */
  private generateBurndownData(issues: any[], sprintStart: number, sprintEnd: number): any {
    const totalIssues = issues.length;
    const sprintDays = Math.ceil((sprintEnd - sprintStart) / (1000 * 60 * 60 * 24));
    
    const burndownPoints = [];
    for (let day = 0; day <= sprintDays; day++) {
      const dayTimestamp = sprintStart + (day * 24 * 60 * 60 * 1000);
      const resolvedByDay = issues.filter(issue => 
        issue.resolved && new Date(issue.resolved).getTime() <= dayTimestamp).length;
      
      burndownPoints.push({
        day: day,
        date: new Date(dayTimestamp).toISOString().split('T')[0],
        remaining: totalIssues - resolvedByDay,
        ideal: Math.max(0, totalIssues - (totalIssues * day / sprintDays))
      });
    }
    
    return {
      totalIssues,
      sprintDays,
      points: burndownPoints
    };
  }

  /**
   * Helper method to get sprint recommendations
   */
  private getSprintRecommendation(completionPercentage: number, progressPercentage: number): string {
    if (completionPercentage >= progressPercentage) {
      return "Sprint is on track or ahead of schedule";
    } else if (progressPercentage - completionPercentage > 20) {
      return "Sprint is significantly behind schedule - consider scope adjustment";
    } else {
      return "Sprint is slightly behind schedule - monitor closely";
    }
  }

  /**
   * Helper method for grouping data
   */
  private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, number> {
    return array.reduce((groups: Record<string, number>, item) => {
      const key = keyFn(item);
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  // ===========================
  // PHASE 3: KNOWLEDGE BASE
  // ===========================

  /**
   * List all knowledge base articles
   */
  async listArticles(params: {
    projectId?: string;
    query?: string;
    includeContent?: boolean;
  }): Promise<MCPResponse> {
    try {
      let fieldsParam = 'id,title,summary,author(login,fullName),created,updated,project(name,shortName),tags(name),ordinal,parentArticle(id,idReadable,summary),childArticles(id,idReadable,summary),hasChildren';
      if (params.includeContent) {
        fieldsParam += ',content';
      }

      const queryParams: any = { fields: fieldsParam };
      
      // Build search query
      if (params.projectId || params.query) {
        let searchQuery = '';
        if (params.projectId) {
          searchQuery += `project: ${params.projectId}`;
        }
        if (params.query) {
          if (searchQuery) searchQuery += ' ';
          searchQuery += params.query;
        }
        queryParams.query = searchQuery;
      }

      logApiCall('GET', '/articles', queryParams);
      const response = await this.api.get('/articles', { params: queryParams });

      const articles = response.data || [];
      
      // Process articles for better presentation
      const processedArticles = articles.map((article: any) => ({
        ...article,
        createdDate: article.created ? new Date(article.created).toISOString().split('T')[0] : null,
        updatedDate: article.updated ? new Date(article.updated).toISOString().split('T')[0] : null,
        contentLength: article.content?.length || 0,
        tagNames: article.tags?.map((tag: any) => tag.name) || [],
        authorName: article.author?.fullName || article.author?.login || 'Unknown'
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            articles: processedArticles,
            count: processedArticles.length,
            filter: {
              projectId: params.projectId || null,
              query: params.query || null,
              includeContent: params.includeContent || false
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to list articles: ${(error as Error).message}`);
    }
  }

  /**
   * Get detailed information about a specific article
   */
  async getArticle(params: {
    articleId: string;
    includeComments?: boolean;
  }): Promise<MCPResponse> {
    try {
      let fieldsParam = 'id,title,summary,content,author(login,fullName),created,updated,project(name,shortName),visibility,attachments(name,url,size),tags(name),ordinal,parentArticle(id,idReadable,summary),childArticles(id,idReadable,summary),hasChildren';
      
      if (params.includeComments) {
        fieldsParam += ',comments(text,author(login,fullName),created,updated)';
      }

      const articleParams = { fields: fieldsParam };
      logApiCall('GET', `/articles/${params.articleId}`, articleParams);
      const response = await this.api.get(`/articles/${params.articleId}`, { params: articleParams });

      const article = response.data;
      
      // Process article for better presentation
      const processedArticle = {
        ...article,
        createdDate: article.created ? new Date(article.created).toISOString().split('T')[0] : null,
        updatedDate: article.updated ? new Date(article.updated).toISOString().split('T')[0] : null,
        contentLength: article.content?.length || 0,
        tagNames: article.tags?.map((tag: any) => tag.name) || [],
        authorName: article.author?.fullName || article.author?.login || 'Unknown',
        attachmentCount: article.attachments?.length || 0,
        commentCount: article.comments?.length || 0
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            article: processedArticle
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to get article: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new knowledge base article
   */
  async createArticle(params: {
    title: string;
    summary?: string;
    content: string;
    projectId?: string;
    tags?: string[];
  }): Promise<MCPResponse> {
    try {
      // Get project details to get the actual project ID
      let projectId = params.projectId;
      if (projectId) {
        try {
          const projectResponse = await this.api.get(`/admin/projects/${projectId}`);
          projectId = projectResponse.data.id;
        } catch (error) {
          // If getting project details fails, use the projectId as-is
          logError(error as Error, { message: 'Failed to get project details, using projectId as-is', projectId });
        }
      }

      const articleData: any = {
        summary: params.summary || params.title, // summary is required, use title as fallback
        content: params.content
      };

      // Project is required for article creation
      if (projectId) {
        articleData.project = { id: projectId };
      } else {
        throw new Error('Project ID is required for article creation');
      }

      // Note: Tags will be added separately after article creation
      // YouTrack API doesn't support adding tags during article creation

      logApiCall('POST', '/articles', articleData);
      const response = await this.api.post('/articles', articleData);

      const articleId = response.data.id;

      // Add tags separately if provided
      if (params.tags && params.tags.length > 0) {
        for (const tagName of params.tags) {
          try {
            // Create or get tag, then add it to the article
            await this.addTagToArticle(articleId, tagName);
          } catch (tagError) {
            // Log error but don't fail the whole operation
            logError(tagError as Error, { message: 'Failed to add tag', articleId, tagName });
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            articleId: articleId,
            message: `Article "${params.title}" created successfully`,
            article: response.data,
            tagsAdded: params.tags || []
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to create article: ${(error as Error).message}`);
    }
  }

  /**
   * Helper method to add a tag to an article
   */
  private async addTagToArticle(articleId: string, tagName: string): Promise<void> {
    try {
      // First, try to find if the tag already exists
      const existingTagsResponse = await this.api.get('/tags', {
        params: {
          query: tagName,
          fields: 'id,name'
        }
      });

      let tagId: string;
      
      if (existingTagsResponse.data && existingTagsResponse.data.length > 0) {
        // Tag exists, use it
        const existingTag = existingTagsResponse.data.find((tag: any) => tag.name === tagName);
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          // Create new tag
          const newTagResponse = await this.api.post('/tags', {
            name: tagName
          });
          tagId = newTagResponse.data.id;
        }
      } else {
        // Create new tag
        const newTagResponse = await this.api.post('/tags', {
          name: tagName
        });
        tagId = newTagResponse.data.id;
      }

      // Add the tag to the article
      await this.api.post(`/articles/${articleId}/tags`, {
        id: tagId,
        name: tagName
      });

    } catch (error) {
      throw new Error(`Failed to add tag "${tagName}" to article ${articleId}: ${(error as Error).message}`);
    }
  }

  /**
   * Helper method to add a tag to an issue
   */
  private async addTagToIssue(issueId: string, tagName: string): Promise<void> {
    try {
      // First, try to find if the tag already exists
      const existingTagsResponse = await this.api.get('/tags', {
        params: {
          query: tagName,
          fields: 'id,name'
        }
      });

      let tagId: string;
      
      if (existingTagsResponse.data && existingTagsResponse.data.length > 0) {
        // Tag exists, use it
        const existingTag = existingTagsResponse.data.find((tag: any) => tag.name === tagName);
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          // Create new tag
          const newTagResponse = await this.api.post('/tags', {
            name: tagName
          });
          tagId = newTagResponse.data.id;
        }
      } else {
        // Create new tag
        const newTagResponse = await this.api.post('/tags', {
          name: tagName
        });
        tagId = newTagResponse.data.id;
      }

      // Add the tag to the issue using the correct endpoint
      await this.api.post(`/issues/${issueId}/tags`, {
        id: tagId,
        name: tagName
      });

    } catch (error) {
      throw new Error(`Failed to add tag "${tagName}" to issue ${issueId}: ${(error as Error).message}`);
    }
  }

  /**
   * Update an existing knowledge base article
   */
  async updateArticle(params: {
    articleId: string;
    title?: string;
    summary?: string;
    content?: string;
    tags?: string[];
  }): Promise<MCPResponse> {
    try {
      const updateData: any = {};

      // In YouTrack Articles API, we update 'summary' not 'title'
      if (params.title) updateData.summary = params.title;
      if (params.summary) updateData.summary = params.summary;
      if (params.content) updateData.content = params.content;
      
      logApiCall('POST', `/articles/${params.articleId}`, updateData);
      await this.api.post(`/articles/${params.articleId}`, updateData);

      // Add tags separately if provided (YouTrack requires separate API calls for tags)
      if (params.tags && params.tags.length > 0) {
        for (const tag of params.tags) {
          await this.addTagToArticle(params.articleId, tag);
        }
      }

      // Get updated article to return
      const verifyResponse = await this.api.get(`/articles/${params.articleId}`, {
        params: { fields: 'id,summary,content,updated' }
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            articleId: params.articleId,
            message: `Article ${params.articleId} updated successfully`,
            updatedFields: Object.keys(updateData),
            article: verifyResponse.data
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to update article: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a knowledge base article
   */
  async deleteArticle(params: {
    articleId: string;
  }): Promise<MCPResponse> {
    try {
      // Get article info before deletion for confirmation
      const articleResponse = await this.api.get(`/articles/${params.articleId}`, {
        params: { fields: 'id,title' }
      });
      const articleTitle = articleResponse.data.title;

      logApiCall('DELETE', `/articles/${params.articleId}`, {});
      await this.api.delete(`/articles/${params.articleId}`);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            articleId: params.articleId,
            message: `Article "${articleTitle}" deleted successfully`
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to delete article: ${(error as Error).message}`);
    }
  }

  /**
   * Search knowledge base articles
   * Note: Articles API doesn't support query filtering, so we filter client-side
   */
  async searchArticles(params: {
    searchTerm: string;
    projectId?: string;
    tags?: string[];
    includeContent?: boolean;
  }): Promise<MCPResponse> {
    try {
      let fieldsParam = 'id,summary,author(login,fullName),created,updated,project(name,shortName),tags(name)';
      if (params.includeContent) {
        fieldsParam += ',content';
      }

      // Get all articles and filter client-side (Articles API doesn't support query filtering)
      const queryParams = { fields: fieldsParam };

      logApiCall('GET', '/articles', queryParams);
      const response = await this.api.get('/articles', { params: queryParams });

      const allArticles = response.data || [];
      
      // Client-side filtering
      let filteredArticles = allArticles;
      
      // Filter by project if specified
      if (params.projectId) {
        filteredArticles = filteredArticles.filter((article: any) => 
          article.project?.shortName === params.projectId
        );
      }
      
      // Filter by tags if specified
      if (params.tags && params.tags.length > 0) {
        filteredArticles = filteredArticles.filter((article: any) =>
          params.tags?.some(tag => 
            article.tags?.some((articleTag: any) => articleTag.name === tag)
          )
        );
      }
      
      // Filter by search term
      if (params.searchTerm) {
        const searchLower = params.searchTerm.toLowerCase();
        filteredArticles = filteredArticles.filter((article: any) => 
          article.summary?.toLowerCase().includes(searchLower) ||
          (params.includeContent && article.content?.toLowerCase().includes(searchLower))
        );
      }

      // Process articles for better presentation
      const processedArticles = filteredArticles.map((article: any) => ({
        ...article,
        createdDate: article.created ? new Date(article.created).toISOString().split('T')[0] : null,
        updatedDate: article.updated ? new Date(article.updated).toISOString().split('T')[0] : null,
        contentLength: article.content?.length || 0,
        tagNames: article.tags?.map((tag: any) => tag.name) || [],
        authorName: article.author?.fullName || article.author?.login || 'Unknown',
        relevanceScore: this.calculateRelevanceScore(article, params.searchTerm)
      }));

      // Sort by relevance
      processedArticles.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            searchTerm: params.searchTerm,
            results: processedArticles,
            count: processedArticles.length,
            totalArticlesChecked: allArticles.length,
            filters: {
              projectId: params.projectId || null,
              tags: params.tags || [],
              includeContent: params.includeContent || false
            },
            note: 'Articles API does not support query filtering - results filtered client-side'
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to search articles: ${(error as Error).message}`);
    }
  }

  /**
   * Get articles by tags (category-like functionality)
   * Note: Articles API doesn't support query filtering, so we filter client-side
   */
  async getArticlesByTag(params: {
    tag: string;
    projectId?: string;
    includeContent?: boolean;
  }): Promise<MCPResponse> {
    try {
      let fieldsParam = 'id,summary,author(login,fullName),created,updated,project(name,shortName),tags(name)';
      if (params.includeContent) {
        fieldsParam += ',content';
      }

      // Get all articles and filter client-side (Articles API doesn't support query filtering)
      const queryParams = {
        fields: fieldsParam
      };

      logApiCall('GET', '/articles', queryParams);
      const response = await this.api.get('/articles', { params: queryParams });

      const allArticles = response.data || [];
      
      // Filter articles by tag and optionally by project
      const filteredArticles = allArticles.filter((article: any) => {
        const hasTag = article.tags?.some((tag: any) => tag.name === params.tag);
        const matchesProject = !params.projectId || article.project?.shortName === params.projectId;
        return hasTag && matchesProject;
      });
      
      // Process articles for better presentation
      const processedArticles = filteredArticles.map((article: any) => ({
        ...article,
        createdDate: article.created ? new Date(article.created).toISOString().split('T')[0] : null,
        updatedDate: article.updated ? new Date(article.updated).toISOString().split('T')[0] : null,
        contentLength: article.content?.length || 0,
        tagNames: article.tags?.map((tag: any) => tag.name) || [],
        authorName: article.author?.fullName || article.author?.login || 'Unknown'
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            tag: params.tag,
            articles: processedArticles,
            count: processedArticles.length,
            totalArticlesChecked: allArticles.length,
            projectId: params.projectId || null,
            note: 'Articles API does not support query filtering - results filtered client-side'
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to get articles by tag: ${(error as Error).message}`);
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getKnowledgeBaseStats(params: {
    projectId?: string;
  }): Promise<MCPResponse> {
    try {
      // Get all articles for the project
      const queryParams: any = {
        fields: 'id,title,created,updated,author(login),project(shortName),tags(name),content'
      };

      if (params.projectId) {
        queryParams.query = `project: ${params.projectId}`;
      }

      logApiCall('GET', '/articles', queryParams);
      const response = await this.api.get('/articles', { params: queryParams });

      const articles = response.data || [];

      // Calculate statistics
      const totalArticles = articles.length;
      const authorsSet = new Set(articles.map((a: any) => a.author?.login).filter(Boolean));
      const totalAuthors = authorsSet.size;
      
      // Get all unique tags
      const allTags = articles.flatMap((a: any) => a.tags?.map((t: any) => t.name) || []);
      const uniqueTags = [...new Set(allTags)];
      
      // Calculate content statistics
      const totalContentLength = articles.reduce((sum: number, a: any) => sum + (a.content?.length || 0), 0);
      const avgContentLength = totalArticles > 0 ? Math.round(totalContentLength / totalArticles) : 0;
      
      // Get recent articles (last 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recentArticles = articles.filter((a: any) => 
        a.created && new Date(a.created).getTime() > thirtyDaysAgo
      ).length;

      // Group by project
      const projectStats = this.groupBy(articles, (a: any) => a.project?.shortName || 'Unknown');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            statistics: {
              totalArticles,
              totalAuthors,
              totalTags: uniqueTags.length,
              recentArticles,
              avgContentLength,
              totalContentLength
            },
            breakdown: {
              byProject: projectStats,
              topTags: this.getTopTags(allTags, 10),
              topAuthors: this.getTopAuthors(articles, 5)
            },
            filter: {
              projectId: params.projectId || null
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to get knowledge base statistics: ${(error as Error).message}`);
    }
  }

  /**
   * Link an article as a sub-article to a parent article
   */
  async linkSubArticle(params: {
    parentArticleId: string;
    childArticleId: string;
  }): Promise<MCPResponse> {
    try {
      const linkData = {
        id: params.childArticleId,
        $type: 'Article'
      };

      logApiCall('POST', `/articles/${params.parentArticleId}/childArticles`, linkData);
      const response = await this.api.post(`/articles/${params.parentArticleId}/childArticles`, linkData, {
        params: { fields: 'id,idReadable,summary' }
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            parentArticleId: params.parentArticleId,
            childArticleId: params.childArticleId,
            linkedArticle: response.data,
            message: `Article ${params.childArticleId} linked as sub-article of ${params.parentArticleId}`
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to link sub-article: ${(error as Error).message}`);
    }
  }

  /**
   * Get sub-articles of a parent article
   */
  async getSubArticles(params: {
    parentArticleId: string;
    includeContent?: boolean;
  }): Promise<MCPResponse> {
    try {
      let fieldsParam = 'id,idReadable,summary,author(login,fullName),created,updated,tags(name),ordinal';
      if (params.includeContent) {
        fieldsParam += ',content';
      }

      logApiCall('GET', `/articles/${params.parentArticleId}/childArticles`, { fields: fieldsParam });
      const response = await this.api.get(`/articles/${params.parentArticleId}/childArticles`, {
        params: { fields: fieldsParam }
      });

      const subArticles = response.data || [];
      
      // Process sub-articles for better presentation
      const processedSubArticles = subArticles.map((article: any) => ({
        ...article,
        createdDate: article.created ? new Date(article.created).toISOString().split('T')[0] : null,
        updatedDate: article.updated ? new Date(article.updated).toISOString().split('T')[0] : null,
        contentLength: article.content?.length || 0,
        tagNames: article.tags?.map((tag: any) => tag.name) || [],
        authorName: article.author?.fullName || article.author?.login || 'Unknown'
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            parentArticleId: params.parentArticleId,
            subArticles: processedSubArticles,
            count: processedSubArticles.length
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to get sub-articles: ${(error as Error).message}`);
    }
  }

  /**
   * Helper method to calculate relevance score for search results
   */
  private calculateRelevanceScore(article: any, searchTerm: string): number {
    if (!searchTerm) return 0;
    
    const searchLower = searchTerm.toLowerCase();
    let score = 0;
    
    // Title match (highest weight)
    if (article.title?.toLowerCase().includes(searchLower)) {
      score += 10;
    }
    
    // Summary match (medium weight)
    if (article.summary?.toLowerCase().includes(searchLower)) {
      score += 5;
    }
    
    // Content match (lower weight)
    if (article.content?.toLowerCase().includes(searchLower)) {
      score += 2;
    }
    
    // Tag match (medium weight)
    if (article.tags?.some((tag: any) => tag.name?.toLowerCase().includes(searchLower))) {
      score += 3;
    }
    
    return score;
  }

  /**
   * Helper method to get top tags
   */
  private getTopTags(allTags: string[], limit: number): Array<{tag: string, count: number}> {
    const tagCounts = allTags.reduce((counts: Record<string, number>, tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
      return counts;
    }, {});
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Helper method to get top authors
   */
  private getTopAuthors(articles: any[], limit: number): Array<{author: string, count: number}> {
    const authorCounts = articles.reduce((counts: Record<string, number>, article) => {
      const author = article.author?.login || 'Unknown';
      counts[author] = (counts[author] || 0) + 1;
      return counts;
    }, {});
    
    return Object.entries(authorCounts)
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  get apiInstance(): AxiosInstance {
    return this.api;
  }

  // =====================================================
  // PHASE 4: GANTT CHARTS & DEPENDENCIES
  // =====================================================
  // GANTT CHARTS & ADVANCED PROJECT MANAGEMENT
  // =====================================================

  /**
   * Generate comprehensive Gantt chart with dependencies, critical path, and resource analysis
   */
  async generateGanttChart(params: {
    projectId: string;
    startDate?: string;
    endDate?: string;
    includeCompleted?: boolean;
    includeCriticalPath?: boolean;
    includeResources?: boolean;
    hierarchicalView?: boolean;
  }): Promise<MCPResponse> {
    return this.ganttChartManager.generateGanttChart(params);
  }

  /**
   * Create issue dependency with Gantt-specific relationship types
   */
  async createGanttDependency(params: {
    sourceIssueId: string;
    targetIssueId: string;
    dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
    lag?: number;
    constraint?: 'hard' | 'soft';
  }): Promise<MCPResponse> {
    return this.ganttChartManager.createIssueDependency(params);
  }

  /**
   * Analyze resource conflicts and overallocations across project timeline
   */
  async analyzeResourceConflicts(projectId: string): Promise<MCPResponse> {
    return this.ganttChartManager.analyzeResourceConflicts(projectId);
  }

  /**
   * Get enhanced critical path analysis with bottlenecks and optimization suggestions
   */
  async getEnhancedCriticalPath(params: {
    projectId: string;
    targetMilestone?: string;
    includeSlack?: boolean;
  }): Promise<MCPResponse> {
    return this.ganttChartManager.getCriticalPathAnalysis(params);
  }

  /**
   * Get project timeline/Gantt data (legacy method - redirects to enhanced Gantt chart)
   */
  async getProjectTimeline(params: {
    projectId: string;
    startDate?: string;
    endDate?: string;
    includeCompleted?: boolean;
  }): Promise<MCPResponse> {
    // Redirect to enhanced Gantt chart functionality
    return this.generateGanttChart({
      ...params,
      includeCriticalPath: true,
      includeResources: false,
      hierarchicalView: false
    });
  }

  /**
   * Create issue dependency
   * Note: YouTrack API has limited support for programmatic link creation
   */
  async createIssueDependency(params: {
    sourceIssueId: string;
    targetIssueId: string;
    linkType?: string;
  }): Promise<MCPResponse> {
    try {
      // YouTrack uses PUT method for issue links
      const linkData = {
        linkType: { name: params.linkType || 'Depends' },
        issues: [{ id: params.targetIssueId }]
      };

      logApiCall('PUT', `/issues/${params.sourceIssueId}/links`, linkData);
      
      // Try different approaches for creating links
      let response;
      try {
        response = await this.api.put(`/issues/${params.sourceIssueId}/links`, linkData);
      } catch (putError) {
        // Try POST method as fallback
        try {
          response = await this.api.post(`/issues/${params.sourceIssueId}/links`, linkData);
        } catch (postError) {
          // Return informative message about API limitation
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                limitation: true,
                message: 'YouTrack API does not support programmatic link creation via REST API',
                recommendation: 'Use YouTrack web interface to create issue dependencies manually',
                dependency: {
                  sourceIssue: params.sourceIssueId,
                  targetIssue: params.targetIssueId,
                  linkType: params.linkType || 'Depends'
                },
                alternatives: [
                  'Use YouTrack web interface',
                  'Use YouTrack command line tool',
                  'Set up dependencies during issue creation'
                ]
              }, null, 2)
            }]
          };
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            dependency: {
              sourceIssue: params.sourceIssueId,
              targetIssue: params.targetIssueId,
              linkType: params.linkType || 'Depends',
              message: `Created dependency: ${params.sourceIssueId} depends on ${params.targetIssueId}`
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      
      // Return informative error for API limitations
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            limitation: true,
            message: 'YouTrack API limitation: Cannot create issue dependencies programmatically',
            error: (error as Error).message,
            recommendation: 'Use YouTrack web interface to create dependencies manually',
            dependency: {
              sourceIssue: params.sourceIssueId,
              targetIssue: params.targetIssueId,
              linkType: params.linkType || 'Depends'
            }
          }, null, 2)
        }]
      };
    }
  }

  /**
   * Get issue dependencies
   */
  async getIssueDependencies(params: {
    issueId: string;
    includeTransitive?: boolean;
  }): Promise<MCPResponse> {
    try {
      logApiCall('GET', `/issues/${params.issueId}`, {});
      const response = await this.api.get(`/issues/${params.issueId}`, {
        params: {
          fields: 'id,summary,state(name),links(linkType(name,sourceToTarget,targetToSource),direction,issues(id,summary,state(name),priority(name)))'
        }
      });

      const issue = response.data;
      const links = issue.links || [];

      // Categorize dependencies
      const dependencies: {
        dependsOn: Array<{id: string, summary: string, status: string, priority: string, linkType: string}>,
        blocks: Array<{id: string, summary: string, status: string, priority: string, linkType: string}>,
        related: Array<{id: string, summary: string, status: string, priority: string, linkType: string}>
      } = {
        dependsOn: [], // Issues this issue depends on
        blocks: [], // Issues this issue blocks
        related: [] // Other relationships
      };

      links.forEach((link: any) => {
        const linkTypeName = link.linkType?.name?.toLowerCase() || '';
        const sourceToTarget = link.linkType?.sourceToTarget?.toLowerCase() || '';
        const targetToSource = link.linkType?.targetToSource?.toLowerCase() || '';

        link.issues?.forEach((linkedIssue: any) => {
          const depInfo = {
            id: linkedIssue.id,
            summary: linkedIssue.summary,
            status: linkedIssue.state?.name || 'Unknown',
            priority: linkedIssue.priority?.name || 'Normal',
            linkType: link.linkType?.name || 'Unknown'
          };

          if (link.direction === 'OUTWARD') {
            if (linkTypeName.includes('depend') || sourceToTarget.includes('depend')) {
              dependencies.dependsOn.push(depInfo);
            } else if (linkTypeName.includes('block') || sourceToTarget.includes('block')) {
              dependencies.blocks.push(depInfo);
            } else {
              dependencies.related.push(depInfo);
            }
          } else if (link.direction === 'INWARD') {
            if (linkTypeName.includes('depend') || targetToSource.includes('depend')) {
              dependencies.blocks.push(depInfo);
            } else if (linkTypeName.includes('block') || targetToSource.includes('block')) {
              dependencies.dependsOn.push(depInfo);
            } else {
              dependencies.related.push(depInfo);
            }
          } else {
            dependencies.related.push(depInfo);
          }
        });
      });

      // Calculate dependency metrics
      const metrics = {
        totalDependencies: dependencies.dependsOn.length + dependencies.blocks.length + dependencies.related.length,
        blockedByCount: dependencies.dependsOn.length,
        blockingCount: dependencies.blocks.length,
        relatedCount: dependencies.related.length,
        criticalPath: dependencies.dependsOn.filter((dep: any) => 
          dep.status !== 'Done' && dep.status !== 'Resolved'
        ).length > 0
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issue: {
              id: issue.id,
              summary: issue.summary,
              status: issue.state?.name
            },
            dependencies,
            metrics
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to get issue dependencies: ${(error as Error).message}`);
    }
  }

  /**
   * Generate critical path analysis
   */
  async getCriticalPath(params: {
    projectId: string;
    targetIssueId?: string;
  }): Promise<MCPResponse> {
    try {
      // Get all issues with dependencies
      const query = `project: ${params.projectId}`;
      const fieldsParam = 'id,summary,state(name),priority(name),created,resolved,customFields(name,value),links(linkType(name),direction,issues(id,summary,state(name)))';

      logApiCall('GET', '/issues', { query, fields: fieldsParam });
      const response = await this.api.get('/issues', {
        params: {
          query,
          fields: fieldsParam,
          '$top': 100
        }
      });

      const issues = response.data || [];

      // Build dependency graph
      const dependencyGraph: Record<string, string[]> = {};
      const issueDetails: Record<string, any> = {};

      issues.forEach((issue: any) => {
        issueDetails[issue.id] = {
          id: issue.id,
          summary: issue.summary,
          status: issue.state?.name,
          priority: issue.priority?.name,
          created: issue.created,
          resolved: issue.resolved
        };

        const dependencies: string[] = [];
        (issue.links || []).forEach((link: any) => {
          if (link.direction === 'OUTWARD' && 
              (link.linkType?.name?.toLowerCase().includes('depend') ||
               link.linkType?.name?.toLowerCase().includes('block'))) {
            link.issues?.forEach((linkedIssue: any) => {
              dependencies.push(linkedIssue.id);
            });
          }
        });
        dependencyGraph[issue.id] = dependencies;
      });

      // Find critical paths using topological sort with longest path
      const criticalPaths = this.findCriticalPaths(dependencyGraph, issueDetails, params.targetIssueId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            analysis: {
              projectId: params.projectId,
              totalIssues: issues.length,
              issuesWithDependencies: Object.values(dependencyGraph).filter(deps => deps.length > 0).length,
              criticalPaths,
              recommendations: this.generatePathRecommendations(criticalPaths)
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to analyze critical path: ${(error as Error).message}`);
    }
  }

  /**
   * Get resource allocation across timeline
   */
  async getResourceAllocation(params: {
    projectId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<MCPResponse> {
    try {
      const query = `project: ${params.projectId}`;
      const fieldsParam = 'id,summary,assignee(login,fullName),state(name),priority(name),created,resolved,customFields(name,value)';

      logApiCall('GET', '/issues', { query, fields: fieldsParam });
      const response = await this.api.get('/issues', {
        params: {
          query,
          fields: fieldsParam,
          '$top': 200
        }
      });

      const issues = response.data || [];

      // Group by assignee
      const resourceData: Record<string, any> = {};

      issues.forEach((issue: any) => {
        const assigneeKey = issue.assignee?.login || 'Unassigned';
        const assigneeName = issue.assignee?.fullName || issue.assignee?.login || 'Unassigned';

        if (!resourceData[assigneeKey]) {
          resourceData[assigneeKey] = {
            name: assigneeName,
            login: assigneeKey,
            totalIssues: 0,
            inProgress: 0,
            todo: 0,
            highPriority: 0,
            workload: 'Normal'
          };
        }

        const resource = resourceData[assigneeKey];
        resource.totalIssues++;

        const status = issue.state?.name?.toLowerCase() || '';
        if (status.includes('progress') || status.includes('active')) {
          resource.inProgress++;
        } else {
          resource.todo++;
        }

        if (issue.priority?.name === 'Critical' || issue.priority?.name === 'High') {
          resource.highPriority++;
        }
      });

      // Calculate workload levels
      Object.values(resourceData).forEach((resource: any) => {
        if (resource.totalIssues > 10) {
          resource.workload = 'Overloaded';
        } else if (resource.totalIssues > 6) {
          resource.workload = 'Heavy';
        } else if (resource.totalIssues > 3) {
          resource.workload = 'Normal';
        } else {
          resource.workload = 'Light';
        }
      });

      const resources = Object.values(resourceData);
      const summary = {
        totalResources: resources.length,
        overloadedResources: resources.filter((r: any) => r.workload === 'Overloaded').length,
        unassignedIssues: resourceData['Unassigned']?.totalIssues || 0,
        averageWorkload: Math.round(resources.reduce((sum: number, r: any) => sum + r.totalIssues, 0) / resources.length)
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            allocation: {
              projectId: params.projectId,
              resources,
              summary,
              recommendations: this.generateResourceRecommendations(resources, summary)
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to get resource allocation: ${(error as Error).message}`);
    }
  }

  /**
   * Helper method to find critical paths
   */
  private findCriticalPaths(graph: Record<string, string[]>, issueDetails: Record<string, any>, targetId?: string): any[] {
    // Simple critical path implementation
    const paths: any[] = [];
    const visited = new Set<string>();

    const dfs = (issueId: string, currentPath: string[], depth: number) => {
      if (visited.has(issueId) || depth > 10) return; // Prevent cycles and limit depth
      
      visited.add(issueId);
      currentPath.push(issueId);

      const dependencies = graph[issueId] || [];
      
      if (dependencies.length === 0 || (targetId && issueId === targetId)) {
        // End of path
        if (currentPath.length > 1) {
          paths.push({
            path: currentPath.map(id => ({
              id,
              summary: issueDetails[id]?.summary,
              status: issueDetails[id]?.status,
              priority: issueDetails[id]?.priority
            })),
            length: currentPath.length,
            isCritical: currentPath.some(id => 
              issueDetails[id]?.priority === 'Critical' || 
              issueDetails[id]?.status === 'In Progress'
            )
          });
        }
      } else {
        dependencies.forEach(depId => {
          if (issueDetails[depId]) {
            dfs(depId, [...currentPath], depth + 1);
          }
        });
      }

      visited.delete(issueId);
    };

    // Start DFS from each issue
    Object.keys(graph).forEach(issueId => {
      if (issueDetails[issueId]) {
        dfs(issueId, [], 0);
      }
    });

    // Return top critical paths
    return paths
      .sort((a, b) => b.length - a.length || (b.isCritical ? 1 : 0) - (a.isCritical ? 1 : 0))
      .slice(0, 5);
  }

  /**
   * Helper method to generate path recommendations
   */
  private generatePathRecommendations(paths: any[]): string[] {
    const recommendations: string[] = [];
    
    if (paths.length === 0) {
      recommendations.push('No critical dependencies found. Project has good parallel execution potential.');
    } else {
      const longestPath = paths[0];
      if (longestPath.length > 5) {
        recommendations.push(`Long dependency chain detected (${longestPath.length} issues). Consider breaking down complex dependencies.`);
      }
      
      const criticalPaths = paths.filter(p => p.isCritical);
      if (criticalPaths.length > 0) {
        recommendations.push(`${criticalPaths.length} critical paths found. Focus on resolving high-priority blockers first.`);
      }
      
      recommendations.push('Monitor dependency completion to prevent project delays.');
    }
    
    return recommendations;
  }

  /**
   * Helper method to generate resource recommendations
   */
  private generateResourceRecommendations(resources: any[], summary: any): string[] {
    const recommendations: string[] = [];
    
    if (summary.overloadedResources > 0) {
      recommendations.push(`${summary.overloadedResources} team members are overloaded. Consider redistributing work.`);
    }
    
    if (summary.unassignedIssues > 0) {
      recommendations.push(`${summary.unassignedIssues} issues are unassigned. Assign them to team members.`);
    }
    
    const lightWorkload = resources.filter((r: any) => r.workload === 'Light');
    if (lightWorkload.length > 0 && summary.overloadedResources > 0) {
      recommendations.push(`${lightWorkload.length} team members have light workload. Consider task rebalancing.`);
    }
    
    return recommendations;
  }

  /**
   * Dynamically discover all custom fields for a project
   */
  async discoverProjectFields(projectId: string): Promise<MCPResponse> {
    try {
      logApiCall('GET', `/admin/projects/${projectId}/customFields`, { projectId });
      
      const projectFields = await this.dynamicFieldManager.discoverProjectFields(projectId);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            projectInfo: {
              id: projectFields.projectId,
              name: projectFields.projectName,
              shortName: projectFields.projectShortName
            },
            fields: projectFields.fields,
            summary: {
              totalFields: projectFields.fields.length,
              fieldTypes: Array.from(projectFields.fieldsByType.keys()),
              requiredFields: projectFields.fields.filter(f => !f.canBeEmpty).length,
              optionalFields: projectFields.fields.filter(f => f.canBeEmpty).length
            },
            fieldsByCategory: await this.dynamicFieldManager.getProjectFieldSchema(projectId)
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, { method: 'discoverProjectFields', projectId });
      throw new Error(`Failed to discover project fields: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get available values for a specific field in a project
   */
  async getProjectFieldValues(projectId: string, fieldName: string): Promise<MCPResponse> {
    try {
      logApiCall('GET', `/admin/projects/${projectId}/customFields`, { projectId, fieldName });
      
      const field = await this.dynamicFieldManager.getFieldByName(projectId, fieldName);
      if (!field) {
        throw new Error(`Field '${fieldName}' not found in project ${projectId}`);
      }

      const values = await this.dynamicFieldManager.getFieldValues(projectId, fieldName);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            field: {
              name: field.field.name,
              type: field.field.fieldType.valueType,
              canBeEmpty: field.canBeEmpty,
              isPublic: field.isPublic
            },
            values: values,
            valuesCount: values.length
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, { method: 'getProjectFieldValues', projectId, fieldName });
      throw new Error(`Failed to get field values: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Compare field configurations between two projects
   */
  async compareProjectFields(projectId1: string, projectId2: string): Promise<MCPResponse> {
    try {
      logApiCall('GET', '/admin/projects/compare', { projectId1, projectId2 });
      
      const comparison = await this.dynamicFieldManager.compareProjectFields(projectId1, projectId2);
      const [fields1, fields2] = await Promise.all([
        this.dynamicFieldManager.discoverProjectFields(projectId1),
        this.dynamicFieldManager.discoverProjectFields(projectId2)
      ]);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            project1: {
              id: fields1.projectId,
              name: fields1.projectName,
              shortName: fields1.projectShortName,
              fieldCount: fields1.fields.length
            },
            project2: {
              id: fields2.projectId,
              name: fields2.projectName,
              shortName: fields2.projectShortName,
              fieldCount: fields2.fields.length
            },
            comparison: {
              commonFields: comparison.common,
              uniqueToProject1: comparison.onlyInProject1,
              uniqueToProject2: comparison.onlyInProject2,
              differentTypes: comparison.different,
              similarity: Math.round((comparison.common.length / Math.max(fields1.fields.length, fields2.fields.length)) * 100)
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, { method: 'compareProjectFields', projectId1, projectId2 });
      throw new Error(`Failed to compare project fields: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get dynamic field schema for a project (useful for form generation)
   */
  async getProjectFieldSchema(projectId: string): Promise<MCPResponse> {
    try {
      logApiCall('GET', `/admin/projects/${projectId}/schema`, { projectId });
      
      const schema = await this.dynamicFieldManager.getProjectFieldSchema(projectId);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            projectId,
            schema: {
              required: schema.required.map(f => ({
                name: f.field.name,
                type: f.field.fieldType.valueType,
                values: f.bundle?.values?.map(v => ({ id: v.id, name: v.name })) || []
              })),
              optional: schema.optional.map(f => ({
                name: f.field.name,
                type: f.field.fieldType.valueType,
                values: f.bundle?.values?.map(v => ({ id: v.id, name: v.name })) || []
              })),
              byCategory: Object.entries(schema.byCategory).reduce((acc, [category, fields]) => {
                acc[category] = fields.map(f => ({
                  name: f.field.name,
                  type: f.field.fieldType.valueType,
                  required: !f.canBeEmpty
                }));
                return acc;
              }, {} as Record<string, any[]>)
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, { method: 'getProjectFieldSchema', projectId });
      throw new Error(`Failed to get project field schema: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get summary of all discovered project fields
   */
  async getAllProjectFieldsSummary(): Promise<MCPResponse> {
    try {
      const summary = this.dynamicFieldManager.getProjectFieldsSummary();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            discoveredProjects: summary,
            totalProjects: summary.length,
            totalUniqueFields: [...new Set(summary.flatMap(p => p.fieldCount))].length
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, { method: 'getAllProjectFieldsSummary' });
      throw new Error(`Failed to get project fields summary: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Route issue dependencies with dependency analysis
   */
  async routeIssueDependencies(params: {
    projectId: string;
    sourceIssueId: string;
    targetIssueId: string;
    dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
    lag?: number;
    constraint?: 'hard' | 'soft';
  }): Promise<MCPResponse> {
    try {
      const result = await this.ganttChartManager.routeIssueDependencies(params);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, { method: 'routeIssueDependencies', params });
      throw new Error(`Failed to route issue dependencies: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Analyze dependency network for a project
   */
  async analyzeDependencyNetwork(projectId: string): Promise<MCPResponse> {
    try {
      const result = await this.ganttChartManager.analyzeDependencyNetwork(projectId);

      return result;
    } catch (error) {
      logError(error as Error, { method: 'analyzeDependencyNetwork', projectId });
      throw new Error(`Failed to analyze dependency network: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Calculate critical path for project completion
   */
  async calculateCriticalPath(params: {
    projectId: string;
    targetIssueId?: string;
  }): Promise<MCPResponse> {
    try {
      const result = await this.ganttChartManager.getCriticalPathAnalysis({
        projectId: params.projectId,
        targetMilestone: params.targetIssueId,
        includeSlack: true
      });

      return result;
    } catch (error) {
      logError(error as Error, { method: 'calculateCriticalPath', params });
      throw new Error(`Failed to calculate critical path: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Route multiple dependencies in batch
   */
  async routeMultipleDependencies(params: {
    projectId: string;
    dependencies: Array<{
      sourceIssueId: string;
      targetIssueId: string;
      dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
      lag?: number;
      constraint?: 'hard' | 'soft';
    }>;
    validateCircular?: boolean;
  }): Promise<MCPResponse> {
    try {
      const result = await this.ganttChartManager.routeMultipleDependencies(params);
      return result;
    } catch (error) {
      logError(error as Error, { method: 'routeMultipleDependencies', params });
      throw new Error(`Failed to route multiple dependencies: ${getErrorMessage(error)}`);
    }
  }
}
