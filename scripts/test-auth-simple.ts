#!/usr/bin/env tsx

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testAuth() {
  console.log('🔐 Testing YouTrack Authentication');
  console.log('=' .repeat(50));

  const url = process.env.YOUTRACK_URL;
  const token = process.env.YOUTRACK_TOKEN;

  console.log(`📡 URL: ${url}`);
  console.log(`🔑 Token: ${token?.substring(0, 20)}...`);

  try {
    // Test basic API access
    console.log('\n1. Testing basic API access...');
    const response = await axios.get(`${url}/api/admin/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ SUCCESS! Authentication working');
    console.log(`📊 Found ${response.data.length} projects`);
    
    if (response.data.length > 0) {
      console.log('\n📋 Available Projects:');
      response.data.slice(0, 3).forEach((proj: any) => {
        console.log(`   • ${proj.shortName} - ${proj.name}`);
      });
    }

  } catch (error: any) {
    console.log('❌ AUTHENTICATION FAILED!');
    
    if (error.response) {
      console.log(`🔴 Status: ${error.response.status} ${error.response.statusText}`);
      console.log(`📄 Response: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 401) {
        console.log('\n💡 SOLUTIONS:');
        console.log('1. Check if your token is valid and not expired');
        console.log('2. Verify the token has proper permissions');
        console.log('3. Generate a new token from YouTrack > Profile > Account Security > Tokens');
        console.log('4. Make sure the token has "Read Projects" and "Read Articles" permissions');
      }
    } else {
      console.log(`🔴 Network Error: ${error.message}`);
      console.log('\n💡 SOLUTIONS:');
      console.log('1. Check if YOUTRACK_URL is correct');
      console.log('2. Verify network connectivity to YouTrack instance');
    }
  }

  // Test articles endpoint specifically
  try {
    console.log('\n2. Testing Knowledge Base access...');
    const articlesResponse = await axios.get(`${url}/api/articles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'id,summary,author(login)',
        '$top': 5
      }
    });

    console.log('✅ Knowledge Base access working');
    console.log(`📚 Found ${articlesResponse.data.length} articles`);

  } catch (error: any) {
    console.log('❌ Knowledge Base access failed');
    if (error.response?.status === 401) {
      console.log('🔴 Token lacks Knowledge Base permissions');
    }
  }
}

testAuth().catch(console.error);
