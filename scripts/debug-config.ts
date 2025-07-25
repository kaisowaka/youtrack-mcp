#!/usr/bin/env npx tsx

/**
 * Debug configuration and test basic connectivity
 */
import { ConfigManager } from '../src/config.js';
import { YouTrackClientFixed } from '../src/youtrack-client-fixed.js';

async function debugConfiguration() {
  console.log('🔧 Debugging YouTrack Configuration...\n');

  // Check config loading
  const configManager = new ConfigManager();
  const config = configManager.get();

  console.log('📋 Configuration Status:');
  console.log(`   YouTrack URL: ${config.youtrackUrl || 'NOT SET'}`);
  console.log(`   Token: ${config.youtrackToken ? '***' + config.youtrackToken.slice(-4) : 'NOT SET'}`);
  console.log(`   Project ID: ${config.defaultProjectId || 'NOT SET'}`);

  if (!config.youtrackUrl || !config.youtrackToken) {
    console.error('\n❌ Configuration incomplete. Please check:');
    console.error('   1. YOUTRACK_URL environment variable');
    console.error('   2. YOUTRACK_TOKEN environment variable');
    console.error('   3. .env file in project root');
    return;
  }

  // Test basic client creation
  console.log('\n🔌 Testing Client Creation...');
  try {
    const client = new YouTrackClientFixed(config.youtrackUrl, config.youtrackToken);
    console.log('✅ Client created successfully');

    // Test a simple query that doesn't require special permissions
    console.log('\n🧪 Testing Basic API Connectivity...');
    
    // Try to list issues with a very simple query
    const issuesResponse = await client.queryIssues('', 'id,summary', 1);
    console.log('✅ Basic API connectivity test passed');
    
    const issues = JSON.parse(issuesResponse.content[0].text);
    console.log(`   Found ${issues.length} issue(s) in the system`);

  } catch (error) {
    console.error(`❌ Client test failed: ${error}`);
    console.error('\nPossible issues:');
    console.error('   • Check YouTrack URL is accessible');
    console.error('   • Verify token has required permissions');
    console.error('   • Ensure YouTrack instance is running');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  debugConfiguration().catch(console.error);
}
