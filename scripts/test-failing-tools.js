#!/usr/bin/env node

/**
 * Quick test of failing MCP tools
 */

import { YouTrackClient } from '../dist/youtrack-client.js';

async function testFailingTools() {
  console.log('🧪 Testing specific failing tools...');
  
  try {
    const client = new YouTrackClient(
      'https://youtrack.devstroop.com',
      'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
    );

    console.log('✅ Client created successfully');

    // Test 1: create_issue
    console.log('\n🧪 Testing create_issue...');
    try {
      const issueResult = await client.createIssue({
        projectId: 'MYD',
        summary: 'Test Issue from Direct Client',
        description: 'Testing direct client call',
        type: 'Bug'
      });
      // Extract issue ID from MCP response
      const responseText = issueResult.content[0].text;
      const issueId = responseText.match(/Issue created successfully: (\S+)/)?.[1];
      console.log('✅ create_issue works:', issueId);
    } catch (error) {
      console.log('❌ create_issue failed:', error.message);
    }

    // Test 2: create_epic
    console.log('\n🧪 Testing create_epic...');
    try {
      const epicResult = await client.createEpic({
        projectId: 'MYD', 
        summary: 'Test Epic from Direct Client',
        description: 'Testing direct epic creation'
      });
      // Extract epic data from MCP response
      console.log('✅ create_epic works:', epicResult.content[0].text.includes('success'));
    } catch (error) {
      console.log('❌ create_epic failed:', error.message);
    }

    // Test 3: update_issue (get an issue first)
    console.log('\n🧪 Testing update_issue...');
    try {
      const queryResult = await client.queryIssues('project: MYD', 'id,summary', 1);
      const issues = JSON.parse(queryResult.content[0].text);
      
      if (issues.length > 0) {
        const updateResult = await client.updateIssue(issues[0].id, {
          summary: 'Updated via Direct Client Test'
        });
        console.log('✅ update_issue works');
      } else {
        console.log('⚠️ No issues available for update test');
      }
    } catch (error) {
      console.log('❌ update_issue failed:', error.message);
    }

    // Test 4: log_work_time
    console.log('\n🧪 Testing log_work_time...');
    try {
      const queryResult = await client.queryIssues('project: MYD', 'id,summary', 1);
      const issues = JSON.parse(queryResult.content[0].text);
      
      if (issues.length > 0) {
        const workResult = await client.logWorkTime({
          issueId: issues[0].id,
          duration: '1h',
          description: 'Direct client test work'
        });
        console.log('✅ log_work_time works');
      } else {
        console.log('⚠️ No issues available for work time test');
      }
    } catch (error) {
      console.log('❌ log_work_time failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Client initialization failed:', error.message);
  }
}

testFailingTools().catch(console.error);
