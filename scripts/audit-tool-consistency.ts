#!/usr/bin/env tsx

import { toolDefinitions } from '../src/tools.js';

function auditToolConsistency() {
  console.log('🔍 MCP Server Tool Consistency Audit');
  console.log('=' .repeat(60));

  const issues: string[] = [];
  const toolNames = new Set<string>();
  const duplicates: string[] = [];

  console.log(`📊 Total Tools Found: ${toolDefinitions.length}`);

  // Check for duplicates
  toolDefinitions.forEach((tool, index) => {
    if (toolNames.has(tool.name)) {
      duplicates.push(tool.name);
      issues.push(`❌ DUPLICATE: Tool "${tool.name}" appears multiple times`);
    } else {
      toolNames.add(tool.name);
    }
  });

  // Group tools by category
  const categories = {
    projects: [] as string[],
    issues: [] as string[],
    agile: [] as string[],
    knowledge: [] as string[],
    gantt: [] as string[],
    time: [] as string[],
    milestones: [] as string[],
    other: [] as string[]
  };

  toolDefinitions.forEach(tool => {
    const name = tool.name;
    if (name.includes('project')) categories.projects.push(name);
    else if (name.includes('issue')) categories.issues.push(name);
    else if (name.includes('sprint') || name.includes('board')) categories.agile.push(name);
    else if (name.includes('article') || name.includes('knowledge')) categories.knowledge.push(name);
    else if (name.includes('gantt') || name.includes('dependency') || name.includes('critical')) categories.gantt.push(name);
    else if (name.includes('time') || name.includes('work')) categories.time.push(name);
    else if (name.includes('milestone')) categories.milestones.push(name);
    else categories.other.push(name);
  });

  console.log('\n📋 Tool Categories:');
  Object.entries(categories).forEach(([category, tools]) => {
    if (tools.length > 0) {
      console.log(`\n🔸 ${category.toUpperCase()} (${tools.length} tools):`);
      tools.forEach(tool => console.log(`   • ${tool}`));
    }
  });

  // Check for inconsistent naming patterns
  console.log('\n🔍 Naming Pattern Analysis:');
  const patterns = {
    get_: toolDefinitions.filter(t => t.name.startsWith('get_')),
    create_: toolDefinitions.filter(t => t.name.startsWith('create_')),
    update_: toolDefinitions.filter(t => t.name.startsWith('update_')),
    list_: toolDefinitions.filter(t => t.name.startsWith('list_')),
    other: toolDefinitions.filter(t => !['get_', 'create_', 'update_', 'list_'].some(p => t.name.startsWith(p)))
  };

  Object.entries(patterns).forEach(([pattern, tools]) => {
    if (tools.length > 0) {
      console.log(`   ${pattern}: ${tools.length} tools`);
    }
  });

  // Check for potential conflicts
  console.log('\n⚠️  Potential Issues:');
  
  // Check for timeline conflicts
  const timelineTools = toolDefinitions.filter(t => t.name.includes('timeline'));
  if (timelineTools.length > 1) {
    issues.push(`⚠️  Multiple timeline tools: ${timelineTools.map(t => t.name).join(', ')}`);
  }

  // Check for gantt chart conflicts
  const ganttTools = toolDefinitions.filter(t => t.name.includes('gantt'));
  if (ganttTools.length > 1) {
    issues.push(`⚠️  Multiple gantt tools: ${ganttTools.map(t => t.name).join(', ')}`);
  }

  // Check for missing required parameters
  toolDefinitions.forEach(tool => {
    if (!tool.inputSchema || !tool.inputSchema.properties) {
      issues.push(`❌ Tool "${tool.name}" missing input schema`);
    } else if (!tool.inputSchema.required || tool.inputSchema.required.length === 0) {
      // Check if tool should have required parameters
      if (['create_', 'update_', 'get_'].some(prefix => tool.name.startsWith(prefix))) {
        issues.push(`⚠️  Tool "${tool.name}" has no required parameters (unusual for ${tool.name.split('_')[0]} operation)`);
      }
    }
  });

  // Print all issues
  if (issues.length > 0) {
    console.log('\n🚨 ISSUES FOUND:');
    issues.forEach(issue => console.log(`   ${issue}`));
  } else {
    console.log('\n✅ No major consistency issues found!');
  }

  // Print duplicates for fixing
  if (duplicates.length > 0) {
    console.log('\n🔧 DUPLICATES TO FIX:');
    [...new Set(duplicates)].forEach(dup => {
      console.log(`   • ${dup}`);
    });
  }

  console.log('\n📈 SUMMARY:');
  console.log(`   • Total Tools: ${toolDefinitions.length}`);
  console.log(`   • Unique Tools: ${toolNames.size}`);
  console.log(`   • Duplicates: ${duplicates.length}`);
  console.log(`   • Issues Found: ${issues.length}`);

  if (issues.length === 0 && duplicates.length === 0) {
    console.log('\n🎉 MCP Server Tools are CONSISTENT! ✨');
  } else {
    console.log('\n🔧 Consistency fixes needed');
  }
}

auditToolConsistency();
