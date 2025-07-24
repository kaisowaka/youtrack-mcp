#!/usr/bin/env node

/**
 * Test API connection and format
 */

import { YouTrackClient } from '../dist/youtrack-client.js';

async function testAPIConnection() {
  console.log('🧪 Testing API connection and formats...');
  
  try {
    const client = new YouTrackClient(
      'https://youtrack.devstroop.com',
      'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
    );

    // Test 1: List projects (should work)
    console.log('\n🧪 Testing list_projects...');
    try {
      const projects = await client.listProjects();
      console.log('✅ list_projects works:', projects.length, 'projects found');
      if (projects.length > 0) {
        console.log('   First project:', projects[0]);
      }
    } catch (error) {
      console.log('❌ list_projects failed:', error.message);
    }

    // Test 2: Get project status (should work)
    console.log('\n🧪 Testing get_project_status...');
    try {
      const status = await client.getProjectStatus('MYD');
      console.log('✅ get_project_status works');
    } catch (error) {
      console.log('❌ get_project_status failed:', error.message);
    }

    // Test 3: Query issues (should work) 
    console.log('\n🧪 Testing query_issues...');
    try {
      const issues = await client.queryIssues({
        query: 'project: MYD',
        limit: 5
      });
      console.log('✅ query_issues works:', issues.length, 'issues found');
      if (issues.length > 0) {
        console.log('   First issue:', issues[0].id, '-', issues[0].summary);
      }
    } catch (error) {
      console.log('❌ query_issues failed:', error.message);
    }

    // Test 4: Try a different issue creation format
    console.log('\n🧪 Testing alternative create_issue format...');
    try {
      // Try minimal format first
      const minimalIssue = {
        project: { id: '0-1' }, // Use actual project ID not shortName
        summary: 'Minimal Test Issue'
      };

      console.log('Attempting minimal format:', JSON.stringify(minimalIssue, null, 2));
      
      // Direct API call to see exact error
      const response = await client.api.post('/issues', minimalIssue);
      console.log('✅ Minimal format works!', response.data.id);
    } catch (error) {
      console.log('❌ Minimal format failed:', error.response?.data || error.message);
      
      // Try with required fields
      try {
        const basicIssue = {
          project: { shortName: 'MYD' },
          summary: 'Basic Test Issue',
          customFields: [
            { name: 'Type', value: { name: 'Bug' } }
          ]
        };
        
        console.log('Attempting basic format:', JSON.stringify(basicIssue, null, 2));
        const response2 = await client.api.post('/issues', basicIssue);
        console.log('✅ Basic format works!', response2.data.id);
      } catch (error2) {
        console.log('❌ Basic format also failed:', error2.response?.data || error2.message);
      }
    }

  } catch (error) {
    console.error('❌ Client initialization failed:', error.message);
  }
}

testAPIConnection().catch(console.error);
