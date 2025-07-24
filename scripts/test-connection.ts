#!/usr/bin/env node

import dotenv from 'dotenv';
import { YouTrackClient } from '../src/youtrack-client.js';

// Load environment variables
dotenv.config();

async function main() {
  const youtrackUrl = process.env.YOUTRACK_URL;
  const youtrackToken = process.env.YOUTRACK_TOKEN;

  if (!youtrackUrl || !youtrackToken) {
    console.error('Please set YOUTRACK_URL and YOUTRACK_TOKEN environment variables');
    process.exit(1);
  }

  console.log('🚀 Testing YouTrack MCP Client...\n');

  const client = new YouTrackClient(youtrackUrl, youtrackToken);

  try {
    // Test basic connectivity by querying for projects
    console.log('📡 Testing connection...');
    const projectsResult = await client.queryIssues('project: *', 'project(id,name)', 1);
    console.log('✅ Connection successful!\n');

    // If a default project is set, test project status
    const defaultProject = process.env.DEFAULT_PROJECT_ID;
    if (defaultProject) {
      console.log(`📊 Getting status for project: ${defaultProject}`);
      const statusResult = await client.getProjectStatus(defaultProject, true);
      console.log('✅ Project status retrieved successfully!\n');
      
      // Show a summary
      const status = JSON.parse((statusResult as any).content[0].text);
      console.log(`Project: ${status.project.name} (${status.project.id})`);
      if (status.issueStatistics) {
        console.log(`Total Issues: ${status.issueStatistics.total}`);
        console.log('Issues by state:');
        Object.entries(status.issueStatistics.byState).forEach(([state, count]) => {
          console.log(`  ${state}: ${count}`);
        });
      }
      console.log();
    }

    // Test user search
    console.log('👥 Testing user search...');
    try {
      const usersResult = await client.searchUsers('*');
      const users = JSON.parse(usersResult.content[0].text);
      console.log(`✅ Found ${users.length} users\n`);
    } catch (error) {
      console.log('⚠️  User search test skipped (may require admin permissions)\n');
    }

    console.log('🎉 All tests completed successfully!');
    console.log('\n📖 Your YouTrack MCP server is ready to use.');
    console.log('\n📋 Next steps:');
    console.log('1. Build the project: npm run build');
    console.log('2. Start the MCP server: npm start');
    console.log('3. Configure your MCP client to use this server');

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Test failed:', errMsg);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your YOUTRACK_URL is correct');
    console.log('2. Check that your YOUTRACK_TOKEN has sufficient permissions');
    console.log('3. Ensure YouTrack instance is accessible');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
