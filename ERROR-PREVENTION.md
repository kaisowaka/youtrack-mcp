# 🛡️ Error Prevention Guide

## Common Errors and Prevention

Based on the analysis of your error logs, here are the comprehensive error prevention measures implemented:

### 1. **Unknown Tool Errors** (`query_issues`)

**Problem**: Client tries to call `query_issues` but the tool is now called `query`

**Prevention Measures**:
- **Tool Name Mapping**: Automatic mapping from old tool names to new ones
- **Smart Suggestions**: Helpful error messages with correct tool names
- **Backward Compatibility**: Detection and guidance for deprecated tool names

**Error Message Enhancement**:
```
Unknown tool: query_issues. Did you mean 'query'? The tool 'query_issues' has been consolidated into 'query'.
```

### 2. **Invalid Project ID Errors** (`3-32`, `3-0`)

**Problem**: Analytics tool receives invalid project IDs that don't exist

**Prevention Measures**:
- **Format Validation**: Validates project ID format (PROJECT, TEST-1, 0-18)
- **Existence Check**: Verifies project exists before using it
- **Smart Resolution**: Automatic fallback to default project ID when available
- **Clear Error Messages**: Specific guidance on correct project ID formats

**Validation Logic**:
```typescript
// Valid formats: PROJECT, TEST-1, 0-18, 3-32
const projectIdPattern = /^([A-Z][A-Z0-9]*(-[A-Z0-9]+)*|\d+-\d+)$/i;
```

### 3. **Parameter Validation Errors**

**Prevention Measures**:
- **Required Field Validation**: Ensures mandatory parameters are provided
- **Format Validation**: Validates dates (YYYY-MM-DD), durations (2h, 30m), etc.
- **Type Validation**: Ensures parameters are correct types
- **Range Validation**: Validates numeric ranges and limits

### 4. **Issue ID Format Errors**

**Prevention Measures**:
- **Format Validation**: Validates issue ID format (PROJECT-123, 3-511)
- **Pattern Matching**: Uses regex to ensure correct format
- **Clear Error Messages**: Explains expected format when validation fails

**Validation Logic**:
```typescript
// Valid formats: PROJECT-123, TEST-1, 3-511
const issueIdPattern = /^([A-Z][A-Z0-9]*(-[A-Z0-9]+)*-\d+|\d+-\d+)$/i;
```

### 5. **Date and Time Validation Errors**

**Prevention Measures**:
- **Date Format Validation**: Ensures YYYY-MM-DD format
- **Real Date Validation**: Verifies dates are actually valid
- **Duration Format Validation**: Validates time durations (2h, 30m, 1d, 1w)
- **Range Checking**: Ensures dates are reasonable

## Implementation Details

### Validation Utilities (`src/validation.ts`)

The validation system includes:

1. **ParameterValidator Class**:
   - `validateProjectId()` - Project ID format and existence
   - `validateIssueId()` - Issue ID format validation
   - `validateDate()` - Date format and validity
   - `validateDuration()` - Time duration format
   - `validateRequired()` - Required field validation
   - `validateEnum()` - Enumeration value validation

2. **Error Conversion**:
   - Converts `ValidationError` to proper `McpError`
   - Maintains error context and field information
   - Provides user-friendly error messages

3. **Tool Name Mapping**:
   - Maps old tool names to new consolidated tools
   - Provides helpful suggestions for unknown tools
   - Maintains backward compatibility guidance

### Handler-Level Validation

Each tool handler now includes:

1. **Pre-execution Validation**:
   - Validates all required parameters
   - Checks parameter formats and types
   - Verifies resource existence when needed

2. **Action-Specific Validation**:
   - Different validation rules per action
   - Context-aware parameter requirements
   - Smart defaults and fallbacks

3. **Error Handling**:
   - Converts validation errors to proper MCP errors
   - Logs detailed error information for debugging
   - Provides clear user guidance

## Error Prevention Best Practices

### For Users:
1. **Use Correct Tool Names**: Use the new consolidated tool names
2. **Validate Project IDs**: Ensure project IDs exist and are correctly formatted
3. **Check Date Formats**: Use YYYY-MM-DD for all date parameters
4. **Verify Issue IDs**: Use correct format (PROJECT-123 or 3-511)

### For Developers:
1. **Parameter Validation**: Always validate parameters before API calls
2. **Error Logging**: Log detailed error information for debugging
3. **User-Friendly Messages**: Provide clear, actionable error messages
4. **Resource Verification**: Check resource existence before operations

## Testing Error Prevention

### Validation Test Cases:
```bash
# Invalid project ID
{"tool": "analytics", "reportType": "project_stats", "projectId": "invalid-id"}

# Invalid issue ID  
{"tool": "comments", "action": "get", "issueId": "invalid"}

# Invalid date format
{"tool": "analytics", "reportType": "time_tracking", "startDate": "2025/01/01"}

# Missing required parameter
{"tool": "issues", "action": "create"}
```

### Expected Behaviors:
- Clear error messages with format examples
- Suggestions for correct parameter values
- Helpful guidance for resolution
- Proper MCP error codes and structure

## Monitoring and Debugging

### Error Logging:
All validation errors are logged with:
- Tool name and action
- Invalid parameter values
- Validation failure reason
- Suggested corrections

### Debug Information:
```json
{
  "timestamp": "2025-08-01T07:26:34.733Z",
  "level": "error", 
  "tool": "analytics",
  "action": "project_stats",
  "projectId": "3-32",
  "error": "Invalid project ID format",
  "suggestion": "Use format like 'PROJECT', 'TEST-1', or '0-18'"
}
```

## Deployment Verification

After implementing error prevention:

1. **Build Successfully**: ✅ TypeScript compilation passes
2. **Validation Works**: ✅ Parameter validation active
3. **Error Messages Clear**: ✅ User-friendly error guidance  
4. **Backward Compatibility**: ✅ Legacy tool name mapping
5. **Performance Impact**: ✅ Minimal overhead added

---

**Status**: All error prevention measures are now active and ready for production use! 🛡️
