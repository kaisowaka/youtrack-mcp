#!/usr/bin/env tsx

import axios from 'axios';

const YOUTRACK_URL = process.env.YOUTRACK_URL || 'https://youtrack.devstroop.com';
const YOUTRACK_TOKEN = process.env.YOUTRACK_TOKEN;

async function checkStates() {
  if (!YOUTRACK_TOKEN) {
    console.error('YOUTRACK_TOKEN not set');
    process.exit(1);
  }

  const baseURL = YOUTRACK_URL.endsWith('/api') ? YOUTRACK_URL : `${YOUTRACK_URL}/api`;
  
  try {
    // Get State bundle
    console.log('Fetching State values...\n');
    const stateRes = await axios.get(`${baseURL}/admin/customFieldSettings/bundles/state`, {
      headers: { 
        'Authorization': `Bearer ${YOUTRACK_TOKEN}`,
        'Accept': 'application/json'
      },
      params: { fields: 'id,name,values(id,name,isResolved)' }
    });

    console.log('Available States:');
    const bundles = Array.isArray(stateRes.data) ? stateRes.data : [stateRes.data];
    bundles.forEach((bundle: any) => {
      console.log(`\nBundle: ${bundle.name || bundle.id}`);
      if (bundle.values) {
        bundle.values.forEach((state: any) => {
          console.log(`  - ${state.name}${state.isResolved ? ' (resolved)' : ''}`);
        });
      }
    });

    // Also check the project's specific state field
    console.log('\n\nFetching project custom fields...\n');
    const projectRes = await axios.get(`${baseURL}/admin/projects/ZIGSE`, {
      headers: { 
        'Authorization': `Bearer ${YOUTRACK_TOKEN}`,
        'Accept': 'application/json'
      },
      params: { fields: 'id,name,customFields(field(name,fieldType(id)),bundle(values(name)))' }
    });

    const stateField = projectRes.data.customFields?.find((f: any) => 
      f.field?.name === 'State' || f.field?.fieldType?.id === 'state[1]'
    );

    if (stateField?.bundle?.values) {
      console.log('Project ZIGSE State values:');
      stateField.bundle.values.forEach((state: any) => {
        console.log(`  - ${state.name}`);
      });
    }

  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkStates();
