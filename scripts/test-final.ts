#!/usr/bin/env node

import { spawn } from 'child_process';

async function testQueryIssues() {
  console.log('🔍 Testing query_issues tool...\n');
  
  const server = spawn('node', ['dist/index.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      YOUTRACK_URL: 'http://youtrack.devstroop',
      YOUTRACK_TOKEN: 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
    }
  });

  let responses = [];
  
  server.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.startsWith('{')) {
        try {
          responses.push(JSON.parse(line));
        } catch (e) {
          // Skip non-JSON lines
        }
      }
    });
  });

  // Initialize
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  }) + '\n');

  await new Promise(resolve => setTimeout(resolve, 500));

  // Query issues
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'query_issues',
      arguments: {
        query: 'project: MYD',
        fields: 'id,summary,state(name)',
        limit: 3
      }
    }
  }) + '\n');

  await new Promise(resolve => setTimeout(resolve, 2000));

  server.stdin.end();
  server.kill();

  console.log('📋 Query Results:');
  const queryResult = responses.find(r => r.id === 2);
  if (queryResult && queryResult.result) {
    console.log(JSON.stringify(queryResult, null, 2));
  } else {
    console.log('No query result found. All responses:', responses);
  }
}

testQueryIssues().catch(console.error);
