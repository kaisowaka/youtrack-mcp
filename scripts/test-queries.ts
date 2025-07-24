#!/usr/bin/env node

import dotenv from 'dotenv';
import { YouTrackClient } from '../src/youtrack-client.js';

dotenv.config();

async function testQueries() {
  const client = new YouTrackClient(process.env.YOUTRACK_URL!, process.env.YOUTRACK_TOKEN!);

  console.log('🔍 Testing basic queries...');

  try {
    console.log('\n1. Querying issues with project info:');
    const result1 = await client.queryIssues('project: MYD', 'id,summary,project(id,name,shortName)', 5);
    console.log(JSON.stringify(JSON.parse(result1.content[0].text), null, 2));
  } catch (e) {
    console.log('Error:', (e as Error).message);
  }

  try {
    console.log('\n2. Trying to query all issues:');
    const result2 = await client.queryIssues('', 'id,summary,project(id,name,shortName)', 3);
    console.log(JSON.stringify(JSON.parse(result2.content[0].text), null, 2));
  } catch (e) {
    console.log('Error:', (e as Error).message);
  }

  try {
    console.log('\n3. Creating a test issue in MYD project:');
    const createResult = await client.createIssue({
      projectId: 'MYD',  // Try short name instead of full ID
      summary: 'Test Issue from MCP Server',
      description: 'This is a test issue created to verify MCP server functionality.',
      type: 'Task',
      priority: 'Normal'
    });
    console.log(JSON.stringify(JSON.parse(createResult.content[0].text), null, 2));
  } catch (e) {
    console.log('Error:', (e as Error).message);
  }
}

testQueries();
