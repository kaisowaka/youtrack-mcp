#!/usr/bin/env node

import { YouTrackClient } from '../src/youtrack-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function simpleIssueCreation() {
  try {
    console.log('🧪 Simple Issue Creation Test');
    
    const client = new YouTrackClient(process.env.YOUTRACK_URL!, process.env.YOUTRACK_TOKEN!);
    
    // Create issue without custom fields first
    console.log('\n1️⃣ Testing issue creation without custom fields...');
    
    // Override the createIssue method temporarily to bypass custom fields
    const originalCreateIssue = client.createIssue.bind(client);
    
    // Create a simplified version
    const createIssueSimple = async (params: any) => {
      const projectId = await (client as any).resolveProjectId(params.projectId);
      
      const issueData: any = {
        project: { id: projectId },
        summary: params.summary,
      };
      
      if (params.description?.trim()) {
        issueData.description = params.description.trim();
      }
      
      console.log('Making API call with data:', JSON.stringify(issueData, null, 2));
      
      const response = await (client as any).api.post('/issues', issueData, {
        params: {
          fields: 'id,summary,project(id,name)',
        },
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issue: response.data,
            message: `Issue created successfully: ${response.data.id}`
          }, null, 2)
        }],
      };
    };
    
    const result = await createIssueSimple({
      projectId: 'YTM',
      summary: 'Test Issue via Simplified Client',
      description: 'Testing the simplified issue creation path'
    });
    
    console.log('✅ Success:', result);
    
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

simpleIssueCreation();
