# YouTrack MCP API Specification Fixes

## Issues Found and Fixes Required

### 1. Issues API Endpoints
**Current Problem**: Using `/issues` endpoint incorrectly
**Fix Required**: 
- Issues creation should use `/issues` (POST) with proper schema
- Issues updates should use `/issues/{id}` (POST) with proper schema
- Issue queries should use `/issues` (GET) with proper query parameters

### 2. Project Management
**Current Problem**: Using `/admin/projects` which requires admin access
**Fix Required**: 
- Use `/admin/projects` (GET) for listing projects (requires admin)
- Fall back to project discovery via `/issues` if admin access denied
- Validate project access properly

### 3. Custom Fields
**Current Problem**: Not using proper custom fields API
**Fix Required**: 
- Use `/admin/projects/{id}/customFields` for project custom fields
- Use `/admin/customFieldSettings/customFields` for global custom fields
- Proper field type handling

### 4. Agile Boards
**Current Problem**: Missing agile board implementation
**Fix Required**: 
- Implement `/agiles` endpoint for board listing
- Implement `/agiles/{id}` for board details
- Implement sprint management via board APIs

### 5. Knowledge Base Articles
**Current Problem**: Missing articles implementation
**Fix Required**: 
- Implement `/articles` for article management
- Use proper article schema

### 6. Work Items and Time Tracking
**Current Problem**: Not using proper work items API
**Fix Required**: 
- Use `/issues/{id}/timeTracking/workItems` for work item management
- Use `/workItems` for global work item queries

### 7. Field Schema Issues
**Current Problem**: Incorrect field structures
**Fix Required**: 
- Use proper field reference format: `{ name: "value" }` or `{ id: "value" }`
- Handle custom fields with proper ProjectCustomField schema
- Use correct field types from API specification

## API Specification Compliance

### Issue Creation Schema
```json
{
  "summary": "string",
  "description": "string", 
  "project": { "id": "string" },
  "customFields": [
    {
      "name": "Priority",
      "value": { "name": "High" }
    },
    {
      "name": "Type", 
      "value": { "name": "Bug" }
    }
  ]
}
```

### Issue Update Schema
```json
{
  "summary": "string",
  "description": "string",
  "customFields": [
    {
      "name": "State",
      "value": { "name": "In Progress" }
    }
  ]
}
```

### Project Custom Fields Schema
Projects use custom fields, not direct properties for Type, Priority, State.
Need to:
1. Query project custom fields first
2. Map user inputs to proper custom field values
3. Use custom field format in requests

## Required Implementation Changes

1. **Update YouTrack Client** - Fix API calls to match specification
2. **Update Tool Definitions** - Ensure parameters match what API expects  
3. **Add Missing Endpoints** - Implement agile boards, articles, proper time tracking
4. **Fix Field Handling** - Use custom fields approach for Type, Priority, State
5. **Add Error Handling** - Better handling of API responses per specification
6. **Update Caching** - Cache custom field mappings for performance

## Priority Fixes

1. **HIGH**: Fix issue creation/update to use custom fields properly
2. **HIGH**: Fix project validation and field discovery
3. **MEDIUM**: Implement missing agile board endpoints
4. **MEDIUM**: Implement knowledge base articles
5. **LOW**: Enhance time tracking with proper work items API
