#!/usr/bin/env node

/**
 * STEP 1: YouTrack Knowledge Base API Research
 * ============================================
 * 
 * Research the available knowledge base endpoints in YouTrack
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function exploreKnowledgeBaseAPIs() {
  console.log('🔍 EXPLORING YOUTRACK KNOWLEDGE BASE APIs\n');
  
  const endpoints = [
    // Core Knowledge Base endpoints
    '/knowledgeBase',
    '/knowledgeBase/articles',
    '/knowledgeBase/categories',
    '/knowledgeBase/spaces',
    
    // Project-specific knowledge base
    '/admin/projects/MYD/knowledgeBase',
    '/projects/MYD/knowledgeBase',
    '/projects/MYD/articles',
    
    // Alternative API paths
    '/help',
    '/help/articles',
    '/wiki',
    '/wiki/articles',
    '/documentation',
    '/docs',
    
    // Search and discovery
    '/knowledgeBase/search',
    '/articles/search'
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
          fields: 'id,title,content,summary,category,tags,created,updated',
          $top: 3
        }
      });
      
      console.log(`✅ Success! Found ${Array.isArray(response.data) ? response.data.length : 'data'}`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log(`   Sample: ${JSON.stringify(response.data[0], null, 2)}`);
      } else if (response.data && typeof response.data === 'object') {
        console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
      }
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.error_description || error.message;
      console.log(`❌ Failed: ${status} - ${message}`);
    }
    console.log('');
  }
  
  // Also check if there are any help or documentation related endpoints
  console.log('🔍 Checking alternative documentation endpoints...');
  
  const altEndpoints = [
    '/helpdesk',
    '/helpdesk/articles', 
    '/support',
    '/support/articles',
    '/admin/help',
    '/admin/documentation'
  ];
  
  for (const endpoint of altEndpoints) {
    console.log(`🧪 Testing alternative: ${endpoint}`);
    
    try {
      const response = await axios.get(`${BASE_URL}/api${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        },
        params: { $top: 1 }
      });
      
      console.log(`✅ Alternative found!`);
      console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.log(`❌ Not available: ${error.response?.status}`);
    }
  }
}

exploreKnowledgeBaseAPIs().catch(console.error);
