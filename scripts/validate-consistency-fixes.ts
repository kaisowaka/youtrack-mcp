#!/usr/bin/env npx tsx

import { toolDefinitions } from '../src/tools.js';

console.log('🔧 Validating Tool Consistency Fixes');
console.log('=====================================\n');

// Count tools and check for duplicates
const toolNames = toolDefinitions.map(tool => tool.name);
const uniqueNames = new Set(toolNames);

console.log(`📊 Total tools: ${toolDefinitions.length}`);
console.log(`📊 Unique names: ${uniqueNames.size}`);
console.log(`✅ Duplicates eliminated: ${toolDefinitions.length === uniqueNames.size ? 'YES' : 'NO'}\n`);

// Verify specific tools exist and are unique
const criticalTools = [
  'generate_gantt_chart',
  'get_project_timeline', 
  'create_issue_dependency',
  'get_critical_path'
];

console.log('🎯 Critical Tools Check:');
criticalTools.forEach(toolName => {
  const count = toolNames.filter(name => name === toolName).length;
  console.log(`   • ${toolName}: ${count === 1 ? '✅ UNIQUE' : `❌ ${count} instances`}`);
});

console.log('\n🔍 Tool Categories Distribution:');
const categories = {
  projects: toolNames.filter(name => name.includes('project')).length,
  issues: toolNames.filter(name => name.includes('issue')).length,
  gantt: toolNames.filter(name => name.includes('gantt') || name.includes('critical') || name.includes('dependency')).length,
  articles: toolNames.filter(name => name.includes('article')).length,
  agile: toolNames.filter(name => name.includes('board') || name.includes('sprint')).length
};

Object.entries(categories).forEach(([category, count]) => {
  console.log(`   • ${category}: ${count} tools`);
});

console.log('\n🎉 Tool consistency validation complete!');
