#!/usr/bin/env node

/**
 * Debug work time logging with correct YouTrack format
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function debugWorkTimeCorrect() {
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

    // Try YouTrack's expected format
    const formats = [
      // Format 1: DurationValue object with presentation
      {
        duration: {
          presentation: '1h',
          minutes: 60
        },
        description: 'Test work - correct format 1',
        date: Date.now() // Current timestamp
      },
      // Format 2: Just presentation string in duration
      {
        duration: {
          presentation: '1h'
        },
        description: 'Test work - correct format 2',
        date: Date.now()
      },
      // Format 3: Minimal format without date
      {
        duration: {
          presentation: '1h'
        },
        description: 'Test work - correct format 3'
      },
      // Format 4: Check if we need to specify the type
      {
        duration: {
          $type: 'DurationValue',
          presentation: '1h',
          minutes: 60
        },
        description: 'Test work - with type',
        date: Date.now()
      }
    ];

    for (let i = 0; i < formats.length; i++) {
      console.log(`\n🧪 Testing format ${i + 1}:`, JSON.stringify(formats[i], null, 2));
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

debugWorkTimeCorrect().catch(console.error);
