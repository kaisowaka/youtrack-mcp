#!/usr/bin/env node

/**
 * Debug work time logging API
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function debugWorkTime() {
  try {
    // Get an issue first
    const issuesResponse = await axios.get(`${BASE_URL}/api/issues`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      params: {
        query: 'project: MYD',
        fields: 'id,summary',
        $top: 1
      }
    });

    const issues = issuesResponse.data;
    if (issues.length === 0) {
      console.log('No issues found');
      return;
    }

    const issueId = issues[0].id;
    console.log('Using issue:', issueId);

    // Try different work time formats
    const formats = [
      // Format 1: Duration as number (minutes)
      {
        duration: 60, // 1 hour in minutes
        description: 'Test work - format 1',
        date: '2025-07-24'
      },
      // Format 2: Duration object
      {
        duration: { minutes: 60 },
        description: 'Test work - format 2',
        date: '2025-07-24'
      },
      // Format 3: Duration as PT format
      {
        duration: 'PT1H',
        description: 'Test work - format 3',
        date: '2025-07-24'
      },
      // Format 4: Just required fields
      {
        duration: 60,
        description: 'Test work - format 4'
      }
    ];

    for (let i = 0; i < formats.length; i++) {
      console.log(`\n🧪 Testing format ${i + 1}:`, formats[i]);
      try {
        const response = await axios.post(
          `${BASE_URL}/api/issues/${issueId}/timeTracking/workItems`,
          formats[i],
          {
            headers: {
              'Authorization': `Bearer ${TOKEN}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('✅ Success with format', i + 1);
        console.log('Response:', response.data);
        break; // Stop on first success
      } catch (error) {
        console.log(`❌ Format ${i + 1} failed:`, error.response?.status, error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('Debug failed:', error.response?.data || error.message);
  }
}

debugWorkTime().catch(console.error);
