#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { YouTrackClient } from '../src/youtrack-client.js';
import { logger } from '../src/logger.js';

// Load environment variables
dotenv.config();

interface ProjectFieldAnalysis {
  projectShortName: string;
  projectName: string;
  totalFields: number;
  requiredFields: number;
  optionalFields: number;
  fieldTypes: string[];
  commonFields: string[];
  uniqueFields: string[];
}

async function comprehensiveProjectAnalysis() {
  try {
    const youtrackUrl = process.env.YOUTRACK_URL;
    const youtrackToken = process.env.YOUTRACK_TOKEN;

    if (!youtrackUrl || !youtrackToken) {
      throw new Error('Please set YOUTRACK_URL and YOUTRACK_TOKEN environment variables');
    }

    logger.info('=== Comprehensive Multi-Project Field Analysis ===');
    const client = new YouTrackClient(youtrackUrl, youtrackToken);

    // Get all projects
    const allProjects = await client.listProjects();
    console.log(`\n🔍 Found ${allProjects.length} total projects:`);
    
    const projectAnalyses: ProjectFieldAnalysis[] = [];
    const allFieldNames = new Set<string>();
    const fieldTypeUsage = new Map<string, number>();

    // Analyze each project
    for (let i = 0; i < allProjects.length; i++) {
      const project = allProjects[i];
      console.log(`\n📊 Analyzing ${i + 1}/${allProjects.length}: ${project.shortName} (${project.name})`);
      
      try {
        const projectFields = await client.discoverProjectFields(project.shortName);
        const fieldData = JSON.parse(projectFields.content[0].text);
        
        const fieldNames = fieldData.fields.map((f: any) => f.field.name);
        fieldNames.forEach((name: string) => allFieldNames.add(name));
        
        // Count field type usage
        fieldData.summary.fieldTypes.forEach((type: string) => {
          fieldTypeUsage.set(type, (fieldTypeUsage.get(type) || 0) + 1);
        });
        
        const analysis: ProjectFieldAnalysis = {
          projectShortName: project.shortName,
          projectName: project.name,
          totalFields: fieldData.summary.totalFields,
          requiredFields: fieldData.summary.requiredFields,
          optionalFields: fieldData.summary.optionalFields,
          fieldTypes: fieldData.summary.fieldTypes,
          commonFields: [],
          uniqueFields: fieldNames
        };
        
        projectAnalyses.push(analysis);
        
        console.log(`   ✅ ${fieldData.summary.totalFields} fields (${fieldData.summary.requiredFields} required, ${fieldData.summary.optionalFields} optional)`);
        console.log(`   📋 Field types: ${fieldData.summary.fieldTypes.join(', ')}`);
        
      } catch (error) {
        console.log(`   ❌ Failed to analyze: ${(error as Error).message}`);
      }
    }

    // Cross-project analysis
    console.log('\n🔄 Cross-Project Analysis:');
    
    // Find common fields across all projects
    const commonFields = Array.from(allFieldNames).filter(fieldName => 
      projectAnalyses.every(analysis => 
        analysis.uniqueFields.includes(fieldName)
      )
    );

    // Update analyses with common/unique field classifications
    projectAnalyses.forEach(analysis => {
      analysis.commonFields = commonFields.filter(field => analysis.uniqueFields.includes(field));
      analysis.uniqueFields = analysis.uniqueFields.filter(field => !commonFields.includes(field));
    });

    console.log(`\n📝 Universal Fields (present in ALL ${projectAnalyses.length} projects):`);
    if (commonFields.length > 0) {
      commonFields.forEach((field, idx) => {
        console.log(`   ${idx + 1}. ${field}`);
      });
    } else {
      console.log('   ⚠️  No fields are common to ALL projects');
    }

    // Field type distribution
    console.log('\n📊 Field Type Usage Distribution:');
    Array.from(fieldTypeUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = Math.round((count / projectAnalyses.length) * 100);
        console.log(`   ${type}: ${count}/${projectAnalyses.length} projects (${percentage}%)`);
      });

    // Project similarity matrix
    console.log('\n🎯 Project Similarity Analysis:');
    for (let i = 0; i < projectAnalyses.length; i++) {
      for (let j = i + 1; j < projectAnalyses.length; j++) {
        try {
          const comparison = await client.compareProjectFields(
            projectAnalyses[i].projectShortName,
            projectAnalyses[j].projectShortName
          );
          const compData = JSON.parse(comparison.content[0].text);
          
          console.log(`   ${projectAnalyses[i].projectShortName} ↔ ${projectAnalyses[j].projectShortName}: ${compData.comparison.similarity}% similar`);
          console.log(`     Common: ${compData.comparison.commonFields.length} fields`);
          console.log(`     ${projectAnalyses[i].projectShortName} unique: ${compData.comparison.uniqueToProject1.length} fields`);
          console.log(`     ${projectAnalyses[j].projectShortName} unique: ${compData.comparison.uniqueToProject2.length} fields`);
          
        } catch (error) {
          console.log(`   ❌ Failed to compare ${projectAnalyses[i].projectShortName} ↔ ${projectAnalyses[j].projectShortName}`);
        }
      }
    }

    // Detailed project breakdown
    console.log('\n📋 Detailed Project Breakdown:');
    projectAnalyses.forEach((analysis, idx) => {
      console.log(`\n   ${idx + 1}. ${analysis.projectShortName} (${analysis.projectName})`);
      console.log(`      Total Fields: ${analysis.totalFields}`);
      console.log(`      Required: ${analysis.requiredFields}, Optional: ${analysis.optionalFields}`);
      console.log(`      Field Types: ${analysis.fieldTypes.join(', ')}`);
      console.log(`      Common Fields: ${analysis.commonFields.join(', ') || 'None'}`);
      console.log(`      Unique Fields: ${analysis.uniqueFields.join(', ') || 'None'}`);
    });

    // Strategic recommendations
    console.log('\n🎯 Strategic Recommendations:');
    
    if (commonFields.length > 0) {
      console.log(`✅ Focus on ${commonFields.length} universal fields for cross-project compatibility:`);
      commonFields.forEach(field => console.log(`   • ${field}`));
    }
    
    const avgFieldCount = Math.round(projectAnalyses.reduce((sum, p) => sum + p.totalFields, 0) / projectAnalyses.length);
    console.log(`📊 Average fields per project: ${avgFieldCount}`);
    
    const mostComplexProject = projectAnalyses.reduce((max, p) => p.totalFields > max.totalFields ? p : max);
    const simplestProject = projectAnalyses.reduce((min, p) => p.totalFields < min.totalFields ? p : min);
    
    console.log(`🔝 Most complex: ${mostComplexProject.projectShortName} (${mostComplexProject.totalFields} fields)`);
    console.log(`🎯 Simplest: ${simplestProject.projectShortName} (${simplestProject.totalFields} fields)`);
    
    const projectsWithSameStructure = projectAnalyses.filter(p => 
      p.totalFields === mostComplexProject.totalFields && 
      p.projectShortName !== mostComplexProject.projectShortName
    );
    
    if (projectsWithSameStructure.length > 0) {
      console.log(`🔄 Projects with identical structure to ${mostComplexProject.projectShortName}:`);
      projectsWithSameStructure.forEach(p => console.log(`   • ${p.projectShortName}`));
    }

    console.log('\n💡 Implementation Strategy:');
    console.log('1. 🔧 Use dynamic field discovery for each project');
    console.log('2. 🎯 Cache field configurations to improve performance');
    console.log('3. 🔄 Implement field mapping for cross-project operations');
    console.log('4. ✅ Validate field values against project-specific constraints');
    console.log('5. 🎨 Generate dynamic forms based on project field schemas');

    console.log('\n=== Analysis Complete ===');

  } catch (error) {
    logger.error('Comprehensive analysis failed:', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });
    process.exit(1);
  }
}

// Run the analysis if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  comprehensiveProjectAnalysis().catch((error) => {
    logger.error('Unhandled error in comprehensive analysis:', { error });
    process.exit(1);
  });
}

export { comprehensiveProjectAnalysis };
