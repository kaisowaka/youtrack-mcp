#!/usr/bin/env tsx
/**
 * Integration Example: Enhanced YouTrack MCP Client
 * Demonstrates the new modular architecture and enhanced capabilities
 */

import { EnhancedYouTrackClient } from '../src/api/enhanced-client.js';

async function demonstrateEnhancements() {
  console.log('🚀 YouTrack MCP Enhanced Client Demo');
  console.log('=====================================\n');

  // Initialize enhanced client
  const client = new EnhancedYouTrackClient(
    process.env.YOUTRACK_URL || 'https://youtrack.devstroop.com',
    process.env.YOUTRACK_TOKEN || '',
    {
      cacheEnabled: true,
      timeout: 30000,
      retries: 3
    }
  );

  try {
    // 1. Health Check
    console.log('🔍 Performing system health check...');
    const health = await client.healthCheck();
    console.log(`System Status: ${health.status.toUpperCase()}`);
    console.log(`Domains Tested: ${Object.keys(health.domains).join(', ')}`);
    console.log('');

    // 2. Enhanced Agile Management
    console.log('🎯 Testing Enhanced Agile Management...');
    
    // List agile boards with details
    const boardsResponse = await client.agile.listAgileBoards({
      includeDetails: true
    });
    console.log('✅ Enhanced agile boards listing successful');
    
    // If we have boards, test board configuration
    const boardsData = JSON.parse(boardsResponse.content[0].text);
    if (boardsData.data?.boards?.length > 0) {
      const firstBoard = boardsData.data.boards[0];
      console.log(`📊 Analyzing board: ${firstBoard.name} (${firstBoard.id})`);
      
      const configResponse = await client.agile.getBoardDetails({
        boardId: firstBoard.id,
        includeColumns: true,
        includeSprints: true
      });
      console.log('✅ Board configuration analysis successful');
    }

    // 3. Enhanced Time Tracking
    console.log('\n⏱️ Testing Enhanced Time Tracking...');
    
    // List recent work items
    const workItemsResponse = await client.workItems.listWorkItems({
      limit: 5
    });
    console.log('✅ Enhanced work items listing successful');
    
    // Generate a time tracking report for the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const reportResponse = await client.workItems.getTimeTrackingReport({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      groupBy: 'user',
      includeDetails: false
    });
    console.log('✅ Time tracking report generation successful');

    // 4. Cache Performance
    console.log('\n🚀 Testing Cache Performance...');
    
    // First call (cache miss)
    const start1 = Date.now();
    await client.agile.listAgileBoards({ includeDetails: false });
    const duration1 = Date.now() - start1;
    
    // Second call (cache hit)
    const start2 = Date.now();
    await client.agile.listAgileBoards({ includeDetails: false });
    const duration2 = Date.now() - start2;
    
    console.log(`First call (cache miss): ${duration1}ms`);
    console.log(`Second call (cache hit): ${duration2}ms`);
    console.log(`Performance improvement: ${Math.round(((duration1 - duration2) / duration1) * 100)}%`);

    // 5. Architecture Benefits Summary
    console.log('\n🏗️ Architecture Improvements Summary:');
    console.log('=====================================');
    console.log('✅ Modular domain-specific clients');
    console.log('✅ Consistent error handling patterns');
    console.log('✅ Shared caching across domains');
    console.log('✅ Performance monitoring built-in');
    console.log('✅ Unified response formatting');
    console.log('✅ Health checking capabilities');
    
    console.log('\n🎯 New Capabilities:');
    console.log('====================');
    console.log('• Enhanced agile board management');
    console.log('• Advanced sprint configuration');
    console.log('• Comprehensive time tracking analytics');
    console.log('• Work item reporting and grouping');
    console.log('• System health monitoring');
    console.log('• API coverage validation');

    console.log('\n🚀 Ready for Phase 2: Administrative Functions');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateEnhancements().catch(console.error);
}

export { demonstrateEnhancements };
