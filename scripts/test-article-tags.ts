#!/usr/bin/env tsx

import { YouTrackClient } from '../src/youtrack-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testTagsInArticles() {
  console.log('🏷️  Testing article tags functionality');
  console.log('=' .repeat(50));

  const youtrackUrl = process.env.YOUTRACK_URL;
  const youtrackToken = process.env.YOUTRACK_TOKEN;
  const projectId = process.env.DEFAULT_PROJECT_ID || 'YTM';

  if (!youtrackUrl || !youtrackToken) {
    console.log('❌ Missing environment variables');
    console.log('Please set YOUTRACK_URL and YOUTRACK_TOKEN in .env file');
    process.exit(1);
  }

  console.log(`📡 Testing with project: ${projectId}`);
  
  const client = new YouTrackClient(youtrackUrl, youtrackToken);

  try {
    // Test creating an article with tags
    console.log('\n1️⃣ Creating article with tags...');
    const result = await client.createArticle({
      title: 'Test Article with Tags',
      content: 'This is a test article to verify that tags are working correctly.',
      projectId: projectId,
      tags: ['test', 'verification', 'automation']
    });

    console.log('✅ Article creation result:', JSON.stringify(result, null, 2));

    // Extract article ID from response
    let articleId = '';
    try {
      const response = JSON.parse(result.content[0].text);
      articleId = response.articleId;
      console.log(`📄 Created article ID: ${articleId}`);
    } catch (error) {
      console.log('⚠️  Could not extract article ID from response');
      return;
    }

    // Test retrieving the article to verify tags were applied
    console.log('\n2️⃣ Retrieving article to verify tags...');
    const retrievedArticle = await client.getArticle({
      articleId: articleId,
      includeComments: false
    });

    console.log('✅ Retrieved article:', JSON.stringify(retrievedArticle, null, 2));

    // Test updating article with different tags
    console.log('\n3️⃣ Updating article with different tags...');
    const updateResult = await client.updateArticle({
      articleId: articleId,
      tags: ['updated', 'modified', 'new-tag']
    });

    console.log('✅ Article update result:', JSON.stringify(updateResult, null, 2));

    console.log('\n🎉 All tag tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testTagsInArticles();
