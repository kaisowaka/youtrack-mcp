#!/usr/bin/env node

/**
 * STEP 1: YouTrack Agile API Research
 * ===================================
 * 
 * Research the available agile board endpoints in YouTrack
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function exploreAgileAPIs() {
  console.log('🔍 EXPLORING YOUTRACK AGILE APIs\n');
  
  const endpoints = [
    '/agiles',
    '/admin/projects/MYD/agiles', 
    '/agiles/boards',
    '/admin/projects/MYD/boards',
    '/sprints',
    '/admin/projects/MYD/sprints'
  ];

  for (const endpoint of endpoints) {
    console.log(`🧪 Testing: ${endpoint}`);
    
    try {
      const response = await axios.get(`${BASE_URL}/api${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params: {
          fields: 'id,name,projects,columns,sprints',
          $top: 5
        }
      });
      
      console.log(`✅ Success! Found ${Array.isArray(response.data) ? response.data.length : 'data'}`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log(`   Sample: ${JSON.stringify(response.data[0], null, 2)}`);
      } else if (response.data && typeof response.data === 'object') {
        console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
    }
    console.log('');
  }
}

exploreAgileAPIs().catch(console.error);
