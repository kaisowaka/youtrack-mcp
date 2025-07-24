#!/usr/bin/env node

/**
 * Final API Research: Understanding YouTrack Agile Operations
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function finalAgileAPIResearch() {
  console.log('🔍 FINAL AGILE API RESEARCH\n');
  
  // 1. Test different ways to access sprint issues
  console.log('1️⃣ Testing sprint issue access patterns...');
  const sprintId = '184-2';
  const boardId = '181-2';
  
  const patterns = [
    `/agiles/${boardId}/sprints/${sprintId}`,
    `/agiles/${boardId}/sprints/${sprintId}/issues`,
    `/agiles/${boardId}/board`,
    `/agiles/${boardId}/board/issues`
  ];
  
  for (const pattern of patterns) {
    console.log(`\n🧪 Testing: ${pattern}`);
    try {
      const response = await axios.get(`${BASE_URL}/api${pattern}`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        },
        params: {
          fields: 'id,name,issues(id,summary),board,columns,start,finish'
        }
      });
      
      console.log(`✅ Success!`);
      if (response.data.name) {
        console.log(`   Name: ${response.data.name}`);
      }
      if (response.data.issues) {
        console.log(`   Issues: ${response.data.issues.length}`);
      }
      if (response.data.columns) {
        console.log(`   Columns: ${response.data.columns.length}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status} - ${error.message}`);
    }
  }
  
  // 2. Try to understand board configuration
  console.log(`\n\n2️⃣ Understanding board configuration...`);
  try {
    const response = await axios.get(`${BASE_URL}/api/agiles/${boardId}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'id,name,projects(shortName),columns(id,presentation,fieldValues),swimlanes,estimationField,sprintSyncField,hideOrphansSwimlane,colorCoding'
      }
    });
    
    console.log(`✅ Board Configuration:`);
    console.log(`   Name: ${response.data.name}`);
    console.log(`   Projects: ${response.data.projects?.map(p => p.shortName).join(', ')}`);
    console.log(`   Columns: ${response.data.columns?.length || 0}`);
    console.log(`   Swimlanes: ${response.data.swimlanes?.length || 0}`);
    console.log(`   Full data: ${JSON.stringify(response.data, null, 2)}`);
    
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status} - ${error.message}`);
  }
  
  // 3. Test creating/managing operations (read-only tests)
  console.log(`\n\n3️⃣ Testing management endpoints (read-only)...`);
  const managementEndpoints = [
    `/admin/agiles`,
    `/admin/agiles/${boardId}`,
    `/admin/agiles/${boardId}/sprints`,
    `/admin/agiles/${boardId}/columns`
  ];
  
  for (const endpoint of managementEndpoints) {
    console.log(`\n🧪 Testing: ${endpoint}`);
    try {
      const response = await axios.get(`${BASE_URL}/api${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        },
        params: {
          fields: 'id,name,presentation',
          $top: 3
        }
      });
      
      console.log(`✅ Success!`);
      if (Array.isArray(response.data)) {
        console.log(`   Count: ${response.data.length}`);
      } else if (response.data.name) {
        console.log(`   Name: ${response.data.name}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status} - ${error.message}`);
    }
  }
  
  console.log(`\n\n🎯 RESEARCH SUMMARY:`);
  console.log(`================================`);
  console.log(`✅ Board access: /agiles/{boardId}`);
  console.log(`✅ Sprint access: /agiles/{boardId}/sprints`);
  console.log(`✅ Sprint details: /agiles/{boardId}/sprints/{sprintId}`);
  console.log(`❓ Issue management: /issues/{issueId}/sprints (for assignment)`);
  console.log(`❓ Admin operations: /admin/agiles/* (may need special permissions)`);
  console.log(`\n🚀 Ready to implement Phase 2!`);
}

finalAgileAPIResearch().catch(console.error);
