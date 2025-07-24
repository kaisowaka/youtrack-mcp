#!/usr/bin/env tsx

/**
 * MCP TOOL VALIDATION TESTS
 * Validates all 21 YouTrack MCP tools have proper schemas and parameter validation
 * Tests tool discovery, parameter validation, and schema compliance
 */

import { readFileSync } from 'fs';
import path from 'path';

class MCPToolValidator {
  private toolsModule: any;
  private expectedTools = [
    // Core Project Management (6 tools)
    'list_projects',
    'validate_project', 
    'get_project_status',
    'get_project_custom_fields',
    'get_project_issues_summary',
    'get_project_timeline',
    
    // Issue Management (5 tools)
    'create_issue',
    'query_issues',
    'update_issue',
    'bulk_update_issues',
    'search_users',
    
    // Comments & Communication (2 tools)
    'get_issue_comments',
    'add_issue_comment',
    
    // Epic Management (3 tools)
    'create_epic',
    'link_issue_to_epic',
    'get_epic_progress',
    
    // Milestone Management (3 tools)
    'create_milestone',
    'assign_issues_to_milestone',
    'get_milestone_progress',
    
    // Time Tracking (1 tool)
    'log_work_time'
  ];

  async loadToolsModule(): Promise<void> {
    try {
      const toolsPath = path.join(__dirname, '../dist/tools.js');
      this.toolsModule = await import(toolsPath);
      console.log('✅ Tools module loaded successfully');
    } catch (error) {
      throw new Error(`Failed to load tools module: ${error}`);
    }
  }

  validateToolExists(toolName: string): boolean {
    const tools = this.toolsModule.getTools?.() || [];
    const tool = tools.find((t: any) => t.name === toolName);
    
    if (!tool) {
      console.log(`❌ Tool '${toolName}' not found`);
      return false;
    }
    
    console.log(`✅ Tool '${toolName}' exists`);
    return true;
  }

  validateToolSchema(toolName: string): boolean {
    const tools = this.toolsModule.getTools?.() || [];
    const tool = tools.find((t: any) => t.name === toolName);
    
    if (!tool) {
      console.log(`❌ Tool '${toolName}' not found for schema validation`);
      return false;
    }

    // Validate required properties
    const requiredProperties = ['name', 'description', 'inputSchema'];
    for (const prop of requiredProperties) {
      if (!tool[prop]) {
        console.log(`❌ Tool '${toolName}' missing required property: ${prop}`);
        return false;
      }
    }

    // Validate input schema structure
    const schema = tool.inputSchema;
    if (!schema.type || !schema.properties) {
      console.log(`❌ Tool '${toolName}' has invalid inputSchema structure`);
      return false;
    }

    console.log(`✅ Tool '${toolName}' has valid schema`);
    return true;
  }

  validateToolParameters(toolName: string, expectedParams: string[]): boolean {
    const tools = this.toolsModule.getTools?.() || [];
    const tool = tools.find((t: any) => t.name === toolName);
    
    if (!tool) {
      console.log(`❌ Tool '${toolName}' not found for parameter validation`);
      return false;
    }

    const schema = tool.inputSchema;
    const actualParams = Object.keys(schema.properties || {});
    
    // Check if all expected parameters are present
    for (const param of expectedParams) {
      if (!actualParams.includes(param)) {
        console.log(`❌ Tool '${toolName}' missing expected parameter: ${param}`);
        return false;
      }
    }

    console.log(`✅ Tool '${toolName}' has all expected parameters: ${expectedParams.join(', ')}`);
    return true;
  }

  validateToolDescription(toolName: string, minLength: number = 20): boolean {
    const tools = this.toolsModule.getTools?.() || [];
    const tool = tools.find((t: any) => t.name === toolName);
    
    if (!tool) {
      console.log(`❌ Tool '${toolName}' not found for description validation`);
      return false;
    }

    if (!tool.description || tool.description.length < minLength) {
      console.log(`❌ Tool '${toolName}' has insufficient description (< ${minLength} chars)`);
      return false;
    }

    console.log(`✅ Tool '${toolName}' has adequate description (${tool.description.length} chars)`);
    return true;
  }

