# YouTrack MCP Tool Reference

Complete reference for all MCP tools provided by the YouTrack server.

## Table of Contents

- [Authentication Tools](#authentication-tools)
- [Issue Management Tools](#issue-management-tools)
- [Project Management Tools](#project-management-tools)
- [Agile & Sprint Tools](#agile--sprint-tools)
- [Analytics & Reporting Tools](#analytics--reporting-tools)
- [Time Tracking Tools](#time-tracking-tools)
- [Knowledge Base Tools](#knowledge-base-tools)
- [Administrative Tools](#administrative-tools)
- [Notification Tools](#notification-tools)
- [Query Tools](#query-tools)

---

## Authentication Tools

### `mcp_youtrack_auth`

Manage authentication and connection status.

#### Actions

##### `status` - Check Authentication Status

Check if authenticated and connected to YouTrack.

**Parameters**: None

**Example**:
```json
{
  "action": "status"
}
```

**Response**:
```json
{
  "authenticated": true,
  "url": "https://your-instance.youtrack.cloud",
  "user": "john.doe"
}
```

##### `test` - Validate Token

Test if the current token is valid and has required permissions.

**Parameters**: None

**Example**:
```json
{
  "action": "test"
}
```

---

## Issue Management Tools

### `mcp_youtrack_issues`

Complete issue lifecycle management.

#### Actions

##### `create` - Create New Issue

Create a new issue in a project.

**Parameters**:
- `projectId` (required): Project ID or shortName
- `summary` (required): Issue title
- `description` (optional): Issue description
- `type` (optional): Issue type (Bug, Feature, Task, etc.)
- `priority` (optional): Priority (Critical, High, Normal, Low)
- `assignee` (optional): Assignee username

**Example**:
```json
{
  "action": "create",
  "projectId": "MYPROJ",
  "summary": "API returns 500 error on login",
  "description": "When users try to login with valid credentials, the API returns a 500 error",
  "type": "Bug",
  "priority": "High",
  "assignee": "john.doe"
}
```

**Response**:
```json
{
  "id": "3-123",
  "idReadable": "MYPROJ-123",
  "summary": "API returns 500 error on login",
  "url": "https://your-instance.youtrack.cloud/issue/MYPROJ-123"
}
```

##### `update` - Update Existing Issue

Update one or more fields of an existing issue.

**Parameters**:
- `issueId` (required): Issue ID (e.g., "MYPROJ-123")
- `summary` (optional): New title
- `description` (optional): New description
- `type` (optional): New type
- `priority` (optional): New priority
- `assignee` (optional): New assignee
- `state` (optional): New state

**Example**:
```json
{
  "action": "update",
  "issueId": "MYPROJ-123",
  "priority": "Critical",
  "assignee": "jane.smith"
}
```

##### `get` - Get Issue Details

Retrieve full details of a specific issue.

**Parameters**:
- `issueId` (required): Issue ID

**Example**:
```json
{
  "action": "get",
  "issueId": "MYPROJ-123"
}
```

**Response**:
```json
{
  "id": "3-123",
  "idReadable": "MYPROJ-123",
  "summary": "API returns 500 error on login",
  "description": "...",
  "created": 1704067200000,
  "updated": 1704153600000,
  "reporter": { "login": "john.doe" },
  "assignee": { "login": "jane.smith" },
  "customFields": [
    { "name": "Type", "value": { "name": "Bug" } },
    { "name": "Priority", "value": { "name": "Critical" } },
    { "name": "State", "value": { "name": "In Progress" } }
  ]
}
```

##### `query` - Advanced Search

Search issues using YouTrack Query Language.

**Parameters**:
- `query` (required): YouTrack query string
- `projectId` (optional): Limit to specific project
- `fields` (optional): Comma-separated fields to return

**Example**:
```json
{
  "action": "query",
  "query": "project: MYPROJ Type: Bug Priority: Critical State: Open",
  "fields": "id,summary,priority,state"
}
```

**Query Language Examples**:
- `project: MYPROJ assignee: me` - My issues in project
- `Type: Bug Priority: High` - High-priority bugs
- `created: {This week}` - Issues created this week
- `assignee: john.doe state: -Fixed` - John's open issues
- `has: Assignee` - Issues with assignee
- `#Critical` - Issues with Critical tag

##### `search` - Simple Text Search

Simple text-based search across issue summaries and descriptions.

**Parameters**:
- `query` (required): Search term
- `projectId` (optional): Limit to specific project

**Example**:
```json
{
  "action": "search",
  "query": "login error",
  "projectId": "MYPROJ"
}
```

##### `state` - Change Issue State

Change the state/status of an issue.

**Parameters**:
- `issueId` (required): Issue ID
- `state` (required): New state (e.g., "In Progress", "Resolved")
- `comment` (optional): Comment explaining the change

**Example**:
```json
{
  "action": "state",
  "issueId": "MYPROJ-123",
  "state": "In Review",
  "comment": "Code is ready for review"
}
```

##### `start` - Start Working on Issue

Mark an issue as "In Progress" and optionally assign to self.

**Parameters**:
- `issueId` (required): Issue ID
- `comment` (optional): Starting comment

**Example**:
```json
{
  "action": "start",
  "issueId": "MYPROJ-123",
  "comment": "Starting work on this bug"
}
```

##### `complete` - Mark Issue as Complete

Mark an issue as done/completed/resolved.

**Parameters**:
- `issueId` (required): Issue ID
- `comment` (optional): Completion comment

**Example**:
```json
{
  "action": "complete",
  "issueId": "MYPROJ-123",
  "comment": "Fixed in commit abc123"
}
```

##### `link` - Create Issue Dependency

Create a relationship/dependency between two issues.

**Parameters**:
- `issueId` (required): Source issue ID
- `targetIssueId` (required): Target issue ID
- `linkType` (optional): Link type (default: "relates to")
  - "relates to"
  - "depends on"
  - "duplicates"
  - "subtask of"
  - "parent for"

**Example**:
```json
{
  "action": "link",
  "issueId": "MYPROJ-123",
  "targetIssueId": "MYPROJ-124",
  "linkType": "depends on"
}
```

##### `move` - Move Issue to Another Project

Move an issue from one project to another.

**Parameters**:
- `issueId` (required): Issue ID
- `targetProjectId` (required): Target project ID or shortName

**Example**:
```json
{
  "action": "move",
  "issueId": "MYPROJ-123",
  "targetProjectId": "NEWPROJ"
}
```

### `mcp_youtrack_comments`

Manage issue comments.

#### Actions

##### `get` - List Comments

Get all comments for an issue.

**Parameters**:
- `issueId` (required): Issue ID

**Example**:
```json
{
  "action": "get",
  "issueId": "MYPROJ-123"
}
```

##### `add` - Add Comment

Add a new comment to an issue.

**Parameters**:
- `issueId` (required): Issue ID
- `text` (required): Comment text

**Example**:
```json
{
  "action": "add",
  "issueId": "MYPROJ-123",
  "text": "This issue is blocking the release"
}
```

##### `update` - Update Comment

Edit an existing comment.

**Parameters**:
- `issueId` (required): Issue ID
- `commentId` (required): Comment ID
- `text` (required): New comment text

**Example**:
```json
{
  "action": "update",
  "issueId": "MYPROJ-123",
  "commentId": "1-456",
  "text": "Updated: This is no longer blocking"
}
```

##### `delete` - Delete Comment

Remove a comment from an issue.

**Parameters**:
- `issueId` (required): Issue ID
- `commentId` (required): Comment ID

**Example**:
```json
{
  "action": "delete",
  "issueId": "MYPROJ-123",
  "commentId": "1-456"
}
```

---

## Project Management Tools

### `mcp_youtrack_projects`

Project discovery and management.

#### Actions

##### `list` - List All Projects

Get all accessible projects.

**Parameters**:
- `fields` (optional): Fields to return (default: "id,name,shortName,description")

**Example**:
```json
{
  "action": "list",
  "fields": "id,name,shortName,description,archived"
}
```

**Response**:
```json
[
  {
    "id": "0-1",
    "name": "My Project",
    "shortName": "MYPROJ",
    "description": "Project description",
    "archived": false
  }
]
```

##### `get` - Get Project Details

Get detailed information about a specific project.

**Parameters**:
- `projectId` (required): Project ID or shortName

**Example**:
```json
{
  "action": "get",
  "projectId": "MYPROJ"
}
```

##### `validate` - Validate Project Access

Check if you have access to a project.

**Parameters**:
- `projectId` (required): Project ID or shortName

**Example**:
```json
{
  "action": "validate",
  "projectId": "MYPROJ"
}
```

##### `fields` - List Custom Fields

Get all custom fields configured for a project.

**Parameters**:
- `projectId` (required): Project ID or shortName

**Example**:
```json
{
  "action": "fields",
  "projectId": "MYPROJ"
}
```

##### `status` - Get Project Statistics

Get statistics and metrics for a project.

**Parameters**:
- `projectId` (required): Project ID or shortName

**Example**:
```json
{
  "action": "status",
  "projectId": "MYPROJ"
}
```

---

## Agile & Sprint Tools

### `mcp_youtrack_agile_boards`

Manage agile boards and sprints.

#### Actions

##### `boards` - List All Boards

Get all agile boards.

**Parameters**: None

**Example**:
```json
{
  "action": "boards"
}
```

##### `board_details` - Get Board Details

Get details of a specific board.

**Parameters**:
- `boardId` (required): Board ID

**Example**:
```json
{
  "action": "board_details",
  "boardId": "1-0"
}
```

##### `sprints` - List Sprints

List all sprints for a board.

**Parameters**:
- `boardId` (required): Board ID

**Example**:
```json
{
  "action": "sprints",
  "boardId": "1-0"
}
```

##### `sprint_details` - Get Sprint Details

Get details of a specific sprint.

**Parameters**:
- `boardId` (required): Board ID
- `sprintId` (required): Sprint ID

**Example**:
```json
{
  "action": "sprint_details",
  "boardId": "1-0",
  "sprintId": "2-5"
}
```

##### `create_sprint` - Create New Sprint

Create a new sprint.

**Parameters**:
- `boardId` (required): Board ID
- `name` (required): Sprint name
- `start` (optional): Start date (YYYY-MM-DD)
- `finish` (optional): End date (YYYY-MM-DD)

**Example**:
```json
{
  "action": "create_sprint",
  "boardId": "1-0",
  "name": "Sprint 23",
  "start": "2025-02-01",
  "finish": "2025-02-14"
}
```

##### `assign_issue` - Assign Issue to Sprint

Add an issue to a sprint.

**Parameters**:
- `boardId` (required): Board ID
- `sprintId` (required): Sprint ID
- `issueId` (required): Issue ID

**Example**:
```json
{
  "action": "assign_issue",
  "boardId": "1-0",
  "sprintId": "2-5",
  "issueId": "MYPROJ-123"
}
```

---

## Analytics & Reporting Tools

### `mcp_youtrack_analytics`

Generate reports and analytics.

#### Report Types

##### `project_stats` - Project Statistics

Get comprehensive project statistics.

**Parameters**:
- `projectId` (required): Project ID

**Example**:
```json
{
  "reportType": "project_stats",
  "projectId": "MYPROJ"
}
```

**Response**:
```json
{
  "totalIssues": 150,
  "openIssues": 45,
  "resolvedIssues": 105,
  "byType": {
    "Bug": 60,
    "Feature": 50,
    "Task": 40
  },
  "byPriority": {
    "Critical": 5,
    "High": 20,
    "Normal": 100,
    "Low": 25
  }
}
```

##### `gantt` - Gantt Chart Data

Generate Gantt chart data with tasks, dates, and dependencies.

**Parameters**:
- `projectId` (required): Project ID
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date

**Example**:
```json
{
  "reportType": "gantt",
  "projectId": "MYPROJ"
}
```

**Response**:
```json
{
  "tasks": [
    {
      "id": "MYPROJ-123",
      "name": "Implement feature",
      "start": "2025-01-15",
      "end": "2025-01-20",
      "progress": 50,
      "dependencies": ["MYPROJ-122"]
    }
  ],
  "dependencies": [
    {
      "from": "MYPROJ-122",
      "to": "MYPROJ-123",
      "type": "finish-to-start"
    }
  ]
}
```

##### `critical_path` - Critical Path Analysis

Identify the critical path in project dependencies.

**Parameters**:
- `projectId` (required): Project ID

**Example**:
```json
{
  "reportType": "critical_path",
  "projectId": "MYPROJ"
}
```

##### `time_tracking` - Time Tracking Report

Get time tracking summary.

**Parameters**:
- `projectId` (required): Project ID
- `startDate` (optional): Report start date
- `endDate` (optional): Report end date
- `userId` (optional): Filter by user

**Example**:
```json
{
  "reportType": "time_tracking",
  "projectId": "MYPROJ",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

##### `resource_allocation` - Resource Allocation Report

Analyze team workload and capacity.

**Parameters**:
- `projectId` (required): Project ID

**Example**:
```json
{
  "reportType": "resource_allocation",
  "projectId": "MYPROJ"
}
```

##### `milestone_progress` - Milestone Progress

Track milestone completion.

**Parameters**:
- `projectId` (required): Project ID
- `milestoneId` (optional): Specific milestone

**Example**:
```json
{
  "reportType": "milestone_progress",
  "projectId": "MYPROJ"
}
```

---

## Time Tracking Tools

### `mcp_youtrack_time_tracking`

Log and manage time entries.

#### Actions

##### `log_time` - Log Work Time

Log time spent on an issue.

**Parameters**:
- `issueId` (required): Issue ID
- `duration` (required): Time duration (e.g., "2h", "1d", "30m")
- `description` (optional): Work description
- `date` (optional): Work date (YYYY-MM-DD, default: today)
- `workType` (optional): Work type (Development, Testing, etc.)

**Example**:
```json
{
  "action": "log_time",
  "issueId": "MYPROJ-123",
  "duration": "3h",
  "description": "Implemented login feature",
  "workType": "Development"
}
```

##### `get_time_entries` - List Time Entries

Get all time entries for an issue.

**Parameters**:
- `issueId` (required): Issue ID

**Example**:
```json
{
  "action": "get_time_entries",
  "issueId": "MYPROJ-123"
}
```

##### `get_work_items` - List Work Items

Get all work items for an issue.

**Parameters**:
- `issueId` (required): Issue ID

**Example**:
```json
{
  "action": "get_work_items",
  "issueId": "MYPROJ-123"
}
```

##### `create_work_item` - Create Work Item

Create a new work item with time tracking.

**Parameters**:
- `issueId` (required): Issue ID
- `duration` (required): Time duration
- `description` (optional): Work description
- `date` (optional): Work date
- `workType` (optional): Work type

**Example**:
```json
{
  "action": "create_work_item",
  "issueId": "MYPROJ-123",
  "duration": "2h",
  "description": "Code review",
  "workType": "Review"
}
```

##### `time_reports` - Generate Time Reports

Generate time tracking reports.

**Parameters**:
- `projectId` (optional): Project ID
- `startDate` (optional): Report start date
- `endDate` (optional): Report end date
- `userId` (optional): Filter by user

**Example**:
```json
{
  "action": "time_reports",
  "projectId": "MYPROJ",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

---

## Knowledge Base Tools

### `mcp_youtrack_knowledge_base`

Manage knowledge base articles.

⚠️ **IMPORTANT**: When creating/updating articles, the `title` field becomes the article heading. NEVER include "# Title" in the content field - it will duplicate!

#### Actions

##### `list` - List All Articles

List all articles in the knowledge base.

**Parameters**:
- `projectId` (optional): Filter by project

**Example**:
```json
{
  "action": "list",
  "projectId": "MYPROJ"
}
```

##### `get` - Get Article

Get a specific article by ID.

**Parameters**:
- `articleId` (required): Article ID

**Example**:
```json
{
  "action": "get",
  "articleId": "1-23"
}
```

##### `create` - Create Article

Create a new knowledge base article.

**Parameters**:
- `projectId` (required): Project ID or shortName
- `title` (required): Article title (becomes H1 heading)
- `content` (required): Article content in Markdown (start with ## or body text)
- `summary` (optional): Brief description
- `tags` (optional): Array of tags (note: may be skipped due to API limitations)

**Example**:
```json
{
  "action": "create",
  "projectId": "MYPROJ",
  "title": "API Authentication Guide",
  "content": "## Overview\n\nThis guide explains...\n\n## Steps\n\n1. Generate token\n2. Add to headers",
  "summary": "How to authenticate with our API",
  "tags": ["api", "authentication"]
}
```

✅ **CORRECT Content Format**:
```markdown
## Introduction

This is the content...

## Features

- Feature 1
- Feature 2
```

❌ **WRONG Content Format** (causes duplication):
```markdown
# API Authentication Guide

## Introduction
...
```

##### `update` - Update Article

Update an existing article.

**Parameters**:
- `articleId` (required): Article ID
- `title` (optional): New title
- `content` (optional): New content
- `summary` (optional): New summary

**Example**:
```json
{
  "action": "update",
  "articleId": "1-23",
  "content": "## Updated Content\n\nNew information..."
}
```

##### `delete` - Delete Article

Delete an article.

**Parameters**:
- `articleId` (required): Article ID

**Example**:
```json
{
  "action": "delete",
  "articleId": "1-23"
}
```

##### `search` - Search Articles

Search for articles by keyword.

**Parameters**:
- `searchTerm` (required): Search query
- `projectId` (optional): Filter by project

**Example**:
```json
{
  "action": "search",
  "searchTerm": "authentication",
  "projectId": "MYPROJ"
}
```

---

## Administrative Tools

### `mcp_youtrack_admin`

Administrative operations and bulk updates.

#### Operations

##### `search_users` - Search Users

Find users by query.

**Parameters**:
- `query` (required): Search query

**Example**:
```json
{
  "operation": "search_users",
  "query": "john"
}
```

##### `project_fields` - List Project Custom Fields

Get all custom fields for a project.

**Parameters**:
- `projectId` (required): Project ID

**Example**:
```json
{
  "operation": "project_fields",
  "projectId": "MYPROJ"
}
```

##### `field_values` - Get Field Values

Get available values for a custom field.

**Parameters**:
- `projectId` (required): Project ID
- `fieldName` (required): Field name

**Example**:
```json
{
  "operation": "field_values",
  "projectId": "MYPROJ",
  "fieldName": "Priority"
}
```

##### `bulk_update` - Bulk Update Issues

Update multiple issues at once.

**Parameters**:
- `issueIds` (required): Array of issue IDs
- `updates` (required): Fields to update

**Example**:
```json
{
  "operation": "bulk_update",
  "issueIds": ["MYPROJ-1", "MYPROJ-2", "MYPROJ-3"],
  "updates": {
    "priority": "High",
    "assignee": "john.doe"
  }
}
```

##### `dependencies` - Manage Dependencies

Create or remove issue dependencies.

**Parameters**:
- `sourceIssueId` (required): Source issue
- `targetIssueId` (required): Target issue

**Example**:
```json
{
  "operation": "dependencies",
  "sourceIssueId": "MYPROJ-1",
  "targetIssueId": "MYPROJ-2"
}
```

---

## Notification Tools

### `mcp_youtrack_notifications`

Manage notifications and subscriptions.

#### Actions

##### `status` - Connection Status

Check notification system status.

**Example**:
```json
{
  "action": "status"
}
```

##### `list` - List Notifications

Get recent notifications.

**Parameters**:
- `limit` (optional): Maximum notifications (default: 50)

**Example**:
```json
{
  "action": "list",
  "limit": 20
}
```

##### `clear` - Clear All Notifications

Clear all notifications.

**Example**:
```json
{
  "action": "clear"
}
```

##### `subscribe` - Create Subscription

Create a notification subscription.

**Parameters**:
- `name` (required): Subscription name
- `filters` (optional): Notification filters
- `deliveryMethods` (optional): Delivery methods (default: ["immediate"])
- `enabled` (optional): Whether enabled (default: true)

**Example**:
```json
{
  "action": "subscribe",
  "name": "High Priority Bugs",
  "filters": {
    "project": "MYPROJ",
    "type": "Bug",
    "priority": "High"
  },
  "enabled": true
}
```

##### `unsubscribe` - Remove Subscription

Remove a notification subscription.

**Parameters**:
- `id` (required): Subscription ID

**Example**:
```json
{
  "action": "unsubscribe",
  "id": "sub-123"
}
```

##### `subscriptions` - List Subscriptions

List all active subscriptions.

**Example**:
```json
{
  "action": "subscriptions"
}
```

---

## Query Tools

### `mcp_youtrack_query`

Execute raw YouTrack queries using native syntax.

**Parameters**:
- `query` (required): YouTrack query string
- `fields` (optional): Fields to return (default: "id,summary,description,state,priority,reporter,assignee")
- `limit` (optional): Maximum results (default: 50, max: 1000)

**Example**:
```json
{
  "query": "project: MYPROJ assignee: me state: Open",
  "fields": "id,summary,state,priority,assignee",
  "limit": 100
}
```

**Query Syntax**:

Basic queries:
- `project: MYPROJ` - Issues in project
- `assignee: me` - My issues
- `Type: Bug` - All bugs
- `Priority: High` - High priority issues
- `State: Open` - Open issues

Operators:
- `:` - equals
- `-:` or `-` - not equals (e.g., `state: -Fixed`)
- `>`, `<`, `>=`, `<=` - comparison
- `has:` - field has value (e.g., `has: Assignee`)

Date queries:
- `created: {Today}`
- `updated: {This week}`
- `resolved: {Last month}`
- `created: 2025-01-01 .. 2025-01-31` - Date range

Combine conditions:
- `project: MYPROJ Type: Bug Priority: High State: Open`
- `assignee: john.doe created: {This week}`
- `State: {In Progress} OR State: {Code Review}`

Tags:
- `#Critical` - Issues with Critical tag
- `#Bug #High` - Issues with both tags

**Response**:
```json
{
  "issues": [
    {
      "id": "3-123",
      "idReadable": "MYPROJ-123",
      "summary": "Issue title",
      "state": { "name": "Open" },
      "priority": { "name": "High" },
      "assignee": { "login": "john.doe" }
    }
  ],
  "count": 1
}
```

---

## Common Workflows

### Creating and Managing Issues

```json
// 1. Create issue
{"action": "create", "projectId": "MYPROJ", "summary": "New feature", "type": "Feature"}

// 2. Start working
{"action": "start", "issueId": "MYPROJ-123"}

// 3. Log time
{"action": "log_time", "issueId": "MYPROJ-123", "duration": "2h"}

// 4. Add comment
{"action": "add", "issueId": "MYPROJ-123", "text": "Progress update"}

// 5. Change state
{"action": "state", "issueId": "MYPROJ-123", "state": "In Review"}

// 6. Complete
{"action": "complete", "issueId": "MYPROJ-123", "comment": "Done"}
```

### Sprint Management

```json
// 1. List boards
{"action": "boards"}

// 2. List sprints
{"action": "sprints", "boardId": "1-0"}

// 3. Create sprint
{"action": "create_sprint", "boardId": "1-0", "name": "Sprint 24", "start": "2025-02-01", "finish": "2025-02-14"}

// 4. Assign issues
{"action": "assign_issue", "boardId": "1-0", "sprintId": "2-6", "issueId": "MYPROJ-123"}
```

### Reporting

```json
// 1. Project stats
{"reportType": "project_stats", "projectId": "MYPROJ"}

// 2. Gantt chart
{"reportType": "gantt", "projectId": "MYPROJ"}

// 3. Time tracking
{"reportType": "time_tracking", "projectId": "MYPROJ", "startDate": "2025-01-01", "endDate": "2025-01-31"}

// 4. Resource allocation
{"reportType": "resource_allocation", "projectId": "MYPROJ"}
```

---

## Error Handling

All tools return standardized error responses:

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {...}
}
```

Common error codes:
- `AUTHENTICATION_ERROR` - Invalid token or permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid parameters
- `RATE_LIMIT` - Too many requests
- `NETWORK_ERROR` - Connection issue

---

## Best Practices

1. **Use specific queries** - Narrow searches with project, type, and state filters
2. **Limit results** - Use `limit` parameter to avoid large responses
3. **Enable caching** - Reduces API calls and improves performance
4. **Batch operations** - Use bulk_update for multiple changes
5. **Field selectors** - Request only needed fields
6. **Error handling** - Always check for error responses
7. **Rate limits** - Respect API rate limits, enable caching

---

## Related Documentation

- [Getting Started](./GETTING_STARTED.md) - Setup and configuration
- [Architecture](./ARCHITECTURE.md) - System design
- [Command Syntax Fix](./COMMAND_SYNTAX_FIX.md) - Recent bug fixes
- [Contributing](../CONTRIBUTING.md) - How to contribute

---

**Last Updated**: 2025-01-15
