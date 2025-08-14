# YouTrack MCP

A comprehensive YouTrack API integration for message channel providers (MCP) implemented in TypeScript. This server provides a robust interface to YouTrack's functionalities including issue management, sprint planning, and knowledge base operations.

![CI](https://github.com/itsalfredakku/youtrack-mcp/actions/workflows/ci.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Complete YouTrack REST API access
- Issue management (create, update, search, comment)
- Sprint and agile board operations
- Knowledge base article management
- Custom field support
- Time tracking integration
- Advanced query capabilities
- State management workflow
- Configurable caching
- Webhook support

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/youtrack-mcp-ts.git
cd youtrack-mcp-ts

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your YouTrack details:

```properties
# YouTrack instance URL (without trailing slash)
YOUTRACK_URL=https://your-instance.youtrack.cloud

# YouTrack permanent token
# Generate from: Profile > Account Security > Tokens
YOUTRACK_TOKEN=your-permanent-token-here

# Optional: Default project ID
PROJECT_ID=PROJECT-1

# Optional: Enable webhooks (true/false)
ENABLE_WEBHOOKS=false

# Optional: Webhook server port (default: 3000)
WEBHOOK_PORT=3000

# Optional: Webhook secret for signature verification
WEBHOOK_SECRET=your-webhook-secret

# Optional: Log level (error, warn, info, debug)
LOG_LEVEL=info

# Optional: Cache TTL in milliseconds (default: 300000 = 5 minutes)
CACHE_TTL=300000

# Optional: Enable cache (true/false, default: true)
CACHE_ENABLED=true
```

## Usage

Start the MCP server:

```bash
npm start
```

For development with automatic reloading:

```bash
npm run dev
```

## API Tools

The YouTrack MCP server provides multiple tools for interacting with YouTrack:

### Issue Management

- `create_issue`: Create a new issue in YouTrack
- `get_issue`: Retrieve issue details
- `update_issue`: Update an existing issue
- `add_issue_comment`: Add a comment to an issue
- `get_issue_comments`: Retrieve comments on an issue
- `search_issues`: Search for issues using YouTrack query language

### State Management

- `start_working_on_issue`: Begin work on an issue and change its state
- `change_issue_state`: Transition an issue to a different state
- `complete_issue`: Mark an issue as completed

### Sprint Management

- `list_sprints`: List all sprints in a board
- `create_sprint`: Create a new sprint
- `assign_issue_to_sprint`: Add an issue to a sprint
- `get_sprint_issues`: Get all issues in a sprint

### Time Tracking

- `log_work`: Log time spent on an issue
- `get_time_tracking`: Retrieve time tracking records for an issue

### Knowledge Base

- `create_article`: Create a new knowledge base article
- `update_article`: Update an existing article
- `get_article`: Retrieve article details
- `search_articles`: Search for articles

### Project Management

- `list_projects`: List all accessible projects
- `get_project_details`: Get detailed information about a project

## Development

### Prerequisites

- Node.js 18.x or later
- npm 8.x or later

### Setup Development Environment

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:queries
npm run test:issues

# Check code quality
npm run lint
```

### Build

```bash
# Build the project
npm run build

# Verify the build
npm run verify-build
```

## API Reference

The YouTrack MCP server exposes a standardized API following the Message Channel Provider protocol. Each tool accepts specific parameters and returns standardized responses.

For example, to create an issue:

```json
{
  "tool": "create_issue",
  "params": {
    "projectId": "PROJECT-1",
    "summary": "Issue title",
    "description": "Detailed description",
    "type": "Task",
    "priority": "Normal"
  }
}
```

## Troubleshooting

Common issues and their solutions:

1. **Authentication errors**: Ensure your YouTrack token has the necessary permissions
2. **Project not found**: Verify the project ID exists and is accessible to your account
3. **Invalid query syntax**: Check the YouTrack query language documentation for proper syntax
4. **State transition issues**: Make sure the workflow allows the state change you're attempting

## Contributing

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on the process for submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [YouTrack REST API](https://www.jetbrains.com/help/youtrack/standalone/api-reference.html)
- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/)
