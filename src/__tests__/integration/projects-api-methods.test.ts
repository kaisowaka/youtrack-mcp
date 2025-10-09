/**
 * Integration Tests for ProjectsAPIClient Methods
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ProjectsAPIClient } from '../../api/domains/projects-api.js';
import type { YouTrackConfig } from '../../api/base/base-client.js';

describe('ProjectsAPIClient - Method Logic Tests', () => {
  let client: ProjectsAPIClient;
  let mockGet: any;

  beforeEach(() => {
    const config: YouTrackConfig = {
      baseURL: 'https://youtrack.test.com',
      token: 'test-token-123',
    };
    
    client = new ProjectsAPIClient(config);
    mockGet = jest.spyOn((client as any).axios, 'get');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('listProjects', () => {
    test('should list all projects', async () => {
      const mockProjects = [
        { id: '0-1', shortName: 'TEST', name: 'Test Project' },
        { id: '0-2', shortName: 'DEMO', name: 'Demo Project' },
      ];

      mockGet.mockResolvedValue({
        data: mockProjects,
        status: 200,
      });

      const result = await client.listProjects();

      expect(mockGet).toHaveBeenCalledWith(
        '/admin/projects',
        expect.objectContaining({
          params: expect.objectContaining({
            fields: expect.any(String),
          }),
        })
      );

      expect(result.content[0].text).toContain('2');
      expect(result.content[0].text).toContain('TEST');
    });

    test('should use custom fields parameter', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      await client.listProjects('id,name,shortName');

      expect(mockGet).toHaveBeenCalledWith(
        '/admin/projects',
        expect.objectContaining({
          params: expect.objectContaining({
            fields: 'id,name,shortName',
          }),
        })
      );
    });

    test('should handle empty project list', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.listProjects();

      expect(result.content[0].text).toContain('0');
    });

    test('should handle API errors', async () => {
      mockGet.mockRejectedValue({
        message: 'Unauthorized',
        response: { status: 401 },
      });

      const result = await client.listProjects();

      expect(result.content[0].text).toContain('error');
    });
  });

  describe('getProject', () => {
    test('should fetch single project by ID', async () => {
      const mockProject = {
        id: '0-1',
        shortName: 'TEST',
        name: 'Test Project',
        description: 'A test project',
      };

      mockGet.mockResolvedValue({
        data: mockProject,
        status: 200,
      });

      const result = await client.getProject('0-1');

      expect(mockGet).toHaveBeenCalledWith(
        '/admin/projects/0-1',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('TEST');
    });

    test('should fetch project by shortName', async () => {
      const mockProject = {
        id: '0-1',
        shortName: 'MYPROJ',
        name: 'My Project',
      };

      mockGet.mockResolvedValue({
        data: mockProject,
        status: 200,
      });

      const result = await client.getProject('MYPROJ');

      expect(result.content[0].text).toContain('MYPROJ');
    });

    test('should handle project not found', async () => {
      mockGet.mockRejectedValue({
        message: 'Project not found',
        response: { status: 404 },
      });

      const result = await client.getProject('NONEXISTENT');

      expect(result.content[0].text).toContain('not found');
    });

    test('should use custom fields', async () => {
      mockGet.mockResolvedValue({
        data: { id: '0-1', name: 'Test' },
        status: 200,
      });

      await client.getProject('TEST', 'id,name,leader');

      expect(mockGet).toHaveBeenCalledWith(
        '/admin/projects/TEST',
        expect.objectContaining({
          params: expect.objectContaining({
            fields: 'id,name,leader',
          }),
        })
      );
    });
  });

  describe('validateProject', () => {
    test('should validate access to existing project', async () => {
      mockGet.mockResolvedValue({
        data: { id: '0-1', shortName: 'TEST', name: 'Test Project' },
        status: 200,
      });

      const result = await client.validateProject('TEST');

      expect(result.content[0].text).toContain('valid');
      expect(result.content[0].text).toContain('TEST');
    });

    test('should handle invalid project', async () => {
      mockGet.mockRejectedValue({
        message: 'Not found',
        response: { status: 404 },
      });

      const result = await client.validateProject('INVALID');

      expect(result.content[0].text).toContain('not found');
    });

    test('should handle permission errors', async () => {
      mockGet.mockRejectedValue({
        message: 'Forbidden',
        response: { status: 403 },
      });

      const result = await client.validateProject('SECRET');

      expect(result.content[0].text).toContain('permission');
    });
  });

  describe('getProjectCustomFields', () => {
    test('should fetch project custom fields', async () => {
      const mockFields = [
        { id: 'field-1', name: 'Priority', fieldType: { id: 'enum' } },
        { id: 'field-2', name: 'Type', fieldType: { id: 'enum' } },
      ];

      mockGet.mockResolvedValue({
        data: mockFields,
        status: 200,
      });

      const result = await client.getProjectCustomFields('TEST');

      expect(mockGet).toHaveBeenCalledWith(
        '/admin/projects/TEST/customFields',
        expect.any(Object)
      );

      expect(result.content[0].text).toContain('2');
      expect(result.content[0].text).toContain('Priority');
    });

    test('should handle project with no custom fields', async () => {
      mockGet.mockResolvedValue({
        data: [],
        status: 200,
      });

      const result = await client.getProjectCustomFields('TEST');

      expect(result.content[0].text).toContain('0');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockGet.mockRejectedValue(new Error('Network failure'));

      const result = await client.listProjects();

      expect(result.content[0].text).toContain('error');
    });

    test('should handle timeout', async () => {
      mockGet.mockRejectedValue({
        message: 'timeout',
        code: 'ECONNABORTED',
      });

      const result = await client.getProject('TEST');

      expect(result.content[0].text).toContain('error');
    });

    test('should handle malformed responses', async () => {
      mockGet.mockResolvedValue({
        data: null,
        status: 200,
      });

      const result = await client.listProjects();

      expect(result).toHaveProperty('content');
    });
  });
});
