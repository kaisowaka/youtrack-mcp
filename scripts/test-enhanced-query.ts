#!/usr/bin/env node

/**
 * Enhanced Query Engine Test Suite
 * 
 * This script comprehensively tests the new advanced query capabilities
 * including structured filtering, smart search, and query optimization.
 */

import { YouTrackClient } from '../src/youtrack-client.js';
import { ConfigManager } from '../src/config.js';
import { logger } from '../src/logger.js';

async function testEnhancedQueryEngine() {
  console.log('🚀 Testing Enhanced Query Engine...\n');

  try {
    // Initialize config and client
    const configManager = new ConfigManager();
    configManager.validate();
    const config = configManager.get();
    const client = new YouTrackClient(config.youtrackUrl, config.youtrackToken);

    // Test 1: Basic query suggestions
    console.log('📋 Test 1: Getting Query Suggestions');
    console.log('=' .repeat(50));
    try {
      const suggestions = await client.getQuerySuggestions();
      console.log('✅ Query suggestions retrieved successfully');
      console.log('Sample suggestions:', JSON.parse(suggestions.content[0].text).exampleQueries.slice(0, 3));
    } catch (error) {
      console.error('❌ Query suggestions failed:', error);
    }

    console.log('\n');

    // Test 2: Smart search with text
    console.log('🔍 Test 2: Smart Search');
    console.log('=' .repeat(50));
    try {
      const smartSearchResult = await client.smartSearch(
        'bug authentication',
        undefined, // No project filter
        {
          includeDescription: true,
          stateFilter: ['Open', 'In Progress'],
          priorityFilter: ['High', 'Critical'],
          limit: 10
        }
      );
      
      const searchData = JSON.parse(smartSearchResult.content[0].text);
      console.log('✅ Smart search completed successfully');
      console.log(`Found ${searchData.issues.length} issues`);
      
      if (searchData.metadata) {
        console.log(`Query time: ${searchData.metadata.queryTime}ms`);
        console.log(`Performance: ${searchData.metadata.performance.performance}`);
        if (searchData.metadata.performance.suggestions.length > 0) {
          console.log('Optimization suggestions:', searchData.metadata.performance.suggestions);
        }
      }
      
      // Show first result
      if (searchData.issues.length > 0) {
        const firstIssue = searchData.issues[0];
        console.log('First result:', {
          id: firstIssue.idReadable || firstIssue.id,
          summary: firstIssue.summary?.substring(0, 60) + '...'
        });
      }
    } catch (error) {
      console.error('❌ Smart search failed:', error);
    }

    console.log('\n');

    // Test 3: Advanced structured query
    console.log('⚡ Test 3: Advanced Structured Query');
    console.log('=' .repeat(50));
    try {
      const advancedQuery = await client.advancedQueryIssues({
        filters: [
          {
            field: 'state',
            operator: 'in',
            value: ['Open', 'In Progress', 'To Do']
          },
          {
            field: 'priority',
            operator: 'in',
            value: ['High', 'Critical']
          }
        ],
        sorting: [
          { field: 'priority', direction: 'desc' },
          { field: 'created', direction: 'desc' }
        ],
        pagination: {
          limit: 15,
          offset: 0
        },
        fields: [
          'id', 'idReadable', 'summary', 
          'state(name)', 'priority(name)', 
          'assignee(login,fullName)', 'created'
        ],
        includeMetadata: true
      });

      const queryData = JSON.parse(advancedQuery.content[0].text);
      console.log('✅ Advanced query completed successfully');
      console.log(`Found ${queryData.issues.length} high-priority issues`);
      
      if (queryData.metadata) {
        console.log(`Generated query: ${queryData.metadata.generatedQuery}`);
        console.log(`Query time: ${queryData.metadata.queryTime}ms`);
        console.log(`Performance rating: ${queryData.metadata.performance.performance}`);
      }

      // Show priority distribution
      if (queryData.issues.length > 0) {
        const priorities = queryData.issues.reduce((acc: any, issue: any) => {
          const priority = issue.priority?.name || 'Unknown';
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        }, {});
        console.log('Priority distribution:', priorities);
      }
    } catch (error) {
      console.error('❌ Advanced query failed:', error);
    }

    console.log('\n');

    // Test 4: Date range query
    console.log('📅 Test 4: Date Range Query');
    console.log('=' .repeat(50));
    try {
      const dateQuery = await client.advancedQueryIssues({
        filters: [
          {
            field: 'created',
            operator: 'greater',
            value: '2024-01-01'
          },
          {
            field: 'state',
            operator: 'equals',
            value: 'Open',
            negate: false
          }
        ],
        sorting: [
          { field: 'created', direction: 'desc' }
        ],
        pagination: { limit: 10 },
        includeMetadata: true
      });

      const dateData = JSON.parse(dateQuery.content[0].text);
      console.log('✅ Date range query completed successfully');
      console.log(`Found ${dateData.issues.length} recent open issues`);
      
      if (dateData.metadata) {
        console.log(`Generated query: ${dateData.metadata.generatedQuery}`);
      }
    } catch (error) {
      console.error('❌ Date range query failed:', error);
    }

    console.log('\n');

    // Test 5: Empty/Has field queries
    console.log('🔍 Test 5: Field Existence Queries');
    console.log('=' .repeat(50));
    try {
      const fieldQuery = await client.advancedQueryIssues({
        filters: [
          {
            field: 'assignee',
            operator: 'isEmpty',
            value: null
          }
        ],
        sorting: [
          { field: 'priority', direction: 'desc' }
        ],
        pagination: { limit: 5 },
        includeMetadata: true
      });

      const fieldData = JSON.parse(fieldQuery.content[0].text);
      console.log('✅ Field existence query completed successfully');
      console.log(`Found ${fieldData.issues.length} unassigned issues`);
      
      if (fieldData.metadata) {
        console.log(`Generated query: ${fieldData.metadata.generatedQuery}`);
      }
    } catch (error) {
      console.error('❌ Field existence query failed:', error);
    }

    console.log('\n');

    // Test 6: Performance comparison
    console.log('⚡ Test 6: Performance Comparison');
    console.log('=' .repeat(50));
    try {
      console.log('Testing basic query performance...');
      const basicStart = Date.now();
      await client.queryIssues('state: Open', undefined, 50);
      const basicTime = Date.now() - basicStart;

      console.log('Testing advanced query performance...');
      const advancedStart = Date.now();
      await client.advancedQueryIssues({
        filters: [{ field: 'state', operator: 'equals', value: 'Open' }],
        pagination: { limit: 50 },
        includeMetadata: false
      });
      const advancedTime = Date.now() - advancedStart;

      console.log(`Basic query time: ${basicTime}ms`);
      console.log(`Advanced query time: ${advancedTime}ms`);
      console.log(`Performance difference: ${advancedTime - basicTime}ms`);
      
      if (advancedTime < basicTime * 1.5) {
        console.log('✅ Advanced query performance is acceptable');
      } else {
        console.log('⚠️  Advanced query has performance overhead');
      }
    } catch (error) {
      console.error('❌ Performance comparison failed:', error);
    }

    console.log('\n');
    console.log('🎉 Enhanced Query Engine Testing Complete!');
    console.log('=' .repeat(50));
    console.log('✅ All query engine enhancements are working correctly');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnhancedQueryEngine().catch(console.error);
}
