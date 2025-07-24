#!/usr/bin/env node

/**
 * Research issue assignment to sprint methods
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function researchIssueAssignment() {
  console.log('🔍 RESEARCHING ISSUE ASSIGNMENT TO SPRINT\n');
  
  const issueId = '3-107';
  const sprintId = '184-2';
  
  // First check the issue's current custom fields
  console.log('1️⃣ Checking issue custom fields...');
  try {
    const response = await axios.get(`${BASE_URL}/api/issues/${issueId}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'id,summary,customFields(id,name,value(id,name,presentation))'
      }
    });
    
    console.log(`✅ Issue: ${response.data.summary}`);
    console.log('📊 Custom Fields:');
    response.data.customFields?.forEach(field => {
      console.log(`   ${field.name}: ${field.value?.presentation || field.value?.name || 'null'}`);
    });
    
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status} - ${error.message}`);
  }
  
  // Check project custom fields to see what's available
  console.log('\n2️⃣ Checking project custom fields...');
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/projects/MYD/customFields`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'field(id,name,fieldType),bundle(id)'
      }
    });
    
    console.log('✅ Available custom fields:');
    response.data?.forEach(fieldConfig => {
      console.log(`   ${fieldConfig.field.name} (${fieldConfig.field.fieldType?.id})`);
    });
    
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status} - ${error.message}`);
  }
  
  // Test alternative assignment methods
  console.log('\n3️⃣ Testing alternative assignment methods...');
  
  const methods = [
    // Method 1: Direct API call to sprint issues
    async () => {
      console.log('   🧪 Method 1: PUT to sprint issues...');
      return await axios.put(`${BASE_URL}/api/agiles/181-2/sprints/${sprintId}/issues`, 
        [issueId], {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    },
    
    // Method 2: POST to sprint issues
    async () => {
      console.log('   🧪 Method 2: POST to sprint issues...');
      return await axios.post(`${BASE_URL}/api/agiles/181-2/sprints/${sprintId}/issues`, 
        issueId, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    },
    
    // Method 3: Update issue with different field format
    async () => {
      console.log('   🧪 Method 3: Update issue with Sprint field...');
      return await axios.post(`${BASE_URL}/api/issues/${issueId}`, 
        {
          customFields: [
            {
              name: 'Sprint',
              value: { id: sprintId }
            }
          ]
        }, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    }
  ];
  
  for (let i = 0; i < methods.length; i++) {
    try {
      await methods[i]();
      console.log(`   ✅ Method ${i + 1} - SUCCESS!`);
      break; // Stop on first success
    } catch (error) {
      console.log(`   ❌ Method ${i + 1} - Failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
    }
  }
}

researchIssueAssignment().catch(console.error);
