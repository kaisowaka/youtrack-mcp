#!/usr/bin/env node

import { YouTrackClient } from '../src/youtrack-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function debugCustomFields() {
  try {
    console.log('🔍 Debugging Custom Fields Issue Creation');
    
    const client = new YouTrackClient(process.env.YOUTRACK_URL!, process.env.YOUTRACK_TOKEN!);
    
    // Get custom fields for YTM
    const customFields = await client.getProjectCustomFields('YTM');
    console.log('\nAvailable custom fields:');
    customFields.forEach(field => {
      console.log(`- ${field.field.name}: ${field.field.fieldType.valueType}`);
      if (field.bundle?.values) {
        console.log(`  Values: ${field.bundle.values.map(v => `"${v.name}"`).join(', ')}`);
      }
    });
    
    // Find the fields we want to set
    const typeField = customFields.find(f => f.field.name.toLowerCase() === 'type');
    const priorityField = customFields.find(f => f.field.name.toLowerCase() === 'priority');
    
    console.log('\nField mapping:');
    console.log('Type field:', typeField?.field.name);
    console.log('Priority field:', priorityField?.field.name);
    
    // Test the exact custom fields payload that would be created
    const customFieldValues: any[] = [];
    
    if (typeField) {
      customFieldValues.push({
        name: typeField.field.name,
        value: { name: 'Task' }
      });
    }
    
    if (priorityField) {
      customFieldValues.push({
        name: priorityField.field.name,
        value: { name: 'Normal' }
      });
    }
    
    console.log('\nCustom fields payload:', JSON.stringify(customFieldValues, null, 2));
    
    // Test direct API call with custom fields
    const projectId = '0-2'; // We know this from previous tests
    
    const issueData = {
      project: { id: projectId },
      summary: 'Test with Custom Fields',
      description: 'Testing explicit custom fields',
      customFields: customFieldValues
    };
    
    console.log('\nFull issue payload:', JSON.stringify(issueData, null, 2));
    
    // Make the API call directly
    try {
      const response = await (client as any).api.post('/issues', issueData, {
        params: {
          fields: 'id,summary,description,project(id,name,shortName),customFields(name,value($type,id,name))',
        },
      });
      console.log('✅ Direct API call with custom fields successful:', response.data.id);
    } catch (error: any) {
      console.log('❌ Direct API call failed:');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugCustomFields();
