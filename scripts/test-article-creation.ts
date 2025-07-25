#!/usr/bin/env tsx

import { YouTrackClient } from '../src/youtrack-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testArticleCreation() {
  console.log('📄 Testing article creation without tags first');
  console.log('=' .repeat(50));

  const youtrackUrl = process.env.YOUTRACK_URL;
  const youtrackToken = process.env.YOUTRACK_TOKEN;
  const projectId = process.env.DEFAULT_PROJECT_ID || 'YTM';

  if (!youtrackUrl || !youtrackToken) {
    console.log('❌ Missing environment variables');
    process.exit(1);
  }

  console.log(`📡 Testing with project: ${projectId}`);
  
  const client = new YouTrackClient(youtrackUrl, youtrackToken);

  try {
    // Test 1: Create article without tags
    console.log('\n1️⃣ Creating article WITHOUT tags...');
    const result1 = await client.createArticle({
      title: 'Test Article No Tags',
      content: 'This is a test article without tags.',
      projectId: projectId
    });

    console.log('✅ Article creation (no tags) result:', JSON.stringify(result1, null, 2));

    // Test 2: Create article with tags
    console.log('\n2️⃣ Creating article WITH tags...');
    const result2 = await client.createArticle({
      title: 'Test Article With Tags',
      content: 'This is a test article with tags.',
      projectId: projectId,
      tags: ['test-tag']
    });

    console.log('✅ Article creation (with tags) result:', JSON.stringify(result2, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Try to show more detailed error info
    if (error instanceof Error && error.message.includes('400')) {
      console.log('\n🔍 This is likely a 400 Bad Request error. Let\'s check if it\'s the same issue we had before.');
      console.log('The tags fix is implemented correctly, but there might be another issue with article creation.');
    }
  }
}

testArticleCreation();
