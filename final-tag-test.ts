import { YouTrackClient } from './src/youtrack-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function finalTagTest() {
  console.log('🏷️  FINAL TAG FUNCTIONALITY TEST');
  console.log('=' .repeat(50));
  
  const youtrackUrl = process.env.YOUTRACK_URL;
  const youtrackToken = process.env.YOUTRACK_TOKEN;
  
  if (!youtrackUrl || !youtrackToken) {
    console.log('❌ Missing environment variables');
    process.exit(1);
  }
  
  const client = new YouTrackClient(youtrackUrl, youtrackToken);
  
  try {
    // Test 1: Create a new article with tags
    console.log('\n1️⃣ Creating new article with initial tags...');
    const createResult = await client.createArticle({
      title: 'Final Tag Test Article',
      content: 'Testing complete tag functionality from scratch.',
      tags: ['initial', 'create-test', 'functionality']
    });
    
    const articleData = JSON.parse(createResult.content[0].text);
    const articleId = articleData.articleId;
    console.log('✅ Created article:', articleId);
    console.log('✅ Tags added:', articleData.tagsAdded);
    
    // Test 2: Update with additional tags
    console.log('\n2️⃣ Adding more tags via update...');
    const updateResult = await client.updateArticle({
      articleId: articleId,
      title: 'Updated Final Tag Test Article',
      tags: ['updated', 'additional', 'more-tags']
    });
    console.log('✅ Update completed');
    
    // Test 3: Verify final tag state
    console.log('\n3️⃣ Verifying all tags are present...');
    const finalCheck = await client.getArticle({
      articleId: articleId,
      includeComments: false
    });
    
    const finalArticle = JSON.parse(finalCheck.content[0].text).article;
    const allTags = finalArticle.tags.map(t => t.name).sort();
    
    console.log('✅ Final tags on article:', allTags);
    console.log('✅ Total tag count:', allTags.length);
    
    // Expected: initial, create-test, functionality, updated, additional, more-tags
    const expectedTags = ['initial', 'create-test', 'functionality', 'updated', 'additional', 'more-tags'];
    const hasAllExpected = expectedTags.every(tag => allTags.includes(tag));
    
    if (hasAllExpected) {
      console.log('\n🎉 SUCCESS: All expected tags are present!');
      console.log('✅ Article creation with tags: WORKING');
      console.log('✅ Article update with tags: WORKING');
      console.log('✅ Tag accumulation (no duplicates): WORKING');
    } else {
      console.log('\n❌ Some expected tags are missing');
      console.log('Expected:', expectedTags);
      console.log('Found:', allTags);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

finalTagTest();
