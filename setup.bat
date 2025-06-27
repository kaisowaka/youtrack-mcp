@echo off
echo 🚀 YouTrack MCP Server - Build and Setup
echo.

echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔨 Building project...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ✅ Build successful!
echo.
echo 📋 Next steps:
echo 1. Copy .env.example to .env and configure your YouTrack settings
echo 2. Run 'npm run test:connection' to verify your configuration
echo 3. Run 'npm start' to start the MCP server
echo 4. Configure your MCP client to use this server
echo.
echo 📖 See SETUP.md for detailed instructions
echo.
pause
