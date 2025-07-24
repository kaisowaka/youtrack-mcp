#!/usr/bin/env node

/**
 * Test corrected article creation
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function testCorrectedCreation() {
  console.log('🔧 TESTING CORRECTED ARTICLE CREATION\n');
  
  // First, get the actual project ID
  console.log('1️⃣ Getting project ID...');
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/projects/MYD`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Project ID:', response.data.id);
    const projectId = response.data.id;
    
    // Test corrected creation with required fields
    console.log('\n2️⃣ Testing corrected creation...');
    const articleData = {
      summary: 'Phase 3 Test Article', // summary is required, not title
      content: 'This is a test article created during Phase 3 testing.',
      project: { id: projectId } // project with ID is required
    };
    
    console.log('Creating with:', JSON.stringify(articleData, null, 2));
    
    const createResponse = await axios.post(`${BASE_URL}/api/articles`, articleData, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Article created successfully!');
    console.log('Created:', JSON.stringify(createResponse.data, null, 2));
    
    const articleId = createResponse.data.id;
    
    // Test getting the article
    console.log('\n3️⃣ Testing article retrieval...');
    const getResponse = await axios.get(`${BASE_URL}/api/articles/${articleId}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Article retrieved successfully!');
    console.log('Retrieved:', JSON.stringify(getResponse.data, null, 2));
    
    // Test updating the article
    console.log('\n4️⃣ Testing article update...');
    const updateData = {
      summary: 'Updated Phase 3 Test Article',
      content: 'This content has been updated during testing.'
    };
    
    const updateResponse = await axios.post(`${BASE_URL}/api/articles/${articleId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Article updated successfully!');
    
    // Clean up
    console.log('\n5️⃣ Cleaning up...');
    await axios.delete(`${BASE_URL}/api/articles/${articleId}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    console.log('✅ Article deleted successfully!');
    
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
    if (error.response?.data) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCorrectedCreation().catch(console.error);
