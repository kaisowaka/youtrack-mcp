// New MCP Tool Definitions for Enhanced API Coverage
// These tools utilize the new domain-specific API clients

export const newToolDefinitions = [
  // ===== AGILE MANAGEMENT TOOLS =====
  {
    name: 'list_agile_boards_enhanced',
    description: '🚀 Enhanced agile board listing with comprehensive filtering and caching. Provides detailed board information including sprints, columns, and project associations.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Filter boards by specific project (optional). Use project shortName or ID.',
        },
        includeDetails: {
          type: 'boolean',
          description: 'Include detailed board information (sprints, columns, current sprint)',
          default: false
        }
      }
    }
  },
  {
    name: 'get_agile_board_configuration',
    description: '⚙️ Get complete agile board configuration including columns, workflow, and metadata. Essential for board analysis and setup.',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'string',
          description: 'The agile board ID to get configuration for'
        },
        includeColumns: {
          type: 'boolean',
          description: 'Include board column configuration and workflow',
          default: true
        },
        includeSprints: {
          type: 'boolean',
          description: 'Include sprint information and metrics',
          default: true
        }
      },
      required: ['boardId']
    }
  },
  {
    name: 'get_board_columns_analysis',
    description: '📊 Analyze board column configuration and workflow structure. Provides insights into board setup and potential optimizations.',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'string',
          description: 'The agile board ID to analyze columns for'
        },
        includeFieldValues: {
          type: 'boolean',
          description: 'Include field value mappings for each column',
          default: false
        }
      },
      required: ['boardId']
    }
  },
  {
    name: 'create_sprint_enhanced',
    description: '🎯 Create a new sprint with enhanced configuration options. Supports date scheduling, goals, and automatic cache management.',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'string',
          description: 'The agile board ID where the sprint will be created'
        },
        name: {
          type: 'string',
          description: 'Sprint name (e.g., "Sprint 1", "Phase 1", "Release 2.0 Sprint")'
        },
        start: {
          type: 'string',
          description: 'Sprint start date in YYYY-MM-DD format (optional)'
        },
        finish: {
          type: 'string',
          description: 'Sprint end date in YYYY-MM-DD format (optional)'
        },
        goal: {
          type: 'string',
          description: 'Sprint goal or objective (optional)'
        }
      },
      required: ['boardId', 'name']
    }
  },
  {
    name: 'manage_sprint_assignments',
    description: '📝 Advanced sprint assignment management. Assign or remove issues from sprints with validation and batch operations.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['assign', 'remove'],
          description: 'Action to perform: assign issue to sprint or remove from sprint'
        },
        issueId: {
          type: 'string',
          description: 'The issue ID to assign or remove'
        },
        sprintId: {
          type: 'string',
          description: 'The sprint ID for the operation'
        },
        boardId: {
          type: 'string',
          description: 'The agile board ID (required for proper assignment)'
        }
      },
      required: ['action', 'issueId', 'sprintId', 'boardId']
    }
  },

  // ===== TIME TRACKING TOOLS =====
  {
    name: 'list_work_items_enhanced',
    description: '⏱️ Comprehensive work item listing with advanced filtering, grouping, and analytics. Perfect for time tracking analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date for work items in YYYY-MM-DD format (optional)'
        },
        endDate: {
          type: 'string',
          description: 'End date for work items in YYYY-MM-DD format (optional)'
        },
        issueId: {
          type: 'string',
          description: 'Filter by specific issue ID (optional)'
        },
        userId: {
          type: 'string',
          description: 'Filter by user ID or login (optional)'
        },
        projectId: {
          type: 'string',
          description: 'Filter by project ID or shortName (optional)'
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of work items to return (default: 100)',
          default: 100
        }
      }
    }
  },
  {
    name: 'get_work_item_analytics',
    description: '📈 Get detailed analytics for a specific work item including context, related items, and time distribution.',
    inputSchema: {
      type: 'object',
      properties: {
        workItemId: {
          type: 'string',
          description: 'The work item ID to analyze'
        }
      },
      required: ['workItemId']
    }
  },
  {
    name: 'log_work_time_enhanced',
    description: '📋 Enhanced work time logging with intelligent duration parsing, work type classification, and validation.',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to log time for'
        },
        duration: {
          type: 'string',
          description: 'Time duration (e.g., "2h 30m", "1.5h", "90m", "1d")'
        },
        description: {
          type: 'string',
          description: 'Description of work performed (optional)'
        },
        date: {
          type: 'string',
          description: 'Work date in YYYY-MM-DD format (defaults to today)'
        },
        workType: {
          type: 'string',
          description: 'Type of work (Development, Testing, Documentation, etc.)'
        }
      },
      required: ['issueId', 'duration']
    }
  },
  {
    name: 'generate_time_tracking_report',
    description: '📊 Generate comprehensive time tracking reports with grouping, analytics, and export options.',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Report start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'Report end date in YYYY-MM-DD format'
        },
        projectId: {
          type: 'string',
          description: 'Filter by project ID or shortName (optional)'
        },
        userId: {
          type: 'string',
          description: 'Filter by specific user (optional)'
        },
        groupBy: {
          type: 'string',
          enum: ['user', 'issue', 'date', 'workType'],
          description: 'Group results by specified dimension',
          default: 'date'
        },
        includeDetails: {
          type: 'boolean',
          description: 'Include detailed work item information',
          default: true
        }
      },
      required: ['startDate', 'endDate']
    }
  },
  {
    name: 'get_issue_time_summary',
    description: '🎯 Get comprehensive time tracking summary for a specific issue including contributor analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The issue ID to get time tracking summary for'
        }
      },
      required: ['issueId']
    }
  },

  // ===== INTEGRATION TOOLS =====
  {
    name: 'validate_api_coverage',
    description: '🔍 Validate current API coverage against OpenAPI specification and identify missing endpoints.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          enum: ['all', 'issues', 'projects', 'agiles', 'workitems', 'admin', 'users'],
          description: 'Domain to validate (default: all)',
          default: 'all'
        },
        includeRecommendations: {
          type: 'boolean',
          description: 'Include improvement recommendations',
          default: true
        }
      }
    }
  },
  {
    name: 'health_check_enhanced',
    description: '❤️ Comprehensive health check including API connectivity, authentication, cache status, and performance metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        includePerformance: {
          type: 'boolean',
          description: 'Include performance metrics and response times',
          default: true
        },
        testEndpoints: {
          type: 'boolean',
          description: 'Test key endpoints for functionality',
          default: false
        }
      }
    }
  }
];

// Export combined tool definitions
export const allToolDefinitions = [
  // ... existing toolDefinitions would be imported here
  ...newToolDefinitions
];
