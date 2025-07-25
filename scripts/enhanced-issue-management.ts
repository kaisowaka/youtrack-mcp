#!/usr/bin/env npx tsx
/**
 * Enhanced Issue Management System
 * 
 * This script demonstrates dynamic issue creation with project-specific configurations:
 * - Time estimations (project-specific fields)
 * - Sprint assignments (for agile projects)
 * - Assignee management (team-based)
 * - Dynamic property enhancement based on project schemas
 */

import { YouTrackClient } from '../src/youtrack-client.js';
import { getProjectSchema, getDefaultIssueProperties } from '../src/project-schemas.js';
import { ConfigManager } from '../src/config.js';

interface EnhancedIssueRequest {
  projectId: string;
  summary: string;
  description?: string;
  issueType?: 'bug' | 'feature' | 'task' | 'epic';
  priority?: string;
  assignee?: string;
  timeEstimation?: string | number; // "4h" or 240 (minutes)
  storyPoints?: number;
  sprintId?: string;
  subsystem?: string; // MYD specific
  affectedVersions?: string[]; // MYD specific
}

class EnhancedIssueManager {
  private client: YouTrackClient;

  constructor() {
    const config = new ConfigManager();
    this.client = new YouTrackClient(config.get().youtrackUrl, config.get().youtrackToken);
  }

  async createEnhancedIssue(request: EnhancedIssueRequest): Promise<string> {
    console.log(`🚀 Creating enhanced issue in ${request.projectId}...`);
    
    // Get project schema for dynamic configuration
    const schema = getProjectSchema(request.projectId);
    if (!schema) {
      throw new Error(`Unknown project: ${request.projectId}`);
    }

    const defaults = getDefaultIssueProperties(request.projectId, request.issueType);
    if (!defaults) {
      throw new Error(`Cannot get defaults for project: ${request.projectId}`);
    }

    console.log(`📋 Using schema for ${schema.projectName}:`);
    console.log(`  - Workflow: ${schema.workflow.defaultState} → ${schema.workflow.progressState} → ${schema.workflow.doneState}`);
    console.log(`  - Available types: ${schema.types.available.join(', ')}`);
    console.log(`  - Time fields: ${schema.estimationFields.timeFields.join(', ') || 'None'}`);
    console.log(`  - Points fields: ${schema.estimationFields.pointsFields.join(', ') || 'None'}`);

    // Step 1: Create basic issue
    const createResponse = await this.client.createIssue({
      projectId: request.projectId,
      summary: request.summary,
      description: request.description || `Enhanced issue created with dynamic properties for ${schema.projectName}`,
    });

    // Extract issue ID from response content
    const responseContent = JSON.parse(createResponse.content[0].text);
    const issueId = responseContent.issue.id;
    console.log(`✅ Created issue: ${issueId}`);

    // Step 2: Apply project-specific enhancements
    await this.applyProjectSpecificEnhancements(issueId, request, schema, defaults);

    console.log(`🎉 Enhanced issue ${issueId} created successfully!`);
    return issueId;
  }

  private async applyProjectSpecificEnhancements(
    issueId: string,
    request: EnhancedIssueRequest,
    schema: any,
    defaults: any
  ) {
    const updates: any = {};

    // Set issue type and priority
    updates.Type = request.issueType ? 
      schema.types.defaults[request.issueType] || schema.types.available[0] : 
      defaults.type;
    
    updates.Priority = request.priority || defaults.priority;

    // Set assignee
    if (request.assignee) {
      const availableAssignees = schema.assignees.available;
      const assignee = availableAssignees.find((a: string) => 
        a.toLowerCase().includes(request.assignee!.toLowerCase())
      ) || defaults.assignee;
      updates.Assignee = { login: assignee };
    } else {
      updates.Assignee = { login: defaults.assignee };
    }

    // Apply time estimation based on project fields
    if (request.timeEstimation && schema.estimationFields.timeFields.length > 0) {
      const timeField = schema.estimationFields.timeFields[0];
      
      if (request.projectId === 'YTM' && timeField === 'Original estimation') {
        // YTM uses minutes
        const minutes = typeof request.timeEstimation === 'string' ? 
          this.parseTimeToMinutes(request.timeEstimation) : 
          request.timeEstimation;
        updates[timeField] = minutes;
        console.log(`⏱️  Set ${timeField}: ${minutes} minutes`);
      } else if (request.projectId === 'MYD' && timeField === 'Estimation') {
        // MYD uses time periods like "4h"
        const timeStr = typeof request.timeEstimation === 'number' ? 
          this.minutesToTimeString(request.timeEstimation) : 
          request.timeEstimation;
        updates[timeField] = { name: timeStr };
        console.log(`⏱️  Set ${timeField}: ${timeStr}`);
      }
    }

    // Apply story points for agile projects
    if (request.storyPoints && schema.estimationFields.pointsFields.includes('Story points')) {
      updates['Story points'] = request.storyPoints;
      console.log(`📊 Set Story points: ${request.storyPoints}`);
    }

    // Apply sprint assignment for agile projects
    if (request.sprintId && schema.uniqueFields.includes('Sprints')) {
      updates.Sprints = [{ name: request.sprintId }];
      console.log(`🏃 Assigned to sprint: ${request.sprintId}`);
    }

    // Apply MYD-specific fields
    if (request.projectId === 'MYD') {
      if (request.subsystem) {
        updates.Subsystem = { name: request.subsystem };
        console.log(`🔧 Set Subsystem: ${request.subsystem}`);
      }
      
      if (request.affectedVersions && request.affectedVersions.length > 0) {
        updates['Affected versions'] = request.affectedVersions.map(v => ({ name: v }));
        console.log(`🏷️  Set Affected versions: ${request.affectedVersions.join(', ')}`);
      }
    }

    // Apply all updates
    if (Object.keys(updates).length > 0) {
      console.log(`🔄 Applying ${Object.keys(updates).length} property updates...`);
      await this.client.updateIssue(issueId, updates);
      console.log(`✅ Applied updates: ${Object.keys(updates).join(', ')}`);
    }
  }

