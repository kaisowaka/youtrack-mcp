#!/usr/bin/env tsx

/**
 * COMPREHENSIVE MCP INTEGRATION TESTS
 * Tests all 21 YouTrack client methods through actual MCP protocol calls
 * Validates end-to-end functionality including MCP message parsing and tool execution
 */

import { spawn } from 'child_process';
import path from 'path';

// Enhanced MCP Test Framework
class MCPTestSuite {
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private mcpProcess: any;
  private messageId = 1;
  private testResults: any[] = [];
  public createdResources: any = {};

  async startMCPServer(): Promise<void> {
    console.log('🔄 Starting MCP server for integration testing...');
    return new Promise((resolve, reject) => {
      const serverPath = path.join(__dirname, '../dist/index.js');
      
      this.mcpProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          YOUTRACK_URL: 'https://youtrack.devstroop.com',
          YOUTRACK_TOKEN: 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA',
          MCP_SERVER: 'true', // Disable colored logging for clean JSON output
          NODE_ENV: 'test'
        }
      });

      let initialized = false;

      this.mcpProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        // Look for server ready indicators
        if ((output.includes('YouTrack MCP Server') || output.includes('Server started')) && !initialized) {
          initialized = true;
          setTimeout(() => resolve(), 1000); // Give server time to fully initialize
        }
      });

      this.mcpProcess.stderr.on('data', (data: Buffer) => {
        const error = data.toString();
        if (!error.includes('Warning')) { // Ignore warnings
          console.error('❌ MCP Server Error:', error);
        }
      });

      this.mcpProcess.on('error', reject);

      // Timeout
      setTimeout(() => {
        if (!initialized) {
          reject(new Error('MCP Server failed to start within 15 seconds'));
        }
      }, 15000);
    });
  }

  async stopMCPServer(): Promise<void> {
    if (this.mcpProcess) {
      this.mcpProcess.kill('SIGTERM');
      await new Promise(resolve => {
        this.mcpProcess.on('close', resolve);
        setTimeout(resolve, 2000); // Force cleanup after 2s
      });
    }
  }

  async sendMCPRequest(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: this.messageId++,
        method,
        params
      };

      let responseBuffer = '';
      const timeout = setTimeout(() => {
        reject(new Error(`MCP request timeout for ${method} after 30s`));
      }, 30000);

      const responseHandler = (data: Buffer) => {
        responseBuffer += data.toString();
        
        // Parse line-delimited JSON responses
        const lines = responseBuffer.split('\\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            if (response.id === request.id) {
              clearTimeout(timeout);
              this.mcpProcess.stdout.removeListener('data', responseHandler);
              
              if (response.error) {
                reject(new Error(`MCP Error [${response.error.code}]: ${response.error.message}`));
                return;
              }
              
              resolve(response.result);
              return;
            }
          } catch (e) {
            // Continue parsing if JSON is incomplete
          }
        }
      };

      this.mcpProcess.stdout.on('data', responseHandler);
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\\n');
    });
  }

  async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    try {
      console.log(`  🧪 ${testName}`);
      await testFn();
      console.log(`  ✅ ${testName} - PASSED`);
      this.passed++;
      this.testResults.push({ name: testName, status: 'PASSED', error: null });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`  ❌ ${testName} - FAILED: ${errorMsg}`);
      this.failed++;
      this.testResults.push({ name: testName, status: 'FAILED', error: errorMsg });
    }
  }

  async runTestSuite(suiteName: string, tests: Array<{ name: string, fn: () => Promise<void> }>): Promise<void> {
    console.log(`\\n🧪 ${suiteName}`);
    console.log('='.repeat(50));
    
    for (const test of tests) {
      await this.runTest(test.name, test.fn);
    }
  }

  printSummary(): boolean {
    console.log('\\n📊 COMPREHENSIVE MCP INTEGRATION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`⚪ Skipped: ${this.skipped}`);
    console.log(`📈 Total: ${this.passed + this.failed + this.skipped}`);
    
    const successRate = (this.passed / (this.passed + this.failed)) * 100;
    console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (this.failed > 0) {
      console.log('\\n❌ FAILED TESTS:');
      this.testResults
        .filter(result => result.status === 'FAILED')
        .forEach(result => {
          console.log(`  • ${result.name}: ${result.error}`);
        });
    }
    
    if (this.failed === 0) {
      console.log('\\n🎉 ALL MCP INTEGRATION TESTS PASSED! 🎉');
      console.log('🚀 YouTrack MCP Server is fully functional and production-ready');
      return true;
    } else {
      console.log(`\\n⚠️  ${this.failed} test(s) failed - Review and fix issues`);
      return false;
    }
  }
}

