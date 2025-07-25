#!/usr/bin/env node

import { YouTrackClient } from '../src/youtrack-client.js';
import dotenv from 'dotenv';

dotenv.config();

interface ProjectSchema {
  projectId: string;
  projectName: string;
  workflow: {
    defaultState: string;
    progressState: string;
    doneState: string;
  };
  types: {
    available: string[];
    defaults: { [key: string]: string };
  };
  priorities: {
    available: string[];
    default: string;
  };
  assignees: {
    available: string[];
    defaultTeam: string;
  };
  estimationFields: {
    timeFields: string[];
    pointsFields: string[];
    defaultValues: { [key: string]: any };
  };
  uniqueFields: string[];
}

async function analyzeProjectSchemas() {
  try {
    console.log('🔍 Analyzing Project Schemas for Dynamic Issue Management');
    
    const client = new YouTrackClient(process.env.YOUTRACK_URL!, process.env.YOUTRACK_TOKEN!);
    
    // Get all projects to analyze
    const projects = await client.listProjects();
    const targetProjects = projects.filter(p => ['MYD', 'YM', 'YTM'].includes(p.shortName));
    
    console.log(`\n📊 Analyzing ${targetProjects.length} projects: ${targetProjects.map(p => p.shortName).join(', ')}`);
    
    const projectSchemas: ProjectSchema[] = [];
    
    for (const project of targetProjects) {
      console.log(`\n🔍 Analyzing ${project.shortName} (${project.name})`);
      
      const customFields = await client.getProjectCustomFields(project.shortName);
      
      // Extract field information
      const stateField = customFields.find(f => f.field.name.toLowerCase() === 'state');
      const typeField = customFields.find(f => f.field.name.toLowerCase() === 'type');
      const priorityField = customFields.find(f => f.field.name.toLowerCase() === 'priority');
      const assigneeField = customFields.find(f => f.field.name.toLowerCase() === 'assignee');
      
      const states = stateField?.bundle?.values?.map(v => v.name) || [];
      const types = typeField?.bundle?.values?.map(v => v.name) || [];
      const priorities = priorityField?.bundle?.values?.map(v => v.name) || [];
      const assignees = assigneeField?.bundle?.values?.map(v => v.name) || [];
      
      // Identify estimation fields
      const timeFields = customFields
        .filter(f => f.field.fieldType.valueType === 'period' || 
                    f.field.name.toLowerCase().includes('time') ||
                    f.field.name.toLowerCase().includes('estimation'))
        .map(f => f.field.name);
      
      const pointsFields = customFields
        .filter(f => f.field.fieldType.valueType === 'integer' && 
                    (f.field.name.toLowerCase().includes('point') ||
                     f.field.name.toLowerCase().includes('days')))
        .map(f => f.field.name);
      
      // Identify unique fields
      const uniqueFields = customFields
        .filter(f => !['state', 'type', 'priority', 'assignee'].includes(f.field.name.toLowerCase()))
        .map(f => f.field.name);
      
      const schema: ProjectSchema = {
        projectId: project.shortName,
        projectName: project.name,
        workflow: {
          defaultState: states.find(s => s.toLowerCase().includes('open')) || states[0] || 'Open',
          progressState: states.find(s => s.toLowerCase().includes('progress')) || 'In Progress',
          doneState: states.find(s => s.toLowerCase().includes('done') || s.toLowerCase().includes('fixed') || s.toLowerCase().includes('verified')) || 'Done'
        },
        types: {
          available: types,
          defaults: {
            'bug': types.find(t => t.toLowerCase().includes('bug')) || 'Bug',
            'feature': types.find(t => t.toLowerCase().includes('feature') || t.toLowerCase().includes('story')) || 'Feature',
            'task': types.find(t => t.toLowerCase().includes('task')) || 'Task',
            'epic': types.find(t => t.toLowerCase().includes('epic')) || 'Epic'
          }
        },
        priorities: {
          available: priorities,
          default: priorities.find(p => p.toLowerCase().includes('normal')) || priorities[Math.floor(priorities.length/2)] || 'Normal'
        },
        assignees: {
          available: assignees,
          defaultTeam: assignees.find(a => a.toLowerCase().includes('team')) || assignees[0] || ''
        },
        estimationFields: {
          timeFields,
          pointsFields,
          defaultValues: {
            'Story points': 3,
            'Ideal days': 1,
            'Original estimation': 240, // 4 hours in minutes
            'Estimation': '4h'
          }
        },
        uniqueFields
      };
      
      projectSchemas.push(schema);
      
      // Display analysis
      console.log(`  📋 Workflow: ${schema.workflow.defaultState} → ${schema.workflow.progressState} → ${schema.workflow.doneState}`);
      console.log(`  🏷️  Types: ${schema.types.available.join(', ')}`);
      console.log(`  ⚡ Priorities: ${schema.priorities.available.join(', ')}`);
      console.log(`  👥 Assignees: ${schema.assignees.available.join(', ')}`);
      console.log(`  ⏱️  Time Fields: ${schema.estimationFields.timeFields.join(', ')}`);
      console.log(`  📊 Points Fields: ${schema.estimationFields.pointsFields.join(', ')}`);
      console.log(`  🔧 Unique Fields: ${schema.uniqueFields.join(', ')}`);
    }
    
    // Save schemas for dynamic usage
    const schemaContent = `// Auto-generated project schemas for dynamic issue management
export const PROJECT_SCHEMAS = ${JSON.stringify(projectSchemas, null, 2)};

export function getProjectSchema(projectId: string) {
  return PROJECT_SCHEMAS.find(schema => schema.projectId === projectId);
}

export function getDefaultIssueProperties(projectId: string, issueType: 'bug' | 'feature' | 'task' | 'epic' = 'task') {
  const schema = getProjectSchema(projectId);
  if (!schema) return null;
  
  return {
    state: schema.workflow.defaultState,
    type: schema.types.defaults[issueType] || schema.types.available[0],
    priority: schema.priorities.default,
    assignee: schema.assignees.defaultTeam,
    estimationValues: schema.estimationFields.defaultValues
  };
}
`;
    
    await import('fs').then(fs => {
      fs.writeFileSync('src/project-schemas.ts', schemaContent);
    });
    
    console.log(`\n✅ Generated dynamic project schemas saved to src/project-schemas.ts`);
    console.log(`\n🚀 Ready to implement dynamic issue management across all projects!`);
    
    return projectSchemas;
    
  } catch (error) {
    console.error('❌ Schema analysis failed:', error);
  }
}

// Run the analysis
analyzeProjectSchemas();
