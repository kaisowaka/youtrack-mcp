#!/usr/bin/env node

import { YouTrackClient } from '../src/youtrack-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    console.log('🔍 Checking YTM Issue Details');
    
    const client = new YouTrackClient(process.env.YOUTRACK_URL!, process.env.YOUTRACK_TOKEN!);
    
    // Get detailed information about the test issue
    const result = await client.queryIssues(
      'project: YTM id: 3-179', 
      'id,summary,description,customFields(name,value($type,name,id,login,fullName))'
    );
    
    const issue = JSON.parse(result.content[0].text)[0];
    
    console.log('\n📋 Issue Details:');
    console.log(`ID: ${issue.id}`);
    console.log(`Summary: ${issue.summary}`);
    console.log(`Description: ${issue.description || 'Not set'}`);
    
    console.log('\n🏷️ Custom Fields:');
    if (issue.customFields && issue.customFields.length > 0) {
      issue.customFields.forEach(field => {
        const value = field.value 
          ? (field.value.name || field.value.login || field.value.fullName || JSON.stringify(field.value))
          : 'Not set';
        console.log(`  ${field.name}: ${value}`);
      });
    } else {
      console.log('  No custom fields found');
    }
    
    // Check what might be missing
    console.log('\n🔍 Analysis:');
    const expectedFields = ['State', 'Type', 'Priority', 'Assignee'];
    const actualFields = issue.customFields?.map(f => f.name) || [];
    
    expectedFields.forEach(fieldName => {
      const field = issue.customFields?.find(f => f.name === fieldName);
      if (!field) {
        console.log(`  ❌ Missing field: ${fieldName}`);
      } else if (!field.value) {
        console.log(`  ⚠️  Field ${fieldName} has no value`);
      } else {
        console.log(`  ✅ Field ${fieldName}: ${field.value.name || field.value.login || 'Set'}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
