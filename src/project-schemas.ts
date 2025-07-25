// Auto-generated project schemas for dynamic issue management
export const PROJECT_SCHEMAS = [
  {
    "projectId": "YTM",
    "projectName": "YouTrack MCP",
    "workflow": {
      "defaultState": "Open",
      "progressState": "In Progress",
      "doneState": "Done"
    },
    "types": {
      "available": [
        "Bug",
        "Epic",
        "User Story",
        "Task"
      ],
      "defaults": {
        "bug": "Bug",
        "feature": "User Story",
        "task": "Task",
        "epic": "Epic"
      }
    },
    "priorities": {
      "available": [
        "Show-stopper",
        "Critical",
        "Major",
        "Normal",
        "Minor"
      ],
      "default": "Normal"
    },
    "assignees": {
      "available": [
        "YouTrack MCP Team"
      ],
      "defaultTeam": "YouTrack MCP Team"
    },
    "estimationFields": {
      "timeFields": [
        "Original estimation"
      ],
      "pointsFields": [
        "Ideal days",
        "Story points"
      ],
      "defaultValues": {
        "Story points": 3,
        "Ideal days": 1,
        "Original estimation": 240,
        "Estimation": "4h"
      }
    },
    "uniqueFields": [
      "Sprints",
      "Ideal days",
      "Original estimation",
      "Story points"
    ]
  },
  {
    "projectId": "MYD",
    "projectName": "MyDR24",
    "workflow": {
      "defaultState": "Open",
      "progressState": "In Progress",
      "doneState": "Fixed"
    },
    "types": {
      "available": [
        "Bug",
        "Cosmetics",
        "Exception",
        "Feature",
        "Task",
        "Usability Problem",
        "Performance Problem",
        "Epic"
      ],
      "defaults": {
        "bug": "Bug",
        "feature": "Feature",
        "task": "Task",
        "epic": "Epic"
      }
    },
    "priorities": {
      "available": [
        "Show-stopper",
        "Critical",
        "Major",
        "Normal",
        "Minor"
      ],
      "default": "Normal"
    },
    "assignees": {
      "available": [
        "Developer 1 - Devstroop",
        "Developer 2 - Devstroop",
        "Developer 3 - Devstroop",
        "Developer 4 - Devstroop",
        "Developer 5 - Devstroop",
        "MyDR24 Team"
      ],
      "defaultTeam": "MyDR24 Team"
    },
    "estimationFields": {
      "timeFields": [
        "Estimation",
        "Spent time"
      ],
      "pointsFields": [],
      "defaultValues": {
        "Story points": 3,
        "Ideal days": 1,
        "Original estimation": 240,
        "Estimation": "4h"
      }
    },
    "uniqueFields": [
      "Subsystem",
      "Fix versions",
      "Affected versions",
      "Fixed in build",
      "Estimation",
      "Spent time"
    ]
  }
];

export function getProjectSchema(projectId: string) {
  return PROJECT_SCHEMAS.find(schema => schema.projectId === projectId);
}

export function getDefaultIssueProperties(projectId: string, issueType: 'bug' | 'feature' | 'task' | 'epic' = 'task') {
  const schema = getProjectSchema(projectId);
  if (!schema) return null;
  
  return {
    state: schema.workflow.defaultState,
    type: schema.types.defaults[issueType] || schema.types.available[0],
    priority: schema.priorities.default,
    assignee: schema.assignees.defaultTeam,
    estimationValues: schema.estimationFields.defaultValues
  };
}
