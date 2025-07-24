#!/usr/bin/env npx tsx

import dotenv from 'dotenv';
import { EnhancedYouTrackClient } from '../src/enhanced-youtrack-client.js';
import { ConfigManager } from '../src/config.js';

dotenv.config();

async function testMCPComponents() {
  console.log('🔧 Testing MCP components individually...\n');

  // Test 1: Environment Variables
  console.log('1️⃣ Testing Environment Variables:');
  console.log('   YOUTRACK_URL:', process.env.YOUTRACK_URL || 'undefined');
  console.log('   YOUTRACK_TOKEN length:', process.env.YOUTRACK_TOKEN?.length || 'undefined');
  console.log('   DEFAULT_PROJECT_ID:', process.env.DEFAULT_PROJECT_ID || 'undefined');

  // Test 2: Config Manager
  console.log('\n2️⃣ Testing ConfigManager:');
  try {
    const config = new ConfigManager();
    const configData = config.get();
    console.log('   ✅ Config loaded successfully');
    console.log('   URL:', configData.youtrackUrl);
    console.log('   Token length:', configData.youtrackToken?.length);
  } catch (error) {
    console.error('   ❌ Config error:', error.message);
    return;
  }

  // Test 3: Enhanced Client
  console.log('\n3️⃣ Testing EnhancedYouTrackClient:');
  try {
    const config = new ConfigManager();
    const { youtrackUrl, youtrackToken } = config.get();
    
    const client = new EnhancedYouTrackClient(youtrackUrl, youtrackToken);
    console.log('   ✅ Client created successfully');

    // Test getProjects
    console.log('\n4️⃣ Testing getProjects():');
    const projects = await client.getProjects();
    console.log('   ✅ Projects retrieved:', projects.length);
    console.log('   Projects:', JSON.stringify(projects, null, 2));

    // Test validateProject
    console.log('\n5️⃣ Testing validateProject():');
    const validation = await client.validateProject('MYDR24');
    console.log('   ✅ Validation result:', JSON.stringify(validation, null, 2));

  } catch (error) {
    console.error('   ❌ Enhanced client error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testMCPComponents().catch(console.error);
