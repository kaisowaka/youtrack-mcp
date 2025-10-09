/**
 * Integration Tests for WorkItemsAPIClient Methods
 * Tests time tracking and work item operations
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WorkItemsAPIClient } from '../../api/domains/workitems-api.js';
import type { YouTrackConfig } from '../../api/base/base-client.js';

describe('WorkItemsAPIClient - Method Logic Tests', () => {
  let client: WorkItemsAPIClient;
  let mockGet: any;
  let mockPost: any;
  let mockPut: any;
  let mockDelete: any;

  beforeEach(() => {
    const config: YouTrackConfig = {
      baseURL: 'https://youtrack.test.com',
      token: 'test-token-123',
    };
    
    client = new WorkItemsAPIClient(config);
    mockGet = jest.spyOn((client as any).axios, 'get');
    mockPost = jest.spyOn((client as any).axios, 'post');
    mockPut = jest.spyOn((client as any).axios, 'put');
    mockDelete = jest.spyOn((client as any).axios, 'delete');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logTimeToIssue', () => {
    test('should log time with duration', async () => {
      const mockWorkItem = {
        id: 'work-item-1',
        duration: 120,
        description: 'Development work',
      };

      mockPost.mockResolvedValue({
        data: mockWorkItem,
        status: 200,
      });

      const result = await client.logTimeToIssue('TEST-1', '2h');

      expect(mockPost).toHaveBeenCalledWith(
        '/issues/TEST-1/timeTracking/workItems',
        expect.objectContaining({
          duration: 120, // 2 hours = 120 minutes
        })
      );

      expect(result.content[0].text).toContain('Logged');
    });

    test('should parse hours correctly', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'work-1' },
        status: 200,
      });

      await client.logTimeToIssue('TEST-1', '3h');

      const call = mockPost.mock.calls.find((call: any) =>
        call[1]?.duration === 180
      );

      expect(call).toBeDefined();
    });

    test('should parse minutes correctly', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'work-1' },
        status: 200,
      });

      await client.logTimeToIssue('TEST-1', '45m');

      const call = mockPost.mock.calls.find((call: any) =>
        call[1]?.duration === 45
      );

      expect(call).toBeDefined();
    });

    test('should parse days correctly', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'work-1' },
        status: 200,
      });

      await client.logTimeToIssue('TEST-1', '1d');

      const call = mockPost.mock.calls.find((call: any) =>
        call[1]?.duration === 480 // 1 day = 8 hours = 480 minutes
      );

      expect(call).toBeDefined();
    });

    test('should include description when provided', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'work-1' },
        status: 200,
      });

      await client.logTimeToIssue('TEST-1', '2h', 'Implemented feature');

      expect(mockPost).toHaveBeenCalledWith(
        '/issues/TEST-1/timeTracking/workItems',
        expect.objectContaining({
          description: 'Implemented feature',
        })
      );
    });

    test('should include work type when provided', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'work-1' },
        status: 200,
      });

      await client.logTimeToIssue('TEST-1', '2h', 'Work', undefined, 'Development');

      expect(mockPost).toHaveBeenCalledWith(
        '/issues/TEST-1/timeTracking/workItems',
        expect.objectContaining({
          type: expect.objectContaining({
            name: 'Development',
          }),
        })
      );
    });

    test('should use provided date', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'work-1' },
        status: 200,
      });

      await client.logTimeToIssue('TEST-1', '2h', 'Work', '2025-10-01');

      const call = mockPost.mock.calls.find((call: any) =>
        call[1]?.date !== undefined
      );

      expect(call).toBeDefined();
      expect(call[1].date).toBeGreaterThan(0);
    });

    test('should handle logging errors', async () => {
      mockPost.mockRejectedValue({
        message: 'Invalid duration',
        response: { status: 400 },
      });

      await expect(async () => {
        await client.logTimeToIssue('TEST-1', 'invalid');
      }).rejects.toThrow();
    });
  });

  describe('getTimeEntries', () => {
    test('should get time entries for issue', async () => {
      const mockEntries = [
        { id: 'work-1', duration: 120, description: 'Work 1' },
        { id: 'work-2', duration: 60, description: 'Work 2' },
      ];

      mockGet.mockResolvedValue({
        data: mockEntries,
        status: 200,
      });

      const result = await client.getTimeEntries('TEST-1');

      expect(mockGet).toHaveBeenCalledWith(
        '/issues/TEST-1/timeTracking/workItems',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('2');
    });

    test('should get all time entries when no issue specified', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.getTimeEntries();

      expect(mockGet).toHaveBeenCalledWith(
        '/workItems',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('0');
    });

    test('should filter by date range', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      await client.getTimeEntries(undefined, '2025-10-01', '2025-10-31');

      const call = mockGet.mock.calls.find((call: any) =>
        call[1]?.startDate && call[1]?.endDate
      );

      expect(call).toBeDefined();
    });

    test('should filter by user', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      await client.getTimeEntries(undefined, undefined, undefined, 'user-123');

      const call = mockGet.mock.calls.find((call: any) =>
        call[1]?.author === 'user-123'
      );

      expect(call).toBeDefined();
    });

    test('should handle empty results', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.getTimeEntries('TEST-1');

      expect(result.content[0].text).toContain('0');
    });

    test('should handle fetch errors', async () => {
      mockGet.mockRejectedValue({
        message: 'Issue not found',
        response: { status: 404 },
      });

      await expect(async () => {
        await client.getTimeEntries('INVALID-1');
      }).rejects.toThrow();
    });
  });

  describe('updateTimeEntry', () => {
    test('should update time entry duration', async () => {
      mockPut.mockResolvedValue({
        data: { id: 'work-1', duration: 180 },
        status: 200,
      });

      const result = await client.updateTimeEntry('work-1', {
        duration: '3h',
      });

      expect(mockPut).toHaveBeenCalledWith(
        '/workItems/work-1',
        expect.objectContaining({
          duration: 180,
        })
      );

      expect(result.content[0].text).toContain('updated');
    });

    test('should update description', async () => {
      mockPut.mockResolvedValue({
        data: { id: 'work-1' },
        status: 200,
      });

      await client.updateTimeEntry('work-1', {
        description: 'Updated description',
      });

      expect(mockPut).toHaveBeenCalledWith(
        '/workItems/work-1',
        expect.objectContaining({
          description: 'Updated description',
        })
      );
    });

    test('should update work type', async () => {
      mockPut.mockResolvedValue({
        data: { id: 'work-1' },
        status: 200,
      });

      await client.updateTimeEntry('work-1', {
        workType: 'Testing',
      });

      expect(mockPut).toHaveBeenCalledWith(
        '/workItems/work-1',
        expect.objectContaining({
          type: expect.objectContaining({
            name: 'Testing',
          }),
        })
      );
    });

    test('should update multiple fields', async () => {
      mockPut.mockResolvedValue({
        data: { id: 'work-1' },
        status: 200,
      });

      await client.updateTimeEntry('work-1', {
        duration: '4h',
        description: 'Updated work',
        workType: 'Development',
      });

      expect(mockPut).toHaveBeenCalledWith(
        '/workItems/work-1',
        expect.objectContaining({
          duration: 240,
          description: 'Updated work',
          type: expect.objectContaining({
            name: 'Development',
          }),
        })
      );
    });

    test('should handle update errors', async () => {
      mockPut.mockRejectedValue({
        message: 'Cannot update',
        response: { status: 403 },
      });

      await expect(async () => {
        await client.updateTimeEntry('work-1', { duration: '2h' });
      }).rejects.toThrow();
    });
  });

  describe('deleteTimeEntry', () => {
    test('should delete time entry', async () => {
      mockDelete.mockResolvedValue({
        status: 200,
      });

      const result = await client.deleteTimeEntry('work-1');

      expect(mockDelete).toHaveBeenCalledWith('/workItems/work-1');

      expect(result.content[0].text).toContain('deleted');
    });

    test('should handle deletion errors', async () => {
      mockDelete.mockRejectedValue({
        message: 'Cannot delete',
        response: { status: 403 },
      });

      await expect(async () => {
        await client.deleteTimeEntry('work-1');
      }).rejects.toThrow();
    });

    test('should handle not found errors', async () => {
      mockDelete.mockRejectedValue({
        message: 'Work item not found',
        response: { status: 404 },
      });

      await expect(async () => {
        await client.deleteTimeEntry('nonexistent');
      }).rejects.toThrow();
    });
  });

  describe('generateTimeReport', () => {
    test('should generate time report for project', async () => {
      const mockReport = {
        totalTime: 480, // 8 hours
        entries: [],
        breakdown: {},
      };

      mockGet.mockResolvedValue({
        data: mockReport,
        status: 200,
      });

      const result = await client.generateTimeReport(
        'TEST',
        '2025-10-01',
        '2025-10-31'
      );

      expect(mockGet).toHaveBeenCalled();
      expect(result.content[0].text).toContain('report');
    });

    test('should generate report for user', async () => {
      mockGet.mockResolvedValue({
        data: { totalTime: 1000, entries: [] },
        status: 200,
      });

      const result = await client.generateTimeReport(
        undefined,
        '2025-10-01',
        '2025-10-31',
        'user-123'
      );

      expect(mockGet).toHaveBeenCalled();
      expect(result.content[0].text).toContain('report');
    });

    test('should handle report generation errors', async () => {
      mockGet.mockRejectedValue({
        message: 'Report generation failed',
        response: { status: 500 },
      });

      await expect(async () => {
        await client.generateTimeReport(
          'TEST',
          '2025-10-01',
          '2025-10-31'
        );
      }).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockGet.mockRejectedValue(new Error('Network failure'));

      await expect(async () => {
        await client.getTimeEntries();
      }).rejects.toThrow();
    });

    test('should handle timeout errors', async () => {
      mockPost.mockRejectedValue({
        message: 'timeout',
        code: 'ECONNABORTED',
      });

      await expect(async () => {
        await client.logTimeToIssue('TEST-1', '2h');
      }).rejects.toThrow();
    });

    test('should handle permission errors', async () => {
      mockDelete.mockRejectedValue({
        message: 'Forbidden',
        response: { status: 403 },
      });

      await expect(async () => {
        await client.deleteTimeEntry('work-1');
      }).rejects.toThrow();
    });
  });
});
