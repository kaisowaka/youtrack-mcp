export const toolDefinitions = [
  {
    name: 'list_projects',
    description: 'List all available YouTrack projects that the user has access to',
    inputSchema: {
      type: 'object',
      properties: {
        fields: {
          type: 'string',
          description: 'Fields to return for each project (comma-separated)',
          default: 'id,name,shortName,description',
        },
      },
    },
  },
  {
    name: 'validate_project',
    description: 'Validate if a project exists and check user permissions',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID to validate',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_project_status',
    description: 'Get comprehensive project statistics and health metrics using the correct API',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project shortName or ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_project_custom_fields',
    description: 'Get available custom fields and their possible values for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project shortName or ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_issue',
    description: 'Create a new issue in a YouTrack project. CRITICAL: Always use separate fields for type, priority, and state - never embed them in the summary/title. YouTrack displays these as separate metadata fields.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID (optional if PROJECT_ID is set in environment)',
        },
        summary: {
          type: 'string',
          description: 'Issue summary/title (IMPORTANT: do NOT include type, priority, or state prefixes here - use separate fields below)',
        },
        description: {
          type: 'string',
          description: 'Issue description (do NOT repeat the summary/title here - YouTrack displays them separately)',
        },
        type: {
          type: 'string',
          description: 'Issue type (Bug, Feature, Task, etc.) - use this field instead of prefixing the title',
        },
        priority: {
          type: 'string',
          description: 'Issue priority (Critical, High, Normal, Low) - use this field instead of prefixing the title',
        },
      },
      required: ['summary'],
    },
  },
  {
    name: 'query_issues',
    description: `📝 Basic YouTrack query using raw YouTrack syntax (for advanced users familiar with YouTrack query language).

USAGE EXAMPLES:
• All open issues: {"query": "state: Open"}
• Project issues: {"query": "project: PROJECT-1 state: Open"}
• Complex syntax: {"query": "priority: {High Critical} -state: Resolved assignee: me"}
• Text search: {"query": "#bug priority: High"}

⚠️ IMPORTANT: YouTrack cannot query states with spaces (e.g., "In Progress", "To Verify"). Only use states without spaces like "Open", "Done", "Duplicate".

💡 TIP: For structured queries with better validation and performance, use 'advanced_query_issues' instead!`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: `YouTrack query syntax string. Examples:
• "state: Open" - All open issues
• "project: PROJECT-1 assignee: me" - My issues in project
• "priority: High created: >2025-01-01" - High priority recent issues
• "#bug -state: Resolved" - Open bugs (full-text search)`,
        },
        fields: {
          type: 'string',
          description: 'Comma-separated field names to return. Example: "id,summary,state,priority" or "id,summary,description,assignee,created"',
          default: 'id,summary,description,state,priority,reporter,assignee',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of issues to return (1-1000, default: 50)',
          default: 50,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'advanced_query_issues',
    description: `🚀 Advanced issue querying with structured filters, sorting, and performance optimization.

USAGE EXAMPLES:
• Find unassigned high priority issues:
  { "filters": [{"field": "assignee", "operator": "isEmpty", "value": null}, {"field": "priority", "operator": "equals", "value": "High"}] }

• Recent issues with multiple states (auto-filters invalid states):
  { "filters": [{"field": "state", "operator": "in", "value": ["Open", "Done"]}, {"field": "created", "operator": "greater", "value": "2025-01-01"}] }

• Search with sorting and pagination:
  { "textSearch": "bug", "sorting": [{"field": "priority", "direction": "desc"}], "pagination": {"limit": 20} }

⚠️ STATE LIMITATION: YouTrack cannot query states with spaces. The system automatically filters out invalid states like "In Progress" and "To Verify", keeping only valid ones like "Open", "Done", "Duplicate".

FEATURES: ✅ 10+ operators ✅ Performance monitoring ✅ Intelligent caching ✅ Query validation ✅ Auto-filtering invalid states`,
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Project ID to filter by (RECOMMENDED for performance - e.g., "PROJECT-1")',
        },
        filters: {
          type: 'array',
          description: `Array of structured filters. Examples:
• {"field": "state", "operator": "equals", "value": "Open"}
• {"field": "priority", "operator": "in", "value": ["High", "Critical"]}
• {"field": "assignee", "operator": "isEmpty", "value": null}
• {"field": "created", "operator": "greater", "value": "2025-01-01"}`,
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', description: 'Field name: state, priority, assignee, reporter, created, updated, type, summary, description' },
              operator: { 
                type: 'string', 
                enum: ['equals', 'contains', 'startsWith', 'endsWith', 'in', 'notIn', 'greater', 'less', 'between', 'isEmpty', 'isNotEmpty'],
                description: 'Operator: equals (exact match), contains (text search), in (multiple values), isEmpty (no value), greater/less (dates/numbers), between (ranges)'
              },
              value: { description: 'Filter value: string for text, array for "in" operator, null for isEmpty, date string for date fields' },
              negate: { type: 'boolean', description: 'Set to true to negate the condition (e.g., NOT equals)' }
            },
            required: ['field', 'operator', 'value']
          }
        },
        textSearch: {
          type: 'string',
          description: 'Full-text search query (searches across summary and description). Example: "authentication bug" will find issues containing these words',
        },
        sorting: {
          type: 'array',
          description: `Sort results by one or more fields. Examples:
• [{"field": "priority", "direction": "desc"}] - High priority first
• [{"field": "created", "direction": "desc"}] - Newest first
• [{"field": "priority", "direction": "desc"}, {"field": "created", "direction": "asc"}] - Priority then oldest`,
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', description: 'Sort field: priority, created, updated, state, assignee, reporter, summary' },
              direction: { type: 'string', enum: ['asc', 'desc'], description: 'asc (ascending/oldest first) or desc (descending/newest first)' }
            },
            required: ['field', 'direction']
          }
        },
        pagination: {
          type: 'object',
          description: 'Control result pagination. Example: {"limit": 50, "offset": 0} gets first 50 results',
          properties: {
            limit: { type: 'integer', description: 'Maximum results per page (1-1000, default: 100)', default: 100 },
            offset: { type: 'integer', description: 'Number of results to skip (for page 2: use limit * 1, page 3: limit * 2, etc.)', default: 0 }
          }
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Custom fields to return. Leave empty for smart defaults. Examples: ["id", "summary", "state", "priority"] or ["id", "summary", "description", "assignee"]',
        },
        includeMetadata: {
          type: 'boolean',
          description: 'Include performance metadata (query time, optimization suggestions, generated query). Useful for debugging and optimization',
          default: false
        }
      }
    },
  },
  {
    name: 'smart_search_issues',
    description: `🔍 Intelligent search with auto-completion and smart defaults for quick issue discovery.

USAGE EXAMPLES:
• Simple text search: {"searchText": "login bug"}
• Project-specific search: {"searchText": "performance", "projectId": "PROJECT-1"}
• Filtered search: {"searchText": "crash", "options": {"stateFilter": ["Open"], "priorityFilter": ["High", "Critical"]}}
• Assigned issues: {"searchText": "feature", "options": {"assigneeFilter": ["john.doe"]}}

PERFECT FOR: Quick searches, user-facing search interfaces, getting started with complex filters`,
    inputSchema: {
      type: 'object',
      properties: {
        searchText: {
          type: 'string',
          description: 'Search text for full-text search across issues. Examples: "login bug", "performance issue", "crash on startup"',
        },
        projectId: {
          type: 'string',
          description: 'Project ID to limit search scope (improves performance). Example: "PROJECT-1", "MYAPP"',
        },
        options: {
          type: 'object',
          description: 'Optional filters to refine the search results',
          properties: {
            includeDescription: { type: 'boolean', description: 'Include full description in results (default: false for faster loading)' },
            stateFilter: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Filter by issue states. ⚠️ Only use states without spaces (e.g., "Open", "Done", not "In Progress"). Examples: ["Open"], ["Open", "Done"], ["Resolved", "Closed"]' 
            },
            priorityFilter: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Filter by priorities. Examples: ["High"], ["High", "Critical"], ["Normal", "Low"]' 
            },
            assigneeFilter: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Filter by assignees using login names. Examples: ["john.doe"], ["alice", "bob"], ["me"] (for current user)' 
            },
            limit: { type: 'integer', description: 'Maximum results to return (1-100, default: 50)', default: 50 }
          }
        }
      },
      required: ['searchText']
    },
  },
  {
    name: 'get_query_suggestions',
    description: `📚 Get comprehensive query syntax help and suggestions for building complex queries.

USAGE EXAMPLES:
• Get general help: {} (no parameters needed)
• Project-specific suggestions: {"projectId": "PROJECT-1"}

RETURNS: Field reference, operator examples, common query patterns, performance tips, and real-world query examples

PERFECT FOR: Learning YouTrack query syntax, discovering available fields, understanding operators, building complex filters`,
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Optional project ID for project-specific field suggestions and examples. Example: "PROJECT-1"',
        }
      }
    },
  },
  {
    name: 'update_issue',
    description: 'Update an existing issue with enhanced field support. Always use separate properties for state, priority, type, etc. - never embed them in the summary.',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to update',
        },
        updates: {
          type: 'object',
          description: 'Fields to update - use separate properties for each field',
          properties: {
            summary: { type: 'string', description: 'Issue title/summary (do not include state, priority, or type prefixes)' },
            description: { type: 'string', description: 'Issue description' },
            state: { 
              type: 'string', 
              description: 'Issue state (e.g., "Open", "In Progress", "Done", "Resolved") - use this field, not the title' 
            },
            priority: { 
              type: 'string', 
              description: 'Issue priority (e.g., "Critical", "High", "Normal", "Low") - use this field, not the title' 
            },
            type: { 
              type: 'string', 
              description: 'Issue type (e.g., "Bug", "Feature", "Task", "Epic") - use this field, not the title' 
            },
            assignee: { 
              type: 'string', 
              description: 'Assignee login (username) or null to unassign' 
            },
            subsystem: { 
              type: 'string', 
              description: 'Subsystem/component name' 
            },
            dueDate: { 
              type: 'string', 
              description: 'Due date in YYYY-MM-DD format' 
            },
            estimation: { 
              type: 'number', 
              description: 'Time estimation in minutes' 
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of tag names'
            }
          },
        },
      },
      required: ['issueId', 'updates'],
    },
  },
  
  // ===========================
  // CRITICAL: STATE MANAGEMENT TOOLS
  // ===========================
  {
    name: 'change_issue_state',
    description: 'Change the state of an issue with automatic workflow validation. CRITICAL for completing work - use this when issues are done!',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to change state for',
        },
        newState: {
          type: 'string',
          description: 'New state (e.g., "In Progress", "Done", "Resolved", "Closed", "Testing")',
        },
        comment: {
          type: 'string',
          description: 'Optional comment explaining the state change (recommended for completion)',
        },
        resolution: {
          type: 'string',
          description: 'Resolution reason when closing/resolving (e.g., "Fixed", "Won\'t fix", "Duplicate")',
        },
      },
      required: ['issueId', 'newState'],
    },
  },
  {
    name: 'complete_issue',
    description: 'Mark an issue as completed with automatic state transition and completion comment. Use this when work is finished!',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to mark as completed',
        },
        completionComment: {
          type: 'string',
          description: 'Comment describing what was completed and how (recommended)',
        },
        resolution: {
          type: 'string',
          description: 'How the issue was resolved (e.g., "Fixed", "Implemented", "Delivered")',
          default: 'Fixed',
        },
        logTime: {
          type: 'string',
          description: 'Time spent on completion (e.g., "2h", "1d", "30m") - optional',
        },
      },
      required: ['issueId'],
    },
  },
  {
    name: 'get_issue_workflow_states',
    description: 'Get all available states for an issue and valid transitions. Use this to see what states are available before changing.',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to get available states for',
        },
        projectId: {
          type: 'string',
          description: 'Project ID (optional - will be determined from issue if not provided)',
        },
      },
      required: ['issueId'],
    },
  },
  {
    name: 'start_working_on_issue',
    description: 'Mark that you are starting work on an issue - changes state to "In Progress" and assigns to you',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to start working on',
        },
        comment: {
          type: 'string',
          description: 'Optional comment about starting work (e.g., "Starting implementation of login feature")',
        },
        estimatedTime: {
          type: 'string',
          description: 'Estimated time to complete (e.g., "4h", "2d", "1w") - optional',
        },
      },
      required: ['issueId'],
    },
  },
  {
    name: 'get_my_active_issues',
    description: 'Get all issues currently assigned to you that are in progress or need attention',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Filter by specific project (optional)',
        },
        includeDetails: {
          type: 'boolean',
          description: 'Include detailed issue information',
          default: true,
        },
      },
    },
  },
  {
    name: 'get_project_issues_summary',
    description: 'Get a summary of issues in a project grouped by state',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_issue_comments',
    description: 'Get comments for a specific issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID',
        },
      },
      required: ['issueId'],
    },
  },
  {
    name: 'add_issue_comment',
    description: 'Add a comment to an issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID',
        },
        text: {
          type: 'string',
          description: 'Comment text (supports Markdown)',
        },
      },
      required: ['issueId', 'text'],
    },
  },
  {
    name: 'search_users',
    description: 'Search for users in YouTrack',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for users',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'bulk_update_issues',
    description: 'Update multiple issues at once',
    inputSchema: {
      type: 'object',
      properties: {
        issueIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of issue IDs to update',
        },
        updates: {
          type: 'object',
          description: 'Fields to update for all issues',
          properties: {
            state: { type: 'string' },
            assignee: { type: 'string' },
            priority: { type: 'string' },
          },
        },
      },
      required: ['issueIds', 'updates'],
    },
  },

  // Milestone Management Tools
  {
    name: 'create_milestone',
    description: 'Create a project milestone with target date and success criteria',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID (optional if PROJECT_ID is set in environment)',
        },
        name: {
          type: 'string',
          description: 'Milestone name',
        },
        description: {
          type: 'string',
          description: 'Milestone description and objectives',
        },
        targetDate: {
          type: 'string',
          description: 'Target completion date in YYYY-MM-DD format',
        },
        criteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Success criteria for the milestone',
        },
      },
      required: ['name', 'targetDate'],
    },
  },
  {
    name: 'assign_issues_to_milestone',
    description: 'Assign multiple issues to a milestone for tracking and progress monitoring',
    inputSchema: {
      type: 'object',
      properties: {
        milestoneId: {
          type: 'string',
          description: 'The milestone ID',
        },
        issueIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of issue IDs to assign to the milestone',
        },
      },
      required: ['milestoneId', 'issueIds'],
    },
  },
  {
    name: 'get_milestone_progress',
    description: 'Get detailed milestone progress including completion percentage, timeline analysis, risks, and recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        milestoneId: {
          type: 'string',
          description: 'The milestone ID',
        },
      },
      required: ['milestoneId'],
    },
  },

  // Time Tracking Tools
  {
    name: 'log_work_time',
    description: 'Log work time for an issue with detailed tracking information',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID',
        },
        duration: {
          type: 'string',
          description: 'Time duration (e.g., "2h 30m", "1d", "45m", "1.5h")',
        },
        date: {
          type: 'string',
          description: 'Work date in YYYY-MM-DD format (defaults to today)',
        },
        description: {
          type: 'string',
          description: 'Description of work performed',
        },
        workType: {
          type: 'string',
          description: 'Type of work (Development, Testing, Documentation, etc.)',
        },
      },
      required: ['issueId', 'duration'],
    },
  },
  // PHASE 1: REPORTS & ENHANCED TIMESHEET TOOLS
  {
    name: 'get_time_tracking_report',
    description: 'Get time tracking report for a project or user within a date range',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID (optional if userId specified)',
        },
        userId: {
          type: 'string',
          description: 'User ID to filter by (optional if projectId specified)',
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
        groupBy: {
          type: 'string',
          description: 'Group results by: user, issue, date, or workType',
          enum: ['user', 'issue', 'date', 'workType'],
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'get_user_timesheet',
    description: 'Get detailed timesheet for a specific user',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID or login',
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
        includeDetails: {
          type: 'boolean',
          description: 'Include detailed work item information',
        },
      },
      required: ['userId', 'startDate', 'endDate'],
    },
  },
  {
    name: 'get_project_statistics',
    description: 'Get comprehensive project statistics and metrics',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        startDate: {
          type: 'string',
          description: 'Start date for period analysis (optional)',
        },
        endDate: {
          type: 'string',
          description: 'End date for period analysis (optional)',
        },
        includeTimeTracking: {
          type: 'boolean',
          description: 'Include time tracking statistics',
        },
      },
      required: ['projectId'],
    },
  },

  // ========================
  // PHASE 2: AGILE BOARDS
  // ========================
  {
    name: 'list_agile_boards',
    description: 'List all available agile boards with optional project filtering',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Filter boards by project ID (optional)',
        },
        includeDetails: {
          type: 'boolean',
          description: 'Include detailed board information including sprints and columns',
        },
      },
    },
  },
  {
    name: 'get_board_details',
    description: 'Get detailed information about a specific agile board',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'string',
          description: 'The agile board ID',
        },
        includeColumns: {
          type: 'boolean',
          description: 'Include board column configuration',
        },
        includeSprints: {
          type: 'boolean',
          description: 'Include sprint information',
        },
      },
      required: ['boardId'],
    },
  },
  {
    name: 'list_sprints',
    description: 'List sprints for an agile board with filtering options',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'string',
          description: 'The agile board ID',
        },
        includeArchived: {
          type: 'boolean',
          description: 'Include archived sprints in the results',
        },
        includeIssues: {
          type: 'boolean',
          description: 'Include issues assigned to each sprint',
        },
      },
      required: ['boardId'],
    },
  },
  {
    name: 'get_sprint_details',
    description: 'Get detailed information about a specific sprint including metrics',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'string',
          description: 'The agile board ID',
        },
        sprintId: {
          type: 'string',
          description: 'The sprint ID',
        },
        includeIssues: {
          type: 'boolean',
          description: 'Include detailed issue information and metrics',
        },
      },
      required: ['boardId', 'sprintId'],
    },
  },
  {
    name: 'create_sprint',
    description: `🏃‍♂️ Create a new sprint in an agile board.

USAGE EXAMPLES:
• Basic sprint: {"boardId": "181-20", "name": "Sprint 1"}
• Scheduled sprint: {"boardId": "181-20", "name": "Phase 1", "start": "2025-08-01", "finish": "2025-08-15"}
• Quick sprint: {"boardId": "181-20", "name": "Hotfix Sprint", "start": "2025-07-28"}

💡 TIP: Get board ID from list_agile_boards tool first!`,
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'string',
          description: 'The agile board ID where the sprint will be created. Example: "181-20"',
        },
        name: {
          type: 'string',
          description: 'Sprint name. Examples: "Sprint 1", "Phase 1", "Release 2.0 Sprint"',
        },
        start: {
          type: 'string',
          description: 'Sprint start date in YYYY-MM-DD format. Example: "2025-08-01"',
        },
        finish: {
          type: 'string',
          description: 'Sprint end date in YYYY-MM-DD format. Example: "2025-08-15"',
        },
      },
      required: ['boardId', 'name'],
    },
  },
  {
    name: 'assign_issue_to_sprint',
    description: `🎯 Assign an issue to a specific sprint.

USAGE EXAMPLES:
• Simple assignment: {"issueId": "3-357", "sprintId": "184-21"}
• With board ID: {"issueId": "INT-123", "sprintId": "184-21", "boardId": "181-20"}

⚠️ IMPORTANT: Use actual YouTrack sprint IDs (like "184-21"), not custom names!
💡 TIP: Use get_board_details to see available sprints first!`,
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to assign. Examples: "3-357", "INT-123", "PROJECT-456"',
        },
        sprintId: {
          type: 'string',
          description: 'The actual YouTrack sprint ID (NOT custom name). Examples: "184-21", "185-20". Get this from get_board_details!',
        },
        boardId: {
          type: 'string',
          description: 'The agile board ID (optional, will auto-detect if not provided). Example: "181-20"',
        },
      },
      required: ['issueId', 'sprintId'],
    },
  },
  {
    name: 'remove_issue_from_sprint',
    description: 'Remove an issue from its current sprint',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to remove from sprint',
        },
        sprintId: {
          type: 'string',
          description: 'The sprint ID (optional, for reference)',
        },
      },
      required: ['issueId'],
    },
  },
  {
    name: 'get_sprint_progress',
    description: 'Get comprehensive sprint progress metrics and burndown data',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'string',
          description: 'The agile board ID',
        },
        sprintId: {
          type: 'string',
          description: 'The sprint ID',
        },
        includeBurndown: {
          type: 'boolean',
          description: 'Include burndown chart data points',
        },
      },
      required: ['boardId', 'sprintId'],
    },
  },

  // ===========================
  // PHASE 3: KNOWLEDGE BASE
  // ===========================
  {
    name: 'list_articles',
    description: 'List all knowledge base articles with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Filter articles by project ID (optional)',
        },
        query: {
          type: 'string',
          description: 'Search query for filtering articles (optional)',
        },
        includeContent: {
          type: 'boolean',
          description: 'Include full article content in the response',
        },
      },
    },
  },
  {
    name: 'get_article',
    description: 'Get detailed information about a specific knowledge base article',
    inputSchema: {
      type: 'object',
      properties: {
        articleId: {
          type: 'string',
          description: 'The article ID',
        },
        includeComments: {
          type: 'boolean',
          description: 'Include article comments and discussions',
        },
      },
      required: ['articleId'],
    },
  },
  {
    name: 'create_article',
    description: 'Create a new knowledge base article. IMPORTANT: Do NOT duplicate the title in the content body - YouTrack displays header fields separately!',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Article title (appears in header - do NOT repeat in content)',
        },
        summary: {
          type: 'string',
          description: 'Brief article summary (optional - appears in header, do NOT repeat in content)',
        },
        content: {
          type: 'string',
          description: 'Full article content (supports Markdown). CRITICAL: Do NOT include the title or summary here as they appear separately in YouTrack UI',
        },
        projectId: {
          type: 'string',
          description: 'Project to associate the article with (optional if PROJECT_ID is set in environment)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorizing the article (optional)',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'update_article',
    description: 'Update an existing knowledge base article. IMPORTANT: Do NOT duplicate header fields in content body',
    inputSchema: {
      type: 'object',
      properties: {
        articleId: {
          type: 'string',
          description: 'The article ID to update',
        },
        title: {
          type: 'string',
          description: 'New article title (optional - displayed separately from content)',
        },
        summary: {
          type: 'string',
          description: 'New article summary (optional - displayed separately from content)',
        },
        content: {
          type: 'string',
          description: 'New article content (optional). CRITICAL: Do NOT include title or summary here - they appear separately in YouTrack',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags for the article (optional)',
        },
      },
      required: ['articleId'],
    },
  },
  {
    name: 'delete_article',
    description: 'Delete a knowledge base article',
    inputSchema: {
      type: 'object',
      properties: {
        articleId: {
          type: 'string',
          description: 'The article ID to delete',
        },
      },
      required: ['articleId'],
    },
  },
  {
    name: 'search_articles',
    description: 'Search knowledge base articles with advanced filtering',
    inputSchema: {
      type: 'object',
      properties: {
        searchTerm: {
          type: 'string',
          description: 'Text to search for in article title, summary, and content',
        },
        projectId: {
          type: 'string',
          description: 'Filter by project ID (optional)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by specific tags (optional)',
        },
        includeContent: {
          type: 'boolean',
          description: 'Include full article content in search and results',
        },
      },
      required: ['searchTerm'],
    },
  },
  {
    name: 'get_articles_by_tag',
    description: 'Get all articles that have a specific tag (category functionality)',
    inputSchema: {
      type: 'object',
      properties: {
        tag: {
          type: 'string',
          description: 'The tag name to filter by',
        },
        projectId: {
          type: 'string',
          description: 'Filter by project ID (optional)',
        },
        includeContent: {
          type: 'boolean',
          description: 'Include full article content in the response',
        },
      },
      required: ['tag'],
    },
  },
  {
    name: 'get_knowledge_base_stats',
    description: 'Get comprehensive statistics about the knowledge base',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Filter statistics by project ID (optional)',
        },
      },
    },
  },
  {
    name: 'link_sub_article',
    description: 'Link an existing article as a sub-article to a parent article for hierarchical organization',
    inputSchema: {
      type: 'object',
      properties: {
        parentArticleId: {
          type: 'string',
          description: 'The parent article ID',
        },
        childArticleId: {
          type: 'string',
          description: 'The child article ID to link as sub-article',
        },
      },
      required: ['parentArticleId', 'childArticleId'],
    },
  },
  {
    name: 'get_sub_articles',
    description: 'Get all sub-articles of a parent article for hierarchical navigation',
    inputSchema: {
      type: 'object',
      properties: {
        parentArticleId: {
          type: 'string',
          description: 'The parent article ID',
        },
        includeContent: {
          type: 'boolean',
          description: 'Include full article content in the response',
        },
      },
      required: ['parentArticleId'],
    },
  },
  {
    name: 'link_articles_with_fallback',
    description: 'Link two articles as parent-child with automatic fallback to content-based linking if API fails',
    inputSchema: {
      type: 'object',
      properties: {
        parentId: {
          type: 'string',
          description: 'The parent article ID',
        },
        childId: {
          type: 'string',
          description: 'The child article ID',
        },
        fallbackToContent: {
          type: 'boolean',
          description: 'Whether to fallback to content-based linking if API linking fails',
          default: true,
        },
      },
      required: ['parentId', 'childId'],
    },
  },
  {
    name: 'get_article_hierarchy',
    description: 'Get comprehensive article hierarchy including parent, children, and siblings from content links',
    inputSchema: {
      type: 'object',
      properties: {
        articleId: {
          type: 'string',
          description: 'The article ID to analyze hierarchy for',
        },
      },
      required: ['articleId'],
    },
  },
  {
    name: 'create_article_group',
    description: 'Create multiple related articles with automatic parent-child linking (simple batch operation)',
    inputSchema: {
      type: 'object',
      properties: {
        articles: {
          type: 'array',
          description: 'Array of articles to create',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Article title',
              },
              content: {
                type: 'string',
                description: 'Article content',
              },
              tags: {
                type: 'array',
                description: 'Article tags',
                items: { type: 'string' },
              },
              parentIndex: {
                type: 'number',
                description: 'Index of the parent article in this array (optional)',
              },
            },
            required: ['title', 'content'],
          },
        },
        projectId: {
          type: 'string',
          description: 'The project ID to create articles in',
        },
      },
      required: ['articles', 'projectId'],
    },
  },

  // =====================================================
  // PHASE 4: GANTT CHARTS & ADVANCED PROJECT MANAGEMENT
  // =====================================================
  {
    name: 'create_gantt_dependency',
    description: 'Create issue dependency with specific relationship type (Finish-to-Start, Start-to-Start, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        sourceIssueId: {
          type: 'string',
          description: 'The source issue ID',
        },
        targetIssueId: {
          type: 'string',
          description: 'The target issue ID',
        },
        dependencyType: {
          type: 'string',
          enum: ['FS', 'SS', 'FF', 'SF'],
          description: 'Dependency type: FS (Finish-to-Start), SS (Start-to-Start), FF (Finish-to-Finish), SF (Start-to-Finish)',
          default: 'FS',
        },
        lag: {
          type: 'number',
          description: 'Lag time in days (positive) or lead time (negative)',
          default: 0,
        },
        constraint: {
          type: 'string',
          enum: ['hard', 'soft'],
          description: 'Constraint type: hard (must be enforced) or soft (preferred)',
          default: 'hard',
        },
      },
      required: ['sourceIssueId', 'targetIssueId'],
    },
  },
  {
    name: 'analyze_resource_conflicts',
    description: 'Analyze resource conflicts and overallocations across project timeline',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID to analyze',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_enhanced_critical_path',
    description: 'Get enhanced critical path analysis with bottlenecks, slack times, and optimization suggestions',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        targetMilestone: {
          type: 'string',
          description: 'Target milestone issue ID (optional)',
        },
        includeSlack: {
          type: 'boolean',
          description: 'Include slack time analysis for all tasks',
          default: false,
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_project_timeline',
    description: 'Get project timeline/Gantt chart data with issue dependencies and scheduling',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        startDate: {
          type: 'string',
          description: 'Start date for timeline (YYYY-MM-DD format, optional)',
        },
        endDate: {
          type: 'string',
          description: 'End date for timeline (YYYY-MM-DD format, optional)',
        },
        includeCompleted: {
          type: 'boolean',
          description: 'Include completed issues in timeline',
          default: false,
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_issue_dependency',
    description: 'Create a dependency relationship between two issues',
    inputSchema: {
      type: 'object',
      properties: {
        sourceIssueId: {
          type: 'string',
          description: 'The issue that depends on another (source)',
        },
        targetIssueId: {
          type: 'string',
          description: 'The issue that is depended upon (target)',
        },
        linkType: {
          type: 'string',
          description: 'Type of dependency link (default: "Depends")',
          default: 'Depends',
        },
      },
      required: ['sourceIssueId', 'targetIssueId'],
    },
  },
  {
    name: 'get_issue_dependencies',
    description: 'Get all dependencies for a specific issue including blocking and blocked relationships',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to analyze dependencies for',
        },
        includeTransitive: {
          type: 'boolean',
          description: 'Include transitive dependencies (dependencies of dependencies)',
          default: false,
        },
      },
      required: ['issueId'],
    },
  },
  {
    name: 'get_critical_path',
    description: 'Analyze critical path for project completion and identify bottlenecks',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        targetIssueId: {
          type: 'string',
          description: 'Specific target issue to analyze path to (optional)',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_resource_allocation',
    description: 'Get resource allocation and workload distribution across team members',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        startDate: {
          type: 'string',
          description: 'Start date for allocation analysis (YYYY-MM-DD format, optional)',
        },
        endDate: {
          type: 'string',
          description: 'End date for allocation analysis (YYYY-MM-DD format, optional)',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_epic',
    description: 'Create a new epic to group related issues and track strategic progress',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID (optional if PROJECT_ID is set in environment)',
        },
        summary: {
          type: 'string',
          description: 'Epic summary/title',
        },
        description: {
          type: 'string',
          description: 'Epic description and goals',
        },
        priority: {
          type: 'string',
          description: 'Epic priority (Critical, High, Normal, Low)',
        },
        assignee: {
          type: 'string',
          description: 'Epic owner/assignee login',
        },
        dueDate: {
          type: 'string',
          description: 'Due date in YYYY-MM-DD format',
        },
      },
      required: ['summary'],
    },
  },
  {
    name: 'discover_project_fields',
    description: 'Dynamically discover all custom fields for a specific project including field types, constraints, and available values',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID or shortName to discover fields for',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_project_field_values',
    description: 'Get available values for a specific field in a project (useful for dropdowns and validation)',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID or shortName',
        },
        fieldName: {
          type: 'string',
          description: 'The name of the field to get values for (e.g., "Priority", "State", "Type")',
        },
      },
      required: ['projectId', 'fieldName'],
    },
  },
  {
    name: 'compare_project_fields',
    description: 'Compare field configurations between two projects to identify differences and similarities',
    inputSchema: {
      type: 'object',
      properties: {
        projectId1: {
          type: 'string',
          description: 'First project ID or shortName to compare',
        },
        projectId2: {
          type: 'string',
          description: 'Second project ID or shortName to compare',
        },
      },
      required: ['projectId1', 'projectId2'],
    },
  },
  {
    name: 'get_project_field_schema',
    description: 'Get field schema for a project organized by categories (required/optional) - useful for dynamic form generation',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID or shortName to get schema for',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_all_project_fields_summary',
    description: 'Get summary of all discovered project fields across all projects accessed so far',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'generate_gantt_chart',
    description: 'Generate comprehensive Gantt chart with dependencies, critical path analysis, and resource allocation for project timeline visualization',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID or shortName to generate Gantt chart for',
        },
        startDate: {
          type: 'string',
          description: 'Start date for timeline filter (YYYY-MM-DD format, optional)',
        },
        endDate: {
          type: 'string',
          description: 'End date for timeline filter (YYYY-MM-DD format, optional)',
        },
        includeCompleted: {
          type: 'boolean',
          description: 'Include completed issues in the chart (default: true)',
          default: true,
        },
        includeCriticalPath: {
          type: 'boolean',
          description: 'Include critical path analysis (default: true)',
          default: true,
        },
        includeResources: {
          type: 'boolean',
          description: 'Include resource allocation analysis (default: true)',
          default: true,
        },
        hierarchicalView: {
          type: 'boolean',
          description: 'Show hierarchical issue structure (default: false)',
          default: false,
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'route_issue_dependencies',
    description: 'Create and manage sophisticated dependency relationships between issues with circular dependency detection and timeline impact analysis',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID containing the issues',
        },
        sourceIssueId: {
          type: 'string',
          description: 'The source issue ID that depends on or affects the target',
        },
        targetIssueId: {
          type: 'string',
          description: 'The target issue ID that the source depends on or affects',
        },
        dependencyType: {
          type: 'string',
          enum: ['FS', 'SS', 'FF', 'SF'],
          description: 'Dependency type: FS (Finish-to-Start), SS (Start-to-Start), FF (Finish-to-Finish), SF (Start-to-Finish)',
          default: 'FS',
        },
        lag: {
          type: 'number',
          description: 'Number of days lag time between dependencies (can be negative for lead time)',
          default: 0,
        },
        constraint: {
          type: 'string',
          enum: ['hard', 'soft'],
          description: 'Constraint type: hard (must be respected) or soft (preferred but flexible)',
          default: 'hard',
        },
      },
      required: ['projectId', 'sourceIssueId', 'targetIssueId'],
    },
  },
  {
    name: 'analyze_dependency_network',
    description: 'Analyze project dependency network topology, identify bottlenecks, clusters, and generate health metrics for complex project structures',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID to analyze dependency network for',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'calculate_critical_path',
    description: 'Perform detailed critical path analysis to identify the longest sequence of dependent activities and potential project bottlenecks',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID to analyze critical path for',
        },
        targetIssueId: {
          type: 'string',
          description: 'Specific target issue to analyze path to (optional)',
        },
      },
      required: ['projectId'],
    },
  },
  
  // Batch dependency routing
  {
    name: 'route_multiple_dependencies',
    description: 'Route multiple issue dependencies in batch with circular dependency validation',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID'
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceIssueId: {
                type: 'string',
                description: 'Source issue ID that depends on target'
              },
              targetIssueId: {
                type: 'string', 
                description: 'Target issue ID that source depends on'
              },
              dependencyType: {
                type: 'string',
                enum: ['FS', 'SS', 'FF', 'SF'],
                description: 'Dependency type: FS (Finish-to-Start), SS (Start-to-Start), FF (Finish-to-Finish), SF (Start-to-Finish)'
              },
              lag: {
                type: 'number',
                description: 'Lag time in days (positive for delay, negative for lead time)'
              },
              constraint: {
                type: 'string',
                enum: ['hard', 'soft'],
                description: 'Constraint type for dependency enforcement'
              }
            },
            required: ['sourceIssueId', 'targetIssueId', 'dependencyType']
          },
          description: 'Array of dependencies to create'
        },
        validateCircular: {
          type: 'boolean',
          description: 'Whether to validate for circular dependencies before creating links'
        }
      },
      required: ['projectId', 'dependencies']
    },
  },
];
