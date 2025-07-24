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
    description: 'Create a new issue in a YouTrack project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        summary: {
          type: 'string',
          description: 'Issue summary/title',
        },
        description: {
          type: 'string',
          description: 'Issue description',
        },
        type: {
          type: 'string',
          description: 'Issue type (Bug, Feature, Task, etc.)',
        },
        priority: {
          type: 'string',
          description: 'Issue priority',
        },
      },
      required: ['projectId', 'summary'],
    },
  },
  {
    name: 'query_issues',
    description: 'Query issues from YouTrack with filters',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: "YouTrack query syntax (e.g., 'project: PROJECT-1 state: Open')",
        },
        fields: {
          type: 'string',
          description: 'Fields to return (comma-separated)',
          default: 'id,summary,description,state,priority,reporter,assignee',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of issues to return',
          default: 50,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'update_issue',
    description: 'Update an existing issue with enhanced field support (state, priority, type, assignee, subsystem, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to update',
        },
        updates: {
          type: 'object',
          description: 'Fields to update with enhanced support',
          properties: {
            summary: { type: 'string', description: 'Issue title/summary' },
            description: { type: 'string', description: 'Issue description' },
            state: { 
              type: 'string', 
              description: 'Issue state (e.g., "Open", "In Progress", "Done", "Resolved")' 
            },
            priority: { 
              type: 'string', 
              description: 'Issue priority (e.g., "Critical", "High", "Normal", "Low")' 
            },
            type: { 
              type: 'string', 
              description: 'Issue type (e.g., "Bug", "Feature", "Task", "Epic")' 
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
    name: 'get_project_timeline',
    description: 'Get recent activity timeline for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        days: {
          type: 'integer',
          description: 'Number of days to look back',
          default: 7,
        },
      },
      required: ['projectId'],
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

  // Enhanced Epic & Milestone Management Tools
  {
    name: 'create_epic',
    description: 'Create a new epic to group related issues and track strategic progress',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
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
      required: ['projectId', 'summary'],
    },
  },
  {
    name: 'link_issue_to_epic',
    description: 'Link an existing issue to an epic as a child story',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to link',
        },
        epicId: {
          type: 'string',
          description: 'The epic ID to link to',
        },
      },
      required: ['issueId', 'epicId'],
    },
  },
  {
    name: 'get_epic_progress',
    description: 'Get comprehensive progress report for an epic including all child issues, metrics, and recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        epicId: {
          type: 'string',
          description: 'The epic ID',
        },
      },
      required: ['epicId'],
    },
  },
  {
    name: 'create_milestone',
    description: 'Create a project milestone with target date and success criteria',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
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
      required: ['projectId', 'name', 'targetDate'],
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
    name: 'assign_issue_to_sprint',
    description: 'Assign an issue to a specific sprint',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to assign',
        },
        sprintId: {
          type: 'string',
          description: 'The sprint ID to assign the issue to',
        },
        boardId: {
          type: 'string',
          description: 'The agile board ID (optional)',
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
];
