#!/usr/bin/env node

import { YouTrackClient } from '../src/youtrack-client.js';
import { logger } from '../src/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testBasicIntegration() {
  try {
    console.log('🧪 Testing YouTrack MCP Client Integration');
    
    const youtrackUrl = process.env.YOUTRACK_URL;
    const youtrackToken = process.env.YOUTRACK_TOKEN;
    
    if (!youtrackUrl || !youtrackToken) {
      console.log('❌ Missing environment variables');
      console.log('Please set YOUTRACK_URL and YOUTRACK_TOKEN in .env file');
      process.exit(1);
    }
    
    console.log('✅ Environment variables loaded');
    console.log(`📡 Connecting to: ${youtrackUrl}`);
    
    const client = new YouTrackClient(youtrackUrl, youtrackToken);
    
    // Test 1: List projects
    console.log('\n1️⃣ Testing project listing...');
    const projects = await client.listProjects();
    console.log(`✅ Found ${projects.length} projects`);
    if (projects.length > 0) {
      console.log(`   Sample: ${projects[0].shortName} (${projects[0].name})`);
    }
    
    // Test 2: Get custom fields for first project
    if (projects.length > 0) {
      console.log('\n2️⃣ Testing custom fields...');
      const customFields = await client.getProjectCustomFields(projects[0].id);
      console.log(`✅ Found ${customFields.length} custom fields`);
      
      // Find key fields
      const typeField = customFields.find(f => f.field.name.toLowerCase().includes('type'));
      const priorityField = customFields.find(f => f.field.name.toLowerCase().includes('priority'));
      const stateField = customFields.find(f => f.field.name.toLowerCase().includes('state'));
      
      if (typeField) console.log(`   Type field: ${typeField.field.name}`);
      if (priorityField) console.log(`   Priority field: ${priorityField.field.name}`);
      if (stateField) console.log(`   State field: ${stateField.field.name}`);
    }
    
    console.log('\n✨ All integration tests passed!');
    console.log('🎯 YouTrack MCP server is ready for use with proper API compliance.');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

testBasicIntegration();
