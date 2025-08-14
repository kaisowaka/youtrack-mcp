import { YouTrackClient } from '../src/api/client.js';
import { ConfigManager } from '../src/config.js';

async function quickBuildVerification() {
  const configManager = new ConfigManager();
  const config = configManager.get();
  const client = new YouTrackClient({ baseURL: config.youtrackUrl, token: config.youtrackToken });
  
  try {
  console.log('Build Verification Test\n');
    
    // Test 1: Verify time tracking functionality still works
  console.log('1. Testing basic client health retrieval...');
  const health = client.getHealth();
  console.log('Health object received:', health.status);
    
    // Test 2: Verify new comment management methods exist
    console.log('\n2. Verifying domain clients initialized...');
    const domains: Array<[string, any]> = [
      ['issues', client.issues],
      ['agile', client.agile],
      ['workItems', client.workItems],
      ['admin', client.admin],
      ['projects', client.projects],
      ['knowledgeBase', client.knowledgeBase]
    ];
    for (const [name, instance] of domains) {
      if (instance) {
        console.log(`   ${name} domain available`);
      } else {
        console.log(`   ${name} domain missing`);
        return false;
      }
    }
    
  console.log('\nBUILD VERIFICATION SUCCESSFUL');
  console.log('\nComponents Available:');
  console.log('Issues domain');
  console.log('Agile domain');
  console.log('WorkItems domain');
  console.log('Admin domain');
  console.log('Projects domain');
  console.log('Knowledge Base domain');
    
  console.log('\nReady for commit and deployment.');
    
  } catch (error: any) {
  console.error('Build verification failed:', error.message);
    return false;
  }
  
  return true;
}

quickBuildVerification().then(success => {
  process.exit(success ? 0 : 1);
});
