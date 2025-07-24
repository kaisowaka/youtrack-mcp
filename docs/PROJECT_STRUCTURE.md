# 📁 Project Structure

## Overview
This YouTrack MCP server is organized for maintainability, scalability, and clear separation of concerns.

```
youtrack-mcp/
├── src/                          # 🏗️ Core application code
│   ├── __tests__/               # 🧪 Unit tests
│   ├── utils/                   # 🔧 Utility modules and experimental features
│   ├── index.ts                 # 🚀 Main MCP server entry point
│   ├── youtrack-client.ts       # 🔌 YouTrack API client
│   ├── tools.ts                 # 🛠️ MCP tool definitions
│   ├── config.ts                # ⚙️ Configuration management
│   ├── cache.ts                 # 💾 Caching system
│   ├── logger.ts                # 📝 Logging utilities
│   └── webhooks.ts              # 🔗 Webhook handling
├── scripts/                     # 📜 Utility scripts and testing tools
│   ├── test-connection.ts       # 🔍 Test YouTrack connectivity
│   ├── explore-youtrack.ts      # 🧭 Explore YouTrack instance
│   ├── test-queries.ts          # 🔎 Test API queries
│   ├── test-mcp.ts             # 🧪 Test MCP protocol
│   ├── test-final.ts           # ✅ Final integration test
│   └── project-enhancement-analysis.ts # 📊 Enhancement analysis
├── docs/                        # 📚 Documentation
│   ├── ENHANCEMENT_ROADMAP.md   # 🗺️ Future enhancement plans
│   └── api-references.md        # 📖 API documentation
├── dist/                        # 🏭 Compiled JavaScript output
├── .vscode/                     # 🔧 VS Code configuration
│   └── mcp.json                 # 🔌 MCP client configuration
└── [config files]              # ⚙️ Package.json, tsconfig, etc.
```

## 🏗️ Core Architecture

### **Production Code (`/src`)**
- **`index.ts`** - MCP server initialization and main entry point
- **`youtrack-client.ts`** - Core YouTrack API integration
- **`tools.ts`** - MCP tool definitions and schemas
- **`config.ts`** - Environment and configuration management
- **`cache.ts`** - Simple caching implementation
- **`logger.ts`** - Structured logging system
- **`webhooks.ts`** - Real-time webhook handling

### **Utilities (`/src/utils`)**
- **`enhanced-tools.ts`** - Extended tool definitions for future features
- **`production-enhanced-client.ts`** - Production-ready advanced YouTrack client with real API implementations

### **Scripts (`/scripts`)**
- **`test-connection.ts`** - Verify YouTrack connectivity and credentials
- **`explore-youtrack.ts`** - Interactive YouTrack instance exploration
- **`test-queries.ts`** - Test different API queries and responses
- **`test-mcp.ts`** - Test MCP protocol communication
- **`project-enhancement-analysis.ts`** - Analysis of potential enhancements

### **Documentation (`/docs`)**
- **`ENHANCEMENT_ROADMAP.md`** - Comprehensive enhancement plans
- **`api-references.md`** - YouTrack API reference documentation

## 🚀 Usage

### **Development**
```bash
npm run dev          # Start in development mode
npm run build        # Compile TypeScript
npm start           # Run compiled server
```

### **Testing & Exploration**
```bash
npm run test:connection  # Test YouTrack connection
npm run explore         # Explore YouTrack instance
npm run analyze         # Run enhancement analysis
npm test               # Run unit tests
```

### **Maintenance**
```bash
npm run lint           # Lint code
npm run format         # Format code
npm run clean          # Clean build artifacts
```

## 🔧 Configuration

### **Environment Variables**
- `YOUTRACK_URL` - YouTrack instance URL
- `YOUTRACK_TOKEN` - Authentication token
- `PROJECT_ID` - Default project for testing

### **MCP Client Configuration**
Located in `.vscode/mcp.json` for VS Code integration.

## 📊 Key Features

### **Current Capabilities**
- ✅ Complete issue CRUD operations
- ✅ Advanced project analytics
- ✅ Team and user management
- ✅ Comment and communication tools
- ✅ Bulk operations and automation
- ✅ Real-time webhooks
- ✅ Intelligent caching
- ✅ Comprehensive logging

### **Planned Enhancements** (see `/docs/ENHANCEMENT_ROADMAP.md`)
- 🚧 Epic and milestone management
- 🚧 Advanced analytics and reporting
- 🚧 AI-powered project insights
- 🚧 Integration ecosystem
- 🚧 Quality assurance tools

## 🛠️ Development Guidelines

### **Adding New Features**
1. Define tools in `/src/tools.ts`
2. Implement logic in `/src/youtrack-client.ts`
3. Add tests in `/src/__tests__/`
4. Document in `/docs/`

### **Code Organization**
- Keep core functionality in `/src`
- Put experimental features in `/src/utils`
- Use `/scripts` for development utilities
- Maintain documentation in `/docs`

### **Testing Strategy**
- Unit tests for core functionality
- Integration tests for API connectivity
- MCP protocol tests for client compatibility
- Exploration scripts for development

This structure ensures clean separation of concerns, easy maintenance, and clear development workflows.
