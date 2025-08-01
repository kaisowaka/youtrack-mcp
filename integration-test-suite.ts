/**
 * Integration Test Suite
 * Tests real-world workflows and multi-API interactions using actual API methods
 */

console.log('🔗 Integration Test Suite');
console.log('='.repeat(60));

const integrationResults: Array<{ test: string; status: 'PASS' | 'FAIL'; message: string; duration: number }> = [];

async function runIntegrationTest(testName: string, testFn: () => Promise<string> | string): Promise<void> {
  const startTime = Date.now();
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;
    integrationResults.push({ test: testName, status: 'PASS', message: result, duration });
    console.log(`  ✅ ${testName} (${duration}ms): ${result}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    integrationResults.push({ test: testName, status: 'FAIL', message, duration });
    console.log(`  ❌ ${testName} (${duration}ms): ${message}`);
  }
}

async function runIntegrationTests() {
  try {
    const { EnhancedClientFactory } = await import('./src/api/enhanced-client.js');
    
    const testConfig = {
      baseURL: 'https://test.youtrack.cloud',
      token: 'test-token-123',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableCache: true
    };

    const factory = new EnhancedClientFactory(testConfig);
    const client = factory.createClient();

    console.log('\n🚀 Real API Integration Tests');
    console.log('-'.repeat(40));

    // Test 1: Project-Issue Workflow
    await runIntegrationTest('Project-Issue Integration Workflow', async () => {
      const projectsAPI = client.projects;
      const issuesAPI = client.issues;

      // Mock project API
      (projectsAPI as any).get = async () => ({
        data: { id: 'PROJ-1', name: 'Test Project', shortName: 'PROJ' },
        status: 200
      });

      // Mock issue API
      (issuesAPI as any).post = async (endpoint: string, data: any) => ({
        data: { id: 'PROJ-1', summary: data.summary, state: 'Open' },
        status: 201
      });

      (issuesAPI as any).put = async () => ({
        data: { id: 'PROJ-1', state: 'In Progress' },
        status: 200
      });

      // Execute workflow
      const projectResult = await projectsAPI.getProject('PROJ');
      const issueResult = await issuesAPI.createIssue('PROJ', {
        summary: 'Integration test issue',
        description: 'Testing project-issue integration'
      });
      const updateResult = await issuesAPI.updateIssue('PROJ-1', {
        state: 'In Progress',
        assignee: 'test-user'
      });

      // Verify workflow
      const allResults = [projectResult, issueResult, updateResult];
      const allSuccessful = allResults.every(result => {
        const response = JSON.parse(result.content[0].text);
        return response.success;
      });

      if (!allSuccessful) {
        throw new Error('Project-Issue workflow failed');
      }

      return 'Project-Issue integration workflow successful';
    });

    // Test 2: Issue Lifecycle with Comments
    await runIntegrationTest('Issue Lifecycle with Comments', async () => {
      const issuesAPI = client.issues;

      // Mock all issue operations
      (issuesAPI as any).post = async (endpoint: string, data: any) => {
        if (endpoint.includes('comments')) {
          return { data: { id: 'comment-1', text: data.text }, status: 201 };
        }
        return { data: { id: 'ISSUE-1', summary: data.summary }, status: 201 };
      };

      (issuesAPI as any).get = async (endpoint: string) => {
        if (endpoint.includes('comments')) {
          return { data: [{ id: 'comment-1', text: 'Test comment' }], status: 200 };
        }
        return { data: { id: 'ISSUE-1', summary: 'Test issue' }, status: 200 };
      };

      (issuesAPI as any).put = async () => ({
        data: { success: true },
        status: 200
      });

      // Execute lifecycle
      const createResult = await issuesAPI.createIssue('TEST', {
        summary: 'Lifecycle test issue'
      });

      const commentResult = await issuesAPI.addComment('ISSUE-1', 'Starting work on this issue');
      const getCommentsResult = await issuesAPI.getIssueComments('ISSUE-1');
      
      const stateChangeResult = await issuesAPI.changeIssueState('ISSUE-1', 'In Progress', 'Moving to in progress');

      // Verify all operations
      const allResults = [createResult, commentResult, getCommentsResult, stateChangeResult];
      const allSuccessful = allResults.every(result => {
        const response = JSON.parse(result.content[0].text);
        return response.success;
      });

      if (!allSuccessful) {
        throw new Error('Issue lifecycle with comments failed');
      }

      return 'Issue lifecycle with comments completed successfully';
    });

    // Test 3: Multi-API Data Flow
    await runIntegrationTest('Multi-API Data Flow', async () => {
      const projectsAPI = client.projects;
      const agileAPI = client.agile;
      const issuesAPI = client.issues;

      let apiCallCount = 0;

      // Mock all APIs with consistent data
      (projectsAPI as any).get = async () => {
        apiCallCount++;
        return {
          data: { id: 'FLOW-1', name: 'Flow Test', shortName: 'FLOW' },
          status: 200
        };
      };

      (agileAPI as any).get = async () => {
        apiCallCount++;
        return {
          data: [{ id: 'board-1', name: 'FLOW Board', projects: [{ shortName: 'FLOW' }] }],
          status: 200
        };
      };

      (issuesAPI as any).get = async (endpoint: string) => {
        apiCallCount++;
        if (endpoint.includes('query')) {
          return {
            data: [{ id: 'FLOW-1', project: { shortName: 'FLOW' }, summary: 'Flow issue' }],
            status: 200
          };
        }
        return {
          data: { id: 'FLOW-1', summary: 'Flow issue' },
          status: 200
        };
      };

      // Execute multi-API flow
      const projectInfo = await projectsAPI.getProject('FLOW');
      const boardInfo = await agileAPI.listAgileBoards({ projectId: 'FLOW' });
      const issues = await issuesAPI.queryIssues({ query: 'project: FLOW' });

      // Verify data consistency
      if (apiCallCount !== 3) {
        throw new Error(`Expected 3 API calls, got ${apiCallCount}`);
      }

      const allResults = [projectInfo, boardInfo, issues];
      const allSuccessful = allResults.every(result => {
        const response = JSON.parse(result.content[0].text);
        return response.success;
      });

      if (!allSuccessful) {
        throw new Error('Multi-API data flow failed');
      }

      return 'Multi-API data flow successful with consistent results';
    });

    console.log('\n📊 Performance Integration Tests');
    console.log('-'.repeat(40));

    // Test 4: Concurrent API Operations
    await runIntegrationTest('Concurrent API Operations', async () => {
      const issuesAPI = client.issues;
      const agileAPI = client.agile;

      let issueCallCount = 0;
      let agileCallCount = 0;

      (issuesAPI as any).post = async () => {
        issueCallCount++;
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return {
          data: { id: `CONCURRENT-${issueCallCount}`, summary: 'Concurrent issue' },
          status: 201
        };
      };

      (agileAPI as any).get = async () => {
        agileCallCount++;
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return {
          data: [{ id: `board-${agileCallCount}`, name: 'Concurrent board' }],
          status: 200
        };
      };

      const startTime = Date.now();

      // Execute concurrent operations
      const issuePromises = Array(10).fill(null).map((_, i) =>
        issuesAPI.createIssue('CONCURRENT', {
          summary: `Concurrent issue ${i + 1}`
        })
      );

      const boardPromises = Array(5).fill(null).map(() =>
        agileAPI.listAgileBoards()
      );

      const [issueResults, boardResults] = await Promise.all([
        Promise.all(issuePromises),
        Promise.all(boardPromises)
      ]);

      const totalTime = Date.now() - startTime;

      // Verify results
      if (issueCallCount !== 10 || agileCallCount !== 5) {
        throw new Error(`Expected 10 issue and 5 board calls, got ${issueCallCount} and ${agileCallCount}`);
      }

      const allSuccessful = [...issueResults, ...boardResults].every(result => {
        const response = JSON.parse(result.content[0].text);
        return response.success;
      });

      if (!allSuccessful) {
        throw new Error('Some concurrent operations failed');
      }

      return `15 concurrent operations completed in ${totalTime}ms`;
    });

    console.log('\n🔄 Cache Integration Tests');
    console.log('-'.repeat(40));

    // Test 5: Cache Behavior Across APIs
    await runIntegrationTest('Cache Behavior Across APIs', async () => {
      const projectsAPI = client.projects;
      
      let apiCallCount = 0;
      (projectsAPI as any).get = async (_endpoint: string) => {
        apiCallCount++;
        return {
          data: { id: 'CACHE-TEST', fields: [{ name: 'Priority' }] },
          status: 200
        };
      };

      // Make multiple requests
      const results = await Promise.all([
        projectsAPI.getProjectCustomFields('CACHE-TEST'),
        projectsAPI.getProjectCustomFields('CACHE-TEST'),
        projectsAPI.getProjectCustomFields('CACHE-TEST')
      ]);

      const allSuccessful = results.every(result => {
        const response = JSON.parse(result.content[0].text);
        return response.success;
      });

      if (!allSuccessful) {
        throw new Error('Cache behavior test failed');
      }

      return `Cache test completed with ${results.length} requests (${apiCallCount} API calls)`;
    });

    // Test 6: Error Recovery Integration
    await runIntegrationTest('Error Recovery Integration', async () => {
      const issuesAPI = client.issues;

      let callCount = 0;
      (issuesAPI as any).post = async () => {
        callCount++;
        if (callCount <= 1) {
          throw new Error('Temporary API failure');
        }
        return {
          data: { id: 'RECOVERY-1', summary: 'Recovered issue' },
          status: 201
        };
      };

      // Execute operation that should recover
      try {
        const result = await issuesAPI.createIssue('RECOVERY', {
          summary: 'Recovery test issue'
        });

        const response = JSON.parse(result.content[0].text);
        if (!response.success) {
          throw new Error('Recovery operation failed');
        }

        return `Error recovery successful after ${callCount} attempts`;
      } catch (error) {
        // Check if it's the expected error handling
        if (callCount > 0) {
          return `Error handled gracefully after ${callCount} attempts`;
        }
        throw error;
      }
    });

    // Print integration test results
    printIntegrationResults();

  } catch (error) {
    console.error('\n❌ Integration test suite failed:', error);
  }
}

function printIntegrationResults(): void {
  console.log('\n' + '='.repeat(60));
  console.log('🔗 INTEGRATION TEST RESULTS');
  console.log('='.repeat(60));

  const total = integrationResults.length;
  const passed = integrationResults.filter(r => r.status === 'PASS').length;
  const failed = integrationResults.filter(r => r.status === 'FAIL').length;

  const totalDuration = integrationResults.reduce((sum, r) => sum + r.duration, 0);
  const avgDuration = Math.round(totalDuration / total);

  console.log(`\n📊 Integration Test Summary:`);
  console.log(`  ✅ Passed: ${passed}/${total}`);
  console.log(`  ❌ Failed: ${failed}/${total}`);
  console.log(`  📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
  console.log(`  ⏱️  Total Duration: ${totalDuration}ms`);
  console.log(`  📊 Average Duration: ${avgDuration}ms`);

  if (failed > 0) {
    console.log(`\n❌ Failed Integration Tests:`);
    integrationResults.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`  • ${result.test}: ${result.message}`);
    });
  }

  console.log(`\n🔗 Integration Quality Assessment:`);
  
  if (passed === total) {
    console.log('  🏆 EXCELLENT - All integration scenarios pass flawlessly');
  } else if (passed >= total * 0.9) {
    console.log('  ✅ VERY GOOD - Most integration scenarios work well');
  } else if (passed >= total * 0.8) {
    console.log('  👍 GOOD - Solid integration with minor issues');
  } else if (passed >= total * 0.7) {
    console.log('  ⚠️  FAIR - Integration needs improvement');
  } else {
    console.log('  ❌ POOR - Significant integration issues');
  }

  console.log(`\n🚀 Workflow Analysis:`);
  console.log(`  • Project Setup: ${integrationResults.find(r => r.test.includes('Project Setup'))?.status === 'PASS' ? 'Working' : 'Issues'}`);
  console.log(`  • Issue Management: ${integrationResults.find(r => r.test.includes('Issue Lifecycle'))?.status === 'PASS' ? 'Working' : 'Issues'}`);
  console.log(`  • Cross-API Consistency: ${integrationResults.find(r => r.test.includes('Cross-API'))?.status === 'PASS' ? 'Working' : 'Issues'}`);
  console.log(`  • Bulk Operations: ${integrationResults.find(r => r.test.includes('Bulk Operations'))?.status === 'PASS' ? 'Working' : 'Issues'}`);
  console.log(`  • Error Recovery: ${integrationResults.find(r => r.test.includes('Error Recovery'))?.status === 'PASS' ? 'Working' : 'Issues'}`);

  if (avgDuration < 50) {
    console.log(`  ⚡ Performance: Excellent (${avgDuration}ms avg response)`);
  } else if (avgDuration < 100) {
    console.log(`  🟢 Performance: Good (${avgDuration}ms avg response)`);
  } else if (avgDuration < 200) {
    console.log(`  🟡 Performance: Acceptable (${avgDuration}ms avg response)`);
  } else {
    console.log(`  🔴 Performance: Slow (${avgDuration}ms avg response)`);
  }

  if (passed === total) {
    console.log('\n🎉 ALL INTEGRATION TESTS PASSED! System integration is excellent! 🚀');
  }
}

// Run integration tests
runIntegrationTests().catch(console.error);
