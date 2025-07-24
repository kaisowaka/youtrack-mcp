#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';

async function testMCPServer() {
  console.log('🚀 Testing YouTrack MCP Server...\n');
  
  // Start the MCP server
  const server = spawn('node', ['dist/index.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      YOUTRACK_URL: 'http://youtrack.devstroop',
      YOUTRACK_TOKEN: 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA'
    }
  });

  let serverOutput = '';
  let serverErrors = '';

  server.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });

  server.stderr.on('data', (data) => {
    serverErrors += data.toString();
  });

  // Test 1: Initialize the server
  console.log('1. Testing server initialization...');
  const initMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  server.stdin.write(JSON.stringify(initMessage) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: List available tools
  console.log('2. Testing tools list...');
  const toolsMessage = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };

  server.stdin.write(JSON.stringify(toolsMessage) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Call a tool (query issues)
  console.log('3. Testing youtrack_query_issues tool...');
  const queryMessage = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'youtrack_query_issues',
      arguments: {
        query: 'project: MYD',
        fields: 'id,summary,state(name)',
        limit: 3
      }
    }
  };

  server.stdin.write(JSON.stringify(queryMessage) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Close the server
  server.stdin.end();
  server.kill();

  // Show results
  console.log('\n📋 Server Output:');
  if (serverOutput) {
    const lines = serverOutput.trim().split('\n');
    lines.forEach(line => {
      try {
        const parsed = JSON.parse(line);
        console.log(JSON.stringify(parsed, null, 2));
        console.log('---');
      } catch (e) {
        console.log('Raw:', line);
      }
    });
  }

  if (serverErrors) {
    console.log('\n⚠️  Server Errors:');
    console.log(serverErrors);
  }

  console.log('\n✅ MCP Server test completed!');
}

testMCPServer().catch(console.error);