// Main test execution
async function runComprehensiveMCPTests(): Promise<boolean> {
  console.log('🚀 COMPREHENSIVE MCP INTEGRATION TEST SUITE');
  console.log('Testing all 21 YouTrack methods through MCP protocol');
  console.log('='.repeat(60));
  
  const testSuite = new MCPTestSuite();
  
  try {
    // Start MCP server
    await testSuite.startMCPServer();
    console.log('✅ MCP server started and ready for testing');

    // Test Suite 1: MCP Protocol Compliance
    await testSuite.runTestSuite('MCP Protocol Compliance', [
      {
        name: 'Should respond to tools/list request',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/list');
          if (!result.tools || !Array.isArray(result.tools)) {
            throw new Error('tools/list should return tools array');
          }
          if (result.tools.length < 20) {
            throw new Error(`Expected 20+ tools, got ${result.tools.length}`);
          }
        }
      },
      {
        name: 'Should have proper tool schemas',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/list');
          const requiredTools = [
            'list_projects', 'validate_project', 'get_project_status',
            'create_issue', 'update_issue', 'query_issues',
            'create_epic', 'create_milestone', 'log_work_time'
          ];
          
          for (const toolName of requiredTools) {
            const tool = result.tools.find((t: any) => t.name === toolName);
            if (!tool) {
              throw new Error(`Missing required tool: ${toolName}`);
            }
            if (!tool.inputSchema) {
              throw new Error(`Tool ${toolName} missing inputSchema`);
            }
          }
        }
      }
    ]);

    // Test Suite 2: Core Project Management
    await testSuite.runTestSuite('Core Project Management Functions', [
      {
        name: 'list_projects via MCP',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'list_projects',
            arguments: {}
          });
          if (!result.content || !Array.isArray(result.content)) {
            throw new Error('list_projects should return content array');
          }
        }
      },
      {
        name: 'validate_project via MCP',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'validate_project',
            arguments: { projectId: 'MYD' }
          });
          const data = JSON.parse(result.content[0].text);
          if (typeof data.exists !== 'boolean') {
            throw new Error('validate_project should return exists boolean');
          }
        }
      },
      {
        name: 'get_project_status via MCP',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'get_project_status',
            arguments: { projectId: 'MYD' }
          });
          const data = JSON.parse(result.content[0].text);
          if (!data.totalIssues && data.totalIssues !== 0) {
            throw new Error('get_project_status should return totalIssues');
          }
        }
      },
      {
        name: 'get_project_custom_fields via MCP',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'get_project_custom_fields',
            arguments: { projectId: 'MYD' }
          });
          if (!Array.isArray(JSON.parse(result.content[0].text))) {
            throw new Error('get_project_custom_fields should return array');
          }
        }
      },
      {
        name: 'get_project_issues_summary via MCP',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'get_project_issues_summary',
            arguments: { projectId: 'MYD' }
          });
          if (!result.content[0].text.includes('Issues Summary')) {
            throw new Error('get_project_issues_summary should return summary');
          }
        }
      },
      {
        name: 'get_project_timeline via MCP',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'get_project_timeline',
            arguments: { projectId: 'MYD', days: 7 }
          });
          if (!result.content[0].text.includes('Timeline')) {
            throw new Error('get_project_timeline should return timeline');
          }
        }
      }
    ]);

    // Test Suite 3: Issue Management
    await testSuite.runTestSuite('Issue Management Functions', [
      {
        name: 'create_issue via MCP',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'create_issue',
            arguments: {
              projectId: 'MYD',
              summary: 'MCP Integration Test Issue',
              description: 'Created during comprehensive MCP testing',
              type: 'Bug',
              priority: 'Normal'
            }
          });
          
          if (!result.content[0].text.includes('successfully')) {
            throw new Error('create_issue should indicate success');
          }
          
          // Extract issue ID for later tests
          try {
            const lines = result.content[0].text.split('\\n');
            const issueData = JSON.parse(lines[1]);
            testSuite.createdResources.issueId = issueData.id;
          } catch (e) {
            console.log('  ⚠️  Could not extract issue ID for later tests');
          }
        }
      },
      {
        name: 'query_issues via MCP',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'query_issues',
            arguments: {
              query: 'project: MYD',
              fields: 'id,summary,state(name)',
              limit: 5
            }
          });
          
          const issues = JSON.parse(result.content[0].text);
          if (!Array.isArray(issues)) {
            throw new Error('query_issues should return array of issues');
          }
        }
      },
      {
        name: 'update_issue via MCP',
        fn: async () => {
          // Get an issue to update
          const queryResult = await testSuite.sendMCPRequest('tools/call', {
            name: 'query_issues',
            arguments: { query: 'project: MYD', limit: 1 }
          });
          
          const issues = JSON.parse(queryResult.content[0].text);
          if (issues.length === 0) {
            throw new Error('No issues available for update test');
          }
          
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'update_issue',
            arguments: {
              issueId: issues[0].id,
              updates: {
                summary: 'Updated via MCP Integration Test'
              }
            }
          });
          
          if (!result.content[0].text.includes('updated successfully')) {
            throw new Error('update_issue should indicate success');
          }
        }
      },
      {
        name: 'bulk_update_issues via MCP',
        fn: async () => {
          // Get issues for bulk update
          const queryResult = await testSuite.sendMCPRequest('tools/call', {
            name: 'query_issues',
            arguments: { query: 'project: MYD', limit: 2 }
          });
          
          const issues = JSON.parse(queryResult.content[0].text);
          if (issues.length === 0) {
            throw new Error('No issues available for bulk update test');
          }
          
          const issueIds = issues.slice(0, Math.min(2, issues.length)).map((issue: any) => issue.id);
          
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'bulk_update_issues',
            arguments: {
              issueIds,
              updates: {
                priority: 'Normal'
              }
            }
          });
          
          if (!result.content[0].text.includes('Bulk update completed')) {
            throw new Error('bulk_update_issues should indicate completion');
          }
        }
      }
    ]);

    // Test Suite 4: Comments & Communication
    await testSuite.runTestSuite('Comments & Communication', [
      {
        name: 'get_issue_comments via MCP',
        fn: async () => {
          // Get an issue
          const queryResult = await testSuite.sendMCPRequest('tools/call', {
            name: 'query_issues',
            arguments: { query: 'project: MYD', limit: 1 }
          });
          
          const issues = JSON.parse(queryResult.content[0].text);
          if (issues.length === 0) {
            throw new Error('No issues available for comments test');
          }
          
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'get_issue_comments',
            arguments: { issueId: issues[0].id }
          });
          
          if (!result.content[0].text) {
            throw new Error('get_issue_comments should return text content');
          }
        }
      },
      {
        name: 'add_issue_comment via MCP',
        fn: async () => {
          // Get an issue
          const queryResult = await testSuite.sendMCPRequest('tools/call', {
            name: 'query_issues',
            arguments: { query: 'project: MYD', limit: 1 }
          });
          
          const issues = JSON.parse(queryResult.content[0].text);
          if (issues.length === 0) {
            throw new Error('No issues available for comment test');
          }
          
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'add_issue_comment',
            arguments: {
              issueId: issues[0].id,
              text: 'MCP Integration Test Comment - ' + new Date().toISOString()
            }
          });
          
          if (!result.content[0].text.includes('successfully')) {
            throw new Error('add_issue_comment should indicate success');
          }
        }
      },
      {
        name: 'search_users via MCP',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'search_users',
            arguments: { query: 'admin' }
          });
          
          if (!result.content[0].text) {
            throw new Error('search_users should return text content');
          }
        }
      }
    ]);

    // Test Suite 5: Epic Management
    await testSuite.runTestSuite('Epic Management Functions', [
      {
        name: 'create_epic via MCP',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'create_epic',
            arguments: {
              projectId: 'MYD',
              summary: 'MCP Integration Test Epic',
              description: 'Epic created during comprehensive MCP testing',
              priority: 'High'
            }
          });
          
          if (!result.content[0].text.includes('success')) {
            throw new Error('create_epic should indicate success');
          }
          
          // Extract epic ID
          try {
            const epicData = JSON.parse(result.content[0].text);
            if (epicData.epic?.id) {
              testSuite.createdResources.epicId = epicData.epic.id;
            }
          } catch (e) {
            console.log('  ⚠️  Could not extract epic ID');
          }
        }
      },
      {
        name: 'link_issue_to_epic via MCP',
        fn: async () => {
          // Get an issue and epic
          const queryResult = await testSuite.sendMCPRequest('tools/call', {
            name: 'query_issues',
            arguments: { query: 'project: MYD Type: Epic', limit: 1 }
          });
          
          const epics = JSON.parse(queryResult.content[0].text);
          if (epics.length === 0) {
            console.log('  ⚠️  Skipping - no epics available');
            return;
          }
          
          const issueQueryResult = await testSuite.sendMCPRequest('tools/call', {
            name: 'query_issues',
            arguments: { query: 'project: MYD -Type: Epic', limit: 1 }
          });
          
          const issues = JSON.parse(issueQueryResult.content[0].text);
          if (issues.length === 0) {
            console.log('  ⚠️  Skipping - no issues available');
            return;
          }
          
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'link_issue_to_epic',
            arguments: {
              issueId: issues[0].id,
              epicId: epics[0].id
            }
          });
          
          if (!result.content[0].text.includes('success')) {
            throw new Error('link_issue_to_epic should indicate success');
          }
        }
      },
      {
        name: 'get_epic_progress via MCP',
        fn: async () => {
          // Get an epic
          const queryResult = await testSuite.sendMCPRequest('tools/call', {
            name: 'query_issues',
            arguments: { query: 'project: MYD Type: Epic', limit: 1 }
          });
          
          const epics = JSON.parse(queryResult.content[0].text);
          if (epics.length === 0) {
            console.log('  ⚠️  Skipping - no epics available');
            return;
          }
          
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'get_epic_progress',
            arguments: { epicId: epics[0].id }
          });
          
          if (!result.content[0].text) {
            throw new Error('get_epic_progress should return content');
          }
        }
      }
    ]);

    // Test Suite 6: Milestone Management
    await testSuite.runTestSuite('Milestone Management Functions', [
      {
        name: 'create_milestone via MCP',
        fn: async () => {
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'create_milestone',
            arguments: {
              projectId: 'MYD',
              name: 'MCP Integration Test Milestone',
              targetDate: '2025-08-30',
              description: 'Milestone created during comprehensive MCP testing'
            }
          });
          
          if (!result.content[0].text.includes('success')) {
            throw new Error('create_milestone should indicate success');
          }
          
          // Extract milestone ID
          try {
            const milestoneData = JSON.parse(result.content[0].text);
            if (milestoneData.milestone?.id) {
              testSuite.createdResources.milestoneId = milestoneData.milestone.id;
            }
          } catch (e) {
            console.log('  ⚠️  Could not extract milestone ID');
          }
        }
      },
      {
        name: 'assign_issues_to_milestone via MCP',
        fn: async () => {
          if (!testSuite.createdResources.milestoneId) {
            console.log('  ⚠️  Skipping - no milestone ID available');
            return;
          }
          
          // Get an issue
          const queryResult = await testSuite.sendMCPRequest('tools/call', {
            name: 'query_issues',
            arguments: { query: 'project: MYD', limit: 1 }
          });
          
          const issues = JSON.parse(queryResult.content[0].text);
          if (issues.length === 0) {
            console.log('  ⚠️  Skipping - no issues available');
            return;
          }
          
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'assign_issues_to_milestone',
            arguments: {
              milestoneId: testSuite.createdResources.milestoneId,
              issueIds: [issues[0].id]
            }
          });
          
          if (!result.content[0].text.includes('milestoneId')) {
            throw new Error('assign_issues_to_milestone should return milestone info');
          }
        }
      },
      {
        name: 'get_milestone_progress via MCP',
        fn: async () => {
          if (!testSuite.createdResources.milestoneId) {
            console.log('  ⚠️  Skipping - no milestone ID available');
            return;
          }
          
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'get_milestone_progress',
            arguments: { milestoneId: testSuite.createdResources.milestoneId }
          });
          
          if (!result.content[0].text) {
            throw new Error('get_milestone_progress should return content');
          }
        }
      }
    ]);

    // Test Suite 7: Time Tracking
    await testSuite.runTestSuite('Time Tracking Functions', [
      {
        name: 'log_work_time via MCP',
        fn: async () => {
          // Get an issue
          const queryResult = await testSuite.sendMCPRequest('tools/call', {
            name: 'query_issues',
            arguments: { query: 'project: MYD', limit: 1 }
          });
          
          const issues = JSON.parse(queryResult.content[0].text);
          if (issues.length === 0) {
            throw new Error('No issues available for time logging test');
          }
          
          const result = await testSuite.sendMCPRequest('tools/call', {
            name: 'log_work_time',
            arguments: {
              issueId: issues[0].id,
              duration: '1h 30m',
              description: 'MCP Integration Testing Work',
              workType: 'Testing'
            }
          });
          
          if (!result.content[0].text.includes('success')) {
            throw new Error('log_work_time should indicate success');
          }
        }
      }
    ]);

    console.log('\\n✅ All MCP integration tests completed');
    
  } catch (error) {
    console.error('❌ MCP Test Suite Failed:', error);
    return false;
  } finally {
    await testSuite.stopMCPServer();
    console.log('🔄 MCP server stopped');
  }

  return testSuite.printSummary();
}

// Execute comprehensive MCP tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveMCPTests()
    .then(success => {
      console.log(success ? '\\n🎉 MCP Integration Tests: SUCCESS' : '\\n❌ MCP Integration Tests: FAILED');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

export { runComprehensiveMCPTests };
