# Enterprise Authentication & Real-Time Notifications Guide

## Overview

The YouTrack MCP Server now includes enterprise-grade authentication and real-time notification features inspired by the YouTrack mobile app architecture.

## 🔐 Authentication Management

### OAuth2 Browser-Based Authentication

The server supports OAuth2 authentication with PKCE (Proof Key for Code Exchange) for enhanced security:

```bash
# Check authentication status
mcp-client call auth_manage '{"action": "status"}'

# Initiate OAuth2 browser login
mcp-client call auth_manage '{"action": "login"}'

# Test current authentication
mcp-client call auth_manage '{"action": "test"}'

# Force re-authentication
mcp-client call auth_manage '{"action": "reauth"}'

# Sign out
mcp-client call auth_manage '{"action": "logout"}'
```

### Authentication Flow

1. **Browser Launch**: Opens default browser to YouTrack OAuth2 authorization page
2. **User Consent**: User grants permissions in browser
3. **Token Exchange**: Server exchanges authorization code for access tokens
4. **Auto Refresh**: Tokens are automatically refreshed when expired
5. **Secure Storage**: Tokens stored securely in user's home directory

### Dual Authentication Support

- **Token-based**: Traditional permanent token authentication (fallback)
- **OAuth2**: Modern browser-based authentication with automatic refresh
- **Auto-detection**: Automatically uses available authentication method

## 📱 Real-Time Notifications

### WebSocket Connection

The notification system establishes a WebSocket connection to YouTrack for real-time updates:

```bash
# Check notification system status
mcp-client call notifications '{"action": "status"}'

# List recent notifications
mcp-client call notifications '{"action": "list", "limit": 10}'

# Clear all notifications
mcp-client call notifications '{"action": "clear"}'
```

### Notification Types

- **Issue Updates**: State changes, assignments, comments
- **Project Events**: New issues, milestones, releases
- **System Alerts**: Connection status, authentication issues
- **Custom Events**: Based on your subscriptions

### Priority Levels

- **🚨 Urgent**: Critical issues requiring immediate attention
- **⚠️ High**: Important updates that should be reviewed soon
- **ℹ️ Normal**: Standard notifications for tracking progress
- **📝 Low**: Informational updates and status changes

## 🔔 Subscription Management

### Creating Subscriptions

```bash
# Create a subscription for high-priority bugs
mcp-client call subscriptions '{
  "action": "create",
  "name": "Critical Bugs",
  "filters": {
    "priority": ["High", "Critical"],
    "type": "Bug",
    "state": "Open"
  },
  "deliveryMethods": ["immediate"]
}'

# Create project-specific subscription
mcp-client call subscriptions '{
  "action": "create",
  "name": "My Project Updates",
  "filters": {
    "project": "PROJECT-1",
    "assignee": "me"
  }
}'
```

### Managing Subscriptions

```bash
# List all subscriptions
mcp-client call subscriptions '{"action": "list"}'

# Update a subscription
mcp-client call subscriptions '{
  "action": "update",
  "id": "sub-12345",
  "updates": {
    "enabled": false,
    "filters": {"priority": ["Critical"]}
  }
}'

# Delete a subscription
mcp-client call subscriptions '{"action": "delete", "id": "sub-12345"}'
```

### Filter Options

Subscriptions support comprehensive filtering:

- **Project**: Filter by specific projects
- **Issue Type**: Bug, Feature, Task, Epic, etc.
- **Priority**: Critical, High, Normal, Low
- **State**: Open, In Progress, Done, etc.
- **Assignee**: Specific users or "me"
- **Reporter**: Who created the issue
- **Tags**: Custom tags and labels
- **Custom Fields**: Any project-specific fields

### Delivery Methods

- **immediate**: Real-time notifications as they occur
- **batch**: Grouped notifications (future feature)
- **digest**: Daily/weekly summaries (future feature)

## 🚀 Quick Start

### 1. Enable OAuth2 Authentication

```bash
# Start with OAuth2 browser login
mcp-client call auth_manage '{"action": "login"}'
```

### 2. Set Up Notifications

