#!/bin/bash

# Comprehensive MCP Test Runner
# Runs all test suites to validate YouTrack MCP Server functionality

echo "🧪 YOUTRACK MCP SERVER - COMPREHENSIVE TEST SUITE"
echo "=================================================="
echo "Running all validation tests to ensure production readiness"
echo ""

# Check if required dependencies are available
if ! command -v tsx &> /dev/null; then
    echo "❌ tsx not found. Installing..."
    npm install -g tsx
fi

# Ensure the project is built
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Cannot proceed with tests."
    exit 1
fi

echo "✅ Build successful"
echo ""

# Run the master test runner
echo "🚀 Starting comprehensive test suite..."
echo "⏱️  This may take several minutes to complete"
echo ""

cd "$(dirname "$0")"
tsx test-master.ts

exit_code=$?

echo ""
if [ $exit_code -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
    echo "✅ YouTrack MCP Server is production-ready"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Deploy using: ./start-mcp.sh"
    echo "  2. Set MCP_SERVER=true in production"
    echo "  3. Monitor logs for runtime issues"
else
    echo "❌ TESTS FAILED!"
    echo "🔧 Review test output and fix issues before deployment"
    echo ""
    echo "🚨 Critical failures detected - DO NOT deploy to production"
fi

exit $exit_code
