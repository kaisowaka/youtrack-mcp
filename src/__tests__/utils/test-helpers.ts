/**
 * Test utilities and helper functions
 */

import { YouTrackClient } from '../../api/client.js';
import { YouTrackConfig } from '../../api/base/base-client.js';

/**
 * Create a test client with mock configuration
 */
export function createTestClient(overrides?: Partial<YouTrackConfig>): YouTrackClient {
  const config: YouTrackConfig = {
    baseURL: process.env.YOUTRACK_URL || 'https://youtrack.devstroop.com/api',
    token: process.env.YOUTRACK_TOKEN || 'test-token',
    timeout: 5000,
    retryAttempts: 1,
    retryDelay: 100,
    enableCache: false, // Disable cache for tests
    ...overrides
  };

  return new YouTrackClient(config);
}

/**
 * Generate a unique test ID
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Wait for a specific duration (useful for rate limiting tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function until it succeeds or max attempts reached
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, onRetry } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        onRetry?.(attempt, lastError);
        await wait(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Clean up test data after tests
 */
export class TestDataCleanup {
  private static createdIssues: string[] = [];
  private static createdProjects: string[] = [];
  private static createdArticles: string[] = [];

  static trackIssue(issueId: string): void {
    this.createdIssues.push(issueId);
  }

  static trackProject(projectId: string): void {
    this.createdProjects.push(projectId);
  }

  static trackArticle(articleId: string): void {
    this.createdArticles.push(articleId);
  }

  static async cleanup(client: YouTrackClient): Promise<void> {
    const errors: Error[] = [];

    // Clean up issues
    for (const issueId of this.createdIssues) {
      try {
        await client.issues.deleteIssue(issueId);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    // Clean up articles
    for (const articleId of this.createdArticles) {
      try {
        await client.knowledgeBase.deleteArticle(articleId);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    // Note: Projects typically shouldn't be auto-deleted in tests
    // Clear tracking arrays
    this.createdIssues = [];
    this.createdProjects = [];
    this.createdArticles = [];

    if (errors.length > 0) {
      console.warn(`Cleanup completed with ${errors.length} errors`);
    }
  }

  static reset(): void {
    this.createdIssues = [];
    this.createdProjects = [];
    this.createdArticles = [];
  }
}

/**
 * Assert that an object has expected properties
 */
export function assertHasProperties<T extends object>(
  obj: T,
  properties: (keyof T)[]
): void {
  for (const prop of properties) {
    if (!(prop in obj)) {
      throw new Error(`Expected object to have property: ${String(prop)}`);
    }
  }
}

/**
 * Mock axios response
 */
export function mockAxiosResponse<T>(data: T, status: number = 200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as any
  };
}

/**
 * Mock axios error
 */
export function mockAxiosError(
  message: string,
  status: number = 400,
  data?: any
) {
  const error: any = new Error(message);
  error.response = {
    data: data || { error: message },
    status,
    statusText: 'Error',
    headers: {},
    config: {} as any
  };
  error.isAxiosError = true;
  return error;
}

/**
 * Test environment configuration
 */
export const testConfig = {
  isCI: process.env.CI === 'true',
  skipIntegration: process.env.SKIP_INTEGRATION === 'true',
  skipE2E: process.env.SKIP_E2E === 'true',
  testProjectId: process.env.TEST_PROJECT_ID || 'YTMCP',
  testTimeout: parseInt(process.env.TEST_TIMEOUT || '10000', 10)
};

/**
 * Skip test if condition is met
 */
export function skipIf(condition: boolean, reason: string): void {
  if (condition) {
    console.log(`⏭️  Skipping test: ${reason}`);
    return;
  }
}

/**
 * Expect async function to throw
 */
export async function expectAsyncError(
  fn: () => Promise<any>,
  expectedError?: string | RegExp
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedError) {
      const message = (error as Error).message;
      if (typeof expectedError === 'string') {
        if (!message.includes(expectedError)) {
          throw new Error(
            `Expected error message to include "${expectedError}", but got "${message}"`
          );
        }
      } else {
        if (!expectedError.test(message)) {
          throw new Error(
            `Expected error message to match ${expectedError}, but got "${message}"`
          );
        }
      }
    }
  }
}

/**
 * Create test issue data
 */
export function createTestIssueData(overrides?: any) {
  return {
    summary: `Test Issue ${generateTestId()}`,
    description: 'This is a test issue created by automated tests',
    priority: 'Normal',
    type: 'Task',
    ...overrides
  };
}

/**
 * Create test project data
 */
export function createTestProjectData(overrides?: any) {
  const id = generateTestId('proj');
  return {
    name: `Test Project ${id}`,
    shortName: `TP${id.substring(0, 8).toUpperCase()}`,
    description: 'This is a test project created by automated tests',
    ...overrides
  };
}

/**
 * Validate MCP response format
 */
export function validateMCPResponse(response: any): void {
  if (!response || typeof response !== 'object') {
    throw new Error('Response must be an object');
  }

  if (!('success' in response)) {
    throw new Error('Response must have success property');
  }

  if (response.success) {
    if (!('data' in response)) {
      throw new Error('Successful response must have data property');
    }
    if (!('message' in response)) {
      throw new Error('Successful response must have message property');
    }
  } else {
    if (!('error' in response)) {
      throw new Error('Failed response must have error property');
    }
  }
}
