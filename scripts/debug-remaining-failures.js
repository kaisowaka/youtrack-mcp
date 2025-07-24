#!/usr/bin/env node

/**
 * Debug the two remaining failing tools
 */

import { YouTrackClient } from '../dist/youtrack-client.js';

async function debugFailingTools() {
  console.log('🔍 Debugging remaining failing tools...\n');
  
  try {
    const client = new YouTrackClient(
      'https://youtrack.devstroop.com',
      'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
    );

    // Test 1: list_projects
    console.log('🧪 Testing list_projects...');
    try {
      const projects = await client.listProjects();
      console.log('✅ Projects returned:', projects);
      console.log('✅ Projects length:', projects.length);
      if (projects.length > 0) {
        console.log('✅ First project:', projects[0]);
      } else {
        console.log('⚠️ No projects returned');
      }
    } catch (error) {
      console.log('❌ list_projects failed:', error.message);
    }

    // Test 2: get_project_custom_fields  
    console.log('\n🧪 Testing get_project_custom_fields...');
    try {
      const fields = await client.getProjectCustomFields('MYD');
      console.log('✅ Custom fields returned:', fields);
      console.log('✅ Fields length:', fields.length);
      if (fields.length > 0) {
        console.log('✅ First field:', fields[0]);
      } else {
        console.log('⚠️ No custom fields returned');
      }
    } catch (error) {
      console.log('❌ get_project_custom_fields failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugFailingTools().catch(console.error);
