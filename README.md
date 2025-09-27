<div align="center">

# YouTrack MCP Server

[![CI](https://github.com/itsalfredakku/youtrack-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/itsalfredakku/youtrack-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![MCP](https://img.shields.io/badge/Protocol-MCP-blueviolet)

</div>

> Enterprise‑grade MCP server for JetBrains **YouTrack** giving AI assistants (Claude, VSCode MCP extensions, Continue.dev, Cline, Zed, custom connectors) safe, tool-based access to issues, sprints, dependencies (Gantt + critical path), time tracking and knowledge base content.

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Highlights](#highlights)
3. [Environment & Configuration](#environment--configuration)
4. [MCP Client Integration](#mcp-client-integration)
5. [Usage Examples](#usage-examples)
6. [Analytics (Gantt & Critical Path)](#analytics-gantt--critical-path)
7. [Tool Catalog Summary](#tool-catalog-summary)
8. [Architecture](#architecture)
9. [Development](#development)
10. [Troubleshooting](#troubleshooting)
11. [Security & Permissions](#security--permissions)
12. [Roadmap](#roadmap)
13. [Contributing](#contributing)
14. [License](#license)

---

## Quick Start
```bash
git clone https://github.com/itsalfredakku/youtrack-mcp.git
cd youtrack-mcp
npm install
cp .env.example .env      # set YOUTRACK_URL + YOUTRACK_TOKEN
npm run build
npm start                 # stdio MCP server
```
Remote (SSE) for hosted usage / ChatGPT custom connector:
```bash
npm run start:remote      # http://localhost:3001/mcp/sse
```
Health check:
```bash
curl http://localhost:3001/health
```

---

## Highlights
| Domain | Capabilities |
|--------|--------------|
| Issues | CRUD, comments, transitions, dependency links, estimation |
| Agile  | Sprint create/manage, issue assignment, progress metrics |
| Knowledge Base | Article create/update/search, tagging, linkage |
| Projects | Discovery, metadata, field summaries |
| Analytics | Gantt generation, dependency routing, critical path |
| Time Tracking | Log work, time summaries, reporting hooks |
| Performance | TTL caching, structured logging, graceful fallbacks |
| Reliability | Consistent response envelope & error normalization |

---

## Environment & Configuration
Minimal `.env`:
```properties
YOUTRACK_URL=https://your-instance.youtrack.cloud
YOUTRACK_TOKEN=your-permanent-token
PROJECT_ID=PROJECT-1
LOG_LEVEL=info
CACHE_ENABLED=true
CACHE_TTL=300000
ENABLE_WEBHOOKS=false
WEBHOOK_PORT=3000
WEBHOOK_SECRET=
```
| Variable | Required | Description | Default |
|----------|-----|-------------|---------|
| `YOUTRACK_URL` | ✅ | Base URL (no trailing slash) | — |
| `YOUTRACK_TOKEN` | ✅ | Permanent token (Profile → Tokens) | — |
| `PROJECT_ID` | — | Default project shortName | — |
| `LOG_LEVEL` | — | error/warn/info/debug | info |
| `CACHE_ENABLED` | — | Enable in‑memory cache | true |
| `CACHE_TTL` | — | Cache TTL ms | 300000 |
| `ENABLE_WEBHOOKS` | — | Start webhook listener | false |
| `WEBHOOK_PORT` | — | Webhook port | 3000 |
| `WEBHOOK_SECRET` | — | HMAC secret | — |

---

## MCP Client Integration
Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{ 
  "mcpServers": { 
    "youtrack": {
      "command": "node", 
      "args": ["/abs/path/youtrack-mcp/dist/index.js"], 
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud", 
        "YOUTRACK_TOKEN": "token",
        "PROJECT_ID": "PRJ"  // Optional
      } 
    } 
  } 
}
```
VSCode (`.vscode/settings.json`):
```json
{ 
  "servers": { 
    "youtrack": { 
      "command": "node", 
      "args": ["./dist/index.js"], 
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud", 
        "YOUTRACK_TOKEN": "token",
      } 
    } 
  } 
}
```
Continue.dev (`continue.json`):
```json
{ 
  "mcp": { 
    "servers": [
      { 
        "name": "youtrack", 
        "command": "node", 
        "args": ["/abs/youtrack-mcp/dist/index.js"], 
        "env": {
          "YOUTRACK_URL": "https://your-instance.youtrack.cloud", 
          "YOUTRACK_TOKEN": "token"
        } 
      }
    ] 
  } 
}
```
Cline / Generic:
```json
{ 
  "mcpServers": { 
    "youtrack": { 
      "command": "node", 
      "args": ["/abs/youtrack-mcp/dist/index.js"], 
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud", 
        "YOUTRACK_TOKEN": "token"
      } 
    } 
  } 
}
```
Zed:
```json
{ 
  "context_servers": { 
    "youtrack": { 
      "command": "node", 
      "args": ["/abs/youtrack-mcp/dist/index.js"], 
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud", 
        "YOUTRACK_TOKEN": "token"
      } 
    } 
  } 
}
```
Local test:
```bash
YOUTRACK_URL=https://your-instance.youtrack.cloud \
YOUTRACK_TOKEN=token \
node dist/index.js
```
Pitfalls: absolute path, no trailing slash, full token copy, JSON env values are strings.

---

## Tool Catalog Summary
| Category | Examples |
|----------|----------|
| Issues | `create_issue`, `update_issue`, `add_issue_comment`, `search_issues` |
| State | `start_working_on_issue`, `change_issue_state`, `complete_issue` |
| Agile | `create_sprint`, `list_sprints`, `assign_issue_to_sprint` |
| Knowledge | `create_article`, `update_article`, `search_articles` |
| Projects | `list_projects`, `get_project_details` |
| Analytics | `generate_gantt_chart`, `get_critical_path`, `create_issue_dependency` |
| Time | `log_work_item`, `get_time_report` |

---

## Architecture
```
Clients (Claude / VSCode / Continue / Zed)
          │  MCP (stdio or SSE)
 ┌────────▼────────┐
 │  Orchestrator   │ registry, routing, validation
 └────────┬────────┘
          │ domain calls
 ┌────────▼────────┐
 │ Domain Clients  │ issues / projects / agile / kb / analytics / time
 └────────┬────────┘
          │ REST
 ┌────────▼────────┐
 │  YouTrack API   │
 └─────────────────┘
```
Traits: strong typing, graceful degradation, normalized errors, pluggable caching/logging.

---

## Development
```bash
npm install
npm run dev          # watch
npm run lint         # eslint
npm run type-check   # types
npm test             # tests
npm run build        # dist output
```
Structure: `src/index.ts` (entry), `src/api/domains` (domain clients), `src/tools.ts` (tool registry), `src/utils`, `src/logger.ts`.

---

## Troubleshooting
| Symptom | Cause | Fix |
|---------|-------|-----|
| 401 Unauthorized | Missing scope / expired token | Regenerate token with required permissions |
| Project not found | Hidden / archived / wrong ID | Use internal ID or verify access |
| Empty analytics | No issues in project | Seed baseline issues |
| SSE disconnects | Proxy idle timeout | Enable keep-alive / tune LB |

Checklist: absolute path, no trailing slash, full token, JSON env strings. Use `LOG_LEVEL=debug` for deep inspection.

---

## Security & Permissions
Recommended token capabilities: Issues (R/W), Projects (Read), Knowledge Base (R/W), Agile/Sprints (R/W), Time Tracking (if applicable). Store tokens as environment secrets; never commit.

---

## Roadmap
| Item | Status |
|------|--------|
| Webhook event enrichment | Planned |
| Adaptive rate limit retries | Planned |
| Resource utilization analytics | Planned |
| Fine‑grained tool permission toggles | Planned |

---

## Contributing
1. Fork & branch (`feature/x`)
2. Implement + tests
3. `npm run lint && npm run type-check`
4. Open PR with rationale

---

## License
MIT © 2025

## Acknowledgements
JetBrains YouTrack • MCP community • TypeScript ecosystem

> Feedback / ideas? Open an issue or discussion.

---

**Legacy README content below (to be removed after validation).**

# (Legacy) Original README

[Original content follows for reference]

## Features

- **Issue Management**
  - Create, read, update, delete issues
  - Add comments and attachments
  - Search issues with advanced filtering
  - Track issue time and estimation

- **Agile & Sprint Management**
  - Create and manage sprints
  - Assign issues to sprints
  - Track sprint progress

- **State Management & Workflows**
  - Transition issues through states
  - Start working on issues with automatic assignment
  - Complete issues with proper resolution

- **Knowledge Base Integration**
  - Create and manage articles
  - Link issues to knowledge base articles
  - Search knowledge base content

- **Project Management**
  - List and filter projects
  - Get project details and customization options

## Installation

```bash
# Clone the repository
git clone https://github.com/itsalfredakku/youtrack-mcp.git
cd youtrack-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Copy the example environment file and configure it with your YouTrack instance details:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration:

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

## MCP Client Configuration

### Claude Desktop

Add this configuration to your Claude Desktop MCP settings file:

**Location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["/path/to/youtrack-mcp/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud",
        "YOUTRACK_TOKEN": "your-permanent-token-here"
      }
    }
  }
}
```

### VSCode 

Add this in your project `.vscode/mcp.json`:

```json
{
  "servers": {
    "youtrack": {
      "command": "node",
      "args": ["/path/to/youtrack-mcp/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud",
        "YOUTRACK_TOKEN": "your-permanent-token-here",
        "PROJECT_ID": "PRJ"  // Optional
      }
    }
  }
}
```

### Cline Extension

Add this to your Cline MCP configuration (`.cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["/path/to/youtrack-mcp/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud",
        "YOUTRACK_TOKEN": "your-permanent-token-here"
      }
    }
  }
}
```

### Continue.dev Extension

Add this configuration to your `continue.json`:

```json
{
  "mcp": {
    "servers": [
      {
        "name": "youtrack",
        "command": "node",
        "args": ["/path/to/youtrack-mcp/dist/index.js"],
        "env": {
          "YOUTRACK_URL": "https://your-instance.youtrack.cloud",
          "YOUTRACK_TOKEN": "your-permanent-token-here"
        }
      }
    ]
  }
}
```

### Zed Editor

Add this to your Zed MCP configuration:

```json
{
  "context_servers": {
    "youtrack": {
      "command": "node",
      "args": ["/path/to/youtrack-mcp/dist/index.js"],
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud",
        "YOUTRACK_TOKEN": "your-permanent-token-here"
      }
    }
  }
}
```


### Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `YOUTRACK_URL` | ✅ | Your YouTrack instance URL (no trailing slash) | - |
| `YOUTRACK_TOKEN` | ✅ | Permanent token from YouTrack | - |
| `PROJECT_ID` | ❌ | Default project shortName for operations | - |
| `LOG_LEVEL` | ❌ | Logging verbosity | `info` |
| `CACHE_ENABLED` | ❌ | Enable response caching | `true` |
| `CACHE_TTL` | ❌ | Cache TTL in milliseconds | `300000` |
| `ENABLE_WEBHOOKS` | ❌ | Enable webhook server | `false` |
| `WEBHOOK_PORT` | ❌ | Webhook server port | `3000` |
| `WEBHOOK_SECRET` | ❌ | Webhook signature secret | - |

### Troubleshooting Configuration

**Common Configuration Issues:**

1. **Path Issues**: Use absolute paths to avoid "command not found" errors
2. **Token Permissions**: Ensure your YouTrack token has these permissions:
   - Read Projects
   - Create/Update/Delete Issues  
   - Read/Write Knowledge Base
   - Read/Write Agile Boards
3. **URL Format**: Remove trailing slashes from `YOUTRACK_URL`
4. **Environment Variables**: All env vars must be strings in JSON

**Testing Your Configuration:**

```bash
# Test if the server starts correctly
node /path/to/youtrack-mcp/dist/index.js

# Test with environment variables
YOUTRACK_URL="https://your-instance.youtrack.cloud" \
YOUTRACK_TOKEN="your-token" \
node dist/index.js
```

## Usage

### Starting the Server

```bash
# Start the MCP server
npm start

# Start in development mode with auto-reload
npm run dev
```

### Running as a Remote MCP Server

```bash
# Start the SSE-based remote server
npm run start:remote

# Hot-reload while iterating on the remote server
npm run dev:remote
```

- Remote SSE endpoint: `http://localhost:3001/mcp/sse`
- Message POST endpoint: emitted automatically as `http://localhost:3001/mcp/messages?sessionId=...`
- Health check: `http://localhost:3001/health`
- Configuration: set `PORT` (default `3001`) and `MCP_BASE_PATH` (default `/mcp`) before starting the process

When deploying behind HTTPS, expose the same endpoints over `https://` so ChatGPT can reach them.

## Available Tools

The server provides 60+ tools for interacting with YouTrack. Here are some of the most commonly used:

### Issue Management
- `create_issue` - Create a new issue
- `get_issue` - Get issue details
- `update_issue` - Update an issue
- `add_issue_comment` - Add a comment to an issue
- `search_issues` - Search for issues

### Agile & Sprint Management
- `list_sprints` - List all sprints
- `create_sprint` - Create a new sprint
- `assign_issue_to_sprint` - Add an issue to a sprint
- `get_sprint_issues` - Get all issues in a sprint

### State Management
- `start_working_on_issue` - Begin work on an issue
- `change_issue_state` - Change an issue's state
- `complete_issue` - Mark an issue as completed

### Knowledge Base
- `create_article` - Create a knowledge base article
- `update_article` - Update an article
- `get_article` - Get article details
- `search_articles` - Search knowledge base articles

### Project Management
- `list_projects` - List all accessible projects
- `get_project_details` - Get project information

## Development

### Prerequisites

- Node.js 18.x or later
- npm 8.x or later
- A YouTrack instance with API access

### Development Workflow

```bash
# Install dependencies
npm install

# Start in development mode with auto-reload
npm run dev

# Run linting
npm run lint

# Run type checking
npm run type-check

# Build the project
npm run build
```

### Project Structure

- `src/index.ts` - Main entry point
- `src/youtrack-client.ts` - YouTrack API client
- `src/tools/` - Individual MCP tool implementations
- `src/utils/` - Utility functions and helpers
- `src/types/` - TypeScript type definitions
- `src/config/` - Configuration management

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:queries
npm run test:issues
```

## Troubleshooting

### Common Issues

1. **Authentication errors**: Verify your YouTrack token has the necessary permissions and hasn't expired.

2. **Project not found**: Ensure the project ID exists and is accessible to your account.

3. **API rate limiting**: YouTrack may impose rate limits. Consider implementing retry logic for critical operations.

4. **State transition errors**: Some state transitions may be prohibited by your YouTrack workflow configuration.

### Logs

Logs are stored in the `logs` directory:

- `combined.log` - All log entries
- `error.log` - Error-level logs only

Set the `LOG_LEVEL` environment variable to control logging verbosity (error, warn, info, debug).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [YouTrack REST API](https://www.jetbrains.com/help/youtrack/standalone/api-reference.html)
- [Model Context Protocol (MCP)](https://github.com/microsoft/mcp)
- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/)
