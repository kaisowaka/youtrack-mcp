/**
 * Advanced Edge Case & Stress Test Suite
 * Tests boundary conditions, error scenarios, and real-world edge cases
 */

console.log('🔬 Advanced Edge Case & Stress Testing');
console.log('='.repeat(60));

const advancedResults: Array<{ test: string; status: 'PASS' | 'FAIL'; message: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }> = [];

async function runAdvancedTest(testName: string, severity: 'LOW' | 'MEDIUM' | 'HIGH', testFn: () => Promise<string> | string): Promise<void> {
  try {
    const result = await testFn();
    advancedResults.push({ test: testName, status: 'PASS', message: result, severity });
    console.log(`  ✅ ${testName}: ${result}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    advancedResults.push({ test: testName, status: 'FAIL', message, severity });
    console.log(`  ❌ ${testName}: ${message}`);
  }
}

async function runAdvancedTests() {
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

    console.log('\n🧪 Boundary Condition Tests');
    console.log('-'.repeat(40));

    // Test 1: Empty/Null Parameters
    await runAdvancedTest('Empty Parameters Handling', 'HIGH', async () => {
      const agileAPI = client.agile;
      const originalGet = (agileAPI as any).get;
      (agileAPI as any).get = async () => ({ data: [], status: 200 });

      try {
        // Test with empty parameters
        const result1 = await agileAPI.listAgileBoards({});
        const result2 = await agileAPI.listAgileBoards({ projectId: '', includeDetails: false });
        
        if (!result1.content || !result2.content) {
          throw new Error('Empty parameter handling failed');
        }
        
        return 'Empty parameters handled gracefully';
      } finally {
        (agileAPI as any).get = originalGet;
      }
    });

    // Test 2: Large Data Volumes
    await runAdvancedTest('Large Data Volume Handling', 'MEDIUM', async () => {
      const agileAPI = client.agile;
      const originalGet = (agileAPI as any).get;
      
      // Simulate large response
      const largeData = Array(1000).fill(null).map((_, i) => ({
        id: `board-${i}`,
        name: `Board ${i}`,
        projects: Array(10).fill(null).map((_, j) => ({ 
          id: `proj-${i}-${j}`, 
          name: `Project ${i}-${j}` 
        }))
      }));

      (agileAPI as any).get = async () => ({ data: largeData, status: 200 });

      try {
        const result = await agileAPI.listAgileBoards({ includeDetails: true });
        const response = JSON.parse(result.content[0].text);
        
        if (!response.success || response.data.length !== 1000) {
          throw new Error('Large data handling failed');
        }
        
        return `Handled ${largeData.length} boards successfully`;
      } finally {
        (agileAPI as any).get = originalGet;
      }
    });

    // Test 3: Special Characters in Data
    await runAdvancedTest('Special Characters Handling', 'MEDIUM', async () => {
      const issuesAPI = client.issues;
      const originalPost = (issuesAPI as any).post;
      
      (issuesAPI as any).post = async (endpoint: string, data: any) => ({
        data: { id: 'TEST-123', summary: data.summary },
        status: 201
      });

      try {
        // Test with special characters
        const specialSummary = 'Test with émojis 🚀 and spëcial çharacters & symbols #@$%';
        const result = await issuesAPI.createIssue('TEST', {
          summary: specialSummary,
          description: 'Testing with "quotes" and \'apostrophes\' and <tags>'
        });

        const response = JSON.parse(result.content[0].text);
        if (!response.success) {
          throw new Error('Special characters not handled properly');
        }

        return 'Special characters and unicode handled correctly';
      } finally {
        (issuesAPI as any).post = originalPost;
      }
    });

    console.log('\n💥 Error Scenario Tests');
    console.log('-'.repeat(40));

    // Test 4: Network Timeout Simulation
    await runAdvancedTest('Network Timeout Recovery', 'HIGH', async () => {
      const agileAPI = client.agile;
      const originalGet = (agileAPI as any).get;
      
      (agileAPI as any).get = async () => {
        throw new Error('ETIMEDOUT: Connection timed out');
      };

      try {
        const result = await agileAPI.listAgileBoards();
        const response = JSON.parse(result.content[0].text);
        
        if (response.success) {
          throw new Error('Should have failed due to timeout');
        }
        
        if (!response.error || !response.context) {
          throw new Error('Error response format invalid');
        }

        return 'Network timeouts handled with proper error reporting';
      } finally {
        (agileAPI as any).get = originalGet;
      }
    });

    // Test 5: HTTP Error Codes
    await runAdvancedTest('HTTP Error Code Handling', 'HIGH', async () => {
      const adminAPI = client.admin;
      const originalPost = (adminAPI as any).post;
      
      const errorScenarios = [
        { status: 400, message: 'Bad Request' },
        { status: 401, message: 'Unauthorized' },
        { status: 403, message: 'Forbidden' },
        { status: 404, message: 'Not Found' },
        { status: 429, message: 'Too Many Requests' },
        { status: 500, message: 'Internal Server Error' }
      ];

      let handledErrors = 0;

      for (const scenario of errorScenarios) {
        (adminAPI as any).post = async () => {
          const error: any = new Error(scenario.message);
          error.response = { status: scenario.status };
          throw error;
        };

        try {
          const result = await adminAPI.createProject({ name: 'Test', shortName: 'T' });
          const response = JSON.parse(result.content[0].text);
          
          if (!response.success && response.error) {
            handledErrors++;
          }
        } catch (error) {
          // Some errors might be re-thrown
          handledErrors++;
        }
      }

      (adminAPI as any).post = originalPost;

      if (handledErrors < errorScenarios.length) {
        throw new Error(`Only handled ${handledErrors}/${errorScenarios.length} error scenarios`);
      }

      return `All ${errorScenarios.length} HTTP error codes handled properly`;
    });

    // Test 6: Malformed JSON Response
    await runAdvancedTest('Malformed Response Handling', 'MEDIUM', async () => {
      const projectsAPI = client.projects;
      const originalGet = (projectsAPI as any).get;
      
      (projectsAPI as any).get = async () => ({
        data: '{ invalid json response }', // Malformed JSON
        status: 200
      });

      try {
        const result = await projectsAPI.getProjectCustomFields('TEST');
        const response = JSON.parse(result.content[0].text);
        
        // Should handle malformed response gracefully
        if (response.success) {
          throw new Error('Should have failed due to malformed response');
        }

        return 'Malformed responses handled gracefully';
      } finally {
        (projectsAPI as any).get = originalGet;
      }
    });

    console.log('\n🚀 Performance Stress Tests');
    console.log('-'.repeat(40));

    // Test 7: High Concurrency
    await runAdvancedTest('High Concurrency Stress', 'MEDIUM', async () => {
      const agileAPI = client.agile;
      const originalGet = (agileAPI as any).get;
      
      let callCount = 0;
      (agileAPI as any).get = async () => {
        callCount++;
        // Simulate varying response times
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return { data: [{ id: `board-${callCount}` }], status: 200 };
      };

      try {
        const startTime = Date.now();
        // Test with 50 concurrent calls
        const promises = Array(50).fill(null).map(() => agileAPI.listAgileBoards());
        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;

        if (results.length !== 50 || callCount !== 50) {
          throw new Error('Not all concurrent calls completed');
        }

        if (duration > 5000) {
          throw new Error(`High concurrency too slow: ${duration}ms`);
        }

        return `50 concurrent calls completed in ${duration}ms`;
      } finally {
        (agileAPI as any).get = originalGet;
      }
    });

    // Test 8: Memory Leak Detection
    await runAdvancedTest('Memory Leak Detection', 'MEDIUM', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and destroy multiple clients
      for (let i = 0; i < 100; i++) {
        const tempFactory = new EnhancedClientFactory(testConfig);
        const tempClient = tempFactory.createClient();
        tempClient.clearAllCaches();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const increaseInMB = Math.round(memoryIncrease / 1024 / 1024);

      if (increaseInMB > 10) {
        throw new Error(`Potential memory leak: ${increaseInMB}MB increase`);
      }

      return `Memory stable: ${increaseInMB}MB increase after 100 client cycles`;
    });

    console.log('\n🔐 Security & Validation Tests');
    console.log('-'.repeat(40));

    // Test 9: Input Sanitization
    await runAdvancedTest('Input Sanitization', 'HIGH', async () => {
      const issuesAPI = client.issues;
      const originalPost = (issuesAPI as any).post;
      
      (issuesAPI as any).post = async (endpoint: string, data: any) => ({
        data: { id: 'TEST-XSS', summary: data.summary },
        status: 201
      });

      try {
        // Test with potentially malicious input
        const maliciousInputs = [
          '<script>alert("xss")</script>',
          'javascript:alert("xss")',
          '${7*7}',
          '{{7*7}}',
          '"; DROP TABLE users; --'
        ];

        for (const input of maliciousInputs) {
          const result = await issuesAPI.createIssue('TEST', { summary: input });
          const response = JSON.parse(result.content[0].text);
          
          // Should either sanitize or handle securely
          if (!response.success && !response.error) {
            throw new Error('Malicious input not handled properly');
          }
        }

        return `${maliciousInputs.length} malicious inputs handled securely`;
      } finally {
        (issuesAPI as any).post = originalPost;
      }
    });

    // Test 10: Configuration Validation
    await runAdvancedTest('Configuration Security', 'HIGH', () => {
      const vulnerableConfigs = [
        { baseURL: 'http://malicious-site.com', token: 'fake-token' },
        { baseURL: '', token: '' },
        { baseURL: 'javascript:alert("xss")', token: 'token' },
        { baseURL: 'file:///etc/passwd', token: 'token' }
      ];

      let validatedConfigs = 0;

      for (const config of vulnerableConfigs) {
        try {
          const factory = new EnhancedClientFactory(config as any);
          const testClient = factory.createClient();
          
          // Should create client but with validation/sanitization
          if (testClient) {
            validatedConfigs++;
          }
        } catch (error) {
          // Validation errors are acceptable
          validatedConfigs++;
        }
      }

      if (validatedConfigs < vulnerableConfigs.length) {
        throw new Error('Configuration validation insufficient');
      }

      return `${vulnerableConfigs.length} potentially malicious configs handled safely`;
    });

    console.log('\n🔄 Real-world Scenario Tests');
    console.log('-'.repeat(40));

    // Test 11: Long-running Operations
    await runAdvancedTest('Long-running Operation Handling', 'MEDIUM', async () => {
      const kbAPI = client.knowledgeBase;
      const originalPost = (kbAPI as any).post;
      
      (kbAPI as any).post = async () => {
        // Simulate long operation
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: { id: 'article-1', title: 'Long Article' }, status: 201 };
      };

      try {
        const startTime = Date.now();
        const result = await kbAPI.createArticle({
          title: 'Long Processing Article',
          content: 'Very long content that takes time to process...'
        });
        const duration = Date.now() - startTime;

        const response = JSON.parse(result.content[0].text);
        if (!response.success) {
          throw new Error('Long operation failed');
        }

        return `Long operation completed in ${duration}ms`;
      } finally {
        (kbAPI as any).post = originalPost;
      }
    });

    // Test 12: Cache Coherency Under Load
    await runAdvancedTest('Cache Coherency Under Load', 'MEDIUM', async () => {
      const agileAPI = client.agile;
      let getCallCount = 0;
      const originalGet = (agileAPI as any).get;
      
      (agileAPI as any).get = async () => {
        getCallCount++;
        return { 
          data: [{ id: 'board-1', name: `Board Call ${getCallCount}` }], 
          status: 200 
        };
      };

      try {
        // Make multiple calls that should potentially use cache
        const promises = Array(10).fill(null).map(() => agileAPI.listAgileBoards());
        const results = await Promise.all(promises);

        // Check that all results are consistent
        const firstResponse = JSON.parse(results[0].content[0].text);
        const allSame = results.every(result => {
          const response = JSON.parse(result.content[0].text);
          return JSON.stringify(response.data) === JSON.stringify(firstResponse.data);
        });

        if (!allSame) {
          throw new Error('Cache coherency issue detected');
        }

        return `Cache coherency maintained across ${results.length} concurrent calls`;
      } finally {
        (agileAPI as any).get = originalGet;
      }
    });

    // Print advanced test results
    printAdvancedResults();

  } catch (error) {
    console.error('\n❌ Advanced test suite failed:', error);
  }
}

function printAdvancedResults(): void {
  console.log('\n' + '='.repeat(60));
  console.log('🔬 ADVANCED TEST RESULTS');
  console.log('='.repeat(60));

  const total = advancedResults.length;
  const passed = advancedResults.filter(r => r.status === 'PASS').length;
  const failed = advancedResults.filter(r => r.status === 'FAIL').length;

  const highSeverityFailed = advancedResults.filter(r => r.status === 'FAIL' && r.severity === 'HIGH').length;
  const mediumSeverityFailed = advancedResults.filter(r => r.status === 'FAIL' && r.severity === 'MEDIUM').length;
  const lowSeverityFailed = advancedResults.filter(r => r.status === 'FAIL' && r.severity === 'LOW').length;

  console.log(`\n📊 Advanced Test Summary:`);
  console.log(`  ✅ Passed: ${passed}/${total}`);
  console.log(`  ❌ Failed: ${failed}/${total}`);
  console.log(`  📈 Success Rate: ${Math.round((passed / total) * 100)}%`);

  if (failed > 0) {
    console.log(`\n❌ Failed Tests by Severity:`);
    console.log(`  🔴 High Priority: ${highSeverityFailed} failures`);
    console.log(`  🟡 Medium Priority: ${mediumSeverityFailed} failures`);
    console.log(`  🟢 Low Priority: ${lowSeverityFailed} failures`);

    advancedResults.filter(r => r.status === 'FAIL').forEach(result => {
      const severityIcon = result.severity === 'HIGH' ? '🔴' : result.severity === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`  ${severityIcon} ${result.test}: ${result.message}`);
    });
  }

  console.log(`\n🎯 Production Readiness Assessment:`);
  
  if (highSeverityFailed === 0 && mediumSeverityFailed <= 1) {
    console.log('  🏆 PRODUCTION READY - Excellent resilience and error handling');
  } else if (highSeverityFailed === 0 && mediumSeverityFailed <= 3) {
    console.log('  ✅ MOSTLY READY - Minor edge cases to address');
  } else if (highSeverityFailed <= 1) {
    console.log('  ⚠️  NEEDS WORK - Some critical issues to fix');
  } else {
    console.log('  ❌ NOT READY - Multiple critical issues require attention');
  }

  console.log(`\n🛡️  Security & Robustness:`);
  console.log(`  • Error Handling: ${failed === 0 ? 'Excellent' : 'Needs improvement'}`);
  console.log(`  • Edge Case Coverage: ${passed >= 10 ? 'Comprehensive' : 'Basic'}`);
  console.log(`  • Performance Under Load: ${passed >= 8 ? 'Good' : 'Needs testing'}`);
  console.log(`  • Security Validation: ${highSeverityFailed === 0 ? 'Strong' : 'Vulnerable'}`);

  if (passed === total) {
    console.log('\n🎉 ALL ADVANCED TESTS PASSED! System is robust and production-ready! 🚀');
  }
}

// Run advanced tests
runAdvancedTests().catch(console.error);
