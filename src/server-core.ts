import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { ClientFactory } from './api/client.js';
import { ConfigManager } from './config.js';
import { logger } from './logger.js';
import { NotificationManager } from './notifications/notification-manager.js';
import { 
  ParameterValidator, 
  ValidationError, 
  TOOL_NAME_MAPPINGS, 
  suggestToolName
} from './validation.js';
import { AuthenticationManager } from './auth/authentication-manager.js';
import { CoreTools } from './tools/core-tools.js';
import { DynamicConfigLoader } from './dynamic-config-loader.js';

// Load environment variables
dotenv.config();

// Tool definitions generator using dynamic configuration
function createToolDefinitions(configLoader: DynamicConfigLoader) {
  const queryExamples = configLoader.getQueryExamples();
  const typeExample = configLoader.getTypeExample();
  const stateExample = configLoader.getStateExample();
  const priorityExample = configLoader.getPriorityExample();

  return [
  // PROJECT MANAGEMENT TOOLS
  {
    name: 'projects',
    description: 'Project management: list projects, get details, validate access, list custom fields, retrieve statistics',
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
    name: 'issues',
    description: 'Issue lifecycle: create, update, query/search, change state, comment, start/complete work, link issues, manage watchers, get field values',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'update', 'get', 'query', 'search', 'state', 'complete', 'start', 'link', 'move', 'watchers', 'add_watcher', 'remove_watcher', 'toggle_star', 'get_field_values'],
          description: 'Action: create (new issue), update (modify), get (single issue), query (advanced search), search (smart search), state (change state), complete (mark done), start (begin work), link (relate issues), move (move to another project), watchers (get watchers), add_watcher (add user as watcher), remove_watcher (remove watcher), toggle_star (star/unstar issue), get_field_values (discover available Type/Priority/State values for a project)'
        },
        projectId: {
          type: 'string',
          description: 'Project ID (required for create action, optional for search, required for get_field_values)'
        },
        issueId: {
          type: 'string',
          description: 'Issue ID (required for update, get, state, complete, start, move, watchers, add_watcher, remove_watcher, toggle_star actions)'
        },
        userId: {
          type: 'string',
          description: 'User ID (required for add_watcher, remove_watcher actions)'
        },
        targetProjectId: {
          type: 'string',
          description: 'Target project ID or shortName (required for move action)'
        },
        fieldName: {
          type: 'string',
          description: 'Field name for get_field_values action (e.g., "Type", "Priority", "State"). Default: "Type"',
          default: 'Type'
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
          description: `New state (for state action). Available states: ${stateExample}`
        },
        priority: {
          type: 'string',
          description: `Issue priority. Available priorities: ${priorityExample}`
        },
        assignee: {
          type: 'string',
          description: 'Assignee username'
        },
        type: {
          type: 'string',
          description: `Issue type. Available types: ${typeExample}. Use get_field_values action to discover project-specific types.`
        },
        estimation: {
          type: 'number',
          description: 'Time estimation in minutes (e.g., 120 for 2 hours, 480 for 1 day). For create/update actions.'
        },
        comment: {
          type: 'string',
          description: 'Comment for state changes or completion'
        },
        targetIssueId: {
          type: 'string',
          description: 'Target issue to link with (required for link action)'
        },
        linkType: {
          type: 'string',
          description: 'Link command phrase (for example: "relates to", "depends on", "duplicates", "subtask of", "parent for")',
          default: 'relates to'
        }
      },
      required: ['action']
    }
  },

  // ADVANCED QUERY TOOL
  {
    name: 'query',
    description: 'Raw YouTrack query using native syntax (returns issues matching the expression)',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: `YouTrack query syntax string. Examples:\n• ${queryExamples}`
        },
        fields: {
          type: 'string',
          description: 'Comma-separated field names to return. Example: "id,summary,state,priority" or "id,summary,description,assignee,created"',
          default: 'id,summary,description,state,priority,reporter,assignee'
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of issues to return (1-1000, default: 50)',
          default: 50
        }
      },
      required: ['query']
    }
  },

    // COMMENT MANAGEMENT TOOLS
  {
    name: 'comments',
    description: 'Issue comments: list, add, update, delete',
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

  // AGILE MANAGEMENT TOOLS
  {
    name: 'agile_boards',
    description: 'Agile boards and sprints: list boards/sprints, get details, create/update/delete sprints, assign/unassign issues, get sprint issues',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['boards', 'board_details', 'sprints', 'sprint_details', 'create_sprint', 'update_sprint', 'delete_sprint', 'archive_sprint', 'sprint_issues', 'assign_issues', 'unassign_issues'],
          description: 'Action: boards (list all boards), board_details (get board details), sprints (list all sprints), sprint_details (get sprint details), create_sprint (create new sprint), update_sprint (update sprint), delete_sprint (delete sprint), archive_sprint (archive sprint), sprint_issues (get all issues in sprint), assign_issues (assign issues to sprint), unassign_issues (remove issues from sprint)'
        },
        boardId: {
          type: 'string',
          description: 'Board ID (required for board_details, sprints, sprint_details, create_sprint, update_sprint, delete_sprint, archive_sprint, sprint_issues, assign_issues)'
        },
        sprintId: {
          type: 'string',
          description: 'Sprint ID (required for sprint_details, update_sprint, delete_sprint, archive_sprint, sprint_issues, assign_issues, unassign_issues)'
        },
        issueIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of issue IDs (required for assign_issues, unassign_issues)'
        },
        projectId: {
          type: 'string',
          description: 'Project ID for filtering'
        },
        name: {
          type: 'string',
          description: 'Sprint name (for create_sprint, update_sprint)'
        },
        start: {
          type: 'string',
          description: 'Sprint start date YYYY-MM-DD (for create_sprint, update_sprint)'
        },
        finish: {
          type: 'string',
          description: 'Sprint end date YYYY-MM-DD (for create_sprint, update_sprint)'
        },
        goal: {
          type: 'string',
          description: 'Sprint goal/description (for create_sprint, update_sprint)'
        }
      },
      required: ['action']
    }
  },

  // KNOWLEDGE MANAGEMENT TOOLS
  {
    name: 'knowledge_base',
    description: `Knowledge base: list, get, create, update, delete, search articles

⚠️ IMPORTANT: When creating/updating articles, the 'title' field becomes the article heading.
NEVER include "# Title" in the content field - it will duplicate. Start content with "##" or body text.`,
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
          description: 'Article title (required for create, optional for update). This will be the article heading in YouTrack.'
        },
        content: {
          type: 'string',
          description: `Article content in Markdown format (required for create, optional for update).

⚠️ CRITICAL FORMATTING RULE:
Do NOT include the title as an H1 heading (# Title) in the content - it will be added automatically by YouTrack from the 'title' field.

✅ CORRECT - Start with secondary headings or body text:
"## Introduction\\n\\nThis is the content...\\n\\n## Features\\n\\n- Feature 1\\n- Feature 2"

❌ WRONG - Starting with H1 heading causes duplication:
"# My Article Title\\n\\n## Introduction\\n..." (Title appears twice!)

Start your content with:
• Body text directly, OR
• Secondary headings (##, ###, etc.), OR
• Lists, code blocks, or other content

The server will reject content starting with single # to prevent duplication.`
        },
        summary: {
          type: 'string',
          description: 'Article summary/description (optional) - a brief overview displayed in article lists'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Article tags (optional) - Note: tags will be skipped during creation due to API limitations'
        },
        searchTerm: {
          type: 'string',
          description: 'Search term (required for search action)'
        },
        projectId: {
          type: 'string',
          description: 'Project ID or shortName (REQUIRED for create action, optional for filtering in list/search)'
        }
      },
      required: ['action']
    }
  },

  // ANALYTICS & REPORTING
  {
    name: 'analytics',
    description: 'Analytics and reporting: project statistics, time tracking, Gantt, critical path, resource allocation, milestone progress',
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
    name: 'admin',
    description: 'Administrative operations: search users, inspect fields, list field values, bulk update, create dependencies',
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
  },

  // TIME TRACKING & WORK ITEMS
  {
    name: 'time_tracking',
    description: 'Time tracking & work items: log time, manage entries and work items, generate reports',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['log_time', 'get_time_entries', 'update_time_entry', 'delete_time_entry', 'get_work_items', 'create_work_item', 'update_work_item', 'time_reports'],
          description: 'Action: log_time (add time), get_time_entries (list entries), update_time_entry (edit), delete_time_entry (remove), get_work_items (list items), create_work_item (new), update_work_item (edit), time_reports (analytics)'
        },
        issueId: {
          type: 'string',
          description: 'Issue ID (required for most time tracking operations)'
        },
        duration: {
          type: 'string',
          description: 'Time duration (e.g., "2h", "1d", "30m") for log_time'
        },
        description: {
          type: 'string',
          description: 'Work description or comment'
        },
        date: {
          type: 'string',
          description: 'Date for time entry (YYYY-MM-DD format, defaults to today)'
        },
        workItemId: {
          type: 'string',
          description: 'Work item ID (for update/delete operations)'
        },
        timeEntryId: {
          type: 'string',
          description: 'Time entry ID (for update/delete operations)'
        },
        projectId: {
          type: 'string',
          description: 'Project ID (for reports and filtering)'
        },
        userId: {
          type: 'string',
          description: 'User ID (for reports and filtering)'
        },
        startDate: {
          type: 'string',
          description: 'Start date for reports (YYYY-MM-DD)'
        },
        endDate: {
          type: 'string',
          description: 'End date for reports (YYYY-MM-DD)'
        },
        workType: {
          type: 'string',
          description: 'Type of work (Development, Testing, Documentation, etc.)'
        }
      },
      required: ['action']
    }
  },

  // AUTHENTICATION MANAGEMENT
  {
    name: 'auth',
    description: 'Authentication: status, OAuth2 login, logout, re-authenticate, validate token',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['status', 'login', 'logout', 'reauth', 'test'],
          description: 'Action: status (check auth), login (OAuth2 browser), logout (sign out), reauth (force re-auth), test (validate token)'
        }
      },
      required: ['action']
    }
  },

  // REAL-TIME NOTIFICATIONS
  {
    name: 'notifications',
    description: 'Notifications: status, list, clear, subscribe/unsubscribe, list subscriptions',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['status', 'list', 'clear', 'subscribe', 'unsubscribe', 'subscriptions'],
          description: 'Action: status (connection status), list (recent notifications), clear (clear all), subscribe (create subscription), unsubscribe (remove subscription), subscriptions (list subscriptions)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of notifications to return (for list action)',
          default: 50
        },
        id: {
          type: 'string',
          description: 'Subscription ID (for unsubscribe action)'
        },
        name: {
          type: 'string',
          description: 'Subscription name (for subscribe action)'
        },
        filters: {
          type: 'object',
          description: 'Notification filters (for subscribe action)'
        },
        enabled: {
          type: 'boolean',
          description: 'Whether subscription is enabled (for subscribe action)',
          default: true
        },
        deliveryMethods: {
          type: 'array',
          items: { type: 'string' },
          description: 'Delivery methods for notifications (for subscribe action)',
          default: ['immediate']
        }
      },
      required: ['action']
    }
  },

  // USERS & GROUPS
  {
    name: 'users',
    description: 'User and group management: list users, search, get user details, list groups, manage team members',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'search', 'get', 'current', 'saved_queries', 'list_groups', 'get_group', 'group_members', 'project_team', 'add_to_team'],
          description: 'Action: list (all users), search (find users), get (user details), current (current user), saved_queries (user queries), list_groups (all groups), get_group (group details), group_members (users in group), project_team (project members), add_to_team (add user to project)'
        },
        userId: {
          type: 'string',
          description: 'User ID (required for get, saved_queries actions)'
        },
        groupId: {
          type: 'string',
          description: 'Group ID (required for get_group, group_members actions)'
        },
        projectId: {
          type: 'string',
          description: 'Project ID (required for project_team, add_to_team actions)'
        },
        query: {
          type: 'string',
          description: 'Search query (for search action)'
        },
        fields: {
          type: 'string',
          description: 'Comma-separated fields to return'
        }
      },
      required: ['action']
    }
  },

  // CUSTOM FIELDS
  {
    name: 'custom_fields',
    description: 'Custom field management: list, create, update, delete fields, manage bundles, project fields',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'create', 'update', 'delete', 'types', 'list_bundles', 'get_bundle', 'create_bundle', 'add_bundle_value', 'project_fields', 'add_to_project', 'remove_from_project', 'issue_fields', 'update_issue_field'],
          description: 'Action: list (all fields), get (field details), create (new field), update (edit field), delete (remove field), types (available types), list_bundles (all bundles), get_bundle (bundle details), create_bundle (new bundle), add_bundle_value (add value to bundle), project_fields (project custom fields), add_to_project (add field to project), remove_from_project (remove field from project), issue_fields (issue custom fields), update_issue_field (update issue field value)'
        },
        fieldId: {
          type: 'string',
          description: 'Field ID (required for get, update, delete, add_to_project, remove_from_project actions)'
        },
        bundleId: {
          type: 'string',
          description: 'Bundle ID (required for get_bundle, add_bundle_value actions)'
        },
        projectId: {
          type: 'string',
          description: 'Project ID (required for project_fields, add_to_project, remove_from_project actions)'
        },
        issueId: {
          type: 'string',
          description: 'Issue ID (required for issue_fields, update_issue_field actions)'
        },
        name: {
          type: 'string',
          description: 'Field or bundle name (for create actions)'
        },
        fieldType: {
          type: 'string',
          description: 'Field type ID (for create action)'
        },
        value: {
          description: 'Field value (for update_issue_field action)'
        },
        values: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' }
            }
          },
          description: 'Bundle values (for create_bundle action)'
        },
        description: {
          type: 'string',
          description: 'Description for bundle value'
        },
        isPublic: {
          type: 'boolean',
          description: 'Whether field is public (for create action)'
        },
        canBeEmpty: {
          type: 'boolean',
          description: 'Whether field can be empty in project'
        },
        emptyFieldText: {
          type: 'string',
          description: 'Text to display when field is empty'
        },
        fields: {
          type: 'string',
          description: 'Comma-separated fields to return'
        }
      },
      required: ['action']
    }
  },

  // NOTIFICATION SUBSCRIPTIONS
  {
    name: 'subscriptions',
    description: 'Notification subscriptions: create, update, delete, list',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'update', 'delete', 'list'],
          description: 'Action: create (new subscription), update (modify existing), delete (remove), list (all subscriptions)'
        },
        id: {
          type: 'string',
          description: 'Subscription ID (required for update/delete actions)'
        },
        name: {
          type: 'string',
          description: 'Subscription name (required for create action)'
        },
        filters: {
          type: 'object',
          description: 'Notification filters (project, issue type, priority, etc.)'
        },
        enabled: {
          type: 'boolean',
          description: 'Whether subscription is enabled',
          default: true
        },
        deliveryMethods: {
          type: 'array',
          items: { type: 'string' },
          description: 'How notifications should be delivered',
          default: ['immediate']
        },
        updates: {
          type: 'object',
          description: 'Updates to apply to subscription (for update action)'
        }
      },
      required: ['action']
    }
  } // End of subscriptions tool
  ]; // End of tools array
} // End of createToolDefinitions function

