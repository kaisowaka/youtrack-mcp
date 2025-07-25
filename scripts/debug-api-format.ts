#!/usr/bin/env tsx

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function debugApi() {
  console.log('🔍 Debugging YouTrack API Response Format');
  console.log('=' .repeat(60));

  const url = process.env.YOUTRACK_URL;
  const token = process.env.YOUTRACK_TOKEN;

  try {
    // Get projects with all fields to see what's available
    console.log('\n1. Checking project structure...');
    const projectsResponse = await axios.get(`${url}/api/admin/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'id,name,shortName,description,leader(login,name),archived'
      }
    });

    console.log('✅ Projects response:');
    console.log(JSON.stringify(projectsResponse.data[0], null, 2));

    // Test creating an article WITHOUT project ID
    console.log('\n2. Testing article creation (no project)...');
    try {
      const articleResponse = await axios.post(`${url}/api/articles`, {
        summary: 'Test Article - Simple',
        content: 'This is a test article created without project association.'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('✅ Article creation successful!');
      console.log(`📄 Article ID: ${articleResponse.data.id}`);

    } catch (articleError: any) {
      console.log('❌ Article creation failed:');
      console.log(`Status: ${articleError.response?.status}`);
      console.log(`Error: ${JSON.stringify(articleError.response?.data, null, 2)}`);
    }

    // List all articles to see format
    console.log('\n3. Checking articles format...');
    const articlesResponse = await axios.get(`${url}/api/articles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      params: {
        fields: 'id,summary,content,author(login,fullName),created,project(id,name,shortName)',
        '$top': 3
      }
    });

    console.log('📚 Articles found:');
    articlesResponse.data.forEach((article: any, index: number) => {
      console.log(`${index + 1}. ${article.summary} (ID: ${article.id})`);
      console.log(`   Project: ${article.project?.shortName || 'None'}`);
      console.log(`   Author: ${article.author?.fullName || article.author?.login || 'Unknown'}`);
    });

  } catch (error: any) {
    console.log('❌ Debug failed:', error.message);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

debugApi().catch(console.error);
