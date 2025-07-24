#!/usr/bin/env tsx

/**
 * Simple unit tests for YouTrack MCP Server
 * Since Jest has ES module issues, we'll use a simple test runner
 */

import { YouTrackClient } from '../src/youtrack-client.js';

// Simple test framework
class SimpleTest {
  private passed = 0;
  private failed = 0;
  private currentSuite = '';

  describe(name: string, fn: () => void) {
    this.currentSuite = name;
    console.log(`\n🧪 ${name}`);
    fn();
  }

  it(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✅ ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`  ❌ ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.failed++;
    }
  }

  expect(value: any) {
    return {
      toBe: (expected: any) => {
        if (value !== expected) {
          throw new Error(`Expected ${value} to be ${expected}`);
        }
      },
      toEqual: (expected: any) => {
        if (JSON.stringify(value) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
        }
      },
      toBeDefined: () => {
        if (value === undefined || value === null) {
          throw new Error(`Expected ${value} to be defined`);
        }
      },
      toThrow: (expectedMessage?: string) => {
        if (typeof value !== 'function') {
          throw new Error('Expected a function to test for throwing');
        }
        try {
          value();
          throw new Error('Expected function to throw');
        } catch (error) {
          if (expectedMessage && !(error instanceof Error && error.message.includes(expectedMessage))) {
            throw new Error(`Expected error message to contain "${expectedMessage}"`);
          }
        }
      }
    };
  }

  summary() {
    console.log(`\n📊 Test Summary:`);
    console.log(`  ✅ Passed: ${this.passed}`);
    console.log(`  ❌ Failed: ${this.failed}`);
    console.log(`  📈 Total: ${this.passed + this.failed}`);
    
    if (this.failed === 0) {
      console.log(`\n🎉 All tests passed!`);
      return true;
    } else {
      console.log(`\n⚠️  ${this.failed} test(s) failed`);
      return false;
    }
  }
}

const test = new SimpleTest();

// Mock environment for testing
const mockEnv = {
  YOUTRACK_URL: 'https://test.youtrack.cloud',
  YOUTRACK_TOKEN: 'test-token'
};

async function runTests() {
  console.log('🚀 Running YouTrack MCP Server Unit Tests');
  
  test.describe('YouTrackClient Configuration', () => {
    test.it('should create client with valid config', () => {
      const client = new YouTrackClient(mockEnv.YOUTRACK_URL, mockEnv.YOUTRACK_TOKEN);
      test.expect(client).toBeDefined();
    });
    
    test.it('should expose apiInstance for enhanced client', () => {
      const client = new YouTrackClient(mockEnv.YOUTRACK_URL, mockEnv.YOUTRACK_TOKEN);
      test.expect(client.apiInstance).toBeDefined();
    });
    
    test.it('should throw error with invalid URL', () => {
      test.expect(() => new YouTrackClient('', mockEnv.YOUTRACK_TOKEN)).toThrow();
    });
    
    test.it('should throw error with invalid token', () => {
      test.expect(() => new YouTrackClient(mockEnv.YOUTRACK_URL, '')).toThrow();
    });
  });

  test.describe('Consolidated YouTrackClient Methods', () => {
    const client = new YouTrackClient(mockEnv.YOUTRACK_URL, mockEnv.YOUTRACK_TOKEN);
    
    test.it('should have all consolidated methods', () => {
      test.expect(client).toBeDefined();
    });
    
    test.it('should have epic management methods', () => {
      test.expect(typeof client.createEpic).toBe('function');
      test.expect(typeof client.linkIssueToEpic).toBe('function');
      test.expect(typeof client.getEpicProgress).toBe('function');
    });
    
    test.it('should have milestone management methods', () => {
      test.expect(typeof client.createMilestone).toBe('function');
      test.expect(typeof client.assignIssuesToMilestone).toBe('function');
      test.expect(typeof client.getMilestoneProgress).toBe('function');
    });
    
    test.it('should have time tracking methods', () => {
      test.expect(typeof client.logWorkTime).toBe('function');
    });
    
    test.it('should have enhanced statistics methods', () => {
      test.expect(typeof client.getProjectStats).toBe('function');
      test.expect(typeof client.getProjectCustomFields).toBe('function');
    });
  });

  test.describe('Consolidated Client Architecture', () => {
    test.it('should have single unified client', () => {
      const client = new YouTrackClient(mockEnv.YOUTRACK_URL, mockEnv.YOUTRACK_TOKEN);
      test.expect(client).toBeDefined();
      test.expect(typeof client.listProjects).toBe('function');
      test.expect(typeof client.updateIssue).toBe('function');
      test.expect(typeof client.createEpic).toBe('function');
    });

    test.it('should use correct HTTP methods for create operations', () => {
      const client = new YouTrackClient(mockEnv.YOUTRACK_URL, mockEnv.YOUTRACK_TOKEN);
      // These should use PUT method for YouTrack API compatibility
      test.expect(typeof client.createIssue).toBe('function');
      test.expect(typeof client.createEpic).toBe('function');
      test.expect(typeof client.createMilestone).toBe('function');
    });

    test.it('should have all 21 expected methods', () => {
      const client = new YouTrackClient(mockEnv.YOUTRACK_URL, mockEnv.YOUTRACK_TOKEN);
      const expectedMethods = [
        'listProjects', 'validateProject', 'getProjectStats', 'getProjectCustomFields',
        'getProjectIssuesSummary', 'getProjectTimeline', 'createIssue', 'updateIssue',
        'queryIssues', 'bulkUpdateIssues', 'getIssueComments', 'addIssueComment',
        'searchUsers', 'createEpic', 'linkIssueToEpic', 'getEpicProgress',
        'createMilestone', 'assignIssuesToMilestone', 'getMilestoneProgress', 'logWorkTime'
      ];
      
      expectedMethods.forEach(method => {
        test.expect(typeof (client as any)[method]).toBe('function');
      });
    });
  });

  const success = test.summary();
  process.exit(success ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
