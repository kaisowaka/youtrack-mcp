#!/usr/bin/env npx tsx

/**
 * Test script to verify listArticles functionality with different project IDs
 */

import { YouTrackClient } from './src/youtrack-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testListArticles() {
  console.log('🔍 Testing listArticles functionality...\n');
  
  const youtrackUrl = process.env.YOUTRACK_URL;
  const youtrackToken = process.env.YOUTRACK_TOKEN;
  
  if (!youtrackUrl || !youtrackToken) {
    console.log('❌ Missing environment variables');
    process.exit(1);
  }
  
  const client = new YouTrackClient(youtrackUrl, youtrackToken);
  
  try {
    // Test 1: List all articles (no project filter)
    console.log('📋 Test 1: Listing all articles...');
    const allArticlesResult = await client.listArticles({
      includeContent: false
    });
    
    const allArticles = JSON.parse(allArticlesResult.content[0].text);
    console.log(`✅ Found ${allArticles.count} total articles`);
    
    // Show available projects from articles
    const projectsInArticles = [...new Set(allArticles.articles.map((a: any) => a.project?.shortName).filter(Boolean))];
    console.log('📁 Projects with articles:', projectsInArticles);
    
    // Test 2: Test with valid project (YTM)
    console.log('\n📋 Test 2: Listing articles for valid project YTM...');
    const ytmArticlesResult = await client.listArticles({
      projectId: 'YTM',
      includeContent: false
    });
    
    const ytmArticles = JSON.parse(ytmArticlesResult.content[0].text);
    console.log(`✅ Found ${ytmArticles.count} articles in YTM project`);
    
    // Test 3: Test with invalid project (MYDR)
    console.log('\n📋 Test 3: Listing articles for potentially invalid project MYDR...');
    try {
      const mydrArticlesResult = await client.listArticles({
        projectId: 'MYDR',
        includeContent: false
      });
      
      const mydrArticles = JSON.parse(mydrArticlesResult.content[0].text);
      console.log(`✅ Found ${mydrArticles.count} articles in MYDR project`);
    } catch (error) {
      console.log(`ℹ️  Error for MYDR project: ${error.message}`);
    }
    
    console.log('\n🎉 listArticles testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testListArticles().catch(console.error);
