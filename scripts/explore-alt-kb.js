#!/usr/bin/env node

/**
 * Alternative Knowledge Base Research
 * ==================================
 * 
 * Since YouTrack doesn't seem to have dedicated KB APIs,
 * let's explore if we can use issues as knowledge articles
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function exploreAlternativeKB() {
  console.log('🔍 EXPLORING ALTERNATIVE KNOWLEDGE BASE APPROACHES\n');
  
  // Check if we can use issues with specific types as knowledge articles
  console.log('1️⃣ Checking if we can use Issues as Knowledge Articles...');
  
  try {
    // Look for issues that might be documentation/articles
    const docQueries = [
      'type: Documentation',
      'type: Article', 
      'type: Knowledge',
      'type: Wiki',
      'tag: documentation',
      'tag: knowledge',
      'tag: article',
      'tag: wiki',
      'summary: documentation',
      'summary: guide',
      'summary: how-to'
    ];
    
    for (const query of docQueries) {
      console.log(`\n   🧪 Testing query: "${query}"`);
      try {
        const response = await axios.get(`${BASE_URL}/api/issues`, {
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Accept': 'application/json'
          },
          params: {
            query: `project: MYD ${query}`,
            fields: 'id,summary,description,type(name),tags(name)',
            $top: 3
          }
        });
        
        if (response.data && response.data.length > 0) {
          console.log(`   ✅ Found ${response.data.length} potential knowledge articles`);
          response.data.forEach(issue => {
            console.log(`      - ${issue.id}: ${issue.summary}`);
            console.log(`        Type: ${issue.type?.name || 'N/A'}`);
            console.log(`        Tags: ${issue.tags?.map(t => t.name).join(', ') || 'None'}`);
          });
        } else {
          console.log(`   ❌ No results for "${query}"`);
        }
      } catch (error) {
        console.log(`   ❌ Query failed: ${error.response?.status} - ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Failed to explore issue-based KB: ${error.message}`);
  }
  
  // Check available issue types that could work for knowledge base
  console.log('\n2️⃣ Checking available issue types for KB...');
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/projects/MYD/customFields`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'field(name,fieldType),bundle(values(name))'
      }
    });
    
    const typeField = response.data?.find(field => field.field.name === 'Type');
    if (typeField && typeField.bundle?.values) {
      console.log('✅ Available issue types:');
      typeField.bundle.values.forEach(type => {
        console.log(`   - ${type.name}`);
      });
    } else {
      console.log('❌ Could not find Type field or values');
    }
  } catch (error) {
    console.log(`❌ Failed to get issue types: ${error.response?.status} - ${error.message}`);
  }
  
  // Check if there are any article/attachment APIs
  console.log('\n3️⃣ Checking for article/attachment related APIs...');
  const attachmentEndpoints = [
    '/articles',
    '/attachments', 
    '/files',
    '/documents',
    '/admin/articles',
    '/admin/attachments'
  ];
  
  for (const endpoint of attachmentEndpoints) {
    console.log(`\n   🧪 Testing: ${endpoint}`);
    try {
      const response = await axios.get(`${BASE_URL}/api${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        },
        params: { $top: 1 }
      });
      
      console.log(`   ✅ ${endpoint} exists!`);
      console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.log(`   ❌ ${endpoint} not available: ${error.response?.status}`);
    }
  }
  
  console.log('\n🎯 RESEARCH CONCLUSIONS:');
  console.log('========================');
  console.log('📝 No dedicated Knowledge Base API found in YouTrack');
  console.log('💡 Recommendation: Implement KB using Issues with special types/tags');
  console.log('🏗️ Approach: Create "Documentation", "Article", "Guide" issue types');
  console.log('🔍 Use tags for categorization and search functionality');
  console.log('📚 Leverage existing issue fields for KB metadata');
}

exploreAlternativeKB().catch(console.error);
