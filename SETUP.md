# Setup Instructions

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** (comes with Node.js)
3. **YouTrack instance** with admin access to create tokens

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get YouTrack Token

1. Open your YouTrack instance
2. Go to your profile (click your avatar → Profile)
3. Navigate to **Account Security** → **Tokens**
4. Click **Create new token**
5. Give it a name (e.g., "MCP Server")
6. Copy the generated token (format: `perm:username.tokenname.tokenvalue`)

## Step 3: Configure Environment

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file with your details:
```bash
YOUTRACK_URL=https://your-company.youtrack.cloud
YOUTRACK_TOKEN=perm:username.tokenname.tokenvalue
DEFAULT_PROJECT_ID=YOUR-PROJECT-ID
```

## Step 4: Test Connection

```bash
npm run test:connection
```

This will verify your configuration is correct.

## Step 5: Build the Project

```bash
npm run build
```

## Step 6: Configure MCP Client

### Claude Desktop

Edit your Claude Desktop configuration file:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "youtrack": {
      "command": "node",
      "args": ["C:\\full\\path\\to\\youtrack-mcp\\dist\\index.js"],
      "env": {
        "YOUTRACK_URL": "https://your-company.youtrack.cloud",
        "YOUTRACK_TOKEN": "perm:username.tokenname.tokenvalue"
      }
    }
  }
}
```

### Other MCP Clients (Cline, etc.)

Similar configuration with appropriate paths for your system.

## Step 7: Start the Server

```bash
npm start
```

## Verification

1. Restart your MCP client (Claude Desktop, etc.)
2. Check that the YouTrack tools are available
3. Try a simple command like asking about project status

## Troubleshooting

### Connection Issues

**Error: Network error**
- Check your YouTrack URL (no trailing slash)
- Verify internet connectivity
- Test manual access: `curl -H "Authorization: Bearer YOUR_TOKEN" YOUR_YOUTRACK_URL/api/admin/users/me`

**Error: Authentication failed**
- Verify token format is correct
- Ensure token has sufficient permissions
- Try regenerating the token

**Error: Project not found**
- Check the project ID exists
- Verify token has access to the project
- Use the exact project ID (case-sensitive)

### MCP Client Issues

**Tools not appearing**
- Restart the MCP client completely
- Check the configuration file syntax (valid JSON)
- Verify the path to `dist/index.js` is correct
- Check MCP client logs for errors

**Permission errors**
- Ensure the token has appropriate permissions:
  - Read projects
  - Read/create/update issues
  - Read users (for search functionality)

### Performance Issues

**Slow responses**
- Enable caching: `CACHE_ENABLED=true` in `.env`
- Adjust cache TTL: `CACHE_TTL=300000` (5 minutes)
- Check YouTrack server performance

## Optional: Enable Webhooks

For real-time updates:

1. Add to `.env`:
```bash
ENABLE_WEBHOOKS=true
WEBHOOK_PORT=3000
WEBHOOK_SECRET=your-secret-key
```

2. Configure YouTrack webhook:
   - Administration → Integrations → Webhooks
   - URL: `http://your-server:3000/webhook/youtrack`
   - Secret: Same as WEBHOOK_SECRET
   - Events: Issue Created, Issue Updated, Comment Added

## Development Mode

For development with auto-reload:
```bash
npm run dev
```

## Testing

Run the test suite:
```bash
npm test
```

Watch mode for development:
```bash
npm run test:watch
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your YouTrack instance is accessible
3. Test with the connection script: `npm run test:connection`
4. Check the server logs for detailed error information
5. Review YouTrack API documentation for specific endpoint requirements
