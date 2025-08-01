#!/usr/bin/env node

// Set MCP server mode FIRST, before any imports that use logger
process.env.MCP_SERVER = 'true';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { EnhancedClientFactory } from './api/enhanced-client.js';
import { ConfigManager } from './config.js';
import { logger } from './logger.js';

// Load environment variables
dotenv.config();

// Streamlined tool definitions using our enhanced architecture
const streamlinedToolDefinitions = [
  // PROJECT MANAGEMENT TOOLS
  {
    name: 'projects_manage',
    description: '🏗️  Comprehensive project management: list, get details, validate, get custom fields, and manage project configurations',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'validate', 'fields', 'status'],
          description: 'Action to perform: list (all projects), get (project details), validate (check access), fields (custom fields), status (project statistics)'
        },
        projectId: {
          type: 'string',
          description: 'Project ID or shortName (required for get, validate, fields, status actions)'
        },
        fields: {
          type: 'string',
          description: 'Comma-separated fields to return (for list action)',
          default: 'id,name,shortName,description'
        }
      },
      required: ['action']
    }
  },

  // ISSUE MANAGEMENT TOOLS  
  {
    name: 'issues_manage',
    description: '🎯 Complete issue lifecycle management: create, update, query, state changes, comments, and advanced operations',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'update', 'get', 'query', 'search', 'state', 'complete', 'start'],
          description: 'Action: create (new issue), update (modify), get (single issue), query (advanced search), search (smart search), state (change state), complete (mark done), start (begin work)'
        },
        projectId: {
          type: 'string',
          description: 'Project ID (required for create action)'
        },
        issueId: {
          type: 'string',
          description: 'Issue ID (required for update, get, state, complete, start actions)'
        },
        summary: {
          type: 'string',
          description: 'Issue title/summary (for create/update)'
        },
        description: {
          type: 'string',
          description: 'Issue description (for create/update)'
        },
        query: {
          type: 'string',
          description: 'Search query (for query/search actions)'
        },
        state: {
          type: 'string',
          description: 'New state (for state action)'
        },
        priority: {
          type: 'string',
          description: 'Issue priority'
        },
        assignee: {
          type: 'string',
          description: 'Assignee username'
        },
        type: {
          type: 'string',
          description: 'Issue type (Bug, Feature, Task, etc.)'
        },
        comment: {
          type: 'string',
          description: 'Comment for state changes or completion'
        }
      },
      required: ['action']
    }
  },

  // COMMENTS MANAGEMENT
  {
    name: 'comments_manage',
    description: '💬 Issue comments management: get, add, update, delete comments',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get', 'add', 'update', 'delete'],
          description: 'Action: get (list comments), add (new comment), update (edit), delete (remove)'
        },
        issueId: {
          type: 'string',
          description: 'Issue ID'
        },
        commentId: {
          type: 'string',
          description: 'Comment ID (required for update/delete)'
        },
        text: {
          type: 'string',
          description: 'Comment text (required for add/update)'
        }
      },
      required: ['action', 'issueId']
    }
  },

  // AGILE MANAGEMENT
  {
    name: 'agile_manage',
    description: '🏃‍♂️ Agile board and sprint management: boards, sprints, assignments, and progress tracking',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['boards', 'board_details', 'sprints', 'sprint_details', 'create_sprint', 'assign_issue'],
          description: 'Action: boards (list), board_details (get board), sprints (list), sprint_details (get sprint), create_sprint (new), assign_issue (to sprint)'
        },
        boardId: {
          type: 'string',
          description: 'Board ID (required for board_details, sprints, sprint_details, create_sprint)'
        },
        sprintId: {
          type: 'string',
          description: 'Sprint ID (required for sprint_details, assign_issue)'
        },
        issueId: {
          type: 'string',
          description: 'Issue ID (required for assign_issue)'
        },
        projectId: {
          type: 'string',
          description: 'Project ID for filtering'
        },
        name: {
          type: 'string',
          description: 'Sprint name (for create_sprint)'
        },
        start: {
          type: 'string',
          description: 'Sprint start date YYYY-MM-DD (for create_sprint)'
        },
        finish: {
          type: 'string',
          description: 'Sprint end date YYYY-MM-DD (for create_sprint)'
        }
      },
      required: ['action']
    }
  },

  // KNOWLEDGE BASE
  {
    name: 'knowledge_manage',
    description: '📚 Knowledge base management: articles, search, create, update, organize',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'create', 'update', 'delete', 'search'],
          description: 'Action: list (all articles), get (single), create (new), update (edit), delete (remove), search (find)'
        },
        articleId: {
          type: 'string',
          description: 'Article ID (required for get, update, delete)'
        },
        title: {
          type: 'string',
          description: 'Article title (required for create, optional for update)'
        },
        content: {
          type: 'string',
          description: 'Article content (required for create, optional for update)'
        },
        summary: {
          type: 'string',
          description: 'Article summary (optional)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Article tags (optional)'
        },
        searchTerm: {
          type: 'string',
          description: 'Search term (required for search action)'
        },
        projectId: {
          type: 'string',
          description: 'Project ID for filtering'
        }
      },
      required: ['action']
    }
  },

  // ANALYTICS & REPORTING
  {
    name: 'analytics_report',
    description: '📊 Advanced analytics and reporting: project statistics, time tracking, progress reports, Gantt charts',
    inputSchema: {
      type: 'object',
      properties: {
        reportType: {
          type: 'string',
          enum: ['project_stats', 'time_tracking', 'gantt', 'critical_path', 'resource_allocation', 'milestone_progress'],
          description: 'Report type to generate'
        },
        projectId: {
          type: 'string',
          description: 'Project ID (required for most reports)'
        },
        startDate: {
          type: 'string',
          description: 'Start date YYYY-MM-DD (for time-based reports)'
        },
        endDate: {
          type: 'string',
          description: 'End date YYYY-MM-DD (for time-based reports)'
        },
        userId: {
          type: 'string',
          description: 'User ID (for user-specific reports)'
        },
        milestoneId: {
          type: 'string',
          description: 'Milestone ID (for milestone reports)'
        }
      },
      required: ['reportType']
    }
  },

  // ADMIN OPERATIONS
  {
    name: 'admin_operations',
    description: '⚙️  Administrative operations: user management, project setup, system configuration',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['search_users', 'project_fields', 'field_values', 'bulk_update', 'dependencies'],
          description: 'Admin operation to perform'
        },
        query: {
          type: 'string',
          description: 'Search query (for search_users)'
        },
        projectId: {
          type: 'string',
          description: 'Project ID (for project-specific operations)'
        },
        fieldName: {
          type: 'string',
          description: 'Field name (for field_values)'
        },
        issueIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Issue IDs (for bulk operations)'
        },
        updates: {
          type: 'object',
          description: 'Update data (for bulk_update)'
        },
        sourceIssueId: {
          type: 'string',
          description: 'Source issue ID (for dependencies)'
        },
        targetIssueId: {
          type: 'string',
          description: 'Target issue ID (for dependencies)'
        }
      },
      required: ['operation']
    }
  }
];

