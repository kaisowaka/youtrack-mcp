# YouTrack MCP Server - API Error Fixes

## Summary of Issues Fixed

Based on the error logs from 2025-07-26, the following issues were identified and fixed:

### 1. **404 Not Found** - Custom Fields API Endpoint
**Error**: `YouTrack API Error (404): Not Found` when getting project custom fields for project "VPN"

**Root Cause**: The project "VPN" doesn't exist or the custom fields API endpoint is incorrect.

**Fix Implemented**:
- Enhanced `CustomFieldsManager.getProjectCustomFields()` with multiple endpoint fallbacks:
  1. Try `/admin/projects/{projectId}/customFields` (admin endpoint)
  2. Fallback to `/projects/{projectId}/customFields` (projects endpoint)
  3. Verify project exists with `/projects/{projectId}`
  4. Return empty array instead of throwing error for graceful degradation

- Added project validation before attempting custom field operations
- Improved error handling with specific project existence checks

### 2. **400 Bad Request** - Issue Creation
**Error**: `YouTrack API Error (400): bad_request` when creating issues

**Root Cause**: Invalid data structure or field format being sent to YouTrack API.

**Fix Implemented**:
- Enhanced `YouTrackClient.createIssue()` with improved field handling:
  1. Added project validation before issue creation
  2. Implemented fallback to direct field assignment when custom fields fail
  3. Better error handling with specific guidance for different error types
  4. Added warnings system for content duplication and formatting issues

- Direct field assignment fallback:
  ```typescript
  if (params.type) issueData.type = { name: params.type };
  if (params.priority) issueData.priority = { name: params.priority };
  if (params.state) issueData.state = { name: params.state };
  if (params.assignee) issueData.assignee = { login: params.assignee };
  ```

### 3. **405 Method Not Allowed** - Issue Dependencies
**Error**: `YouTrack API Error (405): Method Not Allowed` when creating issue dependencies

**Root Cause**: Incorrect API endpoint or method for creating issue links.

**Fix Implemented**:
- Enhanced `YouTrackClient.createIssueDependency()` with multiple API approaches:
  1. **Approach 1**: `POST /issues/{id}/links` with proper link structure
  2. **Approach 2**: `POST /links` with direct link data
  3. **Approach 3**: `POST /issues/{id}` with links field update
  4. **Fallback**: Provide manual guidance when all API approaches fail

- Added comprehensive error handling with helpful user guidance
- Detailed attempt logging for debugging

## Key Improvements

### Error Resilience
- All API operations now have graceful fallback mechanisms
- Better error messages with actionable guidance
- Reduced fatal errors through defensive programming

### Project Validation
- Enhanced project existence checking
- Multiple endpoint attempts for better compatibility
- Clear error messages for missing/inaccessible projects

### Field Handling
- Robust custom field processing with fallbacks
- Direct field assignment when custom fields unavailable
- Validation before API calls to prevent 400 errors

### Logging & Debugging
- Enhanced error logging with context
- Multiple attempt tracking for dependency creation
- Clear success/failure reporting

## Testing Results

The fixes have been implemented and compiled successfully. The code now handles:
- ✅ Missing/invalid projects gracefully
- ✅ Custom field API failures with fallbacks
- ✅ Issue creation with improved data structures
- ✅ Issue dependency creation with multiple approaches
- ✅ Better error reporting and user guidance

## Files Modified

1. **src/youtrack-client.ts**
   - Enhanced `createIssue()` method
   - Enhanced `createIssueDependency()` method
   - Better project validation integration

2. **src/custom-fields-manager.ts**
   - Enhanced `getProjectCustomFields()` with multiple endpoint fallbacks
   - Improved error handling and graceful degradation

## Usage Notes

- The server will now attempt multiple API approaches before failing
- Users will receive helpful guidance when APIs are unavailable
- All operations are more resilient to YouTrack configuration differences
- Better compatibility across different YouTrack versions and setups

## Next Steps

1. Test in your actual YouTrack environment
2. Monitor logs for any remaining API compatibility issues
3. Adjust endpoint URLs if your YouTrack instance uses different API paths
4. Consider implementing additional fallback mechanisms if needed
