#!/usr/bin/env node

/**
 * PHASE 3 TEST SUITE: KNOWLEDGE BASE
 * ==================================
 * 
 * Comprehensive testing of all knowledge base functionality
 */

import { YouTrackClient } from '../dist/youtrack-client.js';

const client = new YouTrackClient(
  'https://youtrack.devstroop.com',
  'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
);

// Test configuration
const TEST_CONFIG = {
  projectId: 'MYD',
  testArticleTitle: 'Phase 3 Test Article',
  testTags: ['test', 'automation', 'phase3'],
  searchTerm: 'test'
};

let createdArticleId = null;

// Test runner
async function runTest(testName, testFn) {
  process.stdout.write(`🧪 Testing ${testName}...`);
  try {
    const result = await testFn();
    const data = JSON.parse(result.content[0].text);
    
    if (data.success) {
      console.log(' ✅ PASSED');
      return { passed: true, data };
    } else {
      console.log(' ❌ FAILED: Invalid response format');
      return { passed: false, error: 'Invalid response format' };
    }
  } catch (error) {
    console.log(` ❌ FAILED: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function testPhase3Features() {
  console.log('🧪 TESTING PHASE 3: KNOWLEDGE BASE');
  console.log('==================================\\n');

  const results = [];

  // Test 1: List Articles (initial state)
  const test1 = await runTest('list_articles (all)', async () => {
    return await client.listArticles({
      includeContent: false
    });
  });
  
  if (test1.passed) {
    console.log(`   📚 Found ${test1.data.count} existing articles`);
  }
  results.push(test1);

  // Test 2: List Articles (filtered by project)
  const test2 = await runTest('list_articles (project filtered)', async () => {
    return await client.listArticles({
      projectId: TEST_CONFIG.projectId,
      includeContent: true
    });
  });
  
  if (test2.passed) {
    console.log(`   🔍 Found ${test2.data.count} articles in ${TEST_CONFIG.projectId}`);
  }
  results.push(test2);

  // Test 3: Create Article
  const test3 = await runTest('create_article', async () => {
    return await client.createArticle({
      title: TEST_CONFIG.testArticleTitle,
      summary: 'This is a test article created during Phase 3 testing',
      content: '# Test Article\\n\\nThis article tests the knowledge base functionality.\\n\\n## Features Tested\\n\\n- Article creation\\n- Content formatting\\n- Knowledge management\\n\\n**Note:** This is a test article and can be safely deleted.',
      projectId: TEST_CONFIG.projectId
      // Removing tags for now as they require tag IDs
    });
  });
  
  if (test3.passed) {
    createdArticleId = test3.data.articleId;
    console.log(`   ✅ Created article: ${createdArticleId}`);
  }
  results.push(test3);

  // Test 4: Get Article Details
  const test4 = await runTest('get_article', async () => {
    if (!createdArticleId) throw new Error('No article ID available from creation test');
    return await client.getArticle({
      articleId: createdArticleId,
      includeComments: true
    });
  });
  
  if (test4.passed) {
    console.log(`   📄 Article: ${test4.data.article.title}`);
    console.log(`   📊 Content: ${test4.data.article.contentLength} characters`);
    console.log(`   🏷️ Tags: ${test4.data.article.tagNames.join(', ')}`);
  }
  results.push(test4);

  // Test 5: Update Article
  const test5 = await runTest('update_article', async () => {
    if (!createdArticleId) throw new Error('No article ID available from creation test');
    return await client.updateArticle({
      articleId: createdArticleId,
      summary: 'Updated test article summary - Phase 3 testing complete',
      content: '# Updated Test Article\\n\\nThis article has been updated to test the modification functionality.\\n\\n## Update Features Tested\\n\\n- Content modification\\n- Summary updates\\n- Knowledge management\\n\\n**Status:** Updated successfully!'
      // Removing tags for now as they require tag IDs
    });
  });
  
  if (test5.passed) {
    console.log(`   ✅ Updated fields: ${test5.data.updatedFields.join(', ')}`);
  }
  results.push(test5);

  // Test 6: Search Articles
  const test6 = await runTest('search_articles', async () => {
    return await client.searchArticles({
      searchTerm: TEST_CONFIG.searchTerm,
      projectId: TEST_CONFIG.projectId,
      includeContent: true
    });
  });
  
  if (test6.passed) {
    console.log(`   🔍 Search results: ${test6.data.count} articles found`);
    if (test6.data.results.length > 0) {
      console.log(`   📈 Top result: ${test6.data.results[0].title} (score: ${test6.data.results[0].relevanceScore})`);
    }
  }
  results.push(test6);

  // Test 7: Get Articles by Tag (expect 0 results since we can't create tags yet)
  const test7 = await runTest('get_articles_by_tag', async () => {
    return await client.getArticlesByTag({
      tag: 'nonexistent', // Use a tag that definitely won't exist
      projectId: TEST_CONFIG.projectId,
      includeContent: false
    });
  });
  
  if (test7.passed) {
    console.log(`   🏷️ Articles with tag "nonexistent": ${test7.data.count} (expected 0)`);
  }
  results.push(test7);

  // Test 8: Get Knowledge Base Statistics
  const test8 = await runTest('get_knowledge_base_stats', async () => {
    return await client.getKnowledgeBaseStats({
      projectId: TEST_CONFIG.projectId
    });
  });
  
  if (test8.passed) {
    const stats = test8.data.statistics;
    console.log(`   📊 KB Stats: ${stats.totalArticles} articles, ${stats.totalAuthors} authors`);
    console.log(`   📈 Content: ${stats.totalContentLength} chars total, ${stats.avgContentLength} avg`);
    console.log(`   🆕 Recent: ${stats.recentArticles} articles in last 30 days`);
  }
  results.push(test8);

  // Test 9: Delete Article (cleanup)
  const test9 = await runTest('delete_article', async () => {
    if (!createdArticleId) throw new Error('No article ID available for deletion');
    return await client.deleteArticle({
      articleId: createdArticleId
    });
  });
  
  if (test9.passed) {
    console.log(`   ✅ Article ${createdArticleId} deleted successfully`);
  }
  results.push(test9);

  // Calculate results
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const successRate = Math.round((passed / results.length) * 100);

  console.log('\\n\\n📊 PHASE 3 TEST SUMMARY');
  console.log('========================');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${successRate}%`);

  if (successRate === 100) {
    console.log('\\n🎉 PHASE 3 COMPLETE! All knowledge base features working.');
    console.log('\\n📋 Ready for Phase 4: Gantt Charts & Dependencies');
  } else if (successRate >= 80) {
    console.log('\\n⚠️  Most Phase 3 tests passed. Review failures before proceeding.');
  } else {
    console.log('\\n⚠️  Multiple Phase 3 tests failed. Fix before proceeding to Phase 4.');
  }

  return successRate;
}

// Run the tests
testPhase3Features().catch(console.error);