export class YouTrackMCPServer {
  private server: Server;
  private clientFactory: ClientFactory;
  private config: ConfigManager;
  private authManager: AuthenticationManager;
  private coreTools: CoreTools;
  private transport: Transport | null = null;
  private notificationManager: NotificationManager | null = null;
  private notificationsInitialized = false;
  private configLoader: DynamicConfigLoader | null = null;
  private toolDefinitions: any[] = [];

  constructor() {
    this.config = new ConfigManager();
    this.config.validate();

    const { youtrackUrl, youtrackToken } = this.config.get();
    
    // Initialize authentication manager
    this.authManager = new AuthenticationManager({
      baseUrl: youtrackUrl,
      token: youtrackToken,
      preferOAuth2: false, // Default to token-based auth
      autoRefresh: true
    });
    
  // Initialize core tools with authentication manager
  this.coreTools = new CoreTools(this.authManager);
  logger.info('Initializing YouTrack MCP Server', { 
      url: youtrackUrl, 
      tokenLength: youtrackToken?.length,
      toolCount: 'dynamic' // Will be set after config loads
    });
    
    // Initialize client factory
    this.clientFactory = new ClientFactory({
      baseURL: youtrackUrl,
      token: youtrackToken,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableCache: true
    });

  logger.info('Client Factory initialized');
  
    // Initialize dynamic configuration loader
    this.configLoader = new DynamicConfigLoader(youtrackUrl, youtrackToken);

    this.server = new Server(
      {
        name: 'youtrack-mcp',
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

  private async initializeDynamicConfig(): Promise<void> {
    if (!this.configLoader) {
      logger.warn('Config loader not initialized, using default tool definitions');
      this.toolDefinitions = createToolDefinitions(new DynamicConfigLoader('', ''));
      return;
    }

    try {
      await this.configLoader.loadConfiguration();
      this.toolDefinitions = createToolDefinitions(this.configLoader);
      logger.info('Dynamic tool definitions created', {
        toolCount: this.toolDefinitions.length,
        states: this.configLoader.getConfig().states.length,
        priorities: this.configLoader.getConfig().priorities.length
      });
    } catch (error) {
      logger.warn('Failed to load dynamic configuration, using defaults', error);
      this.toolDefinitions = createToolDefinitions(this.configLoader);
    }
  }

  private setupToolHandlers(): void {
    // Register tool definitions
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.toolDefinitions,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        const client = this.clientFactory.createClient();
        
        switch (name) {
          case 'projects':
            return await this.handleProjectsManage(client, args);
          
          case 'issues':
            return await this.handleIssuesManage(client, args);
          
          case 'query':
            return await this.handleQueryIssues(client, args);
          
          case 'comments':
            return await this.handleCommentsManage(client, args);
          
          case 'agile_boards':
            return await this.handleAgileManage(client, args);
          
          case 'knowledge_base':
            return await this.handleKnowledgeManage(client, args);
          
          case 'analytics':
            return await this.handleAnalyticsReport(client, args);
          
          case 'admin':
            return await this.handleAdminOperations(client, args);
          
          case 'time_tracking':
            return await this.handleTimeTracking(client, args);
          
          case 'users':
            return await this.handleUsersManage(client, args);
          
          case 'custom_fields':
            return await this.handleCustomFieldsManage(client, args);
          
          case 'auth':
            return await this.coreTools.handleAuthManage(args);
          
          case 'notifications':
            return await this.coreTools.handleNotifications(args);
          
          case 'subscriptions':
            return await this.coreTools.handleSubscriptions(args);
          
          default: {
            const suggestion = suggestToolName(name);
            logger.warn('Unknown tool requested', { 
              tool: name, 
              suggestion: TOOL_NAME_MAPPINGS[name] || 'none',
              availableTools: ['projects', 'issues', 'query', 'comments', 'agile_boards', 'knowledge_base', 'analytics', 'admin', 'time_tracking', 'users', 'custom_fields', 'auth', 'notifications', 'subscriptions']
            });
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}. ${suggestion}`
            );
          }
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
    
    // Validate project ID for actions that require it
    const needsProjectId = ['get', 'validate', 'fields', 'status'];
    if (needsProjectId.includes(action)) {
      try {
        ParameterValidator.validateProjectId(projectId || this.resolveProjectId(), 'projectId');
      } catch (error) {
        logger.error('Project validation failed', { 
          action, 
          projectId: projectId || this.resolveProjectId(), 
          error: error instanceof Error ? error.message : error 
        });
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid project ID for ${action} action: ${error instanceof Error ? error.message : error}`
        );
      }
    }
    
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
    const { action, projectId, issueId, userId, summary, description, query, state, comment, priority, assignee, type, estimation, targetIssueId, targetProjectId, linkType, fieldName } = args;
    let normalizedLinkType = linkType;
    
    // Validate parameters based on action
    try {
      switch (action) {
        case 'create':
          ParameterValidator.validateProjectId(projectId || this.resolveProjectId(), 'projectId');
          ParameterValidator.validateRequired(summary, 'summary');
          break;
        case 'get_field_values':
          ParameterValidator.validateProjectId(projectId, 'projectId');
          break;
        case 'update':
        case 'get':
        case 'state':
        case 'complete':
        case 'start':
        case 'watchers':
        case 'toggle_star':
          ParameterValidator.validateIssueId(issueId, 'issueId');
          break;
        case 'add_watcher':
        case 'remove_watcher':
          ParameterValidator.validateIssueId(issueId, 'issueId');
          ParameterValidator.validateRequired(userId, 'userId');
          break;
        case 'move':
          ParameterValidator.validateIssueId(issueId, 'issueId');
          ParameterValidator.validateProjectId(targetProjectId, 'targetProjectId');
          break;
        case 'link':
          ParameterValidator.validateIssueId(issueId, 'issueId');
          ParameterValidator.validateIssueId(targetIssueId, 'targetIssueId');
          if (linkType !== undefined) {
            normalizedLinkType = ParameterValidator.validateRequired(linkType, 'linkType');
          }
          break;
        case 'query':
        case 'search':
          ParameterValidator.validateRequired(query, 'query');
          break;
      }
    } catch (error) {
      logger.error('Issue parameter validation failed', { 
        action, 
        projectId, 
        issueId, 
        error: error instanceof Error ? error.message : error 
      });
      if (error instanceof ValidationError) {
        throw ParameterValidator.toMcpError(error);
      }
      throw error;
    }
    
    switch (action) {
      case 'create':
        return await client.issues.createIssue(projectId || this.resolveProjectId(), {
          summary, description, priority, assignee, type, estimation
        });
      case 'update':
        return await client.issues.updateIssue(issueId, {
          summary, description, state, priority, assignee, type, estimation
        });
      case 'get':
        return await client.issues.getIssue(issueId);
      case 'get_field_values':
        return await client.issues.getProjectFieldValues(projectId, fieldName || 'Type');
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
      case 'move':
        return await client.issues.moveIssueToProject(issueId, targetProjectId, comment);
      case 'link':
        return await client.issues.linkIssues(issueId, targetIssueId, normalizedLinkType);
      case 'watchers':
        return await client.issues.getIssueWatchers(issueId);
      case 'add_watcher':
        return await client.issues.addWatcher(issueId, userId);
      case 'remove_watcher':
        return await client.issues.removeWatcher(issueId, userId);
      case 'toggle_star':
        return await client.issues.toggleStar(issueId);
      default:
        throw new Error(`Unknown issues action: ${action}`);
    }
  }

  private async handleQueryIssues(client: any, args: any) {
    const { query, fields, limit } = args;
    return await client.issues.queryIssues({ 
      query, 
      fields: fields ? fields.split(',') : ['id', 'summary', 'description', 'state', 'priority', 'reporter', 'assignee'],
      limit: limit || 50
    });
  }

  private async handleCommentsManage(client: any, args: any) {
    const { action, issueId, commentId, text } = args;
    
    // Validate parameters
    try {
      ParameterValidator.validateIssueId(issueId, 'issueId');
      
      if (['add', 'update'].includes(action)) {
        ParameterValidator.validateRequired(text, 'text');
      }
      
      if (['update', 'delete'].includes(action)) {
        ParameterValidator.validateRequired(commentId, 'commentId');
      }
    } catch (error) {
      logger.error('Comment parameter validation failed', { 
        action, 
        issueId, 
        commentId, 
        error: error instanceof Error ? error.message : error 
      });
      if (error instanceof ValidationError) {
        throw ParameterValidator.toMcpError(error);
      }
      throw error;
    }
    
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
    const { action, boardId, sprintId, issueIds, projectId, name, start, finish, goal } = args;
    
    switch (action) {
      case 'boards':
        return await client.agile.listAgileBoards({ projectId });
      
      case 'board_details':
        return await client.agile.getBoardDetails({ boardId, includeColumns: true, includeSprints: true });
      
      case 'sprints':
        return await client.agile.listSprints({ boardId, includeArchived: false, includeIssues: false });
      
      case 'sprint_details':
        return await client.agile.getSprintDetails({ boardId, sprintId });
      
      case 'create_sprint':
        return await client.agile.createSprint({ boardId, name, start, finish, goal });
      
      case 'update_sprint':
        return await client.agile.updateSprint({ boardId, sprintId, name, start, finish, goal });
      
      case 'delete_sprint':
        return await client.agile.deleteSprint({ boardId, sprintId });
      
      case 'archive_sprint':
        return await client.agile.archiveSprint({ boardId, sprintId });
      
      case 'sprint_issues':
        return await client.agile.getSprintIssues({ boardId, sprintId });
      
      case 'assign_issues':
        if (!issueIds || !Array.isArray(issueIds)) {
          throw new Error('issueIds must be an array of issue IDs');
        }
        return await client.agile.assignIssuesToSprint({ boardId, sprintId, issueIds });
      
      default:
        throw new Error(`Unknown agile action: ${action}. Available actions: boards, board_details, sprints, sprint_details, create_sprint, update_sprint, delete_sprint, archive_sprint, sprint_issues, assign_issues`);
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
        // Resolve projectId from args or environment variable
        const resolvedProjectId = projectId || this.resolveProjectId();
        return await client.knowledgeBase.createArticle({ 
          title, 
          content, 
          summary, 
          tags, 
          project: resolvedProjectId // Map projectId to project parameter
        });
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
    const { 
      reportType, 
      projectId, 
      startDate, 
      endDate, 
      userId, 
      milestoneId, 
      includeDependencies,
      includeSprints,
      sprintId,
      includeWorkItems
    } = args;
    
    // Validate project ID for project-specific reports
    const needsProjectId = ['project_stats', 'gantt', 'critical_path', 'resource_allocation'];
    if (needsProjectId.includes(reportType)) {
      try {
        const validatedProjectId = ParameterValidator.validateProjectId(projectId || this.resolveProjectId(), 'projectId');
        // Verify project exists before using it
        await client.projects.validateProject(validatedProjectId);
      } catch (error) {
        logger.error('Analytics project validation failed', { 
          reportType, 
          projectId: projectId || this.resolveProjectId(), 
          error: error instanceof Error ? error.message : error 
        });
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid project ID for ${reportType} report: ${error instanceof Error ? error.message : error}`
        );
      }
    }

    // Validate date formats
    if (startDate) {
      ParameterValidator.validateDate(startDate, 'startDate');
    }
    if (endDate) {
      ParameterValidator.validateDate(endDate, 'endDate');
    }
    
    switch (reportType) {
      case 'project_stats':
        return await client.projects.getProjectStatistics(projectId || this.resolveProjectId(), startDate, endDate, true);
      case 'time_tracking':
        return await client.admin.getTimeTrackingReport(startDate, endDate, 'user', projectId, userId);
      case 'gantt':
        return await client.admin.generateGanttChart(
          projectId || this.resolveProjectId(), 
          includeDependencies || false,
          includeSprints || false,
          sprintId,
          includeWorkItems || false
        );
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

  private async handleTimeTracking(client: any, args: any) {
    const { action, issueId, duration, description, date, workItemId, timeEntryId, projectId, userId, startDate, endDate, workType } = args;
    
    // Validate parameters based on action
    try {
      const needsIssueId = ['log_time', 'get_time_entries', 'get_work_items', 'create_work_item'];
      if (needsIssueId.includes(action)) {
        ParameterValidator.validateIssueId(issueId, 'issueId');
      }
      
      if (action === 'log_time') {
        ParameterValidator.validateDuration(duration, 'duration');
      }
      
      // Validate date formats
      if (date) ParameterValidator.validateDate(date, 'date');
      if (startDate) ParameterValidator.validateDate(startDate, 'startDate');
      if (endDate) ParameterValidator.validateDate(endDate, 'endDate');
      
      // Validate required IDs for specific actions
      if (['update_time_entry', 'delete_time_entry'].includes(action)) {
        ParameterValidator.validateRequired(timeEntryId, 'timeEntryId');
      }
      if (action === 'update_work_item') {
        ParameterValidator.validateRequired(workItemId, 'workItemId');
      }
    } catch (error) {
      logger.error('Time tracking parameter validation failed', { 
        action, 
        issueId, 
        duration, 
        error: error instanceof Error ? error.message : error 
      });
      if (error instanceof ValidationError) {
        throw ParameterValidator.toMcpError(error);
      }
      throw error;
    }
    
    switch (action) {
      case 'log_time':
        return await client.workItems.logTimeToIssue(issueId, duration, description, date, workType);
      case 'get_time_entries':
        return await client.workItems.getTimeEntries(issueId, startDate, endDate, userId);
      case 'update_time_entry':
        return await client.workItems.updateTimeEntry(timeEntryId, { duration, description, date, workType });
      case 'delete_time_entry':
        return await client.workItems.deleteTimeEntry(timeEntryId);
      case 'get_work_items':
        return await client.workItems.getWorkItems(issueId, projectId, userId);
      case 'create_work_item':
        return await client.workItems.createWorkItem({ issueId, description, workType, duration, date });
      case 'update_work_item':
        return await client.workItems.updateWorkItem(workItemId, { description, workType, duration, date });
      case 'time_reports':
        return await client.workItems.generateTimeReport(projectId, startDate, endDate, userId);
      default:
        throw new Error(`Unknown time tracking action: ${action}`);
    }
  }

  private async handleUsersManage(client: any, args: any) {
    const { action, userId, groupId, projectId, query, fields } = args;
    
    // Validate parameters based on action
    try {
      const needsUserId = ['get', 'saved_queries'];
      if (needsUserId.includes(action)) {
        ParameterValidator.validateRequired(userId, 'userId');
      }
      
      const needsGroupId = ['get_group', 'group_members'];
      if (needsGroupId.includes(action)) {
        ParameterValidator.validateRequired(groupId, 'groupId');
      }
      
      const needsProjectId = ['project_team', 'add_to_team'];
      if (needsProjectId.includes(action)) {
        ParameterValidator.validateProjectId(projectId, 'projectId');
      }
      
      if (action === 'search') {
        ParameterValidator.validateRequired(query, 'query');
      }
      
      if (action === 'add_to_team') {
        ParameterValidator.validateRequired(userId, 'userId');
      }
    } catch (error) {
      logger.error('Users parameter validation failed', { 
        action, 
        userId, 
        groupId, 
        projectId, 
        error: error instanceof Error ? error.message : error 
      });
      if (error instanceof ValidationError) {
        throw ParameterValidator.toMcpError(error);
      }
      throw error;
    }
    
    switch (action) {
      case 'list':
        return await client.users.listUsers(query, fields);
      case 'search':
        return await client.users.searchUsers(query, fields);
      case 'get':
        return await client.users.getUser(userId, fields);
      case 'current':
        return await client.users.getCurrentUser(fields);
      case 'saved_queries':
        return await client.users.getUserSavedQueries(userId);
      case 'list_groups':
        return await client.users.listGroups(fields);
      case 'get_group':
        return await client.users.getGroup(groupId, fields);
      case 'group_members':
        return await client.users.getGroupMembers(groupId, fields);
      case 'project_team':
        return await client.users.getProjectTeam(projectId, fields);
      case 'add_to_team':
        return await client.users.addUserToProjectTeam(projectId, userId);
      default:
        throw new Error(`Unknown users action: ${action}`);
    }
  }

  private async handleCustomFieldsManage(client: any, args: any) {
    const { action, fieldId, bundleId, projectId, issueId, name, fieldType, value, values, description, isPublic, canBeEmpty, emptyFieldText, fields } = args;
    
    // Validate parameters based on action
    try {
      const needsFieldId = ['get', 'update', 'delete', 'add_to_project', 'remove_from_project', 'update_issue_field'];
      if (needsFieldId.includes(action)) {
        ParameterValidator.validateRequired(fieldId, 'fieldId');
      }
      
      const needsBundleId = ['get_bundle', 'add_bundle_value'];
      if (needsBundleId.includes(action)) {
        ParameterValidator.validateRequired(bundleId, 'bundleId');
      }
      
      const needsProjectId = ['project_fields', 'add_to_project', 'remove_from_project'];
      if (needsProjectId.includes(action)) {
        ParameterValidator.validateProjectId(projectId, 'projectId');
      }
      
      const needsIssueId = ['issue_fields', 'update_issue_field'];
      if (needsIssueId.includes(action)) {
        ParameterValidator.validateIssueId(issueId, 'issueId');
      }
      
      if (action === 'create') {
        ParameterValidator.validateRequired(name, 'name');
        ParameterValidator.validateRequired(fieldType, 'fieldType');
      }
      
      if (['create_bundle', 'add_bundle_value'].includes(action)) {
        ParameterValidator.validateRequired(name, 'name');
      }
      
      if (action === 'update_issue_field') {
        ParameterValidator.validateRequired(value, 'value');
      }
    } catch (error) {
      logger.error('Custom fields parameter validation failed', { 
        action, 
        fieldId, 
        bundleId, 
        projectId, 
        issueId, 
        error: error instanceof Error ? error.message : error 
      });
      if (error instanceof ValidationError) {
        throw ParameterValidator.toMcpError(error);
      }
      throw error;
    }
    
    switch (action) {
      case 'list':
        return await client.customFields.listCustomFields(fields);
      case 'get':
        return await client.customFields.getCustomField(fieldId, fields);
      case 'create':
        return await client.customFields.createCustomField({ name, fieldType, isPublic });
      case 'update':
        return await client.customFields.updateCustomField(fieldId, { name, isPublic });
      case 'delete':
        return await client.customFields.deleteCustomField(fieldId);
      case 'types':
        return await client.customFields.listFieldTypes(fields);
      case 'list_bundles':
        return await client.customFields.listEnumBundles(fields);
      case 'get_bundle':
        return await client.customFields.getEnumBundle(bundleId, fields);
      case 'create_bundle':
        return await client.customFields.createEnumBundle({ name, values });
      case 'add_bundle_value':
        return await client.customFields.addEnumBundleValue(bundleId, name, description);
      case 'project_fields':
        return await client.customFields.getProjectCustomFields(projectId, fields);
      case 'add_to_project':
        return await client.customFields.addCustomFieldToProject(projectId, fieldId, { canBeEmpty, emptyFieldText });
      case 'remove_from_project':
        return await client.customFields.removeCustomFieldFromProject(projectId, fieldId);
      case 'issue_fields':
        return await client.customFields.getIssueCustomFields(issueId, fields);
      case 'update_issue_field':
        return await client.customFields.updateIssueCustomFieldValue(issueId, fieldId, value);
      default:
        throw new Error(`Unknown custom fields action: ${action}`);
    }
  }

  public onConnectionClose(handler: () => void | Promise<void>): void {
    this.server.onclose = () => {
      Promise.resolve(handler()).catch((error) => {
        logger.error('Error while handling MCP connection close', error);
      });
    };
  }

  public onConnectionError(handler: (error: Error) => void | Promise<void>): void {
    this.server.onerror = (error: Error) => {
      Promise.resolve(handler(error)).catch((handlerError) => {
        logger.error('Error while handling MCP connection error', handlerError);
      });
    };
  }

  private async initializeNotifications(): Promise<void> {
    if (this.notificationsInitialized) {
      return;
    }

    try {
      const notificationManager = new NotificationManager(
        this.config.get().youtrackUrl || ''
      );
      await notificationManager.initialize(await this.authManager.getAuthToken());
      this.notificationManager = notificationManager;
      this.notificationsInitialized = true;
      logger.info('Notification system initialized (polling mode)');
    } catch (error) {
      logger.warn(
        'Failed to initialize notification system, continuing without real-time notifications',
        error
      );
    }
  }

  async connect(transport: Transport): Promise<void> {
    this.transport = transport;
    
    // Initialize dynamic configuration before connecting
    await this.initializeDynamicConfig();
    
    await this.server.connect(transport);
    await this.initializeNotifications();
    logger.info('YouTrack MCP Server connected', {
      transport: transport.constructor?.name ?? 'UnknownTransport',
      toolCount: this.toolDefinitions.length,
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.connect(transport);
    logger.info('YouTrack MCP Server running with stdio transport');
  }

  /**
   * Cleanup resources on shutdown
   */
  async cleanup(options: { disconnect?: boolean } = {}): Promise<void> {
    if (options.disconnect && this.transport) {
      try {
        await this.transport.close();
      } catch (error) {
        logger.warn('Error while closing MCP transport during cleanup', error);
      }
    }

    this.transport = null;

    if (this.notificationManager) {
      this.notificationManager.removeAllListeners();
      this.notificationManager = null;
    }
    this.notificationsInitialized = false;

    this.coreTools.cleanup();
    logger.info('Server resources cleaned up');
  }
}
