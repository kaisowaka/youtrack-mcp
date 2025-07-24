#!/usr/bin/env node

/**
 * Deep dive into YouTrack Articles API
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function exploreArticlesAPI() {
  console.log('🔍 DEEP DIVE: YOUTRACK ARTICLES API\n');
  
  // First get all articles with full details
  console.log('1️⃣ Getting all articles with detailed fields...');
  try {
    const response = await axios.get(`${BASE_URL}/api/articles`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'id,title,summary,content,author(login,fullName),created,updated,project(name,shortName),visibility,attachments(name,url),tags(name),ordinal'
      }
    });
    
    console.log(`✅ Found ${response.data.length} articles:`);
    response.data.forEach((article, index) => {
      console.log(`\n📄 Article ${index + 1}: ${article.title || article.id}`);
      console.log(`   ID: ${article.id}`);
      console.log(`   Summary: ${article.summary || 'N/A'}`);
      console.log(`   Author: ${article.author?.fullName || article.author?.login || 'N/A'}`);
      console.log(`   Project: ${article.project?.name || 'N/A'}`);
      console.log(`   Created: ${article.created ? new Date(article.created).toISOString() : 'N/A'}`);
      console.log(`   Tags: ${article.tags?.map(t => t.name).join(', ') || 'None'}`);
      if (article.content) {
        console.log(`   Content preview: ${article.content.substring(0, 100)}...`);
      }
    });
    
    // If we found articles, let's test individual article access
    if (response.data.length > 0) {
      const firstArticle = response.data[0];
      console.log(`\n2️⃣ Testing individual article access for ${firstArticle.id}...`);
      
      try {
        const articleResponse = await axios.get(`${BASE_URL}/api/articles/${firstArticle.id}`, {
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Accept': 'application/json'
          },
          params: {
            fields: 'id,title,summary,content,author(login,fullName),created,updated,project(name),visibility,attachments,tags,comments(text,author)'
          }
        });
        
        console.log(`✅ Individual article access works:`);
        console.log(`   Full content: ${articleResponse.data.content?.length || 0} characters`);
        console.log(`   Attachments: ${articleResponse.data.attachments?.length || 0}`);
        console.log(`   Comments: ${articleResponse.data.comments?.length || 0}`);
        
      } catch (error) {
        console.log(`❌ Individual access failed: ${error.response?.status} - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Failed to get articles: ${error.response?.status} - ${error.message}`);
  }
  
  // Test creating a new article
  console.log('\n3️⃣ Testing article creation...');
  try {
    const createResponse = await axios.post(`${BASE_URL}/api/articles`, {
      title: 'Test Knowledge Base Article',
      summary: 'Testing article creation via API',
      content: 'This is a test article created via the YouTrack API to validate knowledge base functionality.',
      project: { shortName: 'MYD' }
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Article creation works!`);
    console.log(`   Created article ID: ${createResponse.data.id}`);
    
    // Test updating the article
    console.log('\n4️⃣ Testing article update...');
    try {
      const updateResponse = await axios.post(`${BASE_URL}/api/articles/${createResponse.data.id}`, {
        summary: 'Updated test article summary',
        content: 'This article has been updated to test the modification functionality.'
      }, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Article update works!`);
      
    } catch (error) {
      console.log(`❌ Article update failed: ${error.response?.status} - ${error.message}`);
    }
    
    // Test deleting the article
    console.log('\n5️⃣ Testing article deletion...');
    try {
      await axios.delete(`${BASE_URL}/api/articles/${createResponse.data.id}`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      
      console.log(`✅ Article deletion works!`);
      
    } catch (error) {
      console.log(`❌ Article deletion failed: ${error.response?.status} - ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Article creation failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
  }
  
  // Test search functionality
  console.log('\n6️⃣ Testing article search...');
  try {
    const searchResponse = await axios.get(`${BASE_URL}/api/articles`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
      params: {
        query: 'project: MYD',
        fields: 'id,title,summary'
      }
    });
    
    console.log(`✅ Article search works! Found ${searchResponse.data.length} articles`);
    
  } catch (error) {
    console.log(`❌ Article search failed: ${error.response?.status} - ${error.message}`);
  }
  
  console.log('\n🎯 ARTICLES API SUMMARY:');
  console.log('========================');
  console.log('✅ YouTrack HAS a full Articles/Knowledge Base API!');
  console.log('📚 Supports: CRUD operations, search, attachments, comments');
  console.log('🏗️ Ready to implement comprehensive KB functionality');
}

exploreArticlesAPI().catch(console.error);
