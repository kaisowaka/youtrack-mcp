#!/usr/bin/env node

import { YouTrackClient } from '../src/youtrack-client.js';
import { logger } from '../src/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testYTMOperations() {
  try {
    console.log('🧪 Testing YTM Project Operations');
    
    const youtrackUrl = process.env.YOUTRACK_URL;
    const youtrackToken = process.env.YOUTRACK_TOKEN;
    
    if (!youtrackUrl || !youtrackToken) {
      console.log('❌ Missing environment variables');
      process.exit(1);
    }
    
    const client = new YouTrackClient(youtrackUrl, youtrackToken);
    
    // Test 1: Validate YTM project
    console.log('\n1️⃣ Validating YTM project...');
    const validation = await client.validateProject('YTM');
    console.log('✅ Validation result:', validation);
    
    // Test 2: Get custom fields
    console.log('\n2️⃣ Getting YTM custom fields...');
    const customFields = await client.getProjectCustomFields('YTM');
    console.log(`✅ Found ${customFields.length} custom fields`);
    
    const typeField = customFields.find(f => f.field.name.toLowerCase() === 'type');
    const priorityField = customFields.find(f => f.field.name.toLowerCase() === 'priority');
    const stateField = customFields.find(f => f.field.name.toLowerCase() === 'state');
    
    console.log('Available types:', typeField?.bundle?.values?.map(v => v.name));
    console.log('Available priorities:', priorityField?.bundle?.values?.map(v => v.name));
    console.log('Available states:', stateField?.bundle?.values?.map(v => v.name));
    
    // Test 3: Query existing issues
    console.log('\n3️⃣ Querying existing issues...');
    const issuesResult = await client.queryIssues('project: YTM', 'id,summary,state,type,priority');
    console.log('Existing issues:', JSON.stringify(issuesResult, null, 2));
    
    // Test 4: Try creating an issue
    console.log('\n4️⃣ Creating test issue...');
    try {
      const createResult = await client.createIssue({
        projectId: 'YTM',
        summary: 'Test Issue from API Compliance Check',
        description: 'This is a test issue to verify the YouTrack MCP server works correctly.',
        type: 'Task',
        priority: 'Normal'
      });
      console.log('✅ Issue created successfully:', createResult);
    } catch (error) {
      console.log('❌ Issue creation failed:', error.message);
      
      // Let's try a simpler version
      console.log('\n🔄 Trying simpler issue creation...');
      try {
        const simpleResult = await client.createIssue({
          projectId: 'YTM',
          summary: 'Simple Test Issue'
        });
        console.log('✅ Simple issue created:', simpleResult);
      } catch (simpleError) {
        console.log('❌ Simple issue creation also failed:', simpleError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testYTMOperations();
