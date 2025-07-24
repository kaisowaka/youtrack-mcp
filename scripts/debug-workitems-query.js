#!/usr/bin/env node

/**
 * Debug work items query syntax
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function debugWorkItemsQuery() {
  console.log('🔍 Testing different work items query formats...\n');
  
  const queries = [
    'created: 2025-07-01 .. 2025-07-31',
    'project: MYD created: 2025-07-01 .. 2025-07-31',
    'work author: admin',
    'author: admin created: 2025-07-01 .. 2025-07-31'
  ];

  for (let i = 0; i < queries.length; i++) {
    console.log(`🧪 Testing query ${i + 1}: "${queries[i]}"`);
    
    try {
      const response = await axios.get(`${BASE_URL}/api/workItems`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params: {
          query: queries[i],
          fields: 'id,issue(id,summary),author(login,fullName),date,duration(minutes,presentation),description',
          $top: 10
        }
      });
      
      console.log(`✅ Success! Found ${response.data.length} work items`);
      if (response.data.length > 0) {
        console.log(`   Sample: ${response.data[0].id} by ${response.data[0].author?.login || 'Unknown'}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
    }
    console.log('');
  }
}

debugWorkItemsQuery().catch(console.error);
