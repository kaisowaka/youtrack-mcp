// Enhanced tools for comprehensive project management
export const enhancedToolDefinitions = [
  // Epic Management
  {
    name: 'create_epic',
    description: 'Create a new epic to group related issues',
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
          description: 'Epic description',
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
    description: 'Link an issue to an epic as a child story',
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
    description: 'Get progress report for an epic including all child issues',
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

  // Milestone Management
  {
    name: 'create_milestone',
    description: 'Create a project milestone with target date and goals',
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
          description: 'Milestone description and goals',
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
    description: 'Assign multiple issues to a milestone',
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
          description: 'Array of issue IDs to assign',
        },
      },
      required: ['milestoneId', 'issueIds'],
    },
  },
  {
    name: 'get_milestone_progress',
    description: 'Get milestone progress including completion percentage and blocking issues',
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

  // Time Tracking
  {
    name: 'log_work_time',
    description: 'Log work time for an issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID',
        },
        duration: {
          type: 'string',
          description: 'Time duration (e.g., "2h 30m", "1d", "45m")',
        },
        date: {
          type: 'string',
          description: 'Work date in YYYY-MM-DD format (defaults to today)',
        },
        description: {
          type: 'string',
          description: 'Work description',
        },
        workType: {
          type: 'string',
          description: 'Type of work (Development, Testing, Design, etc.)',
        },
      },
      required: ['issueId', 'duration'],
    },
  },
  {
    name: 'get_time_report',
    description: 'Generate time tracking report for project or user',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Project ID (optional if userId provided)',
        },
        userId: {
          type: 'string',
          description: 'User ID (optional if projectId provided)',
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
          enum: ['user', 'issue', 'workType', 'date'],
          description: 'How to group the report',
          default: 'issue',
        },
      },
    },
  },

  // Advanced Analytics
  {
    name: 'get_project_velocity',
    description: 'Calculate team velocity based on completed story points or issues',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        periodWeeks: {
          type: 'integer',
          description: 'Number of weeks to analyze',
          default: 4,
        },
        metricType: {
          type: 'string',
          enum: ['issues', 'storyPoints'],
          description: 'Velocity metric type',
          default: 'issues',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_burndown_chart_data',
    description: 'Generate burndown chart data for sprint or milestone',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        sprintId: {
          type: 'string',
          description: 'Sprint/iteration ID (optional)',
        },
        milestoneId: {
          type: 'string',
          description: 'Milestone ID (optional)',
        },
        startDate: {
          type: 'string',
          description: 'Sprint start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'Sprint end date in YYYY-MM-DD format',
        },
      },
      required: ['projectId', 'startDate', 'endDate'],
    },
  },
  {
    name: 'analyze_cycle_time',
    description: 'Analyze cycle time for issues from creation to completion',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        issueType: {
          type: 'string',
          description: 'Filter by issue type (Bug, Feature, Task, etc.)',
        },
        periodDays: {
          type: 'integer',
          description: 'Number of days to analyze',
          default: 30,
        },
      },
      required: ['projectId'],
    },
  },

  // Team Management
  {
    name: 'get_team_workload',
    description: 'Analyze current workload distribution across team members',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        teamMembers: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of team member logins (optional - gets all if not specified)',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'suggest_issue_assignment',
    description: 'AI-powered suggestion for optimal issue assignment based on workload and skills',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to assign',
        },
        considerFactors: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['workload', 'skills', 'history', 'availability'],
          },
          description: 'Factors to consider in assignment suggestion',
          default: ['workload', 'skills'],
        },
      },
      required: ['issueId'],
    },
  },
  {
    name: 'get_team_performance_metrics',
    description: 'Get comprehensive team performance analytics',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        periodWeeks: {
          type: 'integer',
          description: 'Number of weeks to analyze',
          default: 4,
        },
        includeIndividual: {
          type: 'boolean',
          description: 'Include individual member metrics',
          default: true,
        },
      },
      required: ['projectId'],
    },
  },

  // Risk & Quality Management
  {
    name: 'assess_project_risks',
    description: 'Analyze project for potential risks and bottlenecks',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        riskCategories: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['schedule', 'quality', 'scope', 'team', 'technical'],
          },
          description: 'Risk categories to analyze',
          default: ['schedule', 'quality', 'scope'],
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'generate_quality_report',
    description: 'Generate comprehensive quality metrics report',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        includeBugRatio: {
          type: 'boolean',
          description: 'Include bug-to-feature ratio analysis',
          default: true,
        },
        includeResolutionTime: {
          type: 'boolean',
          description: 'Include average resolution time analysis',
          default: true,
        },
        periodDays: {
          type: 'integer',
          description: 'Number of days to analyze',
          default: 30,
        },
      },
      required: ['projectId'],
    },
  },

  // Integration Tools
  {
    name: 'link_git_commit',
    description: 'Link a Git commit to an issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID',
        },
        commitHash: {
          type: 'string',
          description: 'Git commit hash',
        },
        repository: {
          type: 'string',
          description: 'Repository name/URL',
        },
        branch: {
          type: 'string',
          description: 'Branch name',
        },
        message: {
          type: 'string',
          description: 'Commit message',
        },
      },
      required: ['issueId', 'commitHash', 'repository'],
    },
  },
  {
    name: 'track_deployment',
    description: 'Track deployment status for issues',
    inputSchema: {
      type: 'object',
      properties: {
        issueIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of issue IDs in the deployment',
        },
        environment: {
          type: 'string',
          enum: ['development', 'staging', 'production'],
          description: 'Deployment environment',
        },
        version: {
          type: 'string',
          description: 'Version/release number',
        },
        deploymentUrl: {
          type: 'string',
          description: 'Deployment pipeline URL',
        },
        status: {
          type: 'string',
          enum: ['pending', 'deploying', 'success', 'failed'],
          description: 'Deployment status',
        },
      },
      required: ['issueIds', 'environment', 'version', 'status'],
    },
  },

  // Smart Automation
  {
    name: 'create_automation_rule',
    description: 'Create an automation rule for workflow management',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The YouTrack project ID',
        },
        ruleName: {
          type: 'string',
          description: 'Name for the automation rule',
        },
        trigger: {
          type: 'object',
          properties: {
            event: {
              type: 'string',
              enum: ['issue_created', 'issue_updated', 'state_changed', 'comment_added'],
              description: 'Trigger event',
            },
            conditions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Conditions that must be met',
            },
          },
          required: ['event'],
        },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['assign', 'transition', 'comment', 'notify'],
              },
              value: { type: 'string' },
            },
          },
          description: 'Actions to execute when triggered',
        },
      },
      required: ['projectId', 'ruleName', 'trigger', 'actions'],
    },
  },
];
