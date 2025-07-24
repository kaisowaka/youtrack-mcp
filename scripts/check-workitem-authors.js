#!/usr/bin/env node

/**
 * Check actual work item authors
 */

import axios from 'axios';

const BASE_URL = 'https://youtrack.devstroop.com';
const TOKEN = 'perm-YWRtaW4=.NDItMA==.GVBVbuwvJFafEShv8knLTrtT7A0TPA';

async function checkWorkItemAuthors() {
  console.log('🔍 Checking actual work item authors...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/workItems`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      params: {
        query: 'created: 2025-07-01 .. 2025-07-31',
        fields: 'id,issue(id,summary),author(login,fullName,email),date,duration(minutes,presentation)',
        $top: 10
      }
    });
    
    console.log(`Found ${response.data.length} work items:`);
    
    const authors = new Set();
    response.data.forEach((item, index) => {
      const author = item.author;
      if (author) {
        authors.add(author.login);
        console.log(`${index + 1}. ${item.id}: author login="${author.login}", fullName="${author.fullName}", email="${author.email || 'No email'}"`);
      } else {
        console.log(`${index + 1}. ${item.id}: No author`);
      }
    });
    
    console.log(`\nUnique author logins: ${Array.from(authors).join(', ')}`);
    
    // Test with the actual author
    if (authors.size > 0) {
      const firstAuthor = Array.from(authors)[0];
      console.log(`\n🧪 Testing query with actual author: "${firstAuthor}"`);
      
      const testResponse = await axios.get(`${BASE_URL}/api/workItems`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params: {
          query: `author: ${firstAuthor} created: 2025-07-01 .. 2025-07-31`,
          fields: 'id,issue(id,summary),author(login,fullName)',
          $top: 5
        }
      });
      
      console.log(`✅ Found ${testResponse.data.length} work items for author ${firstAuthor}`);
    }
    
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.error_description || error.message}`);
  }
}

checkWorkItemAuthors().catch(console.error);
