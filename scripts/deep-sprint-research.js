#!/usr/bin/env node

/**
 * Deep research into YouTrack sprint assignment
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function deepSprintResearch() {
  console.log('🔍 DEEP RESEARCH: YOUTRACK SPRINT ASSIGNMENT\n');
  
  const issueId = '3-107';
  const sprintId = '184-2';
  const boardId = '181-2';
  
  // Check if the sprint has any existing issues for reference
  console.log('1️⃣ Checking existing sprint issues for patterns...');
  try {
    const response = await axios.get(`${BASE_URL}/api/agiles/${boardId}/sprints/${sprintId}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'id,name,issues(id,summary,customFields(name,value))'
      }
    });
    
    console.log(`✅ Sprint: ${response.data.name}`);
    console.log(`📊 Current issues: ${response.data.issues?.length || 0}`);
    
    if (response.data.issues?.length > 0) {
      const issue = response.data.issues[0];
      console.log(`🔍 Sample issue fields: ${issue.customFields?.map(f => f.name).join(', ')}`);
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status} - ${error.message}`);
  }
  
  // Try different agile endpoints
  console.log('\n2️⃣ Testing agile-specific endpoints...');
  const agileEndpoints = [
    `/agiles/${boardId}/sprints/${sprintId}/issues/${issueId}`,
    `/agiles/${boardId}/issues/${issueId}`,
    `/agiles/${boardId}/board/issues/${issueId}`
  ];
  
  for (const endpoint of agileEndpoints) {
    console.log(`\n   🧪 Testing: ${endpoint}`);
    
    // Try GET first to see if endpoint exists
    try {
      await axios.get(`${BASE_URL}/api${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        }
      });
      console.log(`   ✅ GET works on ${endpoint}`);
    } catch (error) {
      console.log(`   ❌ GET failed: ${error.response?.status}`);
    }
    
    // Try PUT
    try {
      await axios.put(`${BASE_URL}/api${endpoint}`, {}, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`   ✅ PUT works on ${endpoint}`);
    } catch (error) {
      console.log(`   ❌ PUT failed: ${error.response?.status}`);
    }
  }
  
  // Research if there are commands or other methods
  console.log('\n3️⃣ Testing command-based approach...');
  try {
    const commandResponse = await axios.post(`${BASE_URL}/api/issues/${issueId}`, 
      {
        customFields: [
          {
            '$type': 'SingleBuildIssueCustomField',
            name: 'Sprint',
            value: { 
              '$type': 'Build',
              id: sprintId 
            }
          }
        ]
      }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Command approach worked!');
  } catch (error) {
    console.log(`❌ Command approach failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
  }
  
  // Check if there are batch update APIs
  console.log('\n4️⃣ Testing batch/bulk operations...');
  try {
    const bulkResponse = await axios.post(`${BASE_URL}/api/issues`, 
      {
        query: `issue id: ${issueId}`,
        customFields: [
          {
            name: 'Sprint',
            value: { id: sprintId }
          }
        ]
      }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Bulk update worked!');
  } catch (error) {
    console.log(`❌ Bulk update failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
  }
  
  // Final attempt: Check if there's a specific agile API for assignment
  console.log('\n5️⃣ Final attempt: Agile board assignment...');
  try {
    const agileResponse = await axios.post(`${BASE_URL}/api/agiles/${boardId}`, 
      {
        commands: [`Sprint ${sprintId}`],
        issues: [{ id: issueId }]
      }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Agile board assignment worked!');
  } catch (error) {
    console.log(`❌ Agile board assignment failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
  }
}

deepSprintResearch().catch(console.error);
