#!/usr/bin/env node

/**
 * Test articles API capabilities
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function testArticlesAPI() {
  console.log('🔍 TESTING ARTICLES API CAPABILITIES\n');
  
  try {
    // Test different query approaches
    console.log('1️⃣ Testing simple query parameter...');
    try {
      const response1 = await axios.get(`${BASE_URL}/api/articles`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        },
        params: {
          query: 'tag: test'
        }
      });
      console.log('✅ Query parameter works:', response1.data.length, 'articles');
    } catch (error) {
      console.log(`❌ Query parameter failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
    }
    
    console.log('\n2️⃣ Testing search endpoint...');
    try {
      const response2 = await axios.get(`${BASE_URL}/api/articles/search`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        },
        params: {
          query: 'test'
        }
      });
      console.log('✅ Search endpoint works:', response2.data);
    } catch (error) {
      console.log(`❌ Search endpoint failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
    }
    
    console.log('\n3️⃣ Testing basic articles endpoint with fields...');
    const response3 = await axios.get(`${BASE_URL}/api/articles`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'id,summary,content,project(name,shortName),tags(name),author,created'
      }
    });
    
    console.log('✅ Basic endpoint works with fields');
    console.log('Found articles:', response3.data.length);
    
    if (response3.data.length > 0) {
      console.log('First article structure:');
      console.log(JSON.stringify(response3.data[0], null, 2));
    }
    
  } catch (error) {
    console.log(`❌ General error: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
    if (error.response?.data) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testArticlesAPI().catch(console.error);
