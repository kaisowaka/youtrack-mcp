#!/bin/bash

# Set environment variable for MCP server mode to disable colored logging
export MCP_SERVER=true

# Run the server
npm run build && node dist/index.js
