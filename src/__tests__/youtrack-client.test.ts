import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { YouTrackClient, MCPResponse } from '../youtrack-client.js';
import axios from 'axios';

jest.mock('axios');
jest.mock('axios-retry');

describe('YouTrackClient', () => {
  let client: YouTrackClient;
  let mockedAxios: jest.Mocked<typeof axios>;
  let mockApi: any;

  beforeEach(() => {
    mockedAxios = axios as jest.Mocked<typeof axios>;
    mockApi = {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        response: { use: jest.fn() },
      },
    };
    
    mockedAxios.create.mockReturnValue(mockApi);
    client = new YouTrackClient('https://test.youtrack.cloud', 'test-token');
  });

  describe('getProjectStatus', () => {
    it('should fetch project status successfully', async () => {
      const mockProject = { id: 'TEST', name: 'Test Project', shortName: 'TST' };
      const mockIssues = [
        { id: 'TEST-1', state: { name: 'Open' } },
        { id: 'TEST-2', state: { name: 'Closed' } },
        { id: 'TEST-3', state: { name: 'Open' } },
      ];

      mockApi.get
        .mockResolvedValueOnce({ data: mockProject })
        .mockResolvedValueOnce({ data: mockIssues });

      const result: MCPResponse = await client.getProjectStatus('TEST', true);
      
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('text');
      expect(result.content[0].text).toContain('Test Project');
      expect(result.content[0].text).toContain('Open');
      expect(result.content[0].text).toContain('Closed');
      
      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.project.name).toBe('Test Project');
      expect(parsedResult.issueStatistics.byState.Open).toBe(2);
      expect(parsedResult.issueStatistics.byState.Closed).toBe(1);
    });

    it('should handle project without issues', async () => {
      const mockProject = { id: 'TEST', name: 'Test Project' };

      mockApi.get.mockResolvedValueOnce({ data: mockProject });

      const result = await client.getProjectStatus('TEST', false);
      
      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.project.name).toBe('Test Project');
      expect(parsedResult.issueStatistics).toBeUndefined();
    });

    it('should handle API errors', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getProjectStatus('TEST', true))
        .rejects.toThrow('Failed to get project status: Network error');
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

      mockApi.post.mockResolvedValueOnce(mockResponse);

      const result = await client.createIssue({
        projectId: 'TEST',
        summary: 'Test Issue',
        description: 'Test description',
        type: 'Bug',
        priority: 'High'
      });

      expect(result.content[0].text).toContain('Issue created successfully: TEST-123');
      expect(mockApi.post).toHaveBeenCalledWith('/issues', expect.objectContaining({
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

      mockApi.get.mockResolvedValueOnce({ data: mockIssues });

      const result = await client.queryIssues('project: TEST state: Open');

      expect(mockApi.get).toHaveBeenCalledWith('/issues', {
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

      mockApi.post.mockResolvedValueOnce(mockResponse);

      const result = await client.updateIssue('TEST-123', {
        summary: 'Updated Issue',
        state: 'In Progress',
        assignee: 'john.doe'
      });

      expect(result.content[0].text).toContain('Issue updated successfully: TEST-123');
      expect(mockApi.post).toHaveBeenCalledWith('/issues/TEST-123', expect.objectContaining({
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

      mockApi.get.mockResolvedValueOnce({ data: mockIssues });

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
