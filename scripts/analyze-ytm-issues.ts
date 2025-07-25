#!/usr/bin/env node

import { YouTrackClient } from '../src/youtrack-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function analyzeYTMIssues() {
  try {
    console.log('🔍 Analyzing YTM Issues and Properties');
    
    const client = new YouTrackClient(process.env.YOUTRACK_URL!, process.env.YOUTRACK_TOKEN!);
    
    // Get all issues with comprehensive fields
    const result = await client.queryIssues(
      'project: YTM', 
      'id,summary,description,state,type,priority,assignee(login,fullName),created,updated,customFields(name,value($type,name,id,login,fullName))',
      20
    );
    
    const issues = JSON.parse(result.content[0].text);
    
    console.log(`\n📊 Found ${issues.length} issues in YTM project:`);
    
    issues.forEach((issue: any, index: number) => {
      console.log(`\n${index + 1}. ${issue.id}: ${issue.summary}`);
      
      // Analyze properties
      const properties = {
        description: issue.description ? '✅' : '❌ Missing',
        state: '❓ Check custom fields',
        type: '❓ Check custom fields', 
        priority: '❓ Check custom fields',
        assignee: issue.assignee ? `✅ ${issue.assignee.login}` : '❌ Unassigned',
        created: issue.created ? '✅' : '❌ Missing',
        updated: issue.updated ? '✅' : '❌ Missing'
      };
      
      // Check custom fields
      if (issue.customFields) {
        issue.customFields.forEach((field: any) => {
          const fieldName = field.name.toLowerCase();
          if (fieldName === 'state') {
            properties.state = field.value ? `✅ ${field.value.name}` : '❌ No state';
          } else if (fieldName === 'type') {
            properties.type = field.value ? `✅ ${field.value.name}` : '❌ No type';
          } else if (fieldName === 'priority') {
            properties.priority = field.value ? `✅ ${field.value.name}` : '❌ No priority';
          }
        });
      }
      
      console.log('   Properties:');
      Object.entries(properties).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
      
      // Check for missing custom fields
      const customFieldNames = issue.customFields?.map((f: any) => f.name) || [];
      const expectedFields = ['State', 'Type', 'Priority', 'Assignee'];
      const missingFields = expectedFields.filter(field => !customFieldNames.includes(field));
      
      if (missingFields.length > 0) {
        console.log(`   ❌ Missing custom fields: ${missingFields.join(', ')}`);
      }
    });
    
    // Summary of issues
    console.log('\n📋 Summary of Issues:');
    const issuesWithMissingProps = issues.filter((issue: any) => {
      return !issue.description || 
             !issue.assignee ||
             !issue.customFields?.some((f: any) => f.name === 'State' && f.value) ||
             !issue.customFields?.some((f: any) => f.name === 'Type' && f.value) ||
             !issue.customFields?.some((f: any) => f.name === 'Priority' && f.value);
    });
    
    console.log(`- Total issues: ${issues.length}`);
    console.log(`- Issues with missing properties: ${issuesWithMissingProps.length}`);
    
    if (issuesWithMissingProps.length > 0) {
      console.log('\n🔧 Issues that need attention:');
      issuesWithMissingProps.forEach((issue: any) => {
        console.log(`   ${issue.id}: ${issue.summary}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeYTMIssues();
