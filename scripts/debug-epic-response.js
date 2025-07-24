#!/usr/bin/env node

/**
 * Debug epic creation response format
 */

import { YouTrackClient } from '../dist/youtrack-client.js';

async function debugEpicCreation() {
  console.log('🔍 Debugging epic creation response format...\n');
  
  try {
    const client = new YouTrackClient(
      'https://youtrack.devstroop.com',
      'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
    );

    console.log('Creating an epic to see the response format...');
    const epicResult = await client.createEpic({
      projectId: 'MYD',
      summary: 'Debug Epic Response Format',
      description: 'Epic created to debug response format'
    });
    
    console.log('✅ Epic creation result:');
    console.log('📋 Full response:', JSON.stringify(epicResult, null, 2));
    console.log('📋 Content text:', epicResult.content[0].text);
    
    // Try different extraction patterns
    const responseText = epicResult.content[0].text;
    console.log('\n🔍 Trying different ID extraction patterns...');
    
    const patterns = [
      /Issue created successfully: (\S+)/,
      /Epic created successfully: (\S+)/,
      /created.*?(\d+-\d+)/,
      /"id":"([^"]+)"/,
      /id.*?(\d+-\d+)/
    ];
    
    patterns.forEach((pattern, index) => {
      const match = responseText.match(pattern);
      console.log(`Pattern ${index + 1}: ${pattern} => ${match ? match[1] : 'No match'}`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugEpicCreation().catch(console.error);
