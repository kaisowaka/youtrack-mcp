#!/usr/bin/env node

/**
 * Deep dive into YouTrack Agiles API
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function exploreAgilesDeep() {
  console.log('🔍 DEEP DIVE: YOUTRACK AGILES API\n');
  
  // First get all agiles with full details
  console.log('1️⃣ Getting all agile boards...');
  try {
    const response = await axios.get(`${BASE_URL}/api/agiles`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'id,name,projects(id,name,shortName),sprints(id,name,start,finish,isDefault,archived),columns(id,presentation),currentSprint(id,name),orphansAtTheTop'
      }
    });
    
    console.log(`✅ Found ${response.data.length} agile boards:`);
    response.data.forEach((agile, index) => {
      console.log(`\n📋 Board ${index + 1}: ${agile.name} (${agile.id})`);
      console.log(`   Projects: ${agile.projects?.map(p => `${p.name} (${p.shortName})`).join(', ') || 'None'}`);
      console.log(`   Sprints: ${agile.sprints?.length || 0}`);
      console.log(`   Columns: ${agile.columns?.length || 0}`);
      if (agile.currentSprint) {
        console.log(`   Current Sprint: ${agile.currentSprint.name}`);
      }
    });
    
    // Let's explore the first board in detail
    if (response.data.length > 0) {
      const firstBoard = response.data[0];
      console.log(`\n2️⃣ Exploring board "${firstBoard.name}" (${firstBoard.id}) in detail...`);
      
      // Test sprint endpoints for this board
      const sprintEndpoints = [
        `/agiles/${firstBoard.id}/sprints`,
        `/agiles/${firstBoard.id}`,
        `/agiles/${firstBoard.id}/issues`
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
              fields: 'id,name,start,finish,issues,archived,isDefault,goal,board',
              $top: 3
            }
          });
          
          console.log(`✅ Success! Type: ${Array.isArray(testResponse.data) ? 'Array' : 'Object'}`);
          if (Array.isArray(testResponse.data)) {
            console.log(`   Count: ${testResponse.data.length}`);
            if (testResponse.data.length > 0) {
              console.log(`   Sample: ${JSON.stringify(testResponse.data[0], null, 2)}`);
            }
          } else {
            console.log(`   Data: ${JSON.stringify(testResponse.data, null, 2)}`);
          }
        } catch (error) {
          console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ Failed to get agiles: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
  }
}

exploreAgilesDeep().catch(console.error);
