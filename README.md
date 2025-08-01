# YouTrack MCP Server

A comprehensive Model Context Protocol (MCP) server for YouTrack project management. Provides 12 powerful tools for complete project lifecycle management through a single, unified interface.

## ✨ Enterprise Features

🔐 **OAuth2 Authentication**: Browser-based authentication with PKCE security
📱 **Real-Time Notifications**: WebSocket-based live updates from YouTrack
🔔 **Smart Subscriptions**: Customizable notification filters and delivery
🛡️ **Enhanced Security**: Automatic token refresh and secure credential storage

*See [ENTERPRISE-FEATURES.md](ENTERPRISE-FEATURES.md) for complete authentication and notification guide.*

## Features

- **12 Unified Tools**: Clean, intuitive tool names including enterprise authentication and notifications
- **Complete Project Management**: Issues, projects, agile boards, time tracking
- **Enterprise Authentication**: OAuth2 with PKCE + traditional token support
- **Real-Time Updates**: WebSocket notifications with smart filtering
- **Modular Architecture**: Clean TypeScript implementation with domain-specific APIs
- **Advanced Capabilities**: Analytics, reporting, knowledge base management
- **Robust Implementation**: Comprehensive error handling, caching, and retry logic
- **Comprehensive Validation**: Parameter validation, format checking, and smart error suggestions
- **Error Prevention**: Backward compatibility mapping and resource existence verification

## Transformation Story

This MCP server underwent a major architectural transformation to achieve enterprise-grade quality:

**From Complex to Simple**: Originally started with 71+ individual tools with complex interdependencies. Through systematic refactoring, we consolidated these into **12 powerful unified tools** - including enterprise authentication and real-time notifications - a **85% reduction** while adding advanced features.

**From Monolithic to Modular**: Replaced a single massive client with clean, domain-specific API clients (`IssuesAPIClient`, `ProjectsAPIClient`, `AgileAPIClient`, etc.) built on a robust `BaseAPIClient` foundation.

**From Generic to Specialized**: Removed all vendor-specific "enhanced" branding in favor of clean, generic naming that focuses on functionality rather than marketing terms.

**Enterprise Ready**: Achieved 100% test pass rate with comprehensive error handling, intelligent caching, and robust retry logic. The result is a maintainable, scalable MCP server ready for enterprise use.

*See [TRANSFORMATION-SUMMARY.md](TRANSFORMATION-SUMMARY.md) for detailed technical transformation details.*

## Available Tools

### 🔐 Enterprise Authentication
- **`auth_manage`** - OAuth2 browser authentication, token management, status
- **`notifications`** - Real-time WebSocket notifications from YouTrack
- **`subscriptions`** - Custom notification filters and subscription management

### Core Management
- **`projects`** - Project management (list, details, validation, custom fields)
- **`issues`** - Complete issue lifecycle (create, update, query, state changes)
- **`query`** - Advanced YouTrack query syntax for power users

### Collaboration & Communication
- **`comments`** - Issue comment management (add, edit, delete)
- **`knowledge_base`** - Documentation and article management

### Agile & Planning  
- **`agile_boards`** - Sprint and board management (boards, sprints, assignments)
- **`analytics`** - Project statistics, reports, Gantt charts

### Operations
- **`time_tracking`** - Time logging, work items, reporting
- **`admin`** - User management, bulk operations, system configuration

## Quick Start

### Prerequisites
- Node.js 18+ 
- YouTrack instance with API access
- Valid YouTrack permanent token

### Installation

1. **Clone and Setup**
   ```bash
   git clone https://github.com/itsalfredakku/youtrack-mcp.git
   cd youtrack-mcp
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your YouTrack details
   ```

3. **Build and Test**
   ```bash
   npm run build
   npm test
   ```

### Configuration

Create `.env` file with your YouTrack credentials:

```env
YOUTRACK_URL=https://your-instance.youtrack.cloud
YOUTRACK_TOKEN=perm-your-permanent-token
PROJECT_ID=YOUR-PROJECT  # Optional default project
```

