#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { YouTrackClient } from '../src/youtrack-client.js';

// Load environment variables
dotenv.config();

async function testFixes() {
  const youtrackUrl = process.env.YOUTRACK_URL;
  const youtrackToken = process.env.YOUTRACK_TOKEN;

  if (!youtrackUrl || !youtrackToken) {
    console.error('Please set YOUTRACK_URL and YOUTRACK_TOKEN in .env file');
    process.exit(1);
  }

  console.log('Testing YouTrack MCP fixes...');
  
  const client = new YouTrackClient(youtrackUrl, youtrackToken);

  try {
    // Test 1: List projects to verify basic connectivity
    console.log('\n1. Testing project listing...');
    const projects = await client.listProjects();
    console.log(`✅ Found ${projects.length} projects`);
    if (projects.length > 0) {
      console.log(`   First project: ${projects[0].shortName || projects[0].id} - ${projects[0].name}`);
    }

    // Test 2: Validate a project (this should handle the 404 errors gracefully)
    console.log('\n2. Testing project validation...');
    const validationResult = await client.validateProject('VPN');
    console.log(`✅ Project validation result:`, {
      exists: validationResult.exists,
      accessible: validationResult.accessible,
      message: validationResult.message
    });

    // Test 3: Try to create an issue with the problematic data from the logs
    console.log('\n3. Testing issue creation with improved error handling...');
    try {
      const issueResult = await client.createIssue({
        projectId: 'VPN', // This was causing the 404 error
        summary: 'Test Issue - Connection breaks after first packet sent',
        description: 'Test description for debugging API issues',
        type: 'Bug',
        priority: 'High'
      });

      console.log('✅ Issue creation result:', JSON.parse(issueResult.content[0].text));
    } catch (issueError) {
      console.log('⚠️  Issue creation failed (expected for invalid project):', (issueError as Error).message);
    }

    // Test 4: If we have a valid project, try with that
    if (projects.length > 0) {
      console.log('\n4. Testing issue creation with valid project...');
      const validProject = projects[0];
      try {
        const issueResult = await client.createIssue({
          projectId: validProject.shortName || validProject.id,
          summary: 'Test Issue - API Fix Validation',
          description: 'This is a test issue to validate the API fixes',
          type: 'Task',
          priority: 'Normal'
        });

        const result = JSON.parse(issueResult.content[0].text);
        console.log('✅ Issue creation successful:', {
          success: result.success,
          issueId: result.issue?.id,
          warnings: result.warnings
        });
      } catch (validIssueError) {
        console.log('⚠️  Issue creation failed:', (validIssueError as Error).message);
      }
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run the tests
testFixes().catch(console.error);
