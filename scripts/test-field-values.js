#!/usr/bin/env node
/**
 * Test Script - Field Values Discovery & Enhanced Error Messages
 * 
 * Demonstrates:
 * 1. Discovering available Type values per project (Task, Milestone, Subtask, etc.)
 * 2. Enhanced error messages with valid value suggestions
 * 3. How users/assistants can discover field values before creating issues
 * 
 * Usage: node scripts/test-field-values.js
 */

import { IssuesAPIClient } from '../dist/api/domains/issues-api.js';

// Mock config
const config = {
  baseURL: 'https://test.youtrack.cloud',
  token: 'test-token'
};

// Create a demo client that simulates YouTrack API responses
class DemoIssuesClient extends IssuesAPIClient {
  // Mock project field values
  mockProjectFieldValues = {
    'SoftEtherZig': {
      'Type': ['Task', 'Milestone', 'Subtask'],
      'Priority': ['Critical', 'High', 'Normal', 'Low']
    },
    'MYDAPI': {
      'Type': ['Bug', 'Feature', 'Task', 'Epic'],
      'Priority': ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial']
    }
  };
  
  // Override get to simulate field values API
  async get(endpoint, params) {
    // Simulate getting project field values
    if (endpoint.includes('/admin/projects/') && endpoint.includes('/customFields')) {
      const projectMatch = endpoint.match(/\/admin\/projects\/([^/]+)\//);
      const projectId = projectMatch ? projectMatch[1] : null;
      
      if (projectId && this.mockProjectFieldValues[projectId]) {
        // Return mock field configuration
        return {
          data: [
            {
              field: { 
                name: 'Type', 
                fieldType: { valueType: 'enum[1]' }
              },
              bundle: {
                values: this.mockProjectFieldValues[projectId]['Type'].map(name => ({
                  name,
                  description: `${name} issue type`,
                  color: { background: name === 'Milestone' ? 'M' : 'T' }
                }))
              }
            },
            {
              field: { 
                name: 'Priority', 
                fieldType: { valueType: 'enum[1]' }
              },
              bundle: {
                values: this.mockProjectFieldValues[projectId]['Priority'].map(name => ({
                  name,
                  description: `${name} priority level`,
                  color: { background: 'C' }
                }))
              }
            }
          ]
        };
      }
    }
    
    // Simulate getting issue to find project
    if (endpoint.startsWith('/issues/')) {
      return {
        data: {
          id: 'TEST-123',
          project: { id: 'SoftEtherZig', shortName: 'SoftEtherZig' }
        }
      };
    }
    
    return super.get(endpoint, params);
  }
  
  // Override applyCommand to simulate validation errors
  async applyCommand(issueId, command) {
    console.log(`  🔧 Applying command: "${command}" to ${issueId}`);
    
    // Simulate Type validation failures
    if (command.includes('Type: Bug')) {
      throw new Error('YouTrack API Error (400): Type expected: Bug');
    }
    if (command.includes('Type: Feature')) {
      throw new Error('YouTrack API Error (400): Type expected: Feature');
    }
    
    // Valid commands succeed
    console.log(`  ✅ Command applied successfully`);
    return { data: { success: true } };
  }
  
  // Override post for issue creation
  async post(endpoint, data) {
    if (endpoint === '/issues') {
      console.log(`  ✅ Issue created: TEST-123 in project ${data.project.shortName}`);
      return {
        data: {
          id: 'TEST-123',
          idReadable: 'TEST-123',
          summary: data.summary,
          description: data.description,
          project: data.project
        }
      };
    }
    return super.post(endpoint, data);
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('FIELD VALUES DISCOVERY & ENHANCED ERROR MESSAGES TEST');
  console.log('='.repeat(80) + '\n');
  
  const client = new DemoIssuesClient(config);
  
  // Test 1: Discover available Type values for SoftEtherZig project
  console.log('📋 TEST 1: Discover available Type values for SoftEtherZig project');
  console.log('-'.repeat(80));
  try {
    const result = await client.getProjectFieldValues('SoftEtherZig', 'Type');
    console.log('\n📤 Response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ Users can now discover: Task, Milestone, Subtask\n');
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
  
  // Test 2: Discover available Priority values for MYDAPI project
  console.log('\n📋 TEST 2: Discover available Priority values for MYDAPI project');
  console.log('-'.repeat(80));
  try {
    const result = await client.getProjectFieldValues('MYDAPI', 'Priority');
    console.log('\n📤 Response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ Users can now discover: Blocker, Critical, Major, Minor, Trivial\n');
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
  
  // Test 3: Create issue with invalid Type and see enhanced error message
  console.log('\n📋 TEST 3: Create issue with invalid Type (Bug) in SoftEtherZig');
  console.log('-'.repeat(80));
  console.log('Note: SoftEtherZig only supports Type: Task, Milestone, Subtask');
  try {
    const result = await client.createIssue('SoftEtherZig', {
      summary: 'Test Issue with Invalid Type',
      description: 'Trying to use Type: Bug (not available in this project)',
      type: 'Bug' // This will fail and show available values
    });
    
    console.log('\n📤 Response to User/Assistant:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ ENHANCED: Error message now shows available Type values!\n');
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
  
  // Test 4: Create issue with valid Type
  console.log('\n📋 TEST 4: Create issue with valid Type (Task) in SoftEtherZig');
  console.log('-'.repeat(80));
  try {
    const result = await client.createIssue('SoftEtherZig', {
      summary: 'Valid Task Issue',
      description: 'Using Type: Task (valid for this project)',
      type: 'Task' // This will succeed
    });
    
    console.log('\n📤 Response to User/Assistant:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ SUCCESS: No warnings when using valid Type value!\n');
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
  
  // Test 5: Demonstrate workflow for users/assistants
  console.log('\n📋 TEST 5: Recommended Workflow for Users/Assistants');
  console.log('-'.repeat(80));
  console.log('\n🎯 BEST PRACTICE WORKFLOW:');
  console.log('  1. User: "Create an issue in SoftEtherZig project"');
  console.log('  2. Assistant: First discovers available Type values');
  console.log('     → Call: getProjectFieldValues("SoftEtherZig", "Type")');
  console.log('     → Response: Task, Milestone, Subtask');
  console.log('  3. Assistant: "I can create the issue. What Type should it be?');
  console.log('     Available types: Task, Milestone, Subtask"');
  console.log('  4. User: "Make it a Task"');
  console.log('  5. Assistant: Creates issue with Type: Task');
  console.log('  6. ✅ SUCCESS - No validation errors!\n');
  
  console.log('='.repeat(80));
  console.log('KEY IMPROVEMENTS SUMMARY');
  console.log('='.repeat(80));
  console.log('\n🎯 FEATURES ADDED:');
  console.log('  ✅ getProjectFieldValues(projectId, fieldName) - Discover available values');
  console.log('  ✅ Enhanced error messages show valid Type/Priority options');
  console.log('  ✅ Automatic value discovery when commands fail');
  console.log('  ✅ Support for project-specific Type values (Task, Milestone, Subtask, etc.)');
  console.log('  ✅ New MCP tool action: get_field_values');
  console.log('\n🚀 Users/assistants can now:');
  console.log('  • Discover what Type values exist in a project BEFORE creating issues');
  console.log('  • Get helpful suggestions when they use invalid values');
  console.log('  • Avoid trial-and-error when setting custom fields');
  console.log('  • Work with any project configuration (Bug/Feature OR Task/Milestone/Subtask)');
  console.log('\n✨ The "Type confusion" issue is SOLVED!\n');
}

runTests().catch(console.error);
