# YouTrack MCP Error Handling Guide

## 🚨 Common API Errors and Solutions

Based on the server logs, here are the most common errors and how to resolve them:

### 1. **404 Not Found Errors**

**Error Message**: `YouTrack API Error (404): Not Found`

**Common Causes**:
- Issue ID doesn't exist (e.g., trying to update `MYD-32` when it doesn't exist)
- Incorrect project shortName in issue ID
- User doesn't have access to the issue

**Solutions**:
- ✅ **Verify Issue Exists**: Use `query_issues` to check if the issue exists
- ✅ **Check Project Access**: Use `list_projects` to verify project permissions
- ✅ **Use Correct Format**: Issue IDs should be `PROJECT-NUMBER` (e.g., `MYD-123`)

```javascript
// First check if issue exists
query_issues({ query: "project: MYD #MYD-32" })

// Then update if it exists
update_issue({ issueId: "MYD-32", updates: {...} })
```

### 2. **400 Bad Request Errors**

**Error Message**: `YouTrack API Error (400): bad_request`

**Common Causes**:
- **Content Duplication**: Title repeated in description (most common!)
- Invalid field values
- Content too long or with encoding issues
- Missing required fields

**Solutions**:
- ✅ **Check Duplication Warnings**: Review the warnings from create_issue/create_article
- ✅ **Use Validation Tool**: Run `npm run validate-content` before creating
- ✅ **Follow Best Practices**: See the [Content Duplication Guide](./CONTENT_DUPLICATION_GUIDE.md)

**Example of Bad Request (DON'T DO THIS)**:
```javascript
create_issue({
  "summary": "Admin-Web Final Compilation Verification & Testing",
  "description": "# Admin-Web Final Compilation Verification & Testing\n\n..." // ❌ DUPLICATED TITLE!
})
```

**Correct Approach**:
```javascript
create_issue({
  "summary": "Admin-Web Final Compilation Verification & Testing",
  "description": "Perform final compilation verification and runtime testing..." // ✅ NO TITLE DUPLICATION
})
```

### 3. **405 Method Not Allowed Errors**

**Error Message**: `YouTrack API Error (405): Method Not Allowed`

**Common Causes**:
- Incorrect HTTP method for the endpoint
- YouTrack API limitations for certain operations
- Trying to create issue dependencies programmatically

**Solutions**:
- ✅ **Use Web Interface**: For issue dependencies, use YouTrack web UI
- ✅ **Check API Documentation**: Some operations require different approaches
- ✅ **Alternative Workflows**: Use issue descriptions to document dependencies

**Issue Dependencies Limitation**:
```javascript
// This may fail with 405 error
create_issue_dependency({
  sourceIssueId: "MYD-1",
  targetIssueId: "MYD-2"
})

// Alternative: Document in issue description
create_issue({
  summary: "Task that depends on MYD-2",
  description: "This task depends on completion of MYD-2.\n\n[Rest of description...]"
})
```

## 🔧 Debugging Steps

### Step 1: Check Project Access
```javascript
// Verify you can access the project
list_projects()

// Validate specific project
validate_project({ projectId: "MYD" })
```

### Step 2: Verify Issue Existence
```javascript
// Check if issue exists before updating
query_issues({ query: "project: MYD #MYD-32" })
```

### Step 3: Validate Content Before Creating
```bash
# Use the validation utility
npm run validate-content issue "Your title" "Your description"
```

### Step 4: Check Field Values
```javascript
// Get available field values for the project
get_project_custom_fields({ projectId: "MYD" })

// Get specific field values
get_project_field_values({ 
  projectId: "MYD", 
  fieldName: "Priority" 
})
```

## 📋 Best Practices

### For Issue Creation:
1. **Always validate content first** using the validation tool
2. **Use separate fields** for type, priority, state - never prefix the title
3. **Keep descriptions clean** - no title duplication
4. **Check project access** before creating issues

### For Issue Updates:
1. **Verify issue exists** before updating
2. **Use correct issue IDs** (PROJECT-NUMBER format)
3. **Check permissions** for the specific issue

### For Dependencies:
1. **Use YouTrack web interface** for creating dependencies
2. **Document dependencies** in issue descriptions as alternative
3. **Plan dependency workflows** at project setup time

## 🚨 Critical Content Rules

### ❌ NEVER Do This:
```javascript
// Don't duplicate title in description
create_issue({
  summary: "Fix login bug",
  description: "# Fix login bug\n\nThis issue is about fixing the login bug..."
})

// Don't use prefixes in summary
create_issue({
  summary: "[BUG][HIGH] Fix login bug",
  type: "Bug",     // Use these fields instead
  priority: "High"
})
```

### ✅ ALWAYS Do This:
```javascript
// Clean separation of title and content
create_issue({
  summary: "Fix login bug",
  description: "Steps to reproduce:\n1. Go to login page\n2. Enter credentials...",
  type: "Bug",
  priority: "High"
})

// Clean article creation
create_article({
  title: "API Integration Guide",
  summary: "Complete guide for REST API integration",
  content: "This document covers:\n\n## Prerequisites\n\n## Setup Steps..."
})
```

## 🔍 Error Log Analysis

When you see errors in the logs:

1. **Check the error type** (404, 400, 405)
2. **Look at the context** (issueId, projectId, params)
3. **Review the method** that failed
4. **Apply the appropriate solution** from this guide

## 🎯 Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| 404 on update | Verify issue exists with `query_issues` |
| 400 on create | Check for title duplication in description |
| 405 on dependencies | Use YouTrack web interface instead |
| 403 permissions | Verify token has project access |

---

**Remember**: The MCP server now includes automatic validation that will warn you about potential issues before they cause API errors!
