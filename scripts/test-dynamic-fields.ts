#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { YouTrackClient } from '../src/youtrack-client.js';
import { logger } from '../src/logger.js';

// Load environment variables
dotenv.config();

async function testDynamicFields() {
  try {
    const youtrackUrl = process.env.YOUTRACK_URL;
    const youtrackToken = process.env.YOUTRACK_TOKEN;

    if (!youtrackUrl || !youtrackToken) {
      throw new Error('Please set YOUTRACK_URL and YOUTRACK_TOKEN environment variables');
    }

    logger.info('=== Testing Dynamic Field Management Across All Projects ===');
    const client = new YouTrackClient(youtrackUrl, youtrackToken);

    // First, get all available projects
    logger.info('\n0. Discovering all available projects...');
    const allProjects = await client.listProjects();
    console.log(`Found ${allProjects.length} projects:`);
    allProjects.forEach((project: any, index: number) => {
      console.log(`  ${index + 1}. ${project.shortName} - ${project.name}`);
    });

    // Test dynamic field discovery for multiple projects
    const projectsToTest = allProjects.slice(0, 5); // Test first 5 projects to avoid overwhelming output
    
    for (let i = 0; i < projectsToTest.length; i++) {
      const project = projectsToTest[i];
      logger.info(`\n${i + 1}. Testing dynamic field discovery for ${project.shortName} (${project.name})...`);
      
      try {
        const projectFields = await client.discoverProjectFields(project.shortName);
        const fieldData = JSON.parse(projectFields.content[0].text);
        
        console.log(`\n=== ${project.shortName} Field Analysis ===`);
        console.log(`Project: ${fieldData.projectInfo.name} (${fieldData.projectInfo.shortName})`);
        console.log(`Total Fields: ${fieldData.summary.totalFields}`);
        console.log(`Required Fields: ${fieldData.summary.requiredFields}`);
        console.log(`Optional Fields: ${fieldData.summary.optionalFields}`);
        console.log(`Field Types: ${fieldData.summary.fieldTypes.join(', ')}`);
        
        // Show field names and types
        console.log('\nFields:');
        fieldData.fields.forEach((field: any, idx: number) => {
          const fieldType = field.$type.replace('ProjectCustomField', '');
          console.log(`  ${idx + 1}. ${field.field.name} (${fieldType}) - ${field.canBeEmpty ? 'Optional' : 'Required'}`);
        });
        
      } catch (error) {
        logger.error(`Failed to discover fields for ${project.shortName}:`, { error: (error as Error).message });
      }
    }

    // Cross-project field analysis
    logger.info('\n=== Cross-Project Field Analysis ===');
    if (projectsToTest.length >= 2) {
      try {
        console.log('\nComparing field configurations between first two projects...');
        const comparison = await client.compareProjectFields(
          projectsToTest[0].shortName, 
          projectsToTest[1].shortName
        );
        const compData = JSON.parse(comparison.content[0].text);
        
        console.log(`\n=== Field Comparison: ${compData.project1.shortName} vs ${compData.project2.shortName} ===`);
        console.log(`Common Fields (${compData.comparison.commonFields.length}): ${compData.comparison.commonFields.join(', ')}`);
        console.log(`Unique to ${compData.project1.shortName} (${compData.comparison.uniqueToProject1.length}): ${compData.comparison.uniqueToProject1.join(', ')}`);
        console.log(`Unique to ${compData.project2.shortName} (${compData.comparison.uniqueToProject2.length}): ${compData.comparison.uniqueToProject2.join(', ')}`);
        console.log(`Similarity: ${compData.comparison.similarity}%`);
        
      } catch (error) {
        logger.error('Failed to compare project fields:', { error: (error as Error).message });
      }
    }

    // Sample field values analysis
    if (projectsToTest.length > 0) {
      const firstProject = projectsToTest[0];
      logger.info(`\n=== Field Values Analysis for ${firstProject.shortName} ===`);
      
      // Test common fields that are likely to exist
      const commonFields = ['Priority', 'State', 'Type'];
      
      for (const fieldName of commonFields) {
        try {
          console.log(`\n--- ${fieldName} Values ---`);
          const fieldValues = await client.getProjectFieldValues(firstProject.shortName, fieldName);
          const valueData = JSON.parse(fieldValues.content[0].text);
          
          console.log(`Field: ${valueData.field.name} (${valueData.field.type})`);
          console.log(`Required: ${!valueData.field.canBeEmpty}`);
          console.log(`Available Values (${valueData.valuesCount}):`);
          valueData.values.forEach((value: any, idx: number) => {
            console.log(`  ${idx + 1}. ${value.name} (ID: ${value.id})`);
          });
          
        } catch (error) {
          console.log(`  Field '${fieldName}' not found in ${firstProject.shortName}`);
        }
      }
    }

    // Project field schema analysis
    if (projectsToTest.length > 0) {
      const firstProject = projectsToTest[0];
      logger.info(`\n=== Field Schema for ${firstProject.shortName} ===`);
      
      try {
        const schema = await client.getProjectFieldSchema(firstProject.shortName);
        const schemaData = JSON.parse(schema.content[0].text);
        
        console.log(`\n--- Required Fields (${schemaData.schema.required.length}) ---`);
        schemaData.schema.required.forEach((field: any, idx: number) => {
          const valueCount = field.values ? field.values.length : 0;
          console.log(`  ${idx + 1}. ${field.name} (${field.type}) - ${valueCount} possible values`);
        });
        
        console.log(`\n--- Optional Fields (${schemaData.schema.optional.length}) ---`);
        schemaData.schema.optional.forEach((field: any, idx: number) => {
          const valueCount = field.values ? field.values.length : 0;
          console.log(`  ${idx + 1}. ${field.name} (${field.type}) - ${valueCount} possible values`);
        });
        
        console.log(`\n--- Fields by Category ---`);
        Object.entries(schemaData.schema.byCategory).forEach(([category, fields]: [string, any]) => {
          if (fields.length > 0) {
            console.log(`  ${category}: ${fields.map((f: any) => f.name).join(', ')}`);
          }
        });
        
      } catch (error) {
        logger.error(`Failed to get field schema for ${firstProject.shortName}:`, { error: (error as Error).message });
      }
    }

    // Summary of all discovered projects
    logger.info('\n=== Final Summary ===');
    try {
      const summary = await client.getAllProjectFieldsSummary();
      const summaryData = JSON.parse(summary.content[0].text);
      
      console.log(`\nTotal Projects Analyzed: ${summaryData.totalProjects}`);
      console.log(`Projects with Field Discovery:`);
      summaryData.discoveredProjects.forEach((project: any, idx: number) => {
        console.log(`  ${idx + 1}. ${project.projectShortName} (${project.projectName}) - ${project.fieldCount} fields`);
      });
      
    } catch (error) {
      logger.error('Failed to get fields summary:', { error: (error as Error).message });
    }

    console.log('\n=== Recommendations ===');
    console.log('1. Each project has unique field configurations - use project-specific discovery');
    console.log('2. Common fields (Priority, State, Type) exist across projects but may have different values');
    console.log('3. Use field schema API for dynamic form generation');
    console.log('4. Cache field configurations per project for performance');
    console.log('5. Always validate field values against project-specific constraints');

    logger.info('\n=== Dynamic Field Testing Complete ===');

  } catch (error) {
    logger.error('Dynamic field testing failed:', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDynamicFields().catch((error) => {
    logger.error('Unhandled error in dynamic field testing:', { error });
    process.exit(1);
  });
}

export { testDynamicFields };