### MCP Integration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "servers": {
    "youtrack": {
      "command": "node",
      "args": ["path/to/youtrack-mcp/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud",
        "YOUTRACK_TOKEN": "perm-your-permanent-token",
        "PROJECT_ID": "YOUR-PROJECT"
      }
    }
  }
}
```

## Usage Examples

### Project Management
```
List all projects with details
Get project custom fields
Validate project access
```

### Issue Operations
```
Create new issues with custom fields
Query issues: "state: Open priority: High"
Update issue states with comments
Complete issues with resolution
```

### Time Tracking
```
Log time: "2h development work on authentication"
Get time entries with date filtering
Generate time reports by project/user
```

### Agile Workflows
```
List agile boards and sprints
Assign issues to sprints  
Create new sprints with dates
Track sprint progress
```

## Tool Details

### `projects` Tool
- **Actions**: list, get, validate, fields, status
- **Use Cases**: Project discovery, validation, custom field management
- **Example**: Get all projects with custom field definitions

### `issues` Tool  
- **Actions**: create, update, get, query, search, state, complete, start
- **Use Cases**: Full issue lifecycle management
- **Example**: Create bug with priority, assign to user, set due date

### `query` Tool
- **Format**: Raw YouTrack query syntax
- **Use Cases**: Power user searches, complex filtering
- **Example**: `"project: PROJ state: Open assignee: me created: today"`

### `comments` Tool
- **Actions**: get, add, update, delete
- **Use Cases**: Issue discussion, progress updates
- **Example**: Add resolution comment when closing issue

### `agile_boards` Tool
- **Actions**: boards, board_details, sprints, sprint_details, create_sprint, assign_issue
- **Use Cases**: Sprint planning, agile workflows
- **Example**: Assign issues to current sprint, create new sprint

### `knowledge_base` Tool
- **Actions**: list, get, create, update, delete, search
- **Use Cases**: Documentation, process guides, troubleshooting
- **Example**: Create project documentation, search existing articles

### `analytics` Tool
- **Report Types**: project_stats, time_tracking, gantt, critical_path, resource_allocation, milestone_progress
- **Use Cases**: Project insights, progress tracking, resource planning
- **Example**: Generate Gantt chart for project timeline

### `time_tracking` Tool
- **Actions**: log_time, get_time_entries, update_time_entry, delete_time_entry, get_work_items, create_work_item, update_work_item, time_reports
- **Use Cases**: Time logging, productivity tracking, billing
- **Example**: Log "2h" with description, generate weekly time report

### `admin` Tool
- **Operations**: search_users, project_fields, field_values, bulk_update, dependencies
- **Use Cases**: User management, system configuration, bulk operations
- **Example**: Bulk update multiple issues, manage user permissions

## Architecture

### Clean Design
- **Base Client**: Generic HTTP client with caching and error handling
- **Domain APIs**: Specialized clients for each functional area
- **Response Formatting**: Consistent MCP response structure
- **Type Safety**: Full TypeScript support with proper interfaces

### Key Components
```
src/
├── api/
│   ├── base/
│   │   ├── base-client.ts         # Core HTTP client
│   │   ├── response-formatter.ts  # MCP response formatting
│   │   ├── cache-manager.ts       # Intelligent caching
│   │   └── error-handler.ts       # Robust error handling
│   ├── domains/
│   │   ├── issues-api.ts          # Issue management
│   │   ├── projects-api.ts        # Project operations
│   │   ├── agile-boards-api.ts    # Sprint/board management
│   │   ├── workitems-api.ts       # Time tracking
│   │   ├── knowledge-base-api.ts  # Documentation
│   │   └── admin-api.ts           # Administrative functions
│   └── client.ts                  # Main client factory
├── config.ts                      # Configuration management
├── logger.ts                      # Structured logging
└── index.ts                       # MCP server entry point
```

## Development

### Building
```bash
npm run build       # Compile TypeScript
npm run watch       # Watch mode for development
```

### Testing
```bash
npm test           # Run test queries
npm run verify     # Verify build integrity
```

### Debugging
```bash
# Enable debug logging
DEBUG=youtrack-mcp npm start

# Test specific tool
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"projects","arguments":{"action":"list"}}}' | node dist/index.js
```

## Production Deployment

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

### Environment Variables
- `YOUTRACK_URL` - Your YouTrack instance URL (required)
- `YOUTRACK_TOKEN` - Permanent token with appropriate permissions (required)  
- `PROJECT_ID` - Default project ID for operations (optional)
- `LOG_LEVEL` - Logging level: error, warn, info, debug (default: info)
- `CACHE_TTL` - Cache time-to-live in seconds (default: 300)

### Security Considerations
- Store tokens securely (environment variables, secrets management)
- Use permanent tokens with minimal required permissions
- Enable HTTPS for YouTrack instance
- Consider IP restrictions for production deployments

## Error Prevention

The MCP server includes comprehensive error prevention measures:

### Parameter Validation
- **Project ID Validation**: Format checking (PROJECT, TEST-1, 0-18) and existence verification
- **Issue ID Validation**: Proper format validation (PROJECT-123, 3-511)  
- **Date Format Validation**: YYYY-MM-DD format with real date verification
- **Duration Validation**: Time format validation (2h, 30m, 1d)

### Backward Compatibility
- **Tool Name Mapping**: Automatic mapping from legacy tool names (e.g., `query_issues` → `query`)
- **Smart Error Suggestions**: Helpful suggestions for unknown or deprecated tools
- **Migration Guidance**: Clear guidance when tools have been consolidated

### Error Examples
```bash
# Invalid project ID
Error: Invalid project ID format: 'invalid-id'. Must be a project short name (e.g., 'PROJECT', 'TEST-1') or internal ID (e.g., '0-1', '3-32')

# Unknown tool
Error: Unknown tool: query_issues. Did you mean 'query'? The tool 'query_issues' has been consolidated into 'query'.

# Missing required parameter  
Error: Parameter validation failed: issueId is required and cannot be empty
```

See [ERROR-PREVENTION.md](ERROR-PREVENTION.md) for detailed error prevention documentation.

## API Coverage

This MCP server provides comprehensive YouTrack API coverage:

- **Issues API**: 25+ endpoints covering full issue lifecycle
- **Projects API**: 20+ endpoints for project management
- **Agile API**: 15+ endpoints for sprint and board operations
- **Time Tracking API**: 10+ endpoints for work item management
- **Admin API**: 15+ endpoints for user and system management
- **Knowledge Base API**: 8+ endpoints for documentation management

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/itsalfredakku/youtrack-mcp/issues)
- **Documentation**: [API Documentation](docs/api-references.md)
- **YouTrack API**: [Official YouTrack REST API Documentation](https://www.jetbrains.com/help/youtrack/devportal/youtrack-rest-api.html)

---

**Made with ❤️ for the YouTrack and MCP communities**
