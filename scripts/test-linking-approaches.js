#!/usr/bin/env node

/**
 * Test different YouTrack linking approaches
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function testLinkingApproaches() {
  console.log('🔍 Testing different YouTrack linking approaches...\n');
  
  const issueId = '3-93';
  const epicId = '3-94';
  
  const approaches = [
    {
      name: 'POST /issues/{id}/links',
      method: 'POST',
      url: `/api/issues/${issueId}/links`,
      data: {
        linkType: { name: 'subtask of' },
        issues: [{ id: epicId }]
      }
    },
    {
      name: 'PUT /issues/{id}/links',
      method: 'PUT', 
      url: `/api/issues/${issueId}/links`,
      data: {
        linkType: { name: 'subtask of' },
        issues: [{ id: epicId }]
      }
    },
    {
      name: 'POST /issueLinks',
      method: 'POST',
      url: '/api/issueLinks',
      data: {
        linkType: { name: 'subtask of' },
        source: { id: issueId },
        target: { id: epicId }
      }
    },
    {
      name: 'Update issue with parent link',
      method: 'POST',
      url: `/api/issues/${issueId}`,
      data: {
        parent: { id: epicId }
      }
    },
    {
      name: 'Update issue with customFields',
      method: 'POST',
      url: `/api/issues/${issueId}`,
      data: {
        customFields: [
          {
            name: 'Parent for',
            value: { id: epicId }
          }
        ]
      }
    }
  ];

  for (const approach of approaches) {
    console.log(`🧪 Testing: ${approach.name}`);
    try {
      const response = await axios({
        method: approach.method,
        url: `${BASE_URL}${approach.url}`,
        data: approach.data,
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ ${approach.name} - SUCCESS`);
      console.log(`📋 Response:`, response.status, response.data);
      break; // Stop on first success
    } catch (error) {
      console.log(`❌ ${approach.name} - FAILED:`, error.response?.status, error.response?.data?.error_description || error.message);
    }
    console.log('');
  }
}

testLinkingApproaches().catch(console.error);
