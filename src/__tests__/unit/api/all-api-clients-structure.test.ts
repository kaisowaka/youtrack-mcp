/**
 * Unit tests for all API domain clients
 * Tests class structure and method existence
 */

import { AgileAPIClient } from '../../../api/domains/agile-boards-api.js';
import { KnowledgeBaseAPIClient } from '../../../api/domains/knowledge-base-api.js';
import { UsersAPIClient } from '../../../api/domains/users-api.js';
import { WorkItemsAPIClient } from '../../../api/domains/workitems-api.js';
import { CustomFieldsAPIClient } from '../../../api/domains/custom-fields-api.js';
import { AdminAPIClient } from '../../../api/domains/admin-api.js';

const testConfig = {
  baseURL: 'https://test.youtrack.cloud',
  token: 'test-token',
  enableCache: false
};

describe('API Domain Clients Structure', () => {
  
  describe('AgileAPIClient', () => {
    let api: AgileAPIClient;

    beforeEach(() => {
      api = new AgileAPIClient(testConfig);
    });

    it('should create an instance', () => {
      expect(api).toBeInstanceOf(AgileAPIClient);
    });

    it('should have axios client', () => {
      expect((api as any).axios).toBeDefined();
    });

    it('should have at least one public method', () => {
      // Check that the API has methods defined
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(api));
      expect(methods.length).toBeGreaterThan(1); // constructor + at least one method
    });
  });

  describe('KnowledgeBaseAPIClient', () => {
    let api: KnowledgeBaseAPIClient;

    beforeEach(() => {
      api = new KnowledgeBaseAPIClient(testConfig);
    });

    it('should create an instance', () => {
      expect(api).toBeInstanceOf(KnowledgeBaseAPIClient);
    });

    it('should have required methods', () => {
      expect(typeof api.listArticles).toBe('function');
      expect(typeof api.getArticle).toBe('function');
      expect(typeof api.createArticle).toBe('function');
      expect(typeof api.updateArticle).toBe('function');
      expect(typeof api.deleteArticle).toBe('function');
      expect(typeof api.searchArticles).toBe('function');
    });

    it('should have axios client', () => {
      expect((api as any).axios).toBeDefined();
    });
  });

  describe('UsersAPIClient', () => {
    let api: UsersAPIClient;

    beforeEach(() => {
      api = new UsersAPIClient(testConfig);
    });

    it('should create an instance', () => {
      expect(api).toBeInstanceOf(UsersAPIClient);
    });

    it('should have required methods', () => {
      expect(typeof api.listUsers).toBe('function');
      expect(typeof api.getUser).toBe('function');
      expect(typeof api.searchUsers).toBe('function');
      expect(typeof api.getCurrentUser).toBe('function');
    });

    it('should have axios client', () => {
      expect((api as any).axios).toBeDefined();
    });

    it('should return promises', () => {
      const result = api.getCurrentUser();
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {});
    });
  });

  describe('WorkItemsAPIClient', () => {
    let api: WorkItemsAPIClient;

    beforeEach(() => {
      api = new WorkItemsAPIClient(testConfig);
    });

    it('should create an instance', () => {
      expect(api).toBeInstanceOf(WorkItemsAPIClient);
    });

    it('should have required methods', () => {
      expect(typeof api.getWorkItems).toBe('function');
      expect(typeof api.createWorkItem).toBe('function');
      expect(typeof api.updateWorkItem).toBe('function');
    });

    it('should have axios client', () => {
      expect((api as any).axios).toBeDefined();
    });
  });

  describe('CustomFieldsAPIClient', () => {
    let api: CustomFieldsAPIClient;

    beforeEach(() => {
      api = new CustomFieldsAPIClient(testConfig);
    });

    it('should create an instance', () => {
      expect(api).toBeInstanceOf(CustomFieldsAPIClient);
    });

    it('should have required methods', () => {
      expect(typeof api.listCustomFields).toBe('function');
      expect(typeof api.getCustomField).toBe('function');
      expect(typeof api.getProjectCustomFields).toBe('function');
    });

    it('should have axios client', () => {
      expect((api as any).axios).toBeDefined();
    });

    it('should return promises', () => {
      const result = api.listCustomFields();
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {});
    });
  });

  describe('AdminAPIClient', () => {
    let api: AdminAPIClient;

    beforeEach(() => {
      api = new AdminAPIClient(testConfig);
    });

    it('should create an instance', () => {
      expect(api).toBeInstanceOf(AdminAPIClient);
    });

    it('should have required methods', () => {
      expect(typeof api.bulkUpdateIssues).toBe('function');
    });

    it('should have axios client', () => {
      expect((api as any).axios).toBeDefined();
    });
  });

  describe('All API Clients Configuration', () => {
    it('should all accept the same configuration structure', () => {
      const apis = [
        new AgileAPIClient(testConfig),
        new KnowledgeBaseAPIClient(testConfig),
        new UsersAPIClient(testConfig),
        new WorkItemsAPIClient(testConfig),
        new CustomFieldsAPIClient(testConfig),
        new AdminAPIClient(testConfig)
      ];

      apis.forEach(api => {
        expect((api as any).axios).toBeDefined();
        expect((api as any).cache).toBeDefined();
        expect((api as any).errorHandler).toBeDefined();
      });
    });

    it('should all have proper axios configuration', () => {
      const apis = [
        new AgileAPIClient(testConfig),
        new KnowledgeBaseAPIClient(testConfig),
        new UsersAPIClient(testConfig),
        new WorkItemsAPIClient(testConfig),
        new CustomFieldsAPIClient(testConfig),
        new AdminAPIClient(testConfig)
      ];

      apis.forEach(api => {
        const axios = (api as any).axios;
        expect(axios.defaults.baseURL).toContain('youtrack.cloud');
      });
    });
  });

  describe('All API Clients Inheritance', () => {
    it('should all have inherited HTTP methods', () => {
      const apis = [
        new AgileAPIClient(testConfig),
        new KnowledgeBaseAPIClient(testConfig),
        new UsersAPIClient(testConfig),
        new WorkItemsAPIClient(testConfig),
        new CustomFieldsAPIClient(testConfig),
        new AdminAPIClient(testConfig)
      ];

      apis.forEach(api => {
        expect(typeof (api as any).get).toBe('function');
        expect(typeof (api as any).post).toBe('function');
        expect(typeof (api as any).put).toBe('function');
        expect(typeof (api as any).delete).toBe('function');
      });
    });
  });

  describe('Cache Integration', () => {
    it('should all have cache managers', () => {
      const apis = [
        new AgileAPIClient(testConfig),
        new KnowledgeBaseAPIClient(testConfig),
        new UsersAPIClient(testConfig),
        new WorkItemsAPIClient(testConfig),
        new CustomFieldsAPIClient(testConfig),
        new AdminAPIClient(testConfig)
      ];

      apis.forEach(api => {
        const cache = (api as any).cache;
        expect(cache).toBeDefined();
        expect(typeof cache.get).toBe('function');
        expect(typeof cache.set).toBe('function');
      });
    });
  });
});
