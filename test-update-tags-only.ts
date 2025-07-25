import { YouTrackClient } from './src/youtrack-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testUpdateTagsOnly() {
  console.log('Testing update with tags only...');
  
  const client = new YouTrackClient();
  
  try {
    // Use the article we just created
    const articleId = '167-177';
    
    console.log('🔄 Updating article with new tags only...');
    const result = await client.updateArticle({
      articleId: articleId,
      tags: ['updated', 'modified', 'new-tag']
    });
    
    console.log('Update result:', JSON.stringify(result, null, 2));
    
    // Check the article again
    console.log('\n🔍 Checking article after update...');
    const checkResult = await client.getArticle({
      articleId: articleId,
      includeComments: false
    });
    
    const article = JSON.parse(checkResult.content[0].text).article;
    console.log('Tags after update:', article.tags.map(t => t.name));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUpdateTagsOnly();
