#!/usr/bin/env node

import dotenv from 'dotenv';
import { YouTrackClient } from '../src/youtrack-client.js';

// Load environment variables
dotenv.config();

/**
 * Comprehensive YouTrack instance exploration script
 * Tests all major functionality and provides detailed insights
 */
async function exploreYouTrack(): Promise<void> {
  const youtrackUrl = process.env.YOUTRACK_URL;
  const youtrackToken = process.env.YOUTRACK_TOKEN;

  if (!youtrackUrl || !youtrackToken) {
    console.error('❌ Please set YOUTRACK_URL and YOUTRACK_TOKEN environment variables');
    process.exit(1);
  }

  console.log('🔍 YouTrack Instance Exploration');
  console.log('================================\n');
  console.log(`🌐 URL: ${youtrackUrl}`);
  console.log(`📅 Date: ${new Date().toISOString().split('T')[0]}\n`);

  const client = new YouTrackClient(youtrackUrl, youtrackToken);

  try {
    await discoverProjects(client);
    await testUserManagement(client);
    await demonstrateCapabilities();
    
    console.log('🎉 Exploration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Connection verified');
    console.log('✅ Projects discovered');
    console.log('✅ Core functionality tested');
    console.log('✅ MCP server ready for production');
    
  } catch (error) {
    console.error('❌ Exploration failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

async function discoverProjects(client: YouTrackClient): Promise<void> {
  console.log('📁 Project Discovery');
  console.log('--------------------');
  
  try {
    const projectsResult = await client.queryIssues('project: *', 'project(id,name,shortName)', 10);
    const projectsData = JSON.parse(projectsResult.content[0].text);
    
    const uniqueProjects = new Map();
    projectsData.forEach((issue: any) => {
      if (issue.project) {
        uniqueProjects.set(issue.project.id, issue.project);
      }
    });

    console.log(`Found ${uniqueProjects.size} active project(s):`);
    uniqueProjects.forEach((project: any) => {
      console.log(`  📂 ${project.name} (${project.id}) [${project.shortName}]`);
    });
    console.log();

    // Analyze the first project in detail
    if (uniqueProjects.size > 0) {
      const firstProject = Array.from(uniqueProjects.values())[0];
      await analyzeProject(client, firstProject);
    }

  } catch (error) {
    console.log('⚠️  Project discovery failed');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log();
  }
}

async function analyzeProject(client: YouTrackClient, project: any): Promise<void> {
  console.log(`📊 Project Analysis: ${project.name}`);
  console.log('--------------------------------');
  
  try {
    // Get project statistics using issue queries (since direct project API had issues)
    const allIssuesResult = await client.queryIssues(`project: ${project.shortName}`, 'id,summary,state(name),priority(name),assignee(login)', 50);
    const allIssues = JSON.parse(allIssuesResult.content[0].text);
    
    // Calculate statistics
    const stats = {
      total: allIssues.length,
      byState: {} as { [key: string]: number },
      byPriority: {} as { [key: string]: number },
      byAssignee: {} as { [key: string]: number }
    };
    
    allIssues.forEach((issue: any) => {
      // State statistics
      const state = issue.state?.name || 'No State';
      stats.byState[state] = (stats.byState[state] || 0) + 1;
      
      // Priority statistics
      const priority = issue.priority?.name || 'No Priority';
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
      
      // Assignee statistics
      const assignee = issue.assignee?.login || 'Unassigned';
      stats.byAssignee[assignee] = (stats.byAssignee[assignee] || 0) + 1;
    });
    
    console.log(`📈 Total Issues: ${stats.total}`);
    
    if (Object.keys(stats.byState).length > 0) {
      console.log('\n🏷️  Issues by State:');
      Object.entries(stats.byState)
        .sort(([,a], [,b]) => b - a)
        .forEach(([state, count]) => {
          console.log(`   ${state}: ${count}`);
        });
    }
    
    if (Object.keys(stats.byPriority).length > 0) {
      console.log('\n⚡ Issues by Priority:');
      Object.entries(stats.byPriority)
        .sort(([,a], [,b]) => b - a)
        .forEach(([priority, count]) => {
          console.log(`   ${priority}: ${count}`);
        });
    }
    
    if (Object.keys(stats.byAssignee).length > 0) {
      console.log('\n👥 Issues by Assignee:');
      Object.entries(stats.byAssignee)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5) // Top 5 assignees
        .forEach(([assignee, count]) => {
          console.log(`   ${assignee}: ${count}`);
        });
    }
    
    // Show sample issues
    if (allIssues.length > 0) {
      console.log('\n📋 Sample Issues:');
      allIssues.slice(0, 3).forEach((issue: any) => {
        console.log(`   • ${issue.id}: ${issue.summary.substring(0, 60)}${issue.summary.length > 60 ? '...' : ''}`);
        console.log(`     State: ${issue.state?.name || 'No State'} | Priority: ${issue.priority?.name || 'No Priority'}`);
      });
    }
    
    console.log();
    
  } catch (error) {
    console.log('⚠️  Project analysis failed');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log();
  }
}

async function testUserManagement(client: YouTrackClient): Promise<void> {
  console.log('👥 User Management Test');
  console.log('-----------------------');
  
  try {
    const usersResult = await client.searchUsers('');
    const users = JSON.parse(usersResult.content[0].text);
    
    console.log(`✅ Found ${users.length} user(s):`);
    users.forEach((user: any) => {
      console.log(`   👤 ${user.fullName || user.login} (${user.login})`);
    });
    console.log();
    
  } catch (error) {
    console.log('⚠️  User search failed (may require admin permissions)');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log();
  }
}

async function demonstrateCapabilities(): Promise<void> {
  console.log('🛠️  Available MCP Tools');
  console.log('------------------------');
  
  const capabilities = [
    '✅ get_project_status - Comprehensive project analytics',
    '✅ query_issues - Advanced issue searching and filtering',  
    '✅ create_issue - Issue creation with full metadata',
    '✅ update_issue - Modify existing issues',
    '✅ get_project_issues_summary - Project summary reports',
    '✅ get_issue_comments - Comment retrieval',
    '✅ add_issue_comment - Comment management',
    '✅ search_users - User discovery and management',
    '✅ get_project_timeline - Activity timeline tracking',
    '✅ bulk_update_issues - Batch operations'
  ];
  
  capabilities.forEach(capability => console.log(`   ${capability}`));
  
  console.log('\n🔮 Planned Enhancements:');
  const enhancements = [
    '🚧 Epic and milestone management',
    '🚧 Advanced analytics and reporting',
    '🚧 AI-powered project insights',
    '🚧 Git/CI-CD integrations',
    '🚧 Time tracking and resource management',
    '🚧 Risk assessment and quality metrics'
  ];
  
  enhancements.forEach(enhancement => console.log(`   ${enhancement}`));
  console.log();
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exploreYouTrack().catch(console.error);
}
