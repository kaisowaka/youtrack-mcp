#!/usr/bin/env node

import { YouTrackClient } from '../src/youtrack-client.js';
import { logger } from '../src/logger.js';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

async function debugYTMIssueCreation() {
  try {
    console.log('🔍 Debugging YTM Issue Creation');
    
    const youtrackUrl = process.env.YOUTRACK_URL!;
    const youtrackToken = process.env.YOUTRACK_TOKEN!;
    
    const client = new YouTrackClient(youtrackUrl, youtrackToken);
    
    // Get project details
    const validation = await client.validateProject('YTM');
    console.log('Project ID:', validation.project.id);
    
    // Get custom fields
    const customFields = await client.getProjectCustomFields('YTM');
    console.log('\nCustom fields:');
    customFields.forEach(field => {
      console.log(`- ${field.field.name} (${field.field.fieldType.valueType})`);
      if (field.bundle?.values) {
        console.log(`  Values: ${field.bundle.values.map(v => v.name).join(', ')}`);
      }
    });
    
    // Test direct API call to create issue
    console.log('\n🔬 Testing direct API call...');
    
    const api = axios.create({
      baseURL: `${youtrackUrl}/api`,
      headers: {
        'Authorization': `Bearer ${youtrackToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
    
    // Try minimal issue creation
    const minimalIssueData = {
      project: { id: validation.project.id },
      summary: 'Minimal Test Issue'
    };
    
    console.log('Request payload:', JSON.stringify(minimalIssueData, null, 2));
    
    try {
      const response = await api.post('/issues', minimalIssueData, {
        params: {
          fields: 'id,summary,project(id,name)',
        },
      });
      console.log('✅ Direct API call successful:', response.data);
    } catch (error) {
      console.log('❌ Direct API call failed:');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
        console.log('Headers:', error.response.headers);
      } else {
        console.log('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugYTMIssueCreation();
