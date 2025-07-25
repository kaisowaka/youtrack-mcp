#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { YouTrackClient } from '../src/youtrack-client.js';
import { logger } from '../src/logger.js';

// Load environment variables
dotenv.config();

async function testGanttChartCapabilities() {
  try {
    const youtrackUrl = process.env.YOUTRACK_URL;
    const youtrackToken = process.env.YOUTRACK_TOKEN;

    if (!youtrackUrl || !youtrackToken) {
      throw new Error('Please set YOUTRACK_URL and YOUTRACK_TOKEN environment variables');
    }

    logger.info('=== Testing Gantt Chart & Dependency Management ===');
    const client = new YouTrackClient(youtrackUrl, youtrackToken);

    // Test 1: Get basic project timeline (existing functionality)
    logger.info('\n1. Testing basic project timeline for MYDR...');
    try {
      const timeline = await client.getProjectTimeline({
        projectId: 'MYDR',
        includeCompleted: false
      });
      
      const timelineData = JSON.parse(timeline.content[0].text);
      console.log('Basic Timeline Result:');
      console.log(`Project: ${timelineData.ganttChart.projectId}`);
      console.log(`Items: ${timelineData.ganttChart.items.length}`);
      console.log(`Has Critical Path: ${!!timelineData.ganttChart.criticalPath}`);
      
      if (timelineData.ganttChart.items.length > 0) {
        const sampleItem = timelineData.ganttChart.items[0];
        console.log('\nSample Item:');
        console.log(`  ID: ${sampleItem.id}`);
        console.log(`  Title: ${sampleItem.title}`);
        console.log(`  Status: ${sampleItem.status}`);
        console.log(`  Assignee: ${sampleItem.assignee}`);
        console.log(`  Dependencies: ${sampleItem.dependencies?.length || 0}`);
      }
      
    } catch (error) {
      logger.error('Failed to get basic timeline:', { error: (error as Error).message });
    }

    // Test 2: Test dependency analysis for existing issues
    logger.info('\n2. Testing issue dependency analysis...');
    try {
      // First get some issues to work with
      const issuesResponse = await client.searchIssues({
        query: 'project: MYDR',
        limit: 5
      });
      
      const issuesData = JSON.parse(issuesResponse.content[0].text);
      console.log(`Found ${issuesData.issues.length} issues in MYDR project`);
      
      if (issuesData.issues.length > 0) {
        const firstIssue = issuesData.issues[0];
        console.log(`\nAnalyzing dependencies for issue: ${firstIssue.id} - ${firstIssue.summary}`);
        
        const dependencies = await client.getIssueDependencies({
          issueId: firstIssue.id
        });
        
        const depData = JSON.parse(dependencies.content[0].text);
        console.log('Dependency Analysis:');
        console.log(`  Total Dependencies: ${depData.metrics.totalDependencies}`);
        console.log(`  Blocked By: ${depData.metrics.blockedByCount}`);
        console.log(`  Blocking: ${depData.metrics.blockingCount}`);
        console.log(`  Related: ${depData.metrics.relatedCount}`);
        console.log(`  On Critical Path: ${depData.metrics.criticalPath}`);
      }
      
    } catch (error) {
      logger.error('Failed to analyze dependencies:', { error: (error as Error).message });
    }

    // Test 3: Test critical path analysis
    logger.info('\n3. Testing critical path analysis...');
    try {
      const criticalPath = await client.getCriticalPath({
        projectId: 'MYDR'
      });
      
      const pathData = JSON.parse(criticalPath.content[0].text);
      console.log('Critical Path Analysis:');
      console.log(`  Total Issues: ${pathData.analysis.totalIssues}`);
      console.log(`  Issues with Dependencies: ${pathData.analysis.issuesWithDependencies}`);
      console.log(`  Critical Paths Found: ${pathData.analysis.criticalPaths.length}`);
      
      if (pathData.analysis.criticalPaths.length > 0) {
        const firstPath = pathData.analysis.criticalPaths[0];
        console.log(`\n  First Critical Path:`);
        console.log(`    Duration: ${firstPath.duration} days`);
        console.log(`    Issues: ${firstPath.path.length}`);
        console.log(`    Is Critical: ${firstPath.isCritical}`);
      }
      
    } catch (error) {
      logger.error('Failed to analyze critical path:', { error: (error as Error).message });
    }

    // Test 4: Demonstrate dependency creation limitations
    logger.info('\n4. Testing dependency creation (demonstrating API limitations)...');
    try {
      // Get first two issues to attempt linking
      const issuesResponse = await client.searchIssues({
        query: 'project: MYDR',
        limit: 2
      });
      
      const issuesData = JSON.parse(issuesResponse.content[0].text);
      
      if (issuesData.issues.length >= 2) {
        const sourceIssue = issuesData.issues[0];
        const targetIssue = issuesData.issues[1];
        
        console.log(`Attempting to create dependency: ${sourceIssue.id} depends on ${targetIssue.id}`);
        
        const dependencyResult = await client.createIssueDependency({
          sourceIssueId: sourceIssue.id,
          targetIssueId: targetIssue.id,
          linkType: 'Depends'
        });
        
        const depResult = JSON.parse(dependencyResult.content[0].text);
        console.log('Dependency Creation Result:');
        console.log(`  Success: ${depResult.success}`);
        console.log(`  Limitation: ${depResult.limitation || 'None'}`);
        console.log(`  Message: ${depResult.message}`);
        
        if (depResult.alternatives) {
          console.log('  Alternatives:');
          depResult.alternatives.forEach((alt: string, idx: number) => {
            console.log(`    ${idx + 1}. ${alt}`);
          });
        }
      }
      
    } catch (error) {
      logger.error('Failed to create dependency:', { error: (error as Error).message });
    }

    // Test 5: Show recommendations for Gantt chart implementation
    console.log('\n=== Gantt Chart Implementation Status ===');
    console.log('✅ Basic Timeline: Implemented');
    console.log('✅ Dependency Analysis: Implemented');
    console.log('✅ Critical Path Detection: Implemented');
    console.log('⚠️  Dependency Creation: Limited by YouTrack API');
    console.log('🚧 Full Gantt Features: In Development');
    
    console.log('\n=== YouTrack Gantt Chart Capabilities ===');
    console.log('🎯 What YouTrack Gantt Charts Provide:');
    console.log('   • Visual timeline with task bars');
    console.log('   • Dependency arrows between tasks');
    console.log('   • Critical path highlighting');
    console.log('   • Resource allocation views');
    console.log('   • Drag-and-drop scheduling');
    console.log('   • Milestone tracking');
    console.log('   • Progress visualization');
    
    console.log('\n💡 API Integration Strategy:');
    console.log('   1. ✅ Read timeline data via REST API');
    console.log('   2. ✅ Analyze dependencies and critical paths');
    console.log('   3. ⚠️  Create dependencies (manual via web UI)');
    console.log('   4. 🔄 Generate Gantt-compatible data formats');
    console.log('   5. 📊 Export to external Gantt chart tools');
    
    console.log('\n🎨 Visualization Options:');
    console.log('   • Export data for Microsoft Project');
    console.log('   • Generate data for Gantt.js libraries');
    console.log('   • Create CSV/JSON for custom visualizations');
    console.log('   • Integration with project management tools');

    logger.info('\n=== Gantt Chart Testing Complete ===');

  } catch (error) {
    logger.error('Gantt chart testing failed:', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGanttChartCapabilities().catch((error) => {
    logger.error('Unhandled error in Gantt chart testing:', { error });
    process.exit(1);
  });
}

export { testGanttChartCapabilities };
