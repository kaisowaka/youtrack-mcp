# YouTrack MCP Usage Guidelines: Avoiding Content Duplication

## 🚨 Critical Issue: Header/Content Duplication

### The Problem
When creating issues or articles in YouTrack, users often accidentally duplicate header information (title, summary, type, priority) in the content body. This causes:

- **Duplicate titles** in YouTrack views
- **Redundant information** in PDF exports  
- **Poor user experience** when browsing issues/articles
- **Cluttered interface** with repeated content

### Why This Happens
YouTrack **automatically displays** header fields (title, summary, type, priority) separately from the content body. Users coming from manual markdown preparation often include headers in content without realizing YouTrack handles this automatically.

## ✅ Best Practices

### For Articles (`create_article`, `update_article`)

#### ❌ WRONG - Duplicating header in content:
```javascript
{
  "title": "API Integration Guide",
  "summary": "Complete guide for REST API integration",
  "content": "# API Integration Guide\n\nComplete guide for REST API integration\n\nThis document covers..."
}
```

#### ✅ CORRECT - Clean separation:
```javascript
{
  "title": "API Integration Guide",  // Displayed in header
  "summary": "Complete guide for REST API integration",  // Displayed in header
  "content": "This document covers the following topics:\n\n## Prerequisites\n\n## Setup Steps\n\n..."  // Content only
}
```

### For Issues (`create_issue`)

#### ❌ WRONG - Duplicating/prefixing in summary:
```javascript
{
  "summary": "[BUG] [HIGH] Login fails - Login fails when using OAuth",
  "description": "# Login fails when using OAuth\n\nHigh priority bug...",
  "type": "Bug",
  "priority": "High"
}
```

#### ✅ CORRECT - Using proper fields:
```javascript
{
  "summary": "Login fails when using OAuth",  // Clean title only
  "description": "Steps to reproduce:\n1. Go to login page\n2. Click OAuth...",  // No title repetition
  "type": "Bug",      // Use dedicated field
  "priority": "High"  // Use dedicated field
}
```

## 🔍 MCP Tool Validations

The YouTrack MCP server now includes **automatic validation** that will warn you about potential duplication:

### Warnings You May See:

1. **Title Duplication**: 
   ```
   ⚠️ WARNING: Title "API Guide" appears to be duplicated in content. YouTrack displays title separately.
   ```

2. **Summary Duplication**:
   ```
   ⚠️ WARNING: Summary appears to be duplicated in content. YouTrack displays summary separately.
   ```

3. **Type/Priority Prefixes**:
   ```
   ⚠️ WARNING: Summary appears to have type prefix. Use the separate 'type' field instead.
   ```

4. **Markdown Header Duplication**:
   ```
   ⚠️ WARNING: Title appears as markdown header in content. Remove it to avoid duplication.
   ```

## 📋 Content Preparation Checklist

When preparing content for YouTrack:

### Before Creating Articles:
- [ ] Title goes in `title` field only
- [ ] Summary goes in `summary` field only  
- [ ] Content starts with actual content, not title repetition
- [ ] Remove any markdown headers that duplicate the title
- [ ] Tags use the `tags` array, not content mentions

### Before Creating Issues:
- [ ] Summary is clean, descriptive title only
- [ ] No type prefixes like "[BUG]" or "[FEATURE]" in summary
- [ ] No priority prefixes like "[HIGH]" or "[URGENT]" in summary
- [ ] Description doesn't repeat the summary
- [ ] Use dedicated fields: `type`, `priority`, `state`, `assignee`

## 🛠️ Tool-Specific Guidelines

### `create_article`
```typescript
{
  title: string,           // Header field - displayed prominently
  summary?: string,        // Header field - displayed as subtitle  
  content: string,         // Body content - starts with actual content
  projectId?: string,      // Use environment PROJECT_ID if available
  tags?: string[]          // Use array, not content mentions
}
```

### `create_issue`  
```typescript
{
  summary: string,         // Header field - clean title only
  description?: string,    // Body content - no title repetition
  type?: string,           // Metadata field - not in summary
  priority?: string,       // Metadata field - not in summary
  projectId?: string,      // Use environment PROJECT_ID if available
  tags?: string[]          // Use array, not content mentions
}
```

## 🎯 Migration from Manual Docs

If you have existing markdown documents:

1. **Extract the title** → Use as `title` field
2. **Extract any summary/subtitle** → Use as `summary` field  
3. **Remove title headers** from content (`# Title`)
4. **Remove metadata sections** (type, priority, etc.)
5. **Keep only body content** for the `content` field
6. **Convert metadata** to proper fields (`type`, `priority`, etc.)

## 🔄 Testing Your Content

Use the MCP tools and check the response for warnings:

```json
{
  "success": true,
  "warnings": [
    "⚠️ WARNING: Title appears as markdown header in content. Remove it to avoid duplication."
  ],
  "note": "Please review warnings about potential content duplication"
}
```

Address any warnings before considering the content properly formatted.

---

**Remember**: YouTrack is designed to handle structured metadata. Let it do its job by providing clean, separated content!
