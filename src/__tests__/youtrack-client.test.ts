import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { YouTrackClient, MCPResponse } from '../youtrack-client.js';

// Mock the logger to prevent console output during tests
jest.mock('../logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  logApiCall: jest.fn(),
  logError: jest.fn(),
}));

// Mock the cache
jest.mock('../cache.js', () => ({
  SimpleCache: jest.fn().mockImplementation(() => ({
    get: jest.fn(() => null),
    set: jest.fn(),
  })),
}));

// Mock axios
const mockAxiosInstance = {
  get: jest.fn() as jest.MockedFunction<any>,
  post: jest.fn() as jest.MockedFunction<any>,
  interceptors: {
    response: { use: jest.fn() },
  },
};

jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => mockAxiosInstance),
  },
}));

jest.mock('axios-retry', () => jest.fn());

describe('YouTrackClient', () => {
  let client: YouTrackClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new YouTrackClient('https://test.youtrack.cloud', 'test-token');
  });

  describe('getProjectStats', () => {
    it('should fetch project statistics successfully', async () => {
      const mockValidation = { 
        exists: true, 
        accessible: true, 
        project: { id: 'TEST', name: 'Test Project', shortName: 'TST' },
        message: 'Project found successfully'
      };
      const mockIssues = [
        { id: 'TEST-1', state: { name: 'Open' }, priority: { name: 'High' }, type: { name: 'Bug' }, created: new Date().toISOString() },
        { id: 'TEST-2', state: { name: 'Closed' }, priority: { name: 'Normal' }, type: { name: 'Feature' }, created: new Date().toISOString() },
        { id: 'TEST-3', state: { name: 'Open' }, priority: { name: 'High' }, type: { name: 'Bug' }, created: new Date().toISOString() },
      ];

      // Mock validateProject call
      jest.spyOn(client, 'validateProject').mockResolvedValueOnce(mockValidation);
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockIssues });

      const result = await client.getProjectStats('TEST');
      
      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('totalIssues', 3);
      expect(result).toHaveProperty('byState');
      expect(result).toHaveProperty('byPriority');
      expect(result).toHaveProperty('byType');
      expect(result.byState.Open).toBe(2);
      expect(result.byState.Closed).toBe(1);
      expect(result.byPriority.High).toBe(2);
      expect(result.byPriority.Normal).toBe(1);
    });

    it('should handle project not found', async () => {
      const mockValidation = { exists: false, accessible: false, message: 'Project not found' };
      jest.spyOn(client, 'validateProject').mockResolvedValueOnce(mockValidation);

      await expect(client.getProjectStats('TEST'))
        .rejects.toThrow('Project \'TEST\' not found');
    });

    it('should handle API errors', async () => {
      const mockValidation = { 
        exists: true, 
        accessible: true, 
        project: { id: 'TEST' },
        message: 'Project found successfully'
      };
      jest.spyOn(client, 'validateProject').mockResolvedValueOnce(mockValidation);
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getProjectStats('TEST'))
        .rejects.toThrow('Failed to get project statistics: Network error');
    });
  });

  describe('createIssue', () => {
    it('should create issue successfully', async () => {
      const mockResponse = { 
        data: { 
          id: 'TEST-123', 
          summary: 'Test Issue',
          project: { id: 'TEST', name: 'Test Project' }
        } 
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await client.createIssue({
        projectId: 'TEST',
        summary: 'Test Issue',
        description: 'Test description',
        type: 'Bug',
        priority: 'High'
      });

      expect(result.content[0].text).toContain('Issue created successfully: TEST-123');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/issues', expect.objectContaining({
        project: { id: 'TEST' },
        summary: 'Test Issue',
        description: 'Test description',
        customFields: expect.arrayContaining([
          { name: 'Type', value: { name: 'Bug' } },
          { name: 'Priority', value: { name: 'High' } }
        ])
      }), expect.any(Object));
    });
  });

  describe('queryIssues', () => {
    it('should query issues successfully', async () => {
      const mockIssues = [
        { id: 'TEST-1', summary: 'Issue 1', state: { name: 'Open' } },
        { id: 'TEST-2', summary: 'Issue 2', state: { name: 'Closed' } },
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockIssues });

      const result = await client.queryIssues('project: TEST state: Open');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/issues', {
        params: {
          query: 'project: TEST state: Open',
          fields: 'id,summary,description,state(name),priority(name),reporter(login,fullName),assignee(login,fullName)',
          $top: 50,
        },
      });

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult).toHaveLength(2);
      expect(parsedResult[0].id).toBe('TEST-1');
    });
  });

  describe('updateIssue', () => {
    it('should update issue successfully', async () => {
      const mockResponse = { 
        data: { 
          id: 'TEST-123', 
          summary: 'Updated Issue',
          state: { name: 'In Progress' }
        } 
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await client.updateIssue('TEST-123', {
        summary: 'Updated Issue',
        state: 'In Progress',
        assignee: 'john.doe'
      });

      expect(result.content[0].text).toContain('Issue updated successfully: TEST-123');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/issues/TEST-123', expect.objectContaining({
        summary: 'Updated Issue',
        customFields: expect.arrayContaining([
          { name: 'State', value: { name: 'In Progress' } },
          { name: 'Assignee', value: { login: 'john.doe' } }
        ])
      }), expect.any(Object));
    });
  });

  describe('getProjectIssuesSummary', () => {
    it('should generate project summary successfully', async () => {
      const mockIssues = [
        { id: 'TEST-1', state: { name: 'Open' }, priority: { name: 'High' }, type: { name: 'Bug' } },
        { id: 'TEST-2', state: { name: 'Closed' }, priority: { name: 'Normal' }, type: { name: 'Feature' } },
        { id: 'TEST-3', state: { name: 'Open' }, priority: { name: 'High' }, type: { name: 'Bug' } },
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockIssues });

      const result = await client.getProjectIssuesSummary('TEST');

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.total).toBe(3);
      expect(parsedResult.byState.Open).toBe(2);
      expect(parsedResult.byState.Closed).toBe(1);
      expect(parsedResult.byPriority.High).toBe(2);
      expect(parsedResult.byType.Bug).toBe(2);
    });
  });
});
