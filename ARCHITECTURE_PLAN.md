// Proposed Architecture Refactoring Plan
// Break down the monolithic youtrack-client.ts into domain-specific modules

src/
├── api/
│   ├── base/
│   │   ├── base-client.ts          // Common API client functionality
│   │   ├── error-handler.ts        // Unified error handling
│   │   ├── response-formatter.ts   // Consistent response formatting
│   │   └── cache-manager.ts        // Caching strategies
│   ├── domains/
│   │   ├── issues-api.ts           // Issue management endpoints
│   │   ├── projects-api.ts         // Project management endpoints
│   │   ├── agile-api.ts           // Agile boards and sprints
│   │   ├── knowledge-base-api.ts   // Articles and documentation
│   │   ├── time-tracking-api.ts    // Work items and time tracking
│   │   ├── users-api.ts           // User management
│   │   ├── admin-api.ts           // Administrative functions
│   │   └── activities-api.ts      // Activity streams
│   └── generated/
│       ├── openapi-client.ts      // Auto-generated from OpenAPI spec
│       └── types.ts               // Generated TypeScript types
├── tools/
│   ├── issue-tools.ts             // Issue-related MCP tools
│   ├── project-tools.ts           // Project-related MCP tools
│   ├── agile-tools.ts             // Agile-related MCP tools
│   └── knowledge-base-tools.ts    // KB-related MCP tools
└── utils/
    ├── openapi-analyzer.ts        // OpenAPI coverage analysis
    └── tool-generator.ts          // Auto-generate tools from OpenAPI

// Benefits of this approach:
// 1. Better maintainability - smaller, focused files
// 2. Improved testability - isolated domain logic
// 3. Easier development - parallel work on different domains
// 4. Consistent patterns - shared base classes and utilities
// 5. Type safety - generated types from OpenAPI specification
