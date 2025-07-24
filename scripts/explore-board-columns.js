#!/usr/bin/env node

/**
 * Explore Agile Board Columns and Issue Management
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function exploreAgileBoardColumns() {
  console.log('🔍 EXPLORING AGILE BOARD COLUMNS AND ISSUE MANAGEMENT\n');
  
  const boardId = '181-2'; // MyDR24 Board
  
  // Get board with full column details
  console.log('1️⃣ Getting board columns...');
  try {
    const response = await axios.get(`${BASE_URL}/api/agiles/${boardId}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'id,name,columns(id,presentation,fieldValues(name,presentation),ordinal),swimlanes(id,name),currentSprint(id,name,issues(id,summary,state))'
      }
    });
    
    console.log(`✅ Board: ${response.data.name}`);
    console.log(`📊 Columns: ${response.data.columns?.length || 0}`);
    
    if (response.data.columns) {
      response.data.columns.forEach((column, index) => {
        console.log(`\n🏛️ Column ${index + 1}: ${column.presentation}`);
        console.log(`   ID: ${column.id}`);
        console.log(`   Ordinal: ${column.ordinal}`);
        if (column.fieldValues) {
          console.log(`   Field Values: ${column.fieldValues.map(fv => fv.presentation).join(', ')}`);
        }
      });
    }
    
    if (response.data.currentSprint) {
      console.log(`\n🏃 Current Sprint: ${response.data.currentSprint.name}`);
      console.log(`   Issues: ${response.data.currentSprint.issues?.length || 0}`);
    }
    
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
  }
  
  // Test sprint operations
  console.log(`\n2️⃣ Testing sprint operations...`);
  const sprintEndpoints = [
    `/agiles/${boardId}/sprints`,
    `/sprints/184-2`, // The sprint ID we found
    `/admin/agiles/${boardId}`,
  ];
  
  for (const endpoint of sprintEndpoints) {
    console.log(`\n🧪 Testing: ${endpoint}`);
    try {
      const testResponse = await axios.get(`${BASE_URL}/api${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        },
        params: {
          fields: 'id,name,start,finish,goal,issues(id,summary,state),archived,isDefault'
        }
      });
      
      console.log(`✅ Success!`);
      if (Array.isArray(testResponse.data)) {
        console.log(`   Found ${testResponse.data.length} items`);
      } else {
        console.log(`   Sprint: ${testResponse.data.name || 'N/A'}`);
        console.log(`   Issues: ${testResponse.data.issues?.length || 0}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status} - ${error.message}`);
    }
  }
  
  // Test issue assignment to sprint
  console.log(`\n3️⃣ Testing issue assignment...`);
  try {
    // First get an issue from our project
    const issuesResponse = await axios.get(`${BASE_URL}/api/issues`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
      params: {
        query: 'project: MYD',
        fields: 'id,summary,state',
        $top: 1
      }
    });
    
    if (issuesResponse.data.length > 0) {
      const testIssue = issuesResponse.data[0];
      console.log(`🎯 Found test issue: ${testIssue.id} - ${testIssue.summary}`);
      
      // Try to add it to sprint (this might fail - we're just testing endpoints)
      const addToSprintEndpoints = [
        `/issues/${testIssue.id}/sprints`,
        `/sprints/184-2/issues`,
        `/agiles/${boardId}/sprints/184-2/issues`
      ];
      
      for (const endpoint of addToSprintEndpoints) {
        console.log(`\n   🧪 Testing add to sprint: ${endpoint}`);
        // We won't actually POST, just see if the endpoint exists by checking OPTIONS
        try {
          await axios.options(`${BASE_URL}/api${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${TOKEN}`
            }
          });
          console.log(`   ✅ Endpoint exists (allows OPTIONS)`);
        } catch (error) {
          console.log(`   ❌ Endpoint check failed: ${error.response?.status}`);
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ Issue test failed: ${error.message}`);
  }
}

exploreAgileBoardColumns().catch(console.error);