  private parseTimeToMinutes(timeStr: string): number {
    const match = timeStr.match(/^(\d+)([hdm])$/);
    if (!match) return parseInt(timeStr) || 240; // default 4 hours
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'h': return value * 60;
      case 'd': return value * 480; // 8 hour day
      case 'm': return value;
      default: return value;
    }
  }

  private minutesToTimeString(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  async demonstrateEnhancedIssueCreation() {
    console.log('🚀 Enhanced Issue Management System Demo\n');

    // YTM Project Examples (Agile with sprints and story points)
    console.log('📊 Creating issues for YTM (Agile Project)...\n');

    const ytmIssue1 = await this.createEnhancedIssue({
      projectId: 'YTM',
      summary: 'Implement sprint planning feature',
      description: 'Add comprehensive sprint planning capabilities with drag-and-drop interface',
      issueType: 'feature',
      priority: 'Major',
      timeEstimation: '8h',
      storyPoints: 5,
      sprintId: 'Sprint 2024-Q1'
    });

    const ytmIssue2 = await this.createEnhancedIssue({
      projectId: 'YTM',
      summary: 'Fix issue creation validation bug',
      description: 'Validation not working properly for custom fields in issue creation',
      issueType: 'bug',
      priority: 'Critical',
      timeEstimation: 240, // 4 hours in minutes
      storyPoints: 3,
      assignee: 'YouTrack MCP Team'
    });

    console.log('\n📊 Creating issues for MYD (Traditional Project)...\n');

    // MYD Project Examples (Traditional with subsystems and versions)
    const mydIssue1 = await this.createEnhancedIssue({
      projectId: 'MYD',
      summary: 'Database performance optimization',
      description: 'Optimize slow queries in the patient management module',
      issueType: 'task',
      priority: 'High',
      timeEstimation: '2d',
      assignee: 'Developer 1',
      subsystem: 'Database',
      affectedVersions: ['2.1.0', '2.1.1']
    });

    const mydIssue2 = await this.createEnhancedIssue({
      projectId: 'MYD',
      summary: 'UI responsiveness issues on mobile',
      description: 'Mobile interface has layout problems on smaller screens',
      issueType: 'bug',
      priority: 'Normal',
      timeEstimation: '6h',
      assignee: 'Developer 2',
      subsystem: 'UI/UX',
      affectedVersions: ['2.0.5']
    });

    console.log(`\n🎉 Successfully created enhanced issues:
    - YTM: ${ytmIssue1}, ${ytmIssue2}
    - MYD: ${mydIssue1}, ${mydIssue2}
    
✨ All issues created with:
  ✅ Project-specific time estimation formats
  ✅ Appropriate assignee management
  ✅ Sprint assignments (YTM) / Subsystem classification (MYD)
  ✅ Story points (YTM) / Version tracking (MYD)
  ✅ Dynamic property enhancement based on project schemas`);
  }
}

// Run the demonstration
async function main() {
  try {
    const manager = new EnhancedIssueManager();
    await manager.demonstrateEnhancedIssueCreation();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run immediately
main();

export { EnhancedIssueManager };
