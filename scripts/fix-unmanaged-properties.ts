#!/usr/bin/env node

import { YouTrackClient } from '../src/youtrack-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixUnmanagedProperties() {
  try {
    console.log('🔧 Fixing Unmanaged Properties in YTM Project');
    
    const client = new YouTrackClient(process.env.YOUTRACK_URL!, process.env.YOUTRACK_TOKEN!);
    
    // Get all issues in YTM project
    const issuesResult = await client.queryIssues(
      'project: YTM', 
      'id,summary,description,customFields(name,value($type,name,id,login,fullName))',
      20
    );
    
    const issues = JSON.parse(issuesResult.content[0].text);
    console.log(`\n📊 Found ${issues.length} issues to analyze`);
    
    const fixes: Array<{issueId: string, updates: any}> = [];
    
    for (const issue of issues) {
      console.log(`\n🔍 Analyzing ${issue.id}: ${issue.summary}`);
      
      const updates: any = {};
      const currentFields: any = {};
      
      // Parse current custom fields
      if (issue.customFields) {
        issue.customFields.forEach(field => {
          currentFields[field.name.toLowerCase()] = field.value;
        });
      }
      
      // Check for missing or unset properties
      const checks = [
        {
          field: 'state',
          defaultValue: 'Open',
          check: () => !currentFields.state || !currentFields.state.name
        },
        {
          field: 'type', 
          defaultValue: 'Task',
          check: () => !currentFields.type || !currentFields.type.name
        },
        {
          field: 'priority',
          defaultValue: 'Normal', 
          check: () => !currentFields.priority || !currentFields.priority.name
        }
      ];
      
      checks.forEach(({ field, defaultValue, check }) => {
        if (check()) {
          console.log(`  ❌ Missing ${field}, will set to: ${defaultValue}`);
          updates[field] = defaultValue;
        } else {
          console.log(`  ✅ ${field}: ${currentFields[field]?.name || 'Set'}`);
        }
      });
      
      // Check description
      if (!issue.description || issue.description.trim() === '') {
        console.log(`  ❌ Missing description, will add default`);
        updates.description = `This issue was created as part of YouTrack MCP server testing and validation.`;
      } else {
        console.log(`  ✅ Description: Present`);
      }
      
      // Apply fixes if needed
      if (Object.keys(updates).length > 0) {
        fixes.push({ issueId: issue.id, updates });
        console.log(`  🔧 Will apply ${Object.keys(updates).length} fixes`);
      } else {
        console.log(`  ✅ No fixes needed`);
      }
    }
    
    // Apply all fixes
    if (fixes.length > 0) {
      console.log(`\n🚀 Applying fixes to ${fixes.length} issues...`);
      
      for (const fix of fixes) {
        try {
          console.log(`\n🔧 Updating ${fix.issueId}...`);
          await client.updateIssue(fix.issueId, fix.updates);
          console.log(`  ✅ Successfully updated ${fix.issueId}`);
        } catch (error) {
          console.log(`  ❌ Failed to update ${fix.issueId}: ${error.message}`);
        }
      }
      
      console.log(`\n✨ Completed fixes. Updated ${fixes.length} issues.`);
    } else {
      console.log(`\n✅ All issues are properly managed - no fixes needed!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixUnmanagedProperties();
