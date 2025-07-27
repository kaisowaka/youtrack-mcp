#!/usr/bin/env node

/**
 * Simple Query Engine Test
 * Tests the enhanced query capabilities with working YouTrack syntax
 */

import { YouTrackClient } from '../dist/youtrack-client.js';
import { ConfigManager } from '../dist/config.js';

async function testSimple() {
  console.log('🚀 Simple Query Engine Test\n');

  try {
    const configManager = new ConfigManager();
    configManager.validate();
    const config = configManager.get();
    const client = new YouTrackClient(config.youtrackUrl, config.youtrackToken);

    // Test 1: Query suggestions
    console.log('📋 Test 1: Query Suggestions');
    const suggestions = await client.getQuerySuggestions();
    console.log('✅ Suggestions retrieved');
    
    // Test 2: Basic advanced query (empty - get all issues)
    console.log('\n⚡ Test 2: Basic Advanced Query');
    const basicResult = await client.advancedQueryIssues({
      pagination: { limit: 5 },
      includeMetadata: true
    });
    
    const basicData = JSON.parse(basicResult.content[0].text);
    console.log(`✅ Found ${basicData.issues.length} issues`);
    if (basicData.metadata) {
      console.log(`Query time: ${basicData.metadata.queryTime}ms`);
    }

    // Test 3: Field existence query (works - we saw this succeed)
    console.log('\n🔍 Test 3: Field Existence Query');
    const fieldResult = await client.advancedQueryIssues({
      filters: [
        {
          field: 'assignee',
          operator: 'isEmpty',
          value: null
        }
      ],
      pagination: { limit: 3 },
      includeMetadata: true
    });
    
    const fieldData = JSON.parse(fieldResult.content[0].text);
    console.log(`✅ Found ${fieldData.issues.length} unassigned issues`);
    if (fieldData.metadata) {
      console.log(`Generated query: ${fieldData.metadata.generatedQuery}`);
    }

    // Test 4: Smart search with simple text
    console.log('\n🔍 Test 4: Smart Search');
    const smartResult = await client.smartSearch('test', undefined, {
      limit: 3
    });
    
    const smartData = JSON.parse(smartResult.content[0].text);
    console.log(`✅ Smart search found ${smartData.issues.length} issues`);

    console.log('\n🎉 Simple tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimple().catch(console.error);
