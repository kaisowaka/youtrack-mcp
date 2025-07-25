#!/usr/bin/env npx tsx

/**
 * Comprehensive Issue Properties Test
 * Verifies we can access ALL possible YouTrack issue properties
 */

import { YouTrackClient } from '../src/youtrack-client.js';
import { ConfigManager } from '../src/config.js';
import { logger } from '../src/logger.js';

async function testAllIssueProperties() {
  try {
    console.log('🔍 Testing Comprehensive Issue Properties Access...\n');

    // Initialize client
    const config = new ConfigManager();
    const { youtrackUrl, youtrackToken } = config.get();
    const client = new YouTrackClient(youtrackUrl, youtrackToken);

    console.log('1️⃣ Testing issue search with essential fields...');
    const searchResult = await client.searchIssues({
      limit: 3,
      includeAllFields: false
    });
    
    const searchData = JSON.parse(searchResult.content[0].text);
    if (searchData.success && searchData.issues.length > 0) {
      console.log(`✅ Found ${searchData.issues.length} issues with essential fields`);
      const firstIssue = searchData.issues[0];
      console.log(`📋 Issue: ${firstIssue.idReadable} - ${firstIssue.summary}`);
      console.log(`📊 Metadata: ${JSON.stringify(searchData.metadata, null, 2)}`);
      
      console.log('\n2️⃣ Testing single issue with ALL fields...');
      const detailResult = await client.getIssue(firstIssue.id, true);
      const detailData = JSON.parse(detailResult.content[0].text);
      
      if (detailData.success) {
        const issue = detailData.issue;
        console.log(`✅ Retrieved complete issue: ${issue.idReadable}`);
        
        // Test all major property groups
        console.log('\n📝 Testing Property Groups:');
        
        // Core identification
        console.log(`🆔 Core ID Properties:`);
        console.log(`   - id: ${issue.id || 'N/A'}`);
        console.log(`   - idReadable: ${issue.idReadable || 'N/A'}`);
        console.log(`   - numberInProject: ${issue.numberInProject || 'N/A'}`);
        
        // Basic content
        console.log(`📄 Content Properties:`);
        console.log(`   - summary: ${issue.summary ? 'Present' : 'N/A'}`);
        console.log(`   - description: ${issue.description ? 'Present' : 'N/A'}`);
        console.log(`   - wikifiedDescription: ${issue.wikifiedDescription ? 'Present' : 'N/A'}`);
        
        // Project and ownership
        console.log(`👥 Ownership Properties:`);
        console.log(`   - project: ${issue.project ? JSON.stringify(issue.project) : 'N/A'}`);
        console.log(`   - reporter: ${issue.reporter ? issue.reporter.login : 'N/A'}`);
        console.log(`   - updater: ${issue.updater ? issue.updater.login : 'N/A'}`);
        console.log(`   - draftOwner: ${issue.draftOwner ? issue.draftOwner.login : 'N/A'}`);
        
        // Status and workflow
        console.log(`⚡ Status Properties:`);
        console.log(`   - isDraft: ${issue.isDraft ?? 'N/A'}`);
        console.log(`   - resolved: ${issue.resolved ? new Date(issue.resolved).toISOString() : 'N/A'}`);
        
        // Custom fields
        console.log(`🔧 Custom Fields (${issue.customFields?.length || 0} total):`);
        if (issue.customFields && issue.customFields.length > 0) {
          issue.customFields.slice(0, 5).forEach((field: any) => {
            const value = field.value?.name || field.value?.presentation || field.value || 'N/A';
            console.log(`   - ${field.name}: ${value}`);
          });
          if (issue.customFields.length > 5) {
            console.log(`   ... and ${issue.customFields.length - 5} more`);
          }
        }
        
        // Temporal information
        console.log(`⏰ Temporal Properties:`);
        console.log(`   - created: ${issue.created ? new Date(issue.created).toISOString() : 'N/A'}`);
        console.log(`   - updated: ${issue.updated ? new Date(issue.updated).toISOString() : 'N/A'}`);
        
        // Relationships
        console.log(`🔗 Relationship Properties:`);
        console.log(`   - parent: ${issue.parent ? 'Present' : 'N/A'}`);
        console.log(`   - subtasks: ${issue.subtasks?.length || 0} items`);
        console.log(`   - links: ${issue.links?.length || 0} items`);
        console.log(`   - externalIssue: ${issue.externalIssue ? 'Present' : 'N/A'}`);
        
        // Social features
        console.log(`👍 Social Properties:`);
        console.log(`   - tags: ${issue.tags?.length || 0} items`);
        if (issue.tags && issue.tags.length > 0) {
          console.log(`     Tags: ${issue.tags.map((t: any) => t.name).join(', ')}`);
        }
        console.log(`   - votes: ${issue.votes || 0}`);
        console.log(`   - voters: ${issue.voters ? 'Present' : 'N/A'}`);
        console.log(`   - watchers: ${issue.watchers ? 'Present' : 'N/A'}`);
        
        // Comments and communication
        console.log(`💬 Communication Properties:`);
        console.log(`   - comments: ${issue.comments?.length || 0} items`);
        console.log(`   - commentsCount: ${issue.commentsCount || 0}`);
        console.log(`   - pinnedComments: ${issue.pinnedComments?.length || 0} items`);
        
        // Attachments
        console.log(`📎 Attachment Properties:`);
        console.log(`   - attachments: ${issue.attachments?.length || 0} items`);
        if (issue.attachments && issue.attachments.length > 0) {
          issue.attachments.slice(0, 3).forEach((att: any) => {
            console.log(`     - ${att.name} (${att.size} bytes, ${att.mimeType})`);
          });
        }
        
        // Visibility and permissions
        console.log(`🔒 Visibility Properties:`);
        console.log(`   - visibility: ${issue.visibility ? 'Present' : 'N/A'}`);
        
        console.log('\n3️⃣ Testing advanced search with filters...');
        const advancedSearch = await client.searchIssues({
          projectId: issue.project.id,
          includeAllFields: true,
          limit: 2,
          sortBy: 'created',
          sortOrder: 'desc'
        });
        
        const advancedData = JSON.parse(advancedSearch.content[0].text);
        if (advancedData.success) {
          console.log(`✅ Advanced search returned ${advancedData.issues.length} issues`);
          console.log(`🔍 Query used: ${advancedData.query}`);
          console.log(`📊 Filters applied: ${JSON.stringify(advancedData.metadata.filters)}`);
        }
        
        console.log('\n🎯 Property Coverage Analysis:');
        const allProperties = [
          'id', 'idReadable', 'numberInProject', 'summary', 'description', 'wikifiedDescription',
          'project', 'reporter', 'updater', 'draftOwner', 'isDraft', 'resolved', 'customFields',
          'created', 'updated', 'parent', 'subtasks', 'links', 'externalIssue', 'tags', 'votes',
          'voters', 'watchers', 'comments', 'commentsCount', 'pinnedComments', 'attachments', 'visibility'
        ];
        
        const presentProperties = allProperties.filter(prop => issue[prop] !== undefined);
        const missingProperties = allProperties.filter(prop => issue[prop] === undefined);
        
        console.log(`✅ Present properties (${presentProperties.length}/${allProperties.length}): ${presentProperties.join(', ')}`);
        if (missingProperties.length > 0) {
          console.log(`❌ Missing properties: ${missingProperties.join(', ')}`);
        }
        
        const coveragePercent = Math.round((presentProperties.length / allProperties.length) * 100);
        console.log(`📊 Property Coverage: ${coveragePercent}%`);
        
      } else {
        console.log('❌ Failed to get detailed issue:', detailData.error);
      }
      
    } else {
      console.log('❌ No issues found for testing');
    }

    console.log('\n🏁 Comprehensive Issue Properties Test Complete');

  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAllIssueProperties().catch(console.error);
