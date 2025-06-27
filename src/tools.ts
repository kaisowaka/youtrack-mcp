export const toolDefinitions = [
  {
    name: 'get_project_status',
    description: 'Get current status and statistics of a YouTrack project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        includeIssues: {
          type: 'boolean',
          description: 'Include issue statistics',
          default: true,
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
    description: 'Update an existing issue in YouTrack',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to update',
        },
        updates: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            summary: { type: 'string' },
            description: { type: 'string' },
            state: { type: 'string' },
            assignee: { type: 'string' },
            priority: { type: 'string' },
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
];
