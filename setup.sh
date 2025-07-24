#!/bin/bash

echo "🚀 YouTrack MCP Server - Build and Setup"
echo

echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo
echo "🔨 Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo
echo "🔍 Running connection test..."
if [ -f ".env" ]; then
    npm run test:connection
    if [ $? -ne 0 ]; then
        echo "⚠️  Connection test failed. Please check your .env configuration."
    else
        echo "✅ Connection test passed!"
    fi
else
    echo "⚠️  No .env file found. Please copy .env.example to .env and configure your YouTrack credentials."
fi

echo
echo "✨ Setup complete! Your YouTrack MCP server is ready."
echo
echo "📚 Next steps:"
echo "  1. Configure your .env file with YouTrack credentials"
echo "  2. Run 'npm run explore' to test your YouTrack connection"
echo "  3. Start the MCP server with 'npm start'"
echo
