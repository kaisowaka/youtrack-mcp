#!/usr/bin/env node

/**
 * Comprehensive test of all MCP tools
 */

import { YouTrackClient } from '../dist/youtrack-client.js';

async function testAllMCPTools() {
  console.log('🚀 Comprehensive MCP Tools Test\n');
  
  try {
    const client = new YouTrackClient(
      'https://youtrack.devstroop.com',
      'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
    );

    let passCount = 0;
    let totalTests = 0;

    // Helper function to run a test
    async function runTest(name, testFn) {
      totalTests++;
      console.log(`🧪 Testing ${name}...`);
      try {
        await testFn();
        console.log(`✅ ${name} - PASSED\n`);
        passCount++;
      } catch (error) {
        console.log(`❌ ${name} - FAILED: ${error.message}\n`);
      }
    }

    // Test 1: Create Issue
    await runTest('create_issue', async () => {
      const result = await client.createIssue({
        projectId: 'MYD',
        summary: 'Comprehensive Test Issue',
        description: 'Created during comprehensive MCP test',
        type: 'Task'
      });
      if (!result.content[0].text.includes('success')) {
        throw new Error('Issue creation response invalid');
      }
    });

    // Test 2: Query Issues
    await runTest('query_issues', async () => {
      const result = await client.queryIssues('project: MYD', 'id,summary,state', 5);
      const issues = JSON.parse(result.content[0].text);
      if (!Array.isArray(issues) || issues.length === 0) {
        throw new Error('No issues returned');
      }
    });

    // Test 3: Create Epic
    await runTest('create_epic', async () => {
      const result = await client.createEpic({
        projectId: 'MYD',
        summary: 'Comprehensive Test Epic',
        description: 'Epic created during comprehensive test'
      });
      if (!result.content[0].text.includes('success')) {
        throw new Error('Epic creation response invalid');
      }
    });

    // Test 4: Update Issue (get an issue first)
    await runTest('update_issue', async () => {
      const queryResult = await client.queryIssues('project: MYD', 'id,summary', 1);
      const issues = JSON.parse(queryResult.content[0].text);
      if (issues.length === 0) throw new Error('No issues to update');
      
      const result = await client.updateIssue(issues[0].id, {
        summary: 'Updated in Comprehensive Test'
      });
      if (!result.content[0].text.includes('success')) {
        throw new Error('Update response invalid');
      }
    });

    // Test 5: Log Work Time
    await runTest('log_work_time', async () => {
      const queryResult = await client.queryIssues('project: MYD', 'id,summary', 1);
      const issues = JSON.parse(queryResult.content[0].text);
      if (issues.length === 0) throw new Error('No issues for work time');
      
      const result = await client.logWorkTime({
        issueId: issues[0].id,
        duration: '2h',
        description: 'Comprehensive test work'
      });
      if (!result.content[0].text.includes('success')) {
        throw new Error('Work time logging response invalid');
      }
    });

    // Test 6: Create Milestone
    await runTest('create_milestone', async () => {
      const result = await client.createMilestone({
        projectId: 'MYD',
        name: 'Comprehensive Test Milestone',
        targetDate: '2025-08-15',
        description: 'Milestone for comprehensive testing',
        criteria: ['All tests pass', 'Documentation complete']
      });
      if (!result.content[0].text.includes('success')) {
        throw new Error('Milestone creation response invalid');
      }
    });

    // Test 7: Get Project Issues Summary
    await runTest('get_project_issues_summary', async () => {
      const result = await client.getProjectIssuesSummary('MYD');
      const summary = JSON.parse(result.content[0].text);
      if (!summary.projectId) {
        throw new Error('Invalid summary response');
      }
    });

    // Test 8: Search Users
    await runTest('search_users', async () => {
      const result = await client.searchUsers('admin');
      const users = JSON.parse(result.content[0].text);
      if (!Array.isArray(users)) {
        throw new Error('Invalid users response');
      }
    });

    // Test 9: List Projects
    await runTest('list_projects', async () => {
      const projects = await client.listProjects();
      if (!Array.isArray(projects) || projects.length === 0) {
        throw new Error('No projects returned');
      }
    });

    // Test 10: Get Project Custom Fields
    await runTest('get_project_custom_fields', async () => {
      const fields = await client.getProjectCustomFields('MYD');
      if (!Array.isArray(fields)) {
        throw new Error('Invalid custom fields response');
      }
    });

    // Summary
    console.log(`\n📊 TEST SUMMARY`);
    console.log(`=================`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${totalTests - passCount}`);
    console.log(`Success Rate: ${Math.round((passCount / totalTests) * 100)}%`);

    if (passCount === totalTests) {
      console.log(`\n🎉 ALL TESTS PASSED! MCP Server is fully functional.`);
    } else {
      console.log(`\n⚠️  Some tests failed. Check the output above for details.`);
    }

  } catch (error) {
    console.error('❌ Test suite failed to initialize:', error.message);
  }
}

testAllMCPTools().catch(console.error);
