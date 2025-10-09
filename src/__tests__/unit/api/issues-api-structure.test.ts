/**
 * Unit tests for IssuesAPIClient
 * Tests class structure and method existence
 */

import { IssuesAPIClient } from '../../../api/domains/issues-api.js';

describe('IssuesAPIClient', () => {
  let issuesApi: IssuesAPIClient;

  beforeEach(() => {
    // Create instance with test configuration
    issuesApi = new IssuesAPIClient({
      baseURL: 'https://test.youtrack.cloud',
      token: 'test-token',
      enableCache: false
    });
  });

  describe('Constructor', () => {
    it('should create an instance of IssuesAPIClient', () => {
      expect(issuesApi).toBeInstanceOf(IssuesAPIClient);
    });

    it('should have axios client initialized', () => {
      expect((issuesApi as any).axios).toBeDefined();
    });

    it('should have cache manager initialized', () => {
      expect((issuesApi as any).cache).toBeDefined();
    });

    it('should have error handler initialized', () => {
      expect((issuesApi as any).errorHandler).toBeDefined();
    });
  });

  describe('Method Existence', () => {
    it('should have createIssue method', () => {
      expect(typeof issuesApi.createIssue).toBe('function');
    });

    it('should have getIssue method', () => {
      expect(typeof issuesApi.getIssue).toBe('function');
    });

    it('should have updateIssue method', () => {
      expect(typeof issuesApi.updateIssue).toBe('function');
    });

    it('should have queryIssues method', () => {
      expect(typeof issuesApi.queryIssues).toBe('function');
    });

    it('should have changeIssueState method', () => {
      expect(typeof issuesApi.changeIssueState).toBe('function');
    });

    it('should have completeIssue method', () => {
      expect(typeof issuesApi.completeIssue).toBe('function');
    });

    it('should have startWorkingOnIssue method', () => {
      expect(typeof issuesApi.startWorkingOnIssue).toBe('function');
    });

    it('should have moveIssueToProject method', () => {
      expect(typeof issuesApi.moveIssueToProject).toBe('function');
    });

    it('should have getIssueComments method', () => {
      expect(typeof issuesApi.getIssueComments).toBe('function');
    });

    it('should have addComment method', () => {
      expect(typeof issuesApi.addComment).toBe('function');
    });

    it('should have updateComment method', () => {
      expect(typeof issuesApi.updateComment).toBe('function');
    });

    it('should have deleteComment method', () => {
      expect(typeof issuesApi.deleteComment).toBe('function');
    });

    it('should have linkIssues method', () => {
      expect(typeof issuesApi.linkIssues).toBe('function');
    });

    it('should have getIssueLinks method', () => {
      expect(typeof issuesApi.getIssueLinks).toBe('function');
    });

    it('should have createIssueLink method', () => {
      expect(typeof issuesApi.createIssueLink).toBe('function');
    });

    it('should have getIssueWorkItems method', () => {
      expect(typeof issuesApi.getIssueWorkItems).toBe('function');
    });

    it('should have getIssueAttachments method', () => {
      expect(typeof issuesApi.getIssueAttachments).toBe('function');
    });

    it('should have getIssueStates method', () => {
      expect(typeof issuesApi.getIssueStates).toBe('function');
    });

    it('should have getIssueActivities method', () => {
      expect(typeof issuesApi.getIssueActivities).toBe('function');
    });

    it('should have getIssueWatchers method', () => {
      expect(typeof issuesApi.getIssueWatchers).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('createIssue should accept projectId and params', () => {
      const method = issuesApi.createIssue;
      expect(method.length).toBe(2); // projectId, params
    });

    it('getIssue should accept issueId and optional fields', () => {
      const method = issuesApi.getIssue;
      expect(method.length).toBeGreaterThanOrEqual(1);
    });

    it('updateIssue should accept issueId and updates', () => {
      const method = issuesApi.updateIssue;
      expect(method.length).toBe(2);
    });

    it('queryIssues should accept params object', () => {
      const method = issuesApi.queryIssues;
      expect(method.length).toBe(1);
    });

    it('changeIssueState should accept issueId, newState, and optional comment', () => {
      const method = issuesApi.changeIssueState;
      expect(method.length).toBeGreaterThanOrEqual(2);
    });

    it('addComment should accept issueId and text', () => {
      const method = issuesApi.addComment;
      expect(method.length).toBe(2);
    });

    it('linkIssues should accept sourceId, targetId, and optional linkCommand', () => {
      const method = issuesApi.linkIssues;
      expect(method.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Configuration', () => {
    it('should have correct base URL', () => {
      const config = (issuesApi as any).config;
      expect(config.baseURL).toBeDefined();
    });

    it('should have authentication token', () => {
      const config = (issuesApi as any).config;
      expect(config.token).toBe('test-token');
    });

    it('should have axios instance configured', () => {
      const axios = (issuesApi as any).axios;
      expect(axios.defaults.baseURL).toContain('youtrack.cloud');
      // Authorization header may be in different location depending on axios version
      expect(
        axios.defaults.headers.common?.['Authorization'] ||
        axios.defaults.headers?.['Authorization']
      ).toBeDefined();
    });
  });

  describe('API Client Inheritance', () => {
    it('should have inherited get method', () => {
      expect(typeof (issuesApi as any).get).toBe('function');
    });

    it('should have inherited post method', () => {
      expect(typeof (issuesApi as any).post).toBe('function');
    });

    it('should have inherited put method', () => {
      expect(typeof (issuesApi as any).put).toBe('function');
    });

    it('should have inherited delete method', () => {
      expect(typeof (issuesApi as any).delete).toBe('function');
    });
  });

  describe('Response Format', () => {
    it('should return promises from async methods', () => {
      // createIssue returns a Promise
      const result = issuesApi.createIssue('TEST', { summary: 'Test' });
      expect(result).toBeInstanceOf(Promise);
      
      // Clean up the promise to avoid unhandled rejection
      result.catch(() => {});
    });
  });

  describe('Error Handling Structure', () => {
    it('should have error handler available', () => {
      const errorHandler = (issuesApi as any).errorHandler;
      expect(errorHandler).toBeDefined();
      // Error handler has handleError or similar methods
      expect(errorHandler).toBeTruthy();
    });
  });

  describe('Cache Integration', () => {
    it('should have cache manager', () => {
      const cache = (issuesApi as any).cache;
      expect(cache).toBeDefined();
    });

    it('cache should have expected methods', () => {
      const cache = (issuesApi as any).cache;
      expect(typeof cache.get).toBe('function');
      expect(typeof cache.set).toBe('function');
      expect(typeof cache.has).toBe('function');
      expect(typeof cache.clear).toBe('function');
    });
  });

  describe('Multiple Instances', () => {
    it('should create independent instances', () => {
      const api1 = new IssuesAPIClient({
        baseURL: 'https://instance1.youtrack.cloud',
        token: 'token1'
      });
      
      const api2 = new IssuesAPIClient({
        baseURL: 'https://instance2.youtrack.cloud',
        token: 'token2'
      });

      expect(api1).not.toBe(api2);
      expect((api1 as any).config.baseURL).not.toBe((api2 as any).config.baseURL);
      expect((api1 as any).config.token).not.toBe((api2 as any).config.token);
    });
  });

  describe('Configuration Options', () => {
    it('should support cache disable option', () => {
      const api = new IssuesAPIClient({
        baseURL: 'https://test.youtrack.cloud',
        token: 'token',
        enableCache: false
      });
      
      expect((api as any).config.enableCache).toBe(false);
    });

    it('should have timeout configuration capability', () => {
      const api = new IssuesAPIClient({
        baseURL: 'https://test.youtrack.cloud',
        token: 'token',
        timeout: 60000
      });
      
      expect((api as any).config.timeout).toBe(60000);
      expect((api as any).axios.defaults.timeout).toBe(60000);
    });
  });
});