class StreamlinedYouTrackMCPServer {
  private server: Server;
  private clientFactory: EnhancedClientFactory;
  private config: ConfigManager;

  constructor() {
    this.config = new ConfigManager();
    this.config.validate();

    const { youtrackUrl, youtrackToken } = this.config.get();
    logger.info('🚀 Initializing Streamlined YouTrack MCP Server', { 
      url: youtrackUrl, 
      tokenLength: youtrackToken?.length,
      toolCount: streamlinedToolDefinitions.length 
    });
    
    // Initialize enhanced client factory
    this.clientFactory = new EnhancedClientFactory({
      baseURL: youtrackUrl,
      token: youtrackToken,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableCache: true
    });

    logger.info('✅ Enhanced Client Factory initialized with modular architecture');

    this.server = new Server(
      {
        name: 'youtrack-mcp-streamlined',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private resolveProjectId(providedProjectId?: string): string {
    const config = this.config.get();
    const projectId = providedProjectId || config.defaultProjectId;
    
    if (!projectId) {
      throw new Error('Project ID is required. Either provide projectId parameter or set PROJECT_ID environment variable.');
    }
    
    return projectId;
  }

  private setupToolHandlers(): void {
    // Register streamlined tool definitions
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: streamlinedToolDefinitions,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        const client = this.clientFactory.createClient();
        
        switch (name) {
          case 'projects_manage':
            return await this.handleProjectsManage(client, args);
          
          case 'issues_manage':
            return await this.handleIssuesManage(client, args);
          
          case 'comments_manage':
            return await this.handleCommentsManage(client, args);
          
          case 'agile_manage':
            return await this.handleAgileManage(client, args);
          
          case 'knowledge_manage':
            return await this.handleKnowledgeManage(client, args);
          
          case 'analytics_report':
            return await this.handleAnalyticsReport(client, args);
          
          case 'admin_operations':
            return await this.handleAdminOperations(client, args);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        logger.error('Tool execution error', { tool: name, error: error instanceof Error ? error.message : error });
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleProjectsManage(client: any, args: any) {
    const { action, projectId, fields } = args;
    
    switch (action) {
      case 'list':
        return await client.projects.listProjects(fields);
      case 'get':
        return await client.projects.getProject(projectId || this.resolveProjectId());
      case 'validate':
        return await client.projects.validateProject(projectId || this.resolveProjectId());
      case 'fields':
        return await client.projects.getProjectCustomFields(projectId || this.resolveProjectId());
      case 'status':
        return await client.projects.getProjectStatistics(projectId || this.resolveProjectId());
      default:
        throw new Error(`Unknown projects action: ${action}`);
    }
  }

  private async handleIssuesManage(client: any, args: any) {
    const { action, projectId, issueId, summary, description, query, state, comment, priority, assignee, type } = args;
    
    switch (action) {
      case 'create':
        return await client.issues.createIssue(projectId || this.resolveProjectId(), { 
          summary, description, priority, assignee, type 
        });
      case 'update':
        return await client.issues.updateIssue(issueId, { 
          summary, description, state, priority, assignee, type 
        });
      case 'get':
        return await client.issues.getIssue(issueId);
      case 'query':
        return await client.issues.queryIssues({ query });
      case 'search':
        return await client.issues.smartSearchIssues(query, { projectId });
      case 'state':
        return await client.issues.changeIssueState(issueId, state, comment);
      case 'complete':
        return await client.issues.completeIssue(issueId, comment);
      case 'start':
        return await client.issues.startWorkingOnIssue(issueId, comment);
      default:
        throw new Error(`Unknown issues action: ${action}`);
    }
  }

  private async handleCommentsManage(client: any, args: any) {
    const { action, issueId, commentId, text } = args;
    
    switch (action) {
      case 'get':
        return await client.issues.getIssueComments(issueId);
      case 'add':
        return await client.issues.addComment(issueId, text);
      case 'update':
        return await client.issues.updateComment(issueId, commentId, text);
      case 'delete':
        return await client.issues.deleteComment(issueId, commentId);
      default:
        throw new Error(`Unknown comments action: ${action}`);
    }
  }

  private async handleAgileManage(client: any, args: any) {
    const { action, boardId, sprintId, issueId, projectId, name, start, finish } = args;
    
    switch (action) {
      case 'boards':
        return await client.agile.listAgileBoards({ projectId });
      case 'board_details':
        return await client.agile.getBoardDetails(boardId, true, true);
      case 'sprints':
        return await client.agile.listSprints(boardId, false, false);
      case 'sprint_details':
        return await client.agile.getSprintDetails(boardId, sprintId, true);
      case 'create_sprint':
        return await client.agile.createSprint(boardId, name, start, finish);
      case 'assign_issue':
        return await client.agile.assignIssueToSprint(issueId, sprintId, boardId);
      default:
        throw new Error(`Unknown agile action: ${action}`);
    }
  }

  private async handleKnowledgeManage(client: any, args: any) {
    const { action, articleId, title, content, summary, tags, searchTerm, projectId } = args;
    
    switch (action) {
      case 'list':
        return await client.knowledgeBase.listArticles(false, projectId);
      case 'get':
        return await client.knowledgeBase.getArticle(articleId, false);
      case 'create':
        return await client.knowledgeBase.createArticle({ title, content, summary, tags, projectId });
      case 'update':
        return await client.knowledgeBase.updateArticle(articleId, { title, content, summary, tags });
      case 'delete':
        return await client.knowledgeBase.deleteArticle(articleId);
      case 'search':
        return await client.knowledgeBase.searchArticles(searchTerm, false, projectId, tags);
      default:
        throw new Error(`Unknown knowledge action: ${action}`);
    }
  }

  private async handleAnalyticsReport(client: any, args: any) {
    const { reportType, projectId, startDate, endDate, userId, milestoneId } = args;
    
    switch (reportType) {
      case 'project_stats':
        return await client.projects.getProjectStatistics(projectId || this.resolveProjectId(), startDate, endDate, true);
      case 'time_tracking':
        return await client.admin.getTimeTrackingReport(startDate, endDate, 'user', projectId, userId);
      case 'gantt':
        return await client.admin.generateGanttChart(projectId || this.resolveProjectId(), startDate, endDate);
      case 'critical_path':
        return await client.admin.getCriticalPath(projectId || this.resolveProjectId());
      case 'resource_allocation':
        return await client.admin.getResourceAllocation(projectId || this.resolveProjectId(), startDate, endDate);
      case 'milestone_progress':
        return await client.admin.getMilestoneProgress(milestoneId);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  private async handleAdminOperations(client: any, args: any) {
    const { operation, query, projectId, fieldName, issueIds, updates, sourceIssueId, targetIssueId } = args;
    
    switch (operation) {
      case 'search_users':
        return await client.admin.searchUsers(query);
      case 'project_fields':
        return await client.projects.getProjectCustomFields(projectId || this.resolveProjectId());
      case 'field_values':
        return await client.projects.getProjectFieldValues(projectId || this.resolveProjectId(), fieldName);
      case 'bulk_update':
        return await client.admin.bulkUpdateIssues(issueIds, updates);
      case 'dependencies':
        return await client.admin.createIssueDependency(sourceIssueId, targetIssueId);
      default:
        throw new Error(`Unknown admin operation: ${operation}`);
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info(`🎉 Streamlined YouTrack MCP Server running with ${streamlinedToolDefinitions.length} powerful tools!`);
  }
}

const server = new StreamlinedYouTrackMCPServer();
server.run().catch((error) => {
  logger.error('Server failed to start', error);
  process.exit(1);
});
