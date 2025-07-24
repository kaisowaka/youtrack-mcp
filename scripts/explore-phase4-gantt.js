#!/usr/bin/env node

/**
 * Phase 4: Gantt Charts & Dependencies Implementation
 * Advanced project visualization and dependency management
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function exploreGanttCapabilities() {
  console.log('🔍 PHASE 4: EXPLORING GANTT & DEPENDENCIES API\n');
  
  try {
    // 1. Check for timeline/gantt endpoints
    console.log('1️⃣ Testing timeline endpoints...');
    const timelineEndpoints = [
      '/agile/timeline',
      '/projects/MYD/timeline',
      '/gantt',
      '/projects/MYD/gantt',
      '/admin/projects/MYD/timeline'
    ];
    
    for (const endpoint of timelineEndpoints) {
      try {
        const response = await axios.get(`${BASE_URL}/api${endpoint}`, {
          headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log(`   ✅ ${endpoint} works!`);
        console.log(`   Response: ${JSON.stringify(response.data).slice(0, 200)}...`);
      } catch (error) {
        console.log(`   ❌ ${endpoint}: ${error.response?.status || 'Error'}`);
      }
    }
    
    // 2. Check for dependency management
    console.log('\n2️⃣ Testing dependency endpoints...');
    
    // Get some issues first
    const issuesResponse = await axios.get(`${BASE_URL}/api/issues`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      params: {
        query: 'project: MYD',
        fields: 'id,summary,links(linkType,direction,issues(id,summary))',
        '$top': 5
      }
    });
    
    console.log('✅ Issues with links retrieved');
    if (issuesResponse.data.length > 0) {
      const issueWithLinks = issuesResponse.data.find(issue => issue.links?.length > 0);
      if (issueWithLinks) {
        console.log('   📎 Found issue with links:', issueWithLinks.id);
        console.log('   Links:', JSON.stringify(issueWithLinks.links, null, 2));
      } else {
        console.log('   📎 No issues with existing links found');
      }
    }
    
    // 3. Check for project timeline/milestone endpoints
    console.log('\n3️⃣ Testing project timeline features...');
    
    try {
      const milestonesResponse = await axios.get(`${BASE_URL}/api/admin/projects/MYD/timeTrackingSettings`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      console.log('✅ Time tracking settings available');
    } catch (error) {
      console.log(`❌ Time tracking: ${error.response?.status}`);
    }
    
    // 4. Test issue link types
    console.log('\n4️⃣ Testing issue link types...');
    try {
      const linkTypesResponse = await axios.get(`${BASE_URL}/api/admin/issueLinkTypes`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      console.log('✅ Issue link types available:', linkTypesResponse.data.length);
      linkTypesResponse.data.slice(0, 3).forEach(linkType => {
        console.log(`   🔗 ${linkType.name}: ${linkType.sourceToTarget} / ${linkType.targetToSource}`);
      });
    } catch (error) {
      console.log(`❌ Link types: ${error.response?.status}`);
    }
    
    // 5. Test creating dependencies
    console.log('\n5️⃣ Testing dependency creation...');
    
    if (issuesResponse.data.length >= 2) {
      const issue1 = issuesResponse.data[0];
      const issue2 = issuesResponse.data[1];
      
      try {
        // Try to create a "depends on" link
        const linkData = {
          linkType: { name: 'Depends' },
          issues: [{ id: issue2.id }]
        };
        
        console.log(`   Creating dependency: ${issue1.id} depends on ${issue2.id}`);
        const linkResponse = await axios.post(`${BASE_URL}/api/issues/${issue1.id}/links`, linkData, {
          headers: { 
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Dependency created successfully!');
        
        // Clean up the link
        setTimeout(async () => {
          try {
            await axios.delete(`${BASE_URL}/api/issues/${issue1.id}/links/${linkResponse.data.id}`, {
              headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            console.log('   🧹 Cleanup: Link removed');
          } catch (e) {
            console.log('   ⚠️ Cleanup failed (link may not exist)');
          }
        }, 1000);
        
      } catch (error) {
        console.log(`❌ Dependency creation failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
      }
    }
    
    // 6. Check for schedule/timeline custom fields
    console.log('\n6️⃣ Testing schedule-related custom fields...');
    try {
      const fieldsResponse = await axios.get(`${BASE_URL}/api/admin/projects/MYD/customFields`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      
      const scheduleFields = fieldsResponse.data.filter(field => 
        field.name.toLowerCase().includes('due') || 
        field.name.toLowerCase().includes('start') || 
        field.name.toLowerCase().includes('end') ||
        field.name.toLowerCase().includes('schedule') ||
        field.name.toLowerCase().includes('timeline')
      );
      
      if (scheduleFields.length > 0) {
        console.log('✅ Schedule-related fields found:');
        scheduleFields.forEach(field => {
          console.log(`   📅 ${field.name} (${field.fieldType?.valueType})`);
        });
      } else {
        console.log('   📅 No schedule-specific fields found');
      }
      
    } catch (error) {
      console.log(`❌ Custom fields: ${error.response?.status}`);
    }
    
  } catch (error) {
    console.log(`❌ General error: ${error.message}`);
  }
}

exploreGanttCapabilities().catch(console.error);
