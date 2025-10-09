/**
 * Integration Tests for AgileAPIClient Methods
 * Tests agile boards and sprint management
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AgileAPIClient } from '../../api/domains/agile-boards-api.js';
import type { YouTrackConfig } from '../../api/base/base-client.js';

describe('AgileAPIClient - Method Logic Tests', () => {
  let client: AgileAPIClient;
  let mockGet: any;
  let mockPost: any;

  beforeEach(() => {
    const config: YouTrackConfig = {
      baseURL: 'https://youtrack.test.com',
      token: 'test-token-123',
    };
    
    client = new AgileAPIClient(config);
    mockGet = jest.spyOn((client as any).axios, 'get');
    mockPost = jest.spyOn((client as any).axios, 'post');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('listAgileBoards', () => {
    test('should list all agile boards', async () => {
      const mockBoards = [
        { id: 'board-1', name: 'Sprint Board', projects: [] },
        { id: 'board-2', name: 'Kanban Board', projects: [] },
      ];

      mockGet.mockResolvedValue({
        data: mockBoards,
        status: 200,
      });

      const result = await client.listAgileBoards();

      expect(mockGet).toHaveBeenCalledWith(
        '/agiles',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('2');
    });

    test('should handle empty board list', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.listAgileBoards();

      expect(result.content[0].text).toContain('0');
    });

    test('should include details when requested', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      await client.listAgileBoards({ includeDetails: true });

      const call = mockGet.mock.calls.find((call: any) => 
        call[1]?.fields?.includes('sprints')
      );

      expect(call).toBeDefined();
    });

    test('should filter by project ID', async () => {
      const mockBoards = [
        { id: 'board-1', name: 'Board 1', projects: [{ id: 'proj-1' }] },
        { id: 'board-2', name: 'Board 2', projects: [{ id: 'proj-2' }] },
      ];

      mockGet.mockResolvedValue({
        data: mockBoards,
        status: 200,
      });

      const result = await client.listAgileBoards({ projectId: 'proj-1' });

      expect(result.content[0].text).toContain('1');
    });

    test('should handle API errors', async () => {
      mockGet.mockRejectedValue({
        message: 'Unauthorized',
        response: { status: 401 },
      });

      const result = await client.listAgileBoards();

      expect(result.content[0].text).toContain('error');
    });
  });

  describe('getBoardDetails', () => {
    test('should fetch board details', async () => {
      const mockBoard = {
        id: 'board-1',
        name: 'Sprint Board',
        projects: [],
        sprints: [],
      };

      mockGet.mockResolvedValue({
        data: mockBoard,
        status: 200,
      });

      const result = await client.getBoardDetails({ boardId: 'board-1' });

      expect(mockGet).toHaveBeenCalledWith(
        '/agiles/board-1',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('Sprint Board');
    });

    test('should include columns when requested', async () => {
      mockGet.mockResolvedValue({
        data: { id: 'board-1', name: 'Test', columns: [] },
        status: 200,
      });

      await client.getBoardDetails({ 
        boardId: 'board-1', 
        includeColumns: true 
      });

      const call = mockGet.mock.calls.find((call: any) => 
        call[1]?.fields?.includes('columns')
      );

      expect(call).toBeDefined();
    });

    test('should include sprints when requested', async () => {
      mockGet.mockResolvedValue({
        data: { id: 'board-1', name: 'Test', sprints: [] },
        status: 200,
      });

      await client.getBoardDetails({ 
        boardId: 'board-1', 
        includeSprints: true 
      });

      const call = mockGet.mock.calls.find((call: any) => 
        call[1]?.fields?.includes('sprints')
      );

      expect(call).toBeDefined();
    });

    test('should handle board not found', async () => {
      mockGet.mockRejectedValue({
        message: 'Board not found',
        response: { status: 404 },
      });

      const result = await client.getBoardDetails({ boardId: 'nonexistent' });

      expect(result.content[0].text).toContain('not found');
    });

    test('should compute metrics', async () => {
      const mockBoard = {
        id: 'board-1',
        name: 'Test Board',
        sprints: [
          { id: 's1', archived: false },
          { id: 's2', archived: true },
        ],
        columns: [{ id: 'c1' }, { id: 'c2' }],
        projects: [{ id: 'p1' }],
      };

      mockGet.mockResolvedValue({
        data: mockBoard,
        status: 200,
      });

      const result = await client.getBoardDetails({ 
        boardId: 'board-1',
        includeSprints: true,
        includeColumns: true
      });

      expect(result.content[0].text).toContain('Test Board');
    });
  });

  describe('createSprint', () => {
    test('should create sprint with required fields', async () => {
      const mockSprint = {
        id: 'sprint-new',
        name: 'New Sprint',
      };

      mockPost.mockResolvedValue({
        data: mockSprint,
        status: 200,
      });

      const result = await client.createSprint({
        boardId: 'board-1',
        name: 'New Sprint',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/agiles/board-1/sprints',
        expect.objectContaining({
          name: 'New Sprint',
        })
      );

      expect(result.content[0].text).toContain('created');
    });

    test('should include start date when provided', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'sprint-1' },
        status: 200,
      });

      await client.createSprint({
        boardId: 'board-1',
        name: 'Sprint',
        start: '2025-10-01',
      });

      const call = mockPost.mock.calls.find((call: any) => 
        call[1]?.start !== undefined
      );

      expect(call).toBeDefined();
      expect(call[1].start).toBeGreaterThan(0);
    });

    test('should include finish date when provided', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'sprint-1' },
        status: 200,
      });

      await client.createSprint({
        boardId: 'board-1',
        name: 'Sprint',
        finish: '2025-10-14',
      });

      const call = mockPost.mock.calls.find((call: any) => 
        call[1]?.finish !== undefined
      );

      expect(call).toBeDefined();
      expect(call[1].finish).toBeGreaterThan(0);
    });

    test('should include goal when provided', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'sprint-1' },
        status: 200,
      });

      await client.createSprint({
        boardId: 'board-1',
        name: 'Sprint',
        goal: 'Complete user authentication',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/agiles/board-1/sprints',
        expect.objectContaining({
          goal: 'Complete user authentication',
        })
      );
    });

    test('should handle creation errors', async () => {
      mockPost.mockRejectedValue({
        message: 'Invalid sprint data',
        response: { status: 400 },
      });

      const result = await client.createSprint({
        boardId: 'board-1',
        name: 'Sprint',
      });

      expect(result.content[0].text).toContain('error');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockGet.mockRejectedValue(new Error('Network failure'));

      const result = await client.listAgileBoards();

      expect(result.content[0].text).toContain('error');
    });

    test('should handle timeout errors', async () => {
      mockGet.mockRejectedValue({
        message: 'timeout',
        code: 'ECONNABORTED',
      });

      const result = await client.getBoardDetails({ boardId: 'board-1' });

      expect(result.content[0].text).toContain('error');
    });

    test('should handle permission errors', async () => {
      mockGet.mockRejectedValue({
        message: 'Forbidden',
        response: { status: 403 },
      });

      const result = await client.listAgileBoards();

      expect(result.content[0].text).toContain('error');
    });

    test('should handle malformed responses', async () => {
      mockGet.mockResolvedValue({
        data: null,
        status: 200,
      });

      const result = await client.listAgileBoards();

      expect(result).toHaveProperty('content');
    });
  });
});
