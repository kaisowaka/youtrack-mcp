/**
 * Integration Example: YouTrack MCP Client
 * Demonstrates the new modular architecture and capabilities
 */

import { YouTrackClient } from '../src/api/client.js';

async function demoClient() {
  console.log('YouTrack MCP Client Demo');
  console.log('================================\n');

  // Initialize client
  const client = new YouTrackClient({
    baseURL: process.env.YOUTRACK_URL || 'https://youtrack.devstroop.com',
    token: process.env.YOUTRACK_TOKEN || '',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableCache: true
  });

  try {
    // 1. Project Management
  console.log('Testing Project Management...');
    const projects = await client.projects.listProjects();
  console.log('Projects listing successful');
    console.log(`Found ${JSON.parse(projects.content[0].text).data.items.length} projects\n`);

    // 2. Agile Board Management
  console.log('Testing Agile Board Management...');
    const boards = await client.agile.listAgileBoards({});
  console.log('Agile boards listing successful');
    console.log(`Found ${JSON.parse(boards.content[0].text).data.items.length} boards\n`);

    // 3. Issue Management
  console.log('Testing Issue Management...');
    const issues = await client.issues.queryIssues({
      query: 'State: Open',
      fields: 'id,summary,state',
      limit: 5
    });
  console.log('Issues query successful');
    console.log(`Found ${JSON.parse(issues.content[0].text).data.items.length} open issues\n`);

    // 4. Time Tracking
  console.log('Testing Time Tracking...');
    const workItems = await client.workItems.getWorkItems();
  console.log('Work items listing successful');
    console.log(`Found ${JSON.parse(workItems.content[0].text).data.items.length} work items\n`);

    // 5. Knowledge Base
  console.log('Testing Knowledge Base...');
    const articles = await client.knowledgeBase.listArticles();
  console.log('Knowledge base listing successful');
    console.log(`Found ${JSON.parse(articles.content[0].text).data.items.length} articles\n`);

  console.log('All demos completed successfully.');
  console.log('\nAvailable Capabilities:');
      ['Complete project management','Issue lifecycle management','Agile board management','Time tracking and work items','Knowledge base management','Administrative operations','Advanced analytics and reporting']
        .forEach(c => console.log(c));

  } catch (error) {
    console.error('Demo failed:', error);
  }
}

if (require.main === module) {
  demoClient().catch(console.error);
}

export { demoClient };