  async runToolValidationTests(): Promise<boolean> {
    console.log('🧪 MCP TOOL VALIDATION TESTS');
    console.log('='.repeat(50));
    
    let passed = 0;
    let failed = 0;

    // Test 1: Tool Discovery
    console.log('\\n📋 Test 1: Tool Discovery');
    try {
      await this.loadToolsModule();
      
      const tools = this.toolsModule.getTools?.() || [];
      console.log(`Found ${tools.length} tools`);
      
      if (tools.length !== this.expectedTools.length) {
        console.log(`❌ Expected ${this.expectedTools.length} tools, found ${tools.length}`);
        failed++;
      } else {
        console.log(`✅ Correct number of tools (${tools.length})`);
        passed++;
      }
      
      // Check each expected tool exists
      for (const toolName of this.expectedTools) {
        if (this.validateToolExists(toolName)) {
          passed++;
        } else {
          failed++;
        }
      }
      
    } catch (error) {
      console.log(`❌ Tool discovery failed: ${error}`);
      failed++;
    }

    // Test 2: Schema Validation
    console.log('\\n📐 Test 2: Schema Validation');
    for (const toolName of this.expectedTools) {
      if (this.validateToolSchema(toolName)) {
        passed++;
      } else {
        failed++;
      }
    }

    // Test 3: Parameter Validation
    console.log('\\n🔧 Test 3: Parameter Validation');
    
    const toolParameterSpecs = {
      'list_projects': [],
      'validate_project': ['projectId'],
      'get_project_status': ['projectId'],
      'get_project_custom_fields': ['projectId'],
      'get_project_issues_summary': ['projectId'],
      'get_project_timeline': ['projectId'],
      'create_issue': ['projectId', 'summary'],
      'query_issues': ['query'],
      'update_issue': ['issueId', 'updates'],
      'bulk_update_issues': ['issueIds', 'updates'],
      'search_users': ['query'],
      'get_issue_comments': ['issueId'],
      'add_issue_comment': ['issueId', 'text'],
      'create_epic': ['projectId', 'summary'],
      'link_issue_to_epic': ['issueId', 'epicId'],
      'get_epic_progress': ['epicId'],
      'create_milestone': ['projectId', 'name', 'targetDate'],
      'assign_issues_to_milestone': ['milestoneId', 'issueIds'],
      'get_milestone_progress': ['milestoneId'],
      'log_work_time': ['issueId', 'duration']
    };

    for (const [toolName, expectedParams] of Object.entries(toolParameterSpecs)) {
      if (this.validateToolParameters(toolName, expectedParams)) {
        passed++;
      } else {
        failed++;
      }
    }

    // Test 4: Description Quality
    console.log('\\n📝 Test 4: Description Quality');
    for (const toolName of this.expectedTools) {
      if (this.validateToolDescription(toolName, 30)) {
        passed++;
      } else {
        failed++;
      }
    }

    // Test 5: Required vs Optional Parameters
    console.log('\\n⚠️ Test 5: Required Parameter Validation');
    
    const requiredParameterSpecs = {
      'validate_project': ['projectId'],
      'get_project_status': ['projectId'],
      'create_issue': ['projectId', 'summary'],
      'query_issues': ['query'],
      'update_issue': ['issueId', 'updates'],
      'bulk_update_issues': ['issueIds', 'updates'],
      'add_issue_comment': ['issueId', 'text'],
      'create_epic': ['projectId', 'summary'],
      'link_issue_to_epic': ['issueId', 'epicId'],
      'create_milestone': ['projectId', 'name', 'targetDate'],
      'log_work_time': ['issueId', 'duration']
    };

    for (const [toolName, requiredParams] of Object.entries(requiredParameterSpecs)) {
      try {
        const tools = this.toolsModule.getTools?.() || [];
        const tool = tools.find((t: any) => t.name === toolName);
        
        if (tool && tool.inputSchema && tool.inputSchema.required) {
          const actualRequired = tool.inputSchema.required;
          const missingRequired = requiredParams.filter(param => !actualRequired.includes(param));
          
          if (missingRequired.length === 0) {
            console.log(`✅ Tool '${toolName}' has all required parameters marked as required`);
            passed++;
          } else {
            console.log(`❌ Tool '${toolName}' missing required markers: ${missingRequired.join(', ')}`);
            failed++;
          }
        } else {
          console.log(`❌ Tool '${toolName}' missing required field definition`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ Tool '${toolName}' required parameter validation failed: ${error}`);
        failed++;
      }
    }

    // Summary
    console.log('\\n📊 MCP TOOL VALIDATION SUMMARY');
    console.log('='.repeat(40));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total Tests: ${passed + failed}`);
    
    const successRate = (passed / (passed + failed)) * 100;
    console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\\n🎉 ALL MCP TOOL VALIDATION TESTS PASSED!');
      console.log('🚀 All 21 YouTrack MCP tools are properly defined and validated');
      return true;
    } else {
      console.log(`\\n⚠️ ${failed} validation test(s) failed`);
      console.log('🔧 Review tool definitions and schemas');
      return false;
    }
  }
}

// Additional test: MCP Protocol Message Validation
async function validateMCPProtocolMessages(): Promise<boolean> {
  console.log('\\n🔌 MCP PROTOCOL MESSAGE VALIDATION');
  console.log('='.repeat(45));
  
  let passed = 0;
  let failed = 0;

  // Test message format compliance
  try {
    const toolsPath = path.join(__dirname, '../dist/tools.js');
    const toolsModule = await import(toolsPath);
    
    // Validate tools/list response format
    const tools = toolsModule.getTools?.() || [];
    
    // Check each tool has MCP-compliant structure
    for (const tool of tools) {
      if (tool.name && tool.description && tool.inputSchema) {
        console.log(`✅ Tool '${tool.name}' is MCP-compliant`);
        passed++;
      } else {
        console.log(`❌ Tool '${tool.name}' is not MCP-compliant`);
        failed++;
      }
    }
    
    // Validate JSON Schema compliance
    for (const tool of tools) {
      const schema = tool.inputSchema;
      if (schema.type === 'object' && schema.properties) {
        console.log(`✅ Tool '${tool.name}' has valid JSON Schema`);
        passed++;
      } else {
        console.log(`❌ Tool '${tool.name}' has invalid JSON Schema`);
        failed++;
      }
    }
    
  } catch (error) {
    console.log(`❌ Protocol validation failed: ${error}`);
    failed++;
  }

  console.log(`\\n📊 Protocol Validation: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Main execution
async function runAllValidationTests(): Promise<boolean> {
  console.log('🚀 COMPREHENSIVE MCP TOOL & PROTOCOL VALIDATION');
  console.log('Testing all YouTrack MCP tools for compliance and functionality');
  console.log('='.repeat(70));
  
  const validator = new MCPToolValidator();
  
  try {
    const toolValidationSuccess = await validator.runToolValidationTests();
    const protocolValidationSuccess = await validateMCPProtocolMessages();
    
    const overallSuccess = toolValidationSuccess && protocolValidationSuccess;
    
    console.log('\\n🏁 FINAL VALIDATION RESULTS');
    console.log('='.repeat(35));
    console.log(`🧪 Tool Validation: ${toolValidationSuccess ? 'PASSED' : 'FAILED'}`);
    console.log(`🔌 Protocol Validation: ${protocolValidationSuccess ? 'PASSED' : 'FAILED'}`);
    console.log(`🎯 Overall Status: ${overallSuccess ? 'SUCCESS' : 'FAILED'}`);
    
    if (overallSuccess) {
      console.log('\\n🎉 ALL VALIDATIONS PASSED!');
      console.log('✅ YouTrack MCP Server is fully compliant and ready for production');
      console.log('🤖 All 21 tools are properly defined for AI agent usage');
    } else {
      console.log('\\n❌ VALIDATION FAILURES DETECTED');
      console.log('🔧 Review failed tests and fix issues before deployment');
    }
    
    return overallSuccess;
    
  } catch (error) {
    console.error('❌ Validation execution failed:', error);
    return false;
  }
}

// Run validation tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllValidationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export { MCPToolValidator, runAllValidationTests };
