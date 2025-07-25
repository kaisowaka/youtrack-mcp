import { YouTrackClient } from './src/youtrack-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testUpdateWithContent() {
  console.log('Testing update with content and tags...');
  
  const youtrackUrl = process.env.YOUTRACK_URL;
  const youtrackToken = process.env.YOUTRACK_TOKEN;
  
  console.log('YouTrack URL:', youtrackUrl);
  console.log('Token present:', !!youtrackToken);
  
  const client = new YouTrackClient(youtrackUrl, youtrackToken);
  
  try {
    // Use the article we just created
    const articleId = '167-177';
    
    console.log('🔄 Updating article with content AND tags...');
    const result = await client.updateArticle({
      articleId: articleId,
      content: 'This is updated content with new tags!',
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
    console.log('Content after update:', article.content);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUpdateWithContent();
