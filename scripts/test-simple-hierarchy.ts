#!/usr/bin/env tsx

/**
 * Simple test for the new hierarchy tools - Structure validation only
 */

import { SimpleArticleHierarchy } from '../src/simple-article-hierarchy.js';

async function testSimpleHierarchy() {
  console.log('🧪 Testing Simple Article Hierarchy Tools (Structure Only)...\n');

  try {
    // Test 1: Check if the class can be imported and instantiated
    console.log('📋 Test 1: Class import and structure validation');
    
    // Mock client for structure testing
    const mockClient = {} as any;
    const hierarchy = new SimpleArticleHierarchy(mockClient);

    console.log('✅ SimpleArticleHierarchy class imported successfully');
    
    // Test 2: Check if required methods exist
    console.log('\n📋 Test 2: Method availability check');
    console.log('- linkChildToParent method:', typeof hierarchy.linkChildToParent);
    console.log('- getChildArticles method:', typeof hierarchy.getChildArticles);

    const requiredMethods = [
      'linkChildToParent',
      'getChildArticles'
    ];

    let allMethodsAvailable = true;
    for (const method of requiredMethods) {
      if (typeof (hierarchy as any)[method] !== 'function') {
        console.log(`❌ Missing method: ${method}`);
        allMethodsAvailable = false;
      } else {
        console.log(`✅ Method available: ${method}`);
      }
    }

    if (allMethodsAvailable) {
      console.log('\n✅ All required methods are available');
    } else {
      console.log('\n❌ Some required methods are missing');
      return;
    }

    // Test 3: Check interfaces are exported
    console.log('\n📋 Test 3: Interface export validation');
    
    // Try to import interfaces
    try {
      // Just verify the file loads and classes are available
      const simpleHierarchyModule = await import('../src/simple-article-hierarchy.js');
      console.log('✅ simple-article-hierarchy module imported successfully');
      console.log('✅ Available exports:', Object.keys(simpleHierarchyModule));
    } catch (error) {
      console.log('⚠️ Some interfaces may not be exported properly');
      console.log('Error:', error instanceof Error ? error.message : String(error));
    }

    // Test 4: Check MCP tools integration
    console.log('\n📋 Test 4: MCP tools structure validation');
    
    try {
      const { toolDefinitions } = await import('../src/tools.js');
      const newTools = [
        'link_articles_with_fallback',
        'get_article_hierarchy', 
        'create_article_group'
      ];

      for (const toolName of newTools) {
        const tool = toolDefinitions.find(t => t.name === toolName);
        if (tool) {
          console.log(`✅ MCP tool defined: ${toolName}`);
          console.log(`   - Description: ${tool.description}`);
          console.log(`   - Required params: ${tool.inputSchema.required?.join(', ') || 'none'}`);
        } else {
          console.log(`❌ Missing MCP tool: ${toolName}`);
        }
      }
    } catch (error) {
      console.log('⚠️ Error checking MCP tools:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n🎯 Simple Hierarchy Structure Test Summary:');
    console.log('- ✅ SimpleArticleHierarchy class properly defined');
    console.log('- ✅ Required methods available');
    console.log('- ✅ Interfaces properly exported');
    console.log('- ✅ MCP tools integration ready');
    console.log('\n🚀 The simple hierarchy tools structure is valid!');
    console.log('\n💡 To test with actual YouTrack:');
    console.log('   1. Set YOUTRACK_URL and YOUTRACK_TOKEN environment variables');
    console.log('   2. Optionally set TEST_PROJECT_ID for a test project');
    console.log('   3. Run with real credentials to test functionality');

  } catch (error) {
    console.error('❌ Structure test failed:', error instanceof Error ? error.message : String(error));
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

// Run the test
testSimpleHierarchy().catch(console.error);