```bash
# Check if notification system is running
mcp-client call notifications '{"action": "status"}'

# Create your first subscription
mcp-client call subscriptions '{
  "action": "create",
  "name": "My Issues",
  "filters": {"assignee": "me"}
}'
```

### 3. Monitor Activity

```bash
# View recent notifications
mcp-client call notifications '{"action": "list"}'

# Check your subscriptions
mcp-client call subscriptions '{"action": "list"}'
```

## 🔧 Configuration

### Environment Variables

Add to your `.env` file:

```env
# OAuth2 Configuration (optional)
YOUTRACK_OAUTH2_CLIENT_ID=your-client-id
YOUTRACK_OAUTH2_CLIENT_SECRET=your-client-secret
YOUTRACK_OAUTH2_CALLBACK_PORT=8080

# Notification Settings
YOUTRACK_NOTIFICATIONS_ENABLED=true
YOUTRACK_WEBSOCKET_RECONNECT=true
```

### Storage Locations

- **Auth Tokens**: `~/.youtrack-mcp/auth.json`
- **Subscriptions**: `~/.youtrack-mcp/subscriptions.json`
- **Notification Cache**: In-memory (cleared on restart)

## 🛡️ Security Features

### OAuth2 with PKCE

- **Code Challenge**: Cryptographically secure random code
- **State Parameter**: CSRF protection
- **Secure Storage**: Encrypted token storage
- **Auto Refresh**: Seamless token renewal

### Token Security

- **Scope Limitation**: Minimal required permissions
- **Secure Transport**: HTTPS-only communication
- **Local Storage**: Tokens never leave your machine
- **Automatic Cleanup**: Expired tokens removed

## 📊 Monitoring & Debugging

### Authentication Status

```bash
# Detailed auth status
mcp-client call auth_manage '{"action": "status"}'
```

Response includes:
- Authentication method (token/oauth2)
- Token validity
- Expiration times
- Last refresh status

### Notification System Health

```bash
# Notification system status
mcp-client call notifications '{"action": "status"}'
```

Response includes:
- WebSocket connection status
- Last activity timestamp
- Active subscriptions count
- Recent notification count

### Troubleshooting

**Authentication Issues**:
1. Check token validity: `auth_manage {"action": "test"}`
2. Force re-authentication: `auth_manage {"action": "reauth"}`
3. Check YouTrack permissions

**Notification Issues**:
1. Verify WebSocket connection: `notifications {"action": "status"}`
2. Check subscription filters: `subscriptions {"action": "list"}`
3. Review server logs for connection errors

## 🔄 Migration from Token-Only

Existing token-based setups continue to work seamlessly:

1. **No Breaking Changes**: Current configurations remain valid
2. **Gradual Adoption**: Add OAuth2 when ready
3. **Fallback Support**: Token auth used if OAuth2 unavailable
4. **Easy Migration**: Run `auth_manage {"action": "login"}` to upgrade

## 🎯 Best Practices

### Authentication

- Use OAuth2 for interactive sessions
- Keep permanent tokens for automation
- Regularly test authentication: `auth_manage {"action": "test"}`
- Monitor token expiration

### Notifications

- Start with broad subscriptions, then refine
- Use priority filters to reduce noise
- Regularly review and clean up subscriptions
- Test filters before enabling

### Performance

- Limit notification history size
- Use specific filters to reduce processing
- Monitor WebSocket connection health
- Clean up old subscriptions

## 🚧 Future Enhancements

- **Push Notifications**: Desktop/mobile push support
- **Email Integration**: Email notification delivery
- **Slack/Teams**: Webhook integrations
- **Analytics Dashboard**: Notification analytics
- **Smart Filtering**: ML-based notification prioritization

## 📋 API Reference

### Authentication Tools

- `auth_manage`: Authentication management and status
- OAuth2 flow with PKCE security
- Automatic token refresh
- Secure credential storage

### Notification Tools

- `notifications`: Real-time notification access
- `subscriptions`: Subscription management
- WebSocket-based real-time updates
- Comprehensive filtering system

### Integration Points

- Compatible with all existing YouTrack tools
- Seamless authentication for API calls
- Real-time updates for tracked issues
- Enterprise-ready security model
