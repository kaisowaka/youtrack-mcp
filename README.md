# YouTrack MCP Server

An MCP (Model Context Protocol) server that provides YouTrack REST API access to AI agents like GitHub Copilot, enabling real-time project management and issue tracking.

## 🚨 IMPORTANT: Content Duplication Prevention

**Before using this MCP server**, please read the [Content Duplication Guide](./CONTENT_DUPLICATION_GUIDE.md) to avoid common mistakes when creating issues and articles. The server includes automatic validation to warn about title/content duplication that causes display issues in YouTrack.

## Features

- 🔍 **Query and Search Issues**: Use YouTrack's powerful query syntax to find issues
- 📊 **Real-time Project Status**: Get current project statistics and issue distributions  
- ✨ **Create New Issues**: Add issues with full metadata (type, priority, description)
- 📝 **Update Issues**: Modify existing issues (state, assignee, priority, etc.)
- � **Comment Management**: Add and retrieve issue comments
- 👥 **User Search**: Find and search YouTrack users
- 📈 **Project Analytics**: Generate summaries and timeline reports
- 🔄 **Bulk Operations**: Update multiple issues simultaneously
- 🎣 **Webhook Support**: Real-time notifications (optional)
- 💾 **Smart Caching**: Improved performance with intelligent caching
- 📋 **Comprehensive Logging**: Detailed logs for monitoring and debugging

## Quick Start

1. **Clone and install**:
```bash
git clone https://github.com/itsalfredakku/youtrack-mcp.git
cd youtrack-mcp
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your YouTrack URL and token
```

3. **Build and run**:
```bash
npm run build
npm start
```

4. **Validate your content** (optional but recommended):
```bash
# Test article content before creating
npm run validate-content article "API Guide" "REST API guide" "This guide covers..."

# Test issue content before creating  
npm run validate-content issue "Login fails" "Steps to reproduce: 1. Go to login..."
```

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `YOUTRACK_URL` | ✅ | YouTrack instance URL | - |
| `YOUTRACK_TOKEN` | ✅ | Permanent token | - |
| `PROJECT_ID` | ❌ | Default project ID (makes projectId optional for creation tools) | - |
| `ENABLE_WEBHOOKS` | ❌ | Enable webhook server | `false` |
| `WEBHOOK_PORT` | ❌ | Webhook server port | `3000` |
| `WEBHOOK_SECRET` | ❌ | Webhook signature secret | - |
| `LOG_LEVEL` | ❌ | Logging level | `info` |
| `CACHE_ENABLED` | ❌ | Enable caching | `true` |
| `CACHE_TTL` | ❌ | Cache TTL (ms) | `300000` |

### MCP Client Configuration

Add to your MCP settings (e.g., in Cline, Claude Desktop, or other MCP clients):

```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["path/to/youtrack-mcp/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud",
        "YOUTRACK_TOKEN": "your-token"
      }
    }
  }
}
```

## Available Tools

### 1. `get_project_status`
Get current project status including issue statistics.

### 2. `create_issue`
Create new issues with summary, description, type, and priority.

### 3. `query_issues`
Search issues using YouTrack query syntax.

### 4. `update_issue`
Update existing issues (state, assignee, priority, etc.).

### 5. `get_project_issues_summary`
Get aggregated statistics of issues by state, priority, and type.

## Usage Examples

### ✅ Create Issue (Correct Way)
```javascript
create_issue({
  "summary": "Login authentication timeout",  // Clean title only
  "description": "Steps to reproduce:\n1. Go to login page\n2. Enter credentials\n3. Wait 30 seconds...",  // No title repetition
  "type": "Bug",      // Use dedicated field
  "priority": "High"  // Use dedicated field
})
```

### ✅ Create Article (Correct Way)  
```javascript
create_article({
  "title": "API Integration Guide",  // Header field
  "summary": "Complete guide for REST API integration",  // Header field
  "content": "This document covers:\n\n## Prerequisites\n\n## Setup Steps..."  // Content only, no title repetition
})
```

### Query open bugs
```
query_issues({ query: "project: PROJ-1 type: Bug state: Open" })
```

### Create a new feature request
```
create_issue({
  projectId: "PROJ-1",
  summary: "Add dark mode support",
  description: "Users want a dark theme option",
  type: "Feature",
  priority: "Normal"
})
```

### Create issue with default project (when PROJECT_ID is set)
```
# Set PROJECT_ID=PROJ-1 in environment
create_issue({
  summary: "Add dark mode support",
  description: "Users want a dark theme option",
  type: "Feature",
  priority: "Normal"
})
```

### Update issue state
```
update_issue({
  issueId: "PROJ-123",
  updates: {
    state: "In Progress",
    assignee: "john.doe"
  }
})
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT
