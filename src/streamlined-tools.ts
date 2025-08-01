/**
 * Streamlined Tool Definitions
 * 7 powerful tools that replace 71 individual tools using our modular architecture
 */

export const streamlinedToolDefinitions = [
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

/**
 * Tool Mapping Guide
 * 
 * 🏗️  projects_manage → Replaces: list_projects, validate_project, get_project_status, get_project_custom_fields (4 tools)
 * 
 * 🎯 issues_manage → Replaces: create_issue, query_issues, advanced_query_issues, smart_search_issues, 
 *    update_issue, change_issue_state, complete_issue, start_working_on_issue, get_my_active_issues,
 *    get_project_issues_summary, get_issue_workflow_states (11+ tools)
 * 
 * 💬 comments_manage → Replaces: get_issue_comments, add_issue_comment, update_issue_comment, 
 *    delete_issue_comment, bulk_delete_comments (5 tools)
 * 
 * 🏃‍♂️ agile_manage → Replaces: list_agile_boards, get_board_details, list_sprints, get_sprint_details, 
 *    create_sprint, assign_issue_to_sprint, get_sprint_progress (7+ tools)
 * 
 * 📚 knowledge_manage → Replaces: list_articles, get_article, create_article, update_article, 
 *    delete_article, search_articles, get_articles_by_tag (7+ tools)
 * 
 * 📊 analytics_report → Replaces: get_project_statistics, get_time_tracking_report, generate_gantt_chart,
 *    get_critical_path, get_resource_allocation, get_milestone_progress (6+ tools)
 * 
 * ⚙️  admin_operations → Replaces: search_users, discover_project_fields, get_project_field_values,
 *    bulk_update_issues, create_issue_dependency, and 20+ other admin tools (25+ tools)
 * 
 * TOTAL: 7 streamlined tools replace 65+ individual tools (90%+ reduction!)
 */
