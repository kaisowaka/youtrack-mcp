#!/usr/bin/env node

/**
 * Test different author query syntaxes
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function testAuthorQuerySyntax() {
  console.log('🔍 Testing different author query syntaxes...\n');
  
  const authorQueries = [
    'author: akash',
    'work author: akash', 
    'workauthor: akash',
    'author.login: akash',
    'author: "akash"',
    'work author: "akash"',
    'author: {akash}',
    'work item author: akash'
  ];

  for (let i = 0; i < authorQueries.length; i++) {
    console.log(`🧪 Testing: "${authorQueries[i]}"`);
    
    try {
      const response = await axios.get(`${BASE_URL}/api/workItems`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params: {
          query: `${authorQueries[i]} created: 2025-07-24 .. 2025-07-24`,
          fields: 'id,author(login)',
          $top: 5
        }
      });
      
      console.log(`✅ Success! Found ${response.data.length} work items`);
      if (response.data.length > 0) {
        console.log(`   Authors: ${response.data.map(item => item.author?.login).join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
    }
    console.log('');
  }
}

testAuthorQuerySyntax().catch(console.error);
