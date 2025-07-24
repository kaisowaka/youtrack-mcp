#!/usr/bin/env node

/**
 * Debug response format issue
 */

import { YouTrackClient } from '../dist/youtrack-client.js';

async function debugResponseFormat() {
  console.log('🔍 Debugging response format issue...\n');
  
  try {
    const client = new YouTrackClient(
      'https://youtrack.devstroop.com',
      'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
    );

    console.log('Creating a simple issue...');
    const issueResult = await client.createIssue({
      projectId: 'MYD',
      summary: 'Debug Response Format',
      description: 'Testing response format',
      type: 'Task'
    });
    
    console.log('📋 Raw response content:');
    console.log('Type:', typeof issueResult.content[0].text);
    console.log('Content:', issueResult.content[0].text);
    console.log('First 100 chars:', issueResult.content[0].text.substring(0, 100));

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugResponseFormat().catch(console.error);
