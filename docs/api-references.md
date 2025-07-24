# API REFERENCES

## YouTrack REST API Integration for MCP

This document outlines the YouTrack REST API endpoints that will be exposed through the MCP (Model Context Protocol) server to AI agents.

### Authentication
- **Permanent Token**: Use `Authorization: Bearer <token>` header
- **OAuth 2.0**: For user-specific access

### Core API Endpoints

#### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/{projectID}` - Get project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/{projectID}` - Update project

#### Issues
- `GET /api/issues` - List issues with query support
- `GET /api/issues/{issueID}` - Get issue details
- `POST /api/issues` - Create new issue
- `PUT /api/issues/{issueID}` - Update issue
- `DELETE /api/issues/{issueID}` - Delete issue

#### Custom Fields
- `GET /api/admin/customFieldSettings/customFields` - List custom fields
- `GET /api/issues/{issueID}/customFields` - Get issue custom fields

### MCP Tool Definitions

#### 1. Get Project Status
```json
{
  "name": "get_project_status",
  "description": "Get current status and statistics of a YouTrack project",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectId": {
        "type": "string",
        "description": "The YouTrack project ID"
      },
      "includeIssues": {
        "type": "boolean",
        "description": "Include issue statistics",
        "default": true
      }
    },
    "required": ["projectId"]
  }
}
```

#### 2. Create Issue
```json
{
  "name": "create_issue",
  "description": "Create a new issue in a YouTrack project",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectId": {
        "type": "string",
        "description": "The YouTrack project ID"
      },
      "summary": {
        "type": "string",
        "description": "Issue summary/title"
      },
      "description": {
        "type": "string",
        "description": "Issue description"
      },
      "type": {
        "type": "string",
        "description": "Issue type (Bug, Feature, Task, etc.)"
      },
      "priority": {
        "type": "string",
        "description": "Issue priority"
      }
    },
    "required": ["projectId", "summary"]
  }
}
```

#### 3. Query Issues
```json
{
  "name": "query_issues",
  "description": "Query issues from YouTrack with filters",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "YouTrack query syntax (e.g., 'project: PROJECT-1 state: Open')"
      },
      "fields": {
        "type": "string",
        "description": "Fields to return (comma-separated)",
        "default": "id,summary,description,state,priority,reporter,assignee"
      },
      "limit": {
        "type": "integer",
        "description": "Maximum number of issues to return",
        "default": 50
      }
    },
    "required": ["query"]
  }
}
```

#### 4. Update Issue
```json
{
  "name": "update_issue",
  "description": "Update an existing issue in YouTrack",
  "inputSchema": {
    "type": "object",
    "properties": {
      "issueId": {
        "type": "string",
        "description": "The issue ID to update"
      },
      "updates": {
        "type": "object",
        "description": "Fields to update",
        "properties": {
          "summary": { "type": "string" },
          "description": { "type": "string" },
          "state": { "type": "string" },
          "assignee": { "type": "string" },
          "priority": { "type": "string" }
        }
      }
    },
    "required": ["issueId", "updates"]
  }
}
```

#### 5. Get Project Issues Summary
```json
{
  "name": "get_project_issues_summary",
  "description": "Get a summary of issues in a project grouped by state",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectId": {
        "type": "string",
        "description": "The YouTrack project ID"
      }
    },
    "required": ["projectId"]
  }
}
```

### Query Syntax Examples

1. **Open issues in project**: `project: PROJECT-1 state: Open`
2. **High priority bugs**: `type: Bug priority: High`
3. **Assigned to user**: `assignee: username`
4. **Created last week**: `created: {Last week}`
5. **Unresolved issues**: `state: -Resolved`

### Field Syntax

Use the `fields` parameter to specify which data to return:
- Basic: `id,summary,state`
- Detailed: `id,summary,description,state,priority,reporter(login,fullName),assignee(login,fullName)`
- With custom fields: `id,summary,customFields(name,value)`

### Pagination

For large result sets:
- Use `$skip` and `$top` parameters
- Example: `GET /api/issues?$skip=0&$top=50`

### Error Handling

Common HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found

### Configuration

The MCP server will need:
1. YouTrack instance URL
2. Authentication token
3. Default project (optional)
4. Field mappings for custom fields

### Usage Example

```typescript
// AI agent can use the MCP tools like this:
const projectStatus = await mcp.callTool('get_project_status', {
  projectId: 'PROJECT-1',
  includeIssues: true
});

const newIssue = await mcp.callTool('create_issue', {
  projectId: 'PROJECT-1',
  summary: 'Fix authentication bug',
  description: 'Users cannot log in with OAuth',
  type: 'Bug',
  priority: 'High'
});
```

