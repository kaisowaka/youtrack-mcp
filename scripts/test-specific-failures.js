#!/usr/bin/env node

/**
 * Test the three specific failing scenarios
 */

import { YouTrackClient } from '../dist/youtrack-client.js';

async function testSpecificFailures() {
  console.log('🔍 Testing the three specific failing scenarios...\n');
  
  try {
    const client = new YouTrackClient(
      'https://youtrack.devstroop.com',
      'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
    );

    // Get an issue to work with
    const queryResult = await client.queryIssues('project: MYD', 'id,summary,state,priority', 1);
    const issues = JSON.parse(queryResult.content[0].text);
    
    if (issues.length === 0) {
      console.log('❌ No issues found for testing');
      return;
    }

    const testIssue = issues[0];
    console.log('🎯 Using test issue:', testIssue.id, '-', testIssue.summary);
    console.log('📊 Current state:', testIssue.state?.name);
    console.log('📊 Current priority:', testIssue.priority?.name);

    // Test 1: Issue Updates with state/priority changes
    console.log('\n🧪 Test 1: Issue Updates (state/priority changes)...');
    try {
      console.log('Attempting to change state to "In Progress"...');
      const stateUpdateResult = await client.updateIssue(testIssue.id, {
        state: 'In Progress'
      });
      console.log('✅ State update successful');
    } catch (error) {
      console.log('❌ State update failed:', error.message);
      console.log('📋 Full error:', error);
    }

    try {
      console.log('Attempting to change priority to "High"...');
      const priorityUpdateResult = await client.updateIssue(testIssue.id, {
        priority: 'High'
      });
      console.log('✅ Priority update successful');
    } catch (error) {
      console.log('❌ Priority update failed:', error.message);
      console.log('📋 Full error:', error);
    }

    // Test 2: Work Time Logging
    console.log('\n🧪 Test 2: Work Time Logging...');
    try {
      console.log('Attempting to log 2 hours of work...');
      const workResult = await client.logWorkTime({
        issueId: testIssue.id,
        duration: '2h',
        description: 'Testing work time logging functionality'
      });
      console.log('✅ Work time logging successful');
      console.log('📋 Work result:', workResult.content[0].text);
    } catch (error) {
      console.log('❌ Work time logging failed:', error.message);
      console.log('📋 Full error:', error);
    }

    // Test 3: Issue Linking (Epic-to-issue relationships)
    console.log('\n🧪 Test 3: Issue Linking (Epic-to-issue relationships)...');
    
    // First create an epic
    try {
      console.log('Creating an epic for testing...');
      const epicResult = await client.createEpic({
        projectId: 'MYD',
        summary: 'Test Epic for Linking',
        description: 'Epic created to test issue linking'
      });
      
      const epicText = epicResult.content[0].text;
      // Try multiple patterns to extract the epic ID
      let epicId = null;
      const patterns = [
        /Epic created successfully: (\S+)/,
        /Issue created successfully: (\S+)/,
        /created.*?(\d+-\d+)/,
        /"id":"([^"]+)"/
      ];
      
      for (const pattern of patterns) {
        const match = epicText.match(pattern);
        if (match) {
          epicId = match[1].replace(/[",]$/, ''); // Remove trailing quotes or commas
          break;
        }
      }
      
      if (epicId) {
        console.log('✅ Epic created:', epicId);
        
        // Try to link the issue to the epic
        console.log('Attempting to link issue to epic...');
        const linkResult = await client.linkIssueToEpic(testIssue.id, epicId);
        console.log('✅ Issue linking successful');
        console.log('📋 Link result:', linkResult.content[0].text);
      } else {
        console.log('❌ Could not extract epic ID from response');
      }
    } catch (error) {
      console.log('❌ Issue linking failed:', error.message);
      console.log('📋 Full error:', error);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

testSpecificFailures().catch(console.error);
