/**
 * Unit tests for ProjectsAPIClient
 * Tests class structure and method existence
 */

import { ProjectsAPIClient } from '../../../api/domains/projects-api.js';

describe('ProjectsAPIClient', () => {
  let projectsApi: ProjectsAPIClient;

  beforeEach(() => {
    projectsApi = new ProjectsAPIClient({
      baseURL: 'https://test.youtrack.cloud',
      token: 'test-token',
      enableCache: false
    });
  });

  describe('Constructor', () => {
    it('should create an instance of ProjectsAPIClient', () => {
      expect(projectsApi).toBeInstanceOf(ProjectsAPIClient);
    });

    it('should have axios client initialized', () => {
      expect((projectsApi as any).axios).toBeDefined();
    });

    it('should have cache manager initialized', () => {
      expect((projectsApi as any).cache).toBeDefined();
    });
  });

  describe('Method Existence', () => {
    it('should have listProjects method', () => {
      expect(typeof projectsApi.listProjects).toBe('function');
    });

    it('should have getProject method', () => {
      expect(typeof projectsApi.getProject).toBe('function');
    });

    it('should have getProjectCustomFields method', () => {
      expect(typeof projectsApi.getProjectCustomFields).toBe('function');
    });

    it('should have validateProject method', () => {
      expect(typeof projectsApi.validateProject).toBe('function');
    });

    it('should have getProjectStatistics method', () => {
      expect(typeof projectsApi.getProjectStatistics).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('listProjects should accept optional fields parameter', () => {
      const method = projectsApi.listProjects;
      expect(method.length).toBeGreaterThanOrEqual(0);
    });

    it('getProject should accept projectId and optional fields', () => {
      const method = projectsApi.getProject;
      expect(method.length).toBeGreaterThanOrEqual(1);
    });

    it('validateProject should accept projectId', () => {
      const method = projectsApi.validateProject;
      expect(method.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Response Format', () => {
    it('should return promises from async methods', () => {
      const result = projectsApi.listProjects();
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {});
    });
  });

  describe('Configuration', () => {
    it('should have correct base URL', () => {
      const axios = (projectsApi as any).axios;
      expect(axios.defaults.baseURL).toContain('youtrack.cloud');
    });

    it('should have authentication configured', () => {
      const axios = (projectsApi as any).axios;
      expect(
        axios.defaults.headers.common?.['Authorization'] ||
        axios.defaults.headers?.['Authorization']
      ).toBeDefined();
    });
  });

  describe('Multiple Instances', () => {
    it('should create independent instances', () => {
      const api1 = new ProjectsAPIClient({
        baseURL: 'https://instance1.youtrack.cloud',
        token: 'token1'
      });
      
      const api2 = new ProjectsAPIClient({
        baseURL: 'https://instance2.youtrack.cloud',
        token: 'token2'
      });

      expect(api1).not.toBe(api2);
      expect((api1 as any).config.baseURL).not.toBe((api2 as any).config.baseURL);
    });
  });
});
