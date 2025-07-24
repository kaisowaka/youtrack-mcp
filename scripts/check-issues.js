#!/usr/bin/env node

/**
 * Check what issues exist now
 */

import { YouTrackClient } from '../dist/youtrack-client.js';

async function checkIssues() {
  console.log('🔍 Checking existing issues...');
  
  try {
    const client = new YouTrackClient(
      'https://youtrack.devstroop.com',
      'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
    );

    // Check issues directly
    const response = await client.api.get('/issues', {
      params: {
        query: 'project: MYD',
        fields: 'id,summary,project(shortName)',
        limit: 10
      }
    });

    console.log('Raw API response:', JSON.stringify(response.data, null, 2));
    console.log('Number of issues:', response.data.length);

  } catch (error) {
    console.error('❌ Failed to check issues:', error.message);
  }
}

checkIssues().catch(console.error);
