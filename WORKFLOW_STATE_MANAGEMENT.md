# YouTrack State Management & Workflow Guide

## 🎯 CRITICAL: Complete Work Properly

**PROBLEM IDENTIFIED**: Agents create, update, and comment on issues but don't change states when work is completed!

**SOLUTION**: Use these dedicated state management tools to properly complete workflows.

## 🚀 Quick State Management Tools

### 1. `complete_issue` - Mark Work as Done ✅
**Use this when you finish working on something!**

```javascript
// When you've completed a bug fix
complete_issue({
  issueId: "PROJ-123",
  completionComment: "Fixed the login validation issue by updating the regex pattern",
  resolution: "Fixed",
  logTime: "2h"
})

// When you've implemented a feature
complete_issue({
  issueId: "PROJ-456",
  completionComment: "Implemented user dashboard with all requested widgets",
  resolution: "Implemented"
})
```

### 2. `start_working_on_issue` - Begin Work 🔨
**Use this when you start working on something!**

```javascript
start_working_on_issue({
  issueId: "PROJ-789",
  comment: "Starting implementation of payment processing module",
  estimatedTime: "4h"
})
```

### 3. `change_issue_state` - Custom State Changes 🔄
**For specific state transitions**

```javascript
// Move to testing
change_issue_state({
  issueId: "PROJ-123",
  newState: "Testing",
  comment: "Implementation complete, ready for QA testing"
})

// Mark as resolved
change_issue_state({
  issueId: "PROJ-456", 
  newState: "Resolved",
  resolution: "Won't fix",
  comment: "This is working as intended per product requirements"
})
```

### 4. `get_issue_workflow_states` - See Available States 📋
**Check what states are available before changing**

```javascript
get_issue_workflow_states({
  issueId: "PROJ-123"
})
// Returns: { currentState: "In Progress", availableStates: [...] }
```

### 5. `get_my_active_issues` - See Your Work 📝
**Get all issues you're working on**

```javascript
get_my_active_issues({
  includeDetails: true
})
```

## 🔄 Complete Workflow Examples

### Bug Fix Workflow
```javascript
// 1. Start working
start_working_on_issue({
  issueId: "BUG-101",
  comment: "Investigating database connection timeout issue",
  estimatedTime: "3h"
})

// 2. Add progress comments as you work
add_issue_comment({
  issueId: "BUG-101", 
  text: "Found the issue - connection pool size too small. Implementing fix."
})

// 3. Complete the work
complete_issue({
  issueId: "BUG-101",
  completionComment: "Fixed by increasing connection pool size to 20 and adding retry logic",
  resolution: "Fixed",
  logTime: "2.5h"
})
```

### Feature Implementation Workflow
```javascript
// 1. Start development
start_working_on_issue({
  issueId: "FEAT-200",
  comment: "Beginning implementation of user authentication system",
  estimatedTime: "1d"
})

// 2. Move to testing when dev is done
change_issue_state({
  issueId: "FEAT-200",
  newState: "Testing", 
  comment: "Development complete, ready for testing"
})

// 3. Complete after testing
complete_issue({
  issueId: "FEAT-200",
  completionComment: "Authentication system implemented and tested. All requirements met.",
  resolution: "Implemented",
  logTime: "6h"
})
```

## 📊 Common States & Resolutions

### Typical Issue States:
- **Open** - New, unassigned issues
- **In Progress** - Currently being worked on
- **Testing** - Development done, in QA
- **Done** - Completed successfully
- **Resolved** - Fixed but may need verification
- **Closed** - Completely finished

### Common Resolutions:
- **Fixed** - Bug was resolved
- **Implemented** - Feature was built
- **Won't fix** - Decided not to address
- **Duplicate** - Same as another issue
- **Cannot reproduce** - Unable to recreate problem

## 🚨 Critical Workflow Rules

### ✅ DO THIS:
1. **Always use `start_working_on_issue`** when you begin work
2. **Always use `complete_issue`** when you finish work  
3. **Add comments** explaining what you did
4. **Log time** if you track work hours
5. **Use proper resolutions** (Fixed, Implemented, etc.)

### ❌ DON'T DO THIS:
1. Don't leave issues in "In Progress" forever
2. Don't forget to change states when done
3. Don't use generic comments like "Done"
4. Don't skip the completion step

## 🎯 Agent Best Practices

### For AI Agents Working on Issues:

1. **Start Every Work Session:**
```javascript
start_working_on_issue({
  issueId: "ISSUE-ID",
  comment: "Beginning work on [specific task]", 
  estimatedTime: "2h"
})
```

2. **Provide Progress Updates:**
```javascript
add_issue_comment({
  issueId: "ISSUE-ID",
  text: "Progress update: [what you've accomplished]"
})
```

3. **Complete When Done:**
```javascript
complete_issue({
  issueId: "ISSUE-ID", 
  completionComment: "Completed [specific work done and how]",
  resolution: "Fixed" // or "Implemented" 
})
```

4. **Check Your Active Work:**
```javascript
get_my_active_issues({ includeDetails: true })
```

## 🔧 Troubleshooting

### If State Change Fails:
1. Check available states: `get_issue_workflow_states()`
2. Verify you have permissions to change the issue
3. Make sure the state name is exact (case-sensitive)

### If You Can't Complete:
1. Use `change_issue_state()` to move to a pre-completion state
2. Add a comment explaining any blockers
3. Update assignment if someone else needs to finish

## 🎉 Success Metrics

After implementing proper state management:
- ✅ Issues move through proper workflow stages
- ✅ Work completion is tracked and visible
- ✅ Project managers can see actual progress
- ✅ Team knows what's been finished
- ✅ Time logging provides accurate project data

**Remember**: The goal is complete workflows, not just task completion!
