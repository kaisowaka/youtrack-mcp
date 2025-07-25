#!/usr/bin/env npx tsx

/**
 * Test script for the new custom fields architecture
 * This tests the critical fixes we just implemented
 */

import { YouTrackClient } from '../src/youtrack-client.js';
import { ConfigManager } from '../src/config.js';
import { logger } from '../src/logger.js';

async function testCustomFieldsArchitecture() {
  try {
    console.log('🧪 Testing Custom Fields Architecture...\n');

    // Initialize client
    const config = new ConfigManager();
    const { youtrackUrl, youtrackToken } = config.get();
    const client = new YouTrackClient(youtrackUrl, youtrackToken);

    // Test 1: List projects (should work)
    console.log('1️⃣ Testing project listing...');
    try {
      const projects = await client.listProjects();
      console.log(`✅ Found ${projects.length} projects`);
      
      if (projects.length > 0) {
        const testProject = projects[0];
        console.log(`📁 Using test project: ${testProject.name} (${testProject.id})\n`);

        // Test 2: Get project custom fields
        console.log('2️⃣ Testing custom fields discovery...');
        try {
          const customFields = await client.getProjectCustomFields(testProject.id);
          console.log(`✅ Found ${customFields.length} custom fields`);
          
          // Display first few custom fields
          customFields.slice(0, 3).forEach(field => {
            console.log(`   - ${field.field.name} (${field.field.fieldType.valueType})`);
            if (field.bundle?.values && field.bundle.values.length > 0) {
              console.log(`     Values: ${field.bundle.values.slice(0, 3).map(v => v.name).join(', ')}${field.bundle.values.length > 3 ? '...' : ''}`);
            }
          });
          console.log('');

          // Test 3: Test issue creation with proper custom fields
          console.log('3️⃣ Testing issue creation with custom fields...');
          
          // Find Type and Priority fields for testing
          const typeField = customFields.find(f => f.field.name.toLowerCase().includes('type'));
          const priorityField = customFields.find(f => f.field.name.toLowerCase().includes('priority'));
          
          const testIssueParams = {
            projectId: testProject.id,
            summary: `🧪 Test Issue - Custom Fields Architecture Test ${new Date().toISOString()}`,
            description: 'This is a test issue created to verify the new custom fields architecture is working correctly.',
            type: typeField?.bundle?.values?.[0]?.name || 'Task',
            priority: priorityField?.bundle?.values?.[0]?.name || 'Normal'
          };

          console.log('📝 Creating test issue with:');
          console.log(`   Project: ${testProject.name}`);
          console.log(`   Type: ${testIssueParams.type}`);
          console.log(`   Priority: ${testIssueParams.priority}`);

          const createResult = await client.createIssue(testIssueParams);
          const resultData = JSON.parse(createResult.content[0].text);
          
          if (resultData.success) {
            console.log(`✅ Issue created successfully: ${resultData.issue.id}`);
            console.log(`   Summary: ${resultData.issue.summary}`);
            
            // Test 4: Test issue update
            console.log('\n4️⃣ Testing issue update with custom fields...');
            
            const updateResult = await client.updateIssue(resultData.issue.id, {
              summary: `🔄 Updated: ${testIssueParams.summary}`,
              priority: priorityField?.bundle?.values?.[1]?.name || 'High'
            });
            
            const updateData = JSON.parse(updateResult.content[0].text);
            if (updateData.success) {
              console.log('✅ Issue updated successfully');
            } else {
              console.log('❌ Issue update failed:', updateData.error);
            }
          } else {
            console.log('❌ Issue creation failed:', resultData.error);
            console.log('🔍 Error details:', resultData.details);
          }

        } catch (error) {
          console.log('❌ Custom fields discovery failed:', (error as Error).message);
        }
      } else {
        console.log('⚠️ No projects found to test with');
      }

    } catch (error) {
      console.log('❌ Project listing failed:', (error as Error).message);
    }

    console.log('\n🏁 Custom Fields Architecture Test Complete');

  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCustomFieldsArchitecture().catch(console.error);
