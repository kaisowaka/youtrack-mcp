#!/usr/bin/env node

/**
 * PHASE 2 TEST SUITE: AGILE BOARDS
 * =================================
 * 
 * Comprehensive testing of all agile board functionality
 */

import { YouTrackClient } from '../dist/youtrack-client.js';

const client = new YouTrackClient(
  'https://youtrack.devstroop.com',
  'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
);

// Test configuration from our API research
const TEST_CONFIG = {
  boardId: '181-2',        // MyDR24 Board
  sprintId: '184-2',       // First sprint
  projectId: 'MYD',        // MyDR24 project
  testIssue: '3-107'       // Our test issue
};

// Test runner
async function runTest(testName, testFn) {
  process.stdout.write(`🧪 Testing ${testName}...`);
  try {
    const result = await testFn();
    const data = JSON.parse(result.content[0].text);
    
    if (data.success) {
      console.log(' ✅ PASSED');
      return { passed: true, data };
    } else {
      console.log(' ❌ FAILED: Invalid response format');
      return { passed: false, error: 'Invalid response format' };
    }
  } catch (error) {
    console.log(` ❌ FAILED: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function testPhase2Features() {
  console.log('🧪 TESTING PHASE 2: AGILE BOARDS');
  console.log('================================\\n');

  const results = [];

  // Test 1: List Agile Boards
  const test1 = await runTest('list_agile_boards (all)', async () => {
    return await client.listAgileBoards({
      includeDetails: true
    });
  });
  
  if (test1.passed) {
    console.log(`   📋 Found ${test1.data.count} boards`);
    if (test1.data.boards.length > 0) {
      console.log(`   🎯 Sample board: ${test1.data.boards[0].name}`);
    }
  }
  results.push(test1);

  // Test 2: List Agile Boards (filtered by project)
  const test2 = await runTest('list_agile_boards (project filtered)', async () => {
    return await client.listAgileBoards({
      projectId: TEST_CONFIG.projectId,
      includeDetails: false
    });
  });
  
  if (test2.passed) {
    console.log(`   🔍 Filtered boards: ${test2.data.count}`);
  }
  results.push(test2);

  // Test 3: Get Board Details
  const test3 = await runTest('get_board_details', async () => {
    return await client.getBoardDetails({
      boardId: TEST_CONFIG.boardId,
      includeColumns: true,
      includeSprints: true
    });
  });
  
  if (test3.passed) {
    console.log(`   📊 Board: ${test3.data.board.name}`);
    console.log(`   📈 Summary: ${test3.data.summary.sprintCount} sprints, ${test3.data.summary.columnCount} columns`);
  }
  results.push(test3);

  // Test 4: List Sprints
  const test4 = await runTest('list_sprints', async () => {
    return await client.listSprints({
      boardId: TEST_CONFIG.boardId,
      includeArchived: false,
      includeIssues: true
    });
  });
  
  if (test4.passed) {
    console.log(`   🏃 Active sprints: ${test4.data.summary.activeSprints}`);
    console.log(`   📝 Total issues: ${test4.data.summary.totalIssues}`);
  }
  results.push(test4);

  // Test 5: Get Sprint Details
  const test5 = await runTest('get_sprint_details', async () => {
    return await client.getSprintDetails({
      boardId: TEST_CONFIG.boardId,
      sprintId: TEST_CONFIG.sprintId,
      includeIssues: true
    });
  });
  
  if (test5.passed) {
    console.log(`   📅 Sprint: ${test5.data.sprint.name}`);
    console.log(`   📊 Duration: ${test5.data.sprint.duration} days`);
    console.log(`   🎯 Issues: ${test5.data.sprint.issueCount}`);
  }
  results.push(test5);

  // Test 6: Assign Issue to Sprint
  const test6 = await runTest('assign_issue_to_sprint', async () => {
    return await client.assignIssueToSprint({
      issueId: TEST_CONFIG.testIssue,
      sprintId: TEST_CONFIG.sprintId,
      boardId: TEST_CONFIG.boardId
    });
  });
  
  if (test6.passed) {
    console.log(`   ✅ Issue ${TEST_CONFIG.testIssue} assigned to sprint`);
  }
  results.push(test6);

  // Test 7: Get Sprint Progress (with burndown)
  const test7 = await runTest('get_sprint_progress', async () => {
    return await client.getSprintProgress({
      boardId: TEST_CONFIG.boardId,
      sprintId: TEST_CONFIG.sprintId,
      includeBurndown: true
    });
  });
  
  if (test7.passed) {
    console.log(`   📈 Progress: ${test7.data.progress.completion.percentage}% complete`);
    console.log(`   ⏱️ Timeline: ${test7.data.progress.timeline.percentage}% elapsed`);
    console.log(`   💡 Recommendation: ${test7.data.recommendation}`);
  }
  results.push(test7);

  // Test 8: Remove Issue from Sprint
  const test8 = await runTest('remove_issue_from_sprint', async () => {
    return await client.removeIssueFromSprint({
      issueId: TEST_CONFIG.testIssue,
      sprintId: TEST_CONFIG.sprintId
    });
  });
  
  if (test8.passed) {
    console.log(`   ✅ Issue ${TEST_CONFIG.testIssue} removed from sprint`);
  }
  results.push(test8);

  // Calculate results
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const successRate = Math.round((passed / results.length) * 100);

  console.log('\\n\\n📊 PHASE 2 TEST SUMMARY');
  console.log('========================');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${successRate}%`);

  if (successRate === 100) {
    console.log('\\n🎉 PHASE 2 COMPLETE! All agile board features working.');
    console.log('\\n📋 Ready for Phase 3: Knowledge Base');
  } else if (successRate >= 80) {
    console.log('\\n⚠️  Most Phase 2 tests passed. Review failures before proceeding.');
  } else {
    console.log('\\n⚠️  Multiple Phase 2 tests failed. Fix before proceeding to Phase 3.');
  }

  return successRate;
}

// Run the tests
testPhase2Features().catch(console.error);
