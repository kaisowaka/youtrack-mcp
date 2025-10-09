/**
 * Mock data fixtures for testing
 */

export const mockIssue = {
  id: '3-123',
  idReadable: 'YTMCP-123',
  summary: 'Test Issue',
  description: 'Test issue description',
  created: 1759999254971,
  updated: 1759999602880,
  resolved: null,
  project: {
    id: '0-6',
    shortName: 'YTMCP',
    name: 'YouTrack MCP',
    $type: 'Project'
  },
  reporter: {
    id: 'user-1',
    login: 'testuser',
    fullName: 'Test User',
    email: 'test@example.com',
    $type: 'User'
  },
  customFields: [
    {
      name: 'State',
      value: {
        name: 'Open',
        isResolved: false,
        $type: 'StateBundleElement'
      },
      $type: 'StateIssueCustomField'
    },
    {
      name: 'Priority',
      value: {
        name: 'Normal',
        $type: 'EnumBundleElement'
      },
      $type: 'SingleEnumIssueCustomField'
    },
    {
      name: 'Type',
      value: {
        name: 'Task',
        $type: 'EnumBundleElement'
      },
      $type: 'SingleEnumIssueCustomField'
    }
  ],
  tags: [],
  attachments: [],
  comments: [],
  $type: 'Issue'
};

export const mockProject = {
  id: '0-6',
  shortName: 'YTMCP',
  name: 'YouTrack MCP',
  description: 'Test project for YouTrack MCP',
  archived: false,
  $type: 'Project'
};

export const mockUser = {
  id: 'user-1',
  login: 'testuser',
  fullName: 'Test User',
  email: 'test@example.com',
  banned: false,
  online: false,
  avatarUrl: 'https://example.com/avatar.jpg',
  $type: 'User'
};

export const mockGroup = {
  id: 'group-1',
  name: 'Developers',
  description: 'Development team',
  ringId: 'ring-1',
  autoJoin: false,
  $type: 'UserGroup'
};

export const mockCustomField = {
  id: 'field-1',
  name: 'Sprint Points',
  ordinal: 0,
  isPublic: true,
  hasRunningJob: false,
  isUpdateable: true,
  fieldType: {
    id: 'integer',
    presentation: 'integer',
    $type: 'FieldType'
  },
  instances: [],
  $type: 'CustomField'
};

export const mockEnumBundle = {
  id: 'bundle-1',
  name: 'Priority',
  values: [
    {
      id: 'value-1',
      name: 'Critical',
      description: 'Critical priority',
      ordinal: 0,
      archived: false,
      $type: 'EnumBundleElement'
    },
    {
      id: 'value-2',
      name: 'High',
      description: 'High priority',
      ordinal: 1,
      archived: false,
      $type: 'EnumBundleElement'
    },
    {
      id: 'value-3',
      name: 'Normal',
      description: 'Normal priority',
      ordinal: 2,
      archived: false,
      $type: 'EnumBundleElement'
    }
  ],
  $type: 'EnumBundle'
};

export const mockComment = {
  id: 'comment-1',
  text: 'Test comment',
  created: 1759999254971,
  updated: 1759999254971,
  author: mockUser,
  deleted: false,
  $type: 'IssueComment'
};

export const mockWorkItem = {
  id: 'work-1',
  author: mockUser,
  creator: mockUser,
  text: 'Development work',
  type: {
    name: 'Development',
    $type: 'WorkItemType'
  },
  created: 1759999254971,
  updated: 1759999254971,
  duration: {
    minutes: 120,
    presentation: '2h',
    $type: 'DurationValue'
  },
  date: 1759999254971,
  $type: 'IssueWorkItem'
};

export const mockAgileBoard = {
  id: 'board-1',
  name: 'Scrum Board',
  owner: mockUser,
  favorite: false,
  $type: 'AgileBoard'
};

export const mockSprint = {
  id: 'sprint-1',
  name: 'Sprint 1',
  goal: 'Complete Phase 1',
  start: 1759999254971,
  finish: 1760604054971,
  archived: false,
  $type: 'Sprint'
};

export const mockArticle = {
  id: 'article-1',
  idReadable: 'A-1',
  summary: 'Test Article',
  content: '# Test Article\n\nThis is test content.',
  created: 1759999254971,
  updated: 1759999254971,
  author: mockUser,
  project: mockProject,
  visibility: {
    $type: 'LimitedVisibility',
    permittedGroups: [],
    permittedUsers: []
  },
  $type: 'Article'
};

export const mockWatchers = {
  hasStar: true,
  issueWatchers: [
    {
      user: mockUser,
      $type: 'IssueWatcher'
    }
  ],
  $type: 'IssueWatchers'
};

// Mock API responses
export const mockResponses = {
  issuesList: {
    data: [mockIssue],
    $type: 'IssueList'
  },
  projectsList: {
    data: [mockProject],
    $type: 'ProjectList'
  },
  usersList: {
    data: [mockUser],
    $type: 'UserList'
  },
  customFieldsList: {
    data: [mockCustomField],
    $type: 'CustomFieldList'
  }
};

// Error responses
export const mockErrors = {
  notFound: {
    error: 'Not Found',
    error_description: 'Entity not found',
    error_developer_message: 'The requested entity does not exist',
    $type: 'Error'
  },
  unauthorized: {
    error: 'Unauthorized',
    error_description: 'Authentication required',
    error_developer_message: 'Valid authentication credentials required',
    $type: 'Error'
  },
  forbidden: {
    error: 'Forbidden',
    error_description: 'Access denied',
    error_developer_message: 'You do not have permission to perform this action',
    $type: 'Error'
  },
  badRequest: {
    error: 'Bad Request',
    error_description: 'Invalid parameters',
    error_developer_message: 'The request parameters are invalid',
    $type: 'Error'
  }
};
