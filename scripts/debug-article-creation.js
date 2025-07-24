#!/usr/bin/env node

/**
 * Debug article creation issues
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function debugArticleCreation() {
  console.log('🔍 DEBUGGING ARTICLE CREATION\n');
  
  // First, let's look at the existing article structure
  console.log('1️⃣ Examining existing article structure...');
  try {
    const response = await axios.get(`${BASE_URL}/api/articles`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'id,title,summary,content,project,tags,author,created'
      }
    });
    
    if (response.data.length > 0) {
      const existingArticle = response.data[0];
      console.log('✅ Existing article structure:');
      console.log(JSON.stringify(existingArticle, null, 2));
    }
  } catch (error) {
    console.log(`❌ Failed to get existing articles: ${error.message}`);
  }
  
  // Try minimal article creation
  console.log('\n2️⃣ Testing minimal article creation...');
  try {
    const minimalData = {
      title: 'Minimal Test Article',
      content: 'This is a minimal test article.'
    };
    
    console.log('Attempting creation with:', JSON.stringify(minimalData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/articles`, minimalData, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Minimal creation worked!');
    console.log('Created article:', JSON.stringify(response.data, null, 2));
    
    // Clean up
    await axios.delete(`${BASE_URL}/api/articles/${response.data.id}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    console.log('✅ Cleanup successful');
    
  } catch (error) {
    console.log(`❌ Minimal creation failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
  }
  
  // Try with project but no tags
  console.log('\n3️⃣ Testing with project but no tags...');
  try {
    const projectData = {
      title: 'Project Test Article',
      content: 'This is a test with project association.',
      project: { shortName: 'MYD' }
    };
    
    console.log('Attempting creation with:', JSON.stringify(projectData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/articles`, projectData, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Project creation worked!');
    console.log('Created article:', JSON.stringify(response.data, null, 2));
    
    // Clean up
    await axios.delete(`${BASE_URL}/api/articles/${response.data.id}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    console.log('✅ Cleanup successful');
    
  } catch (error) {
    console.log(`❌ Project creation failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
  }
  
  // Try with tags but no project
  console.log('\n4️⃣ Testing with tags but no project...');
  try {
    const tagsData = {
      title: 'Tags Test Article',
      content: 'This is a test with tags.',
      tags: [{ name: 'test' }]
    };
    
    console.log('Attempting creation with:', JSON.stringify(tagsData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/articles`, tagsData, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Tags creation worked!');
    console.log('Created article:', JSON.stringify(response.data, null, 2));
    
    // Clean up
    await axios.delete(`${BASE_URL}/api/articles/${response.data.id}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    console.log('✅ Cleanup successful');
    
  } catch (error) {
    console.log(`❌ Tags creation failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
  }
  
  // Test what fields are required or cause issues
  console.log('\n5️⃣ Testing different field combinations...');
  const testCombinations = [
    {
      name: 'with summary',
      data: {
        title: 'Summary Test',
        summary: 'Test summary',
        content: 'Test content'
      }
    },
    {
      name: 'with project object different format', 
      data: {
        title: 'Project Format Test',
        content: 'Test content',
        project: { id: 'MYD' }
      }
    }
  ];
  
  for (const test of testCombinations) {
    console.log(`\\n   🧪 Testing ${test.name}...`);
    try {
      const response = await axios.post(`${BASE_URL}/api/articles`, test.data, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   ✅ ${test.name} worked!`);
      
      // Clean up
      await axios.delete(`${BASE_URL}/api/articles/${response.data.id}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      
    } catch (error) {
      console.log(`   ❌ ${test.name} failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
    }
  }
}

debugArticleCreation().catch(console.error);
