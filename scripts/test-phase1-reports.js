#!/usr/bin/env node

/**
 * Test Phase 1: Reports & Enhanced Timesheet
 */

import { YouTrackClient } from '../dist/youtrack-client.js';

async function testPhase1Features() {
  console.log('🧪 TESTING PHASE 1: REPORTS & ENHANCED TIMESHEET\n');
  
  try {
    const client = new YouTrackClient(
      'https://youtrack.devstroop.com',
      'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
    );

    let passCount = 0;
    let totalTests = 0;

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

    // Setup: Create some work time entries for testing
    console.log('📝 Setup: Creating test data...');
    
    // Get an existing issue
    const queryResult = await client.queryIssues('project: MYD', 'id,summary', 1);
    const issues = JSON.parse(queryResult.content[0].text);
    
    if (issues.length === 0) {
      throw new Error('No issues available for testing');
    }
    
    const testIssue = issues[0];
    console.log(`Using test issue: ${testIssue.id} - ${testIssue.summary}`);

    // Log some work time for testing
    await client.logWorkTime({
      issueId: testIssue.id,
      duration: '2h',
      description: 'Phase 1 test work - Development'
    });

    await client.logWorkTime({
      issueId: testIssue.id,
      duration: '1h 30m',
      description: 'Phase 1 test work - Testing'
    });

    console.log('✅ Test data created\n');

    // Test 1: Time Tracking Report by User
    await runTest('get_time_tracking_report (by user)', async () => {
      const result = await client.getTimeTrackingReport({
        projectId: 'MYD',
        startDate: '2025-07-01',
        endDate: '2025-07-31',
        groupBy: 'user'
      });
      
      const report = JSON.parse(result.content[0].text);
      
      if (!report.success) {
        throw new Error('Report not successful');
      }
      
      if (!report.groups) {
        throw new Error('No groups in report');
      }
      
      console.log(`   📊 Total time: ${report.totalTimeFormatted}`);
      console.log(`   📊 Groups: ${Object.keys(report.groups).length}`);
      console.log(`   📊 Work items: ${report.totalItems}`);
    });

    // Test 2: Time Tracking Report by Issue
    await runTest('get_time_tracking_report (by issue)', async () => {
      const result = await client.getTimeTrackingReport({
        projectId: 'MYD',
        startDate: '2025-07-01',
        endDate: '2025-07-31',
        groupBy: 'issue'
      });
      
      const report = JSON.parse(result.content[0].text);
      
      if (!report.success || !report.groups) {
        throw new Error('Invalid report structure');
      }
      
      console.log(`   📊 Issues with time: ${Object.keys(report.groups).length}`);
    });

    // Test 3: Time Tracking Report by Date
    await runTest('get_time_tracking_report (by date)', async () => {
      const result = await client.getTimeTrackingReport({
        projectId: 'MYD',
        startDate: '2025-07-20',
        endDate: '2025-07-25',
        groupBy: 'date'
      });
      
      const report = JSON.parse(result.content[0].text);
      
      if (!report.success) {
        throw new Error('Report failed');
      }
      
      console.log(`   📊 Days with work: ${Object.keys(report.groups).length}`);
    });

    // Test 4: User Timesheet
    await runTest('get_user_timesheet', async () => {
      const result = await client.getUserTimesheet({
        userId: 'akash', // Using the correct username from our work items
        startDate: '2025-07-01',
        endDate: '2025-07-31',
        includeDetails: true
      });
      
      const timesheet = JSON.parse(result.content[0].text);
      
      if (!timesheet.success) {
        throw new Error('Timesheet not successful');
      }
      
      if (typeof timesheet.totalHours !== 'number') {
        throw new Error('Invalid total hours');
      }
      
      console.log(`   ⏱️ Total hours: ${timesheet.totalHours}`);
      console.log(`   📅 Days with work: ${timesheet.dailyBreakdown.length}`);
    });

    // Test 5: Project Statistics (basic)
    await runTest('get_project_statistics (basic)', async () => {
      const result = await client.getProjectStatistics({
        projectId: 'MYD'
      });
      
      const stats = JSON.parse(result.content[0].text);
      
      if (!stats.success || !stats.statistics) {
        throw new Error('Invalid statistics structure');
      }
      
      const s = stats.statistics;
      console.log(`   📈 Total issues: ${s.total}`);
      console.log(`   📈 States: ${Object.keys(s.byState).length}`);
      console.log(`   📈 Resolved: ${s.resolved}`);
    });

    // Test 6: Project Statistics with Time Tracking
    await runTest('get_project_statistics (with time tracking)', async () => {
      const result = await client.getProjectStatistics({
        projectId: 'MYD',
        period: {
          startDate: '2025-07-01',
          endDate: '2025-07-31'
        },
        includeTimeTracking: true
      });
      
      const stats = JSON.parse(result.content[0].text);
      
      if (!stats.success || !stats.statistics) {
        throw new Error('Invalid statistics structure');
      }
      
      console.log(`   ⏱️ Time tracking included: ${!!stats.statistics.timeTracking}`);
      if (stats.statistics.timeTracking) {
        console.log(`   ⏱️ Total time: ${stats.statistics.timeTracking.totalTime}`);
      }
    });

    // Summary
    console.log(`\n📊 PHASE 1 TEST SUMMARY`);
    console.log(`========================`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${totalTests - passCount}`);
    console.log(`Success Rate: ${Math.round((passCount / totalTests) * 100)}%`);

    if (passCount === totalTests) {
      console.log(`\n🎉 PHASE 1 COMPLETE! All reports & timesheet features working.`);
      console.log(`\n📋 Ready for Phase 2: Agile Boards`);
    } else {
      console.log(`\n⚠️  Some Phase 1 tests failed. Fix before proceeding to Phase 2.`);
    }

  } catch (error) {
    console.error('❌ Phase 1 test suite failed:', error.message);
  }
}

testPhase1Features().catch(console.error);
