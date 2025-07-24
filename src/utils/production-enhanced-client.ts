/**
 * Enhanced YouTrack Client - Production Implementation
 * Resolves stubs with real YouTrack API calls
 */

import { AxiosInstance } from 'axios';
import { MCPResponse } from '../youtrack-client.js';
import { logApiCall, logError } from '../logger.js';

export class ProductionEnhancedYouTrackClient {
  constructor(private api: AxiosInstance) {}

  /**
   * FIXED: Real milestone progress tracking using YouTrack queries
   */
  async getMilestoneProgress(milestoneId: string): Promise<MCPResponse> {
    try {
      logApiCall('GET', `/issues/${milestoneId}`, { includeMilestoneIssues: true });

      // Get milestone details
      const milestoneResponse = await this.api.get(`/issues/${milestoneId}`, {
        params: {
          fields: 'id,summary,description,state(name),created,customFields(name,value),links(linkType(name),issues(id,summary,state(name)))',
        },
      });

      const milestone = milestoneResponse.data;

      // REAL IMPLEMENTATION: Get linked issues using YouTrack's link system
      const linkedIssuesQuery = `linked issue: ${milestoneId}`;
      const linkedIssuesResponse = await this.api.get('/issues', {
        params: {
          query: linkedIssuesQuery,
          fields: 'id,summary,state(name),priority(name),assignee(login,fullName),created,resolved,customFields(name,value)',
          $top: 100,
        },
      });

      const milestoneIssues = linkedIssuesResponse.data;

      // Calculate real progress metrics
      const totalIssues = milestoneIssues.length;
      const completedIssues = milestoneIssues.filter((issue: any) => 
        issue.state?.name === 'Done' || 
        issue.state?.name === 'Closed' || 
        issue.state?.name === 'Resolved' ||
        issue.state?.name === 'Fixed'
      ).length;

      const inProgressIssues = milestoneIssues.filter((issue: any) => 
        issue.state?.name === 'In Progress' || 
        issue.state?.name === 'In Review' ||
        issue.state?.name === 'Testing'
      ).length;

      const blockedIssues = milestoneIssues.filter((issue: any) => 
        issue.state?.name === 'Blocked' || 
        issue.state?.name === 'On Hold' ||
        issue.state?.name === 'Waiting'
      ).length;

      const progressPercentage = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

      // REAL IMPLEMENTATION: Extract target date from custom fields or description
      let targetDate = 'Not specified';
      let daysRemaining: number | null = null;

      // Check for Due Date custom field
      const dueDateField = milestone.customFields?.find((field: any) => 
        field.name === 'Due Date' || field.name === 'Target Date'
      );
      
      if (dueDateField?.value) {
        targetDate = dueDateField.value;
      } else {
        // Fallback: extract from description
        const targetDateMatch = milestone.description?.match(/(?:target|due|deadline).*?(\d{4}-\d{2}-\d{2})/i);
        if (targetDateMatch) {
          targetDate = targetDateMatch[1];
        }
      }

      // Calculate days remaining
      if (targetDate !== 'Not specified') {
        const today = new Date();
        const target = new Date(targetDate);
        daysRemaining = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Real risk assessment
      const risks = this.assessMilestoneRisks(progressPercentage, blockedIssues, daysRemaining, milestoneIssues);
      const recommendations = this.generateMilestoneRecommendations(progressPercentage, blockedIssues, daysRemaining, milestoneIssues);

      const progressReport = {
        milestone: {
          id: milestone.id,
          name: milestone.summary.replace(/^\[MILESTONE\]\s*/, ''),
          description: milestone.description,
          targetDate,
          daysRemaining,
          status: this.calculateMilestoneStatus(daysRemaining, progressPercentage),
          created: milestone.created,
        },
        progress: {
          totalIssues,
          completedIssues,
          inProgressIssues,
          blockedIssues,
          remainingIssues: totalIssues - completedIssues,
          progressPercentage,
          velocity: this.calculateVelocity(milestoneIssues),
        },
        timeline: {
          created: milestone.created,
          targetDate,
          daysRemaining,
          isOverdue: daysRemaining !== null && daysRemaining < 0,
          isAtRisk: daysRemaining !== null && daysRemaining < 7 && daysRemaining >= 0,
          estimatedCompletion: this.estimateCompletion(progressPercentage, daysRemaining, milestoneIssues),
        },
        linkedIssues: milestoneIssues.map((issue: any) => ({
          id: issue.id,
          summary: issue.summary,
          state: issue.state?.name,
          assignee: issue.assignee?.fullName || issue.assignee?.login || 'Unassigned',
          priority: issue.priority?.name || 'No Priority',
          created: issue.created,
          resolved: issue.resolved,
        })),
        risks,
        recommendations,
        methodology: 'Real YouTrack API data with linked issues analysis',
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(progressReport, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, { milestoneId });
      throw new Error(`Failed to get milestone progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * FIXED: Real project risk assessment using YouTrack data
   */
  async assessProjectRisks(params: {
    projectId: string;
    riskCategories?: ('schedule' | 'quality' | 'scope' | 'team' | 'technical')[];
  }): Promise<MCPResponse> {
    try {
      const categories = params.riskCategories || ['schedule', 'quality', 'scope'];
      const allRisks: any[] = [];

      // Get project data for analysis
      const projectResponse = await this.api.get(`/admin/projects/${params.projectId}`, {
        params: {
          fields: 'id,name,shortName,created',
        },
      });

      // Get issues for analysis
      const issuesResponse = await this.api.get('/issues', {
        params: {
          query: `project: ${params.projectId}`,
          fields: 'id,summary,state(name),priority(name),type(name),created,resolved,updated,assignee(login),customFields(name,value)',
          $top: 500,
        },
      });

      const project = projectResponse.data;
      const issues = issuesResponse.data;

      // Real risk assessment for each category
      for (const category of categories) {
        switch (category) {
          case 'schedule':
            allRisks.push(...await this.assessScheduleRisks(params.projectId, issues));
            break;
          case 'quality':
            allRisks.push(...await this.assessQualityRisks(params.projectId, issues));
            break;
          case 'scope':
            allRisks.push(...await this.assessScopeRisks(params.projectId, issues));
            break;
          case 'team':
            allRisks.push(...await this.assessTeamRisks(params.projectId, issues));
            break;
          case 'technical':
            allRisks.push(...await this.assessTechnicalRisks(params.projectId, issues));
            break;
        }
      }

      const riskReport = {
        project: {
          id: project.id,
          name: project.name,
          shortName: project.shortName,
        },
        analysisDate: new Date().toISOString(),
        totalIssuesAnalyzed: issues.length,
        riskCategories: categories,
        risks: allRisks,
        overallRisk: this.calculateOverallRisk(allRisks),
        recommendations: this.generateRiskRecommendations(allRisks),
        summary: {
          highRisks: allRisks.filter(r => r.severity >= 4).length,
          mediumRisks: allRisks.filter(r => r.severity === 3).length,
          lowRisks: allRisks.filter(r => r.severity <= 2).length,
        },
        methodology: 'Real-time analysis of YouTrack project data',
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(riskReport, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to assess project risks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * FIXED: Real schedule risk assessment
   */
  private async assessScheduleRisks(projectId: string, issues: any[]): Promise<any[]> {
    const risks: any[] = [];
    const now = new Date();

    // Analyze overdue issues
    const overdueIssues = issues.filter(issue => {
      const dueDate = this.extractDueDate(issue);
      return dueDate && dueDate < now && !this.isCompleted(issue);
    });

    if (overdueIssues.length > 0) {
      risks.push({
        category: 'schedule',
        type: 'overdue_issues',
        severity: Math.min(5, Math.floor(overdueIssues.length / 5) + 3),
        description: `${overdueIssues.length} issues are overdue`,
        impact: overdueIssues.length > 10 ? 'High' : overdueIssues.length > 5 ? 'Medium' : 'Low',
        likelihood: 'Confirmed',
        affectedIssues: overdueIssues.slice(0, 5).map(issue => issue.id),
      });
    }

    // Analyze stalled issues (not updated in 2+ weeks)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const stalledIssues = issues.filter(issue => 
      new Date(issue.updated) < twoWeeksAgo && 
      !this.isCompleted(issue) &&
      issue.state?.name !== 'Blocked'
    );

    if (stalledIssues.length > 0) {
      risks.push({
        category: 'schedule',
        type: 'stalled_issues',
        severity: Math.min(4, Math.floor(stalledIssues.length / 10) + 2),
        description: `${stalledIssues.length} issues haven't been updated in 2+ weeks`,
        impact: 'Medium',
        likelihood: 'High',
        affectedIssues: stalledIssues.slice(0, 5).map(issue => issue.id),
      });
    }

    // Analyze blocked issues
    const blockedIssues = issues.filter(issue => 
      issue.state?.name === 'Blocked' || 
      issue.state?.name === 'On Hold' ||
      issue.state?.name === 'Waiting'
    );

    if (blockedIssues.length > 0) {
      risks.push({
        category: 'schedule',
        type: 'blocked_issues',
        severity: Math.min(4, Math.floor(blockedIssues.length / 5) + 2),
        description: `${blockedIssues.length} issues are currently blocked`,
        impact: 'High',
        likelihood: 'Confirmed',
        affectedIssues: blockedIssues.slice(0, 5).map(issue => issue.id),
      });
    }

    return risks;
  }

  /**
   * FIXED: Real quality risk assessment
   */
  private async assessQualityRisks(projectId: string, issues: any[]): Promise<any[]> {
    const risks: any[] = [];

    // Analyze bug ratio
    const bugs = issues.filter(issue => 
      issue.type?.name === 'Bug' || 
      issue.type?.name === 'Defect' ||
      issue.summary.toLowerCase().includes('bug')
    );
    
    const features = issues.filter(issue => 
      issue.type?.name === 'Feature' || 
      issue.type?.name === 'Enhancement' ||
      issue.type?.name === 'Story'
    );

    const bugRatio = features.length > 0 ? bugs.length / features.length : 0;

    if (bugRatio > 0.3) {
      risks.push({
        category: 'quality',
        type: 'high_bug_ratio',
        severity: bugRatio > 0.5 ? 4 : 3,
        description: `Bug-to-feature ratio is ${(bugRatio * 100).toFixed(1)}% (${bugs.length} bugs vs ${features.length} features)`,
        impact: 'High',
        likelihood: 'Confirmed',
        metrics: { bugRatio, totalBugs: bugs.length, totalFeatures: features.length },
      });
    }

    // Analyze critical/high priority issues
    const criticalIssues = issues.filter(issue => 
      (issue.priority?.name === 'Critical' || issue.priority?.name === 'High') &&
      !this.isCompleted(issue)
    );

    if (criticalIssues.length > 5) {
      risks.push({
        category: 'quality',
        type: 'high_priority_backlog',
        severity: Math.min(4, Math.floor(criticalIssues.length / 10) + 2),
        description: `${criticalIssues.length} high/critical priority issues remain open`,
        impact: 'High',
        likelihood: 'Confirmed',
        affectedIssues: criticalIssues.slice(0, 5).map(issue => issue.id),
      });
    }

    return risks;
  }

  /**
   * FIXED: Real scope risk assessment
   */
  private async assessScopeRisks(projectId: string, issues: any[]): Promise<any[]> {
    const risks: any[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Analyze scope creep (new issues created recently)
    const recentIssues = issues.filter(issue => new Date(issue.created) > thirtyDaysAgo);
    const scopeCreepRate = recentIssues.length / 30; // issues per day

    if (scopeCreepRate > 2) {
      risks.push({
        category: 'scope',
        type: 'scope_creep',
        severity: scopeCreepRate > 5 ? 4 : 3,
        description: `High rate of new issues: ${scopeCreepRate.toFixed(1)} issues/day over last 30 days`,
        impact: 'Medium',
        likelihood: 'High',
        metrics: { recentIssues: recentIssues.length, dailyRate: scopeCreepRate },
      });
    }

    // Analyze incomplete requirements (issues without proper description)
    const incompleteIssues = issues.filter(issue => 
      !issue.description || 
      issue.description.length < 20 ||
      issue.summary.toLowerCase().includes('tbd') ||
      issue.summary.toLowerCase().includes('todo')
    );

    if (incompleteIssues.length > issues.length * 0.2) {
      risks.push({
        category: 'scope',
        type: 'incomplete_requirements',
        severity: 3,
        description: `${incompleteIssues.length} issues (${((incompleteIssues.length / issues.length) * 100).toFixed(1)}%) have incomplete requirements`,
        impact: 'Medium',
        likelihood: 'High',
        affectedIssues: incompleteIssues.slice(0, 5).map(issue => issue.id),
      });
    }

    return risks;
  }

  /**
   * FIXED: Real team risk assessment
   */
  private async assessTeamRisks(projectId: string, issues: any[]): Promise<any[]> {
    const risks: any[] = [];

    // Analyze workload distribution
    const assigneeWorkload = new Map<string, number>();
    issues.forEach(issue => {
      if (issue.assignee?.login && !this.isCompleted(issue)) {
        assigneeWorkload.set(
          issue.assignee.login, 
          (assigneeWorkload.get(issue.assignee.login) || 0) + 1
        );
      }
    });

    const workloads = Array.from(assigneeWorkload.values());
    if (workloads.length > 1) {
      const maxWorkload = Math.max(...workloads);
      const minWorkload = Math.min(...workloads);
      const workloadImbalance = maxWorkload - minWorkload;

      if (workloadImbalance > 10) {
        risks.push({
          category: 'team',
          type: 'workload_imbalance',
          severity: workloadImbalance > 20 ? 4 : 3,
          description: `Significant workload imbalance: ${maxWorkload} vs ${minWorkload} issues`,
          impact: 'Medium',
          likelihood: 'Confirmed',
          metrics: { maxWorkload, minWorkload, imbalance: workloadImbalance },
        });
      }
    }

    // Analyze unassigned issues
    const unassignedIssues = issues.filter(issue => 
      !issue.assignee && 
      !this.isCompleted(issue) &&
      issue.state?.name !== 'Backlog'
    );

    if (unassignedIssues.length > 5) {
      risks.push({
        category: 'team',
        type: 'unassigned_issues',
        severity: Math.min(3, Math.floor(unassignedIssues.length / 10) + 2),
        description: `${unassignedIssues.length} active issues are unassigned`,
        impact: 'Low',
        likelihood: 'Confirmed',
        affectedIssues: unassignedIssues.slice(0, 5).map(issue => issue.id),
      });
    }

    return risks;
  }

  /**
   * FIXED: Real technical risk assessment
   */
  private async assessTechnicalRisks(projectId: string, issues: any[]): Promise<any[]> {
    const risks: any[] = [];

    // Analyze technical debt indicators
    const techDebtKeywords = ['refactor', 'technical debt', 'cleanup', 'optimize', 'performance'];
    const techDebtIssues = issues.filter(issue => 
      techDebtKeywords.some(keyword => 
        issue.summary.toLowerCase().includes(keyword) ||
        issue.description?.toLowerCase().includes(keyword)
      )
    );

    if (techDebtIssues.length > issues.length * 0.15) {
      risks.push({
        category: 'technical',
        type: 'technical_debt',
        severity: 3,
        description: `${techDebtIssues.length} issues indicate technical debt (${((techDebtIssues.length / issues.length) * 100).toFixed(1)}% of project)`,
        impact: 'Medium',
        likelihood: 'High',
        affectedIssues: techDebtIssues.slice(0, 5).map(issue => issue.id),
      });
    }

    return risks;
  }

  // Helper methods
  private extractDueDate(issue: any): Date | null {
    const dueDateField = issue.customFields?.find((field: any) => 
      field.name === 'Due Date' || 
      field.name === 'Target Date' ||
      field.name === 'Deadline'
    );
    
    return dueDateField?.value ? new Date(dueDateField.value) : null;
  }

  private isCompleted(issue: any): boolean {
    const completedStates = ['Done', 'Closed', 'Resolved', 'Fixed', 'Completed'];
    return completedStates.includes(issue.state?.name);
  }

  private calculateMilestoneStatus(daysRemaining: number | null, progressPercentage: number): string {
    if (daysRemaining === null) return 'No Deadline';
    if (daysRemaining < 0) return 'Overdue';
    if (daysRemaining < 7 && progressPercentage < 80) return 'At Risk';
    if (progressPercentage >= 90) return 'Nearly Complete';
    return 'On Track';
  }

  private calculateVelocity(issues: any[]): number {
    const completedIssues = issues.filter(issue => this.isCompleted(issue));
    const avgCompletionTime = completedIssues.reduce((acc, issue) => {
      const created = new Date(issue.created);
      const resolved = new Date(issue.resolved || new Date());
      return acc + (resolved.getTime() - created.getTime());
    }, 0) / (completedIssues.length || 1);
    
    return Math.round(avgCompletionTime / (1000 * 60 * 60 * 24)); // days
  }

  private estimateCompletion(progressPercentage: number, daysRemaining: number | null, issues: any[]): string {
    if (progressPercentage >= 100) return 'Completed';
    if (daysRemaining === null) return 'No target date set';
    
    const velocity = this.calculateVelocity(issues);
    const remainingIssues = issues.filter(issue => !this.isCompleted(issue)).length;
    const estimatedDays = remainingIssues * velocity;
    
    if (estimatedDays <= daysRemaining) {
      return `On track (estimated ${estimatedDays} days remaining)`;
    } else {
      return `Behind schedule (estimated ${estimatedDays} days, only ${daysRemaining} remaining)`;
    }
  }

  private assessMilestoneRisks(progressPercentage: number, blockedIssues: number, daysRemaining: number | null, issues: any[]): string[] {
    const risks: string[] = [];
    
    if (daysRemaining !== null && daysRemaining < 0) {
      risks.push('🔴 Milestone is overdue');
    } else if (daysRemaining !== null && daysRemaining < 7) {
      risks.push('🟡 Milestone deadline is approaching rapidly');
    }
    
    if (progressPercentage < 50 && daysRemaining !== null && daysRemaining < 14) {
      risks.push('📉 Progress is significantly behind schedule');
    }
    
    if (blockedIssues > 0) {
      risks.push(`🚫 ${blockedIssues} issues are blocked, potentially delaying milestone`);
    }

    const stalledIssues = issues.filter(issue => {
      const updated = new Date(issue.updated);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return updated < weekAgo && !this.isCompleted(issue);
    }).length;

    if (stalledIssues > 0) {
      risks.push(`⚠️ ${stalledIssues} issues haven't been updated recently`);
    }
    
    return risks;
  }

  private generateMilestoneRecommendations(progressPercentage: number, blockedIssues: number, daysRemaining: number | null, issues: any[]): string[] {
    const recommendations: string[] = [];
    
    if (progressPercentage < 30) {
      recommendations.push('Focus resources on this milestone to accelerate progress');
    }
    
    if (blockedIssues > 0) {
      recommendations.push('Prioritize unblocking issues to maintain momentum');
    }
    
    if (daysRemaining !== null && daysRemaining < 7 && progressPercentage < 90) {
      recommendations.push('Consider scope reduction or deadline extension');
    }

    const unassignedIssues = issues.filter(issue => !issue.assignee && !this.isCompleted(issue)).length;
    if (unassignedIssues > 0) {
      recommendations.push(`Assign ${unassignedIssues} unassigned issues to team members`);
    }
    
    return recommendations;
  }

  /**
   * FIXED: Real analytics - Project velocity calculation
   */
  async getProjectVelocity(params: {
    projectId: string;
    periodWeeks?: number;
    metricType?: 'issues' | 'storyPoints';
  }): Promise<MCPResponse> {
    try {
      const periodWeeks = params.periodWeeks || 4;
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (periodWeeks * 7 * 24 * 60 * 60 * 1000));

      logApiCall('GET', '/issues', { projectId: params.projectId, velocity: true });

      const completedIssuesResponse = await this.api.get('/issues', {
        params: {
          query: `project: ${params.projectId} resolved: ${startDate.toISOString().split('T')[0]} .. ${endDate.toISOString().split('T')[0]}`,
          fields: 'id,summary,resolved,customFields(name,value)',
          $top: 1000,
        },
      });

      const completedIssues = completedIssuesResponse.data;
      const velocityData = this.calculateVelocityMetrics(completedIssues, periodWeeks, params.metricType);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(velocityData, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to calculate velocity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * FIXED: Real analytics - Burndown chart data
   */
  async getBurndownChartData(params: {
    projectId: string;
    startDate: string;
    endDate: string;
    sprintId?: string;
    milestoneId?: string;
  }): Promise<MCPResponse> {
    try {
      logApiCall('GET', '/issues', { projectId: params.projectId, burndown: true });

      let query = `project: ${params.projectId} created: < ${params.endDate}`;
      if (params.sprintId) query += ` Sprint: ${params.sprintId}`;
      if (params.milestoneId) query += ` Milestone: ${params.milestoneId}`;

      const issuesResponse = await this.api.get('/issues', {
        params: {
          query,
          fields: 'id,summary,created,resolved,state(name),customFields(name,value)',
          $top: 1000,
        },
      });

      const issues = issuesResponse.data;
      const burndownData = this.generateBurndownData(issues, params.startDate, params.endDate);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(burndownData, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to generate burndown data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * FIXED: Real analytics - Team workload analysis
   */
  async getTeamWorkload(params: {
    projectId: string;
    teamMembers?: string[];
  }): Promise<MCPResponse> {
    try {
      logApiCall('GET', '/issues', { projectId: params.projectId, workload: true });

      let query = `project: ${params.projectId} state: -{Closed Done Resolved}`;
      if (params.teamMembers && params.teamMembers.length > 0) {
        query += ` assignee: {${params.teamMembers.join(' ')}}`;
      }

      const activeIssuesResponse = await this.api.get('/issues', {
        params: {
          query,
          fields: 'id,summary,assignee(login,fullName),priority(name),state(name),customFields(name,value)',
          $top: 1000,
        },
      });

      const activeIssues = activeIssuesResponse.data;
      const workloadAnalysis = this.analyzeTeamWorkload(activeIssues);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(workloadAnalysis, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to analyze team workload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real analytics helper methods
  private calculateVelocityMetrics(issues: any[], periodWeeks: number, metricType?: string): any {
    const weeklyData: { [week: string]: number } = {};
    
    issues.forEach(issue => {
      const resolvedDate = new Date(issue.resolved);
      const weekKey = this.getWeekKey(resolvedDate);
      
      if (metricType === 'storyPoints') {
        const storyPoints = this.extractStoryPoints(issue);
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + storyPoints;
      } else {
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
      }
    });
    
    const weeks = Object.keys(weeklyData).sort();
    const velocities = weeks.map(week => weeklyData[week]);
    const averageVelocity = velocities.length > 0 ? 
      velocities.reduce((sum, v) => sum + v, 0) / velocities.length : 0;
    
    return {
      periodWeeks,
      metricType: metricType || 'issues',
      averageVelocity: Math.round(averageVelocity * 100) / 100,
      weeklyData: weeks.map(week => ({
        week,
        value: weeklyData[week],
      })),
      trend: this.calculateTrend(velocities),
      totalCompleted: issues.length,
      methodology: 'Real YouTrack resolved issues analysis',
    };
  }

  private generateBurndownData(issues: any[], startDate: string, endDate: string): any {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = [];
    
    // Generate daily data points
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().split('T')[0];
      const remainingIssues = issues.filter(issue => {
        const resolved = issue.resolved ? new Date(issue.resolved) : null;
        return !resolved || resolved > d;
      }).length;
      
      days.push({
        date: dayKey,
        remaining: remainingIssues,
        ideal: this.calculateIdealBurndown(issues.length, start, end, d),
      });
    }
    
    return {
      startDate,
      endDate,
      totalIssues: issues.length,
      dailyData: days,
      projectedCompletion: this.predictCompletion(days),
      methodology: 'Real YouTrack issue resolution tracking',
    };
  }

  private analyzeTeamWorkload(issues: any[]): any {
    const workloadByUser: { [user: string]: any } = {};
    
    issues.forEach(issue => {
      const assignee = issue.assignee?.fullName || issue.assignee?.login || 'Unassigned';
      
      if (!workloadByUser[assignee]) {
        workloadByUser[assignee] = {
          totalIssues: 0,
          highPriority: 0,
          mediumPriority: 0,
          lowPriority: 0,
          issues: [],
        };
      }
      
      workloadByUser[assignee].totalIssues += 1;
      workloadByUser[assignee].issues.push({
        id: issue.id,
        summary: issue.summary,
        priority: issue.priority?.name,
        state: issue.state?.name,
      });
      
      const priority = issue.priority?.name?.toLowerCase();
      if (priority === 'critical' || priority === 'high') {
        workloadByUser[assignee].highPriority += 1;
      } else if (priority === 'normal' || priority === 'medium') {
        workloadByUser[assignee].mediumPriority += 1;
      } else {
        workloadByUser[assignee].lowPriority += 1;
      }
    });
    
    const sortedUsers = Object.entries(workloadByUser)
      .map(([user, data]) => ({ user, ...data }))
      .sort((a, b) => b.totalIssues - a.totalIssues);
    
    return {
      totalActiveIssues: issues.length,
      teamMembers: sortedUsers,
      workloadBalance: this.assessWorkloadBalance(sortedUsers),
      recommendations: this.generateWorkloadRecommendations(sortedUsers),
      methodology: 'Real YouTrack active issues analysis',
    };
  }

  // Analytics helper methods
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private extractStoryPoints(issue: any): number {
    const storyPointsField = issue.customFields?.find((field: any) => 
      field.name === 'Story Points' || field.name === 'Estimation' || field.name === 'Story Point'
    );
    return storyPointsField?.value || 1;
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-3);
    const earlier = values.slice(0, -3);
    
    if (recent.length === 0 || earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, v) => sum + v, 0) / earlier.length;
    
    const threshold = 0.1;
    if (recentAvg > earlierAvg * (1 + threshold)) return 'increasing';
    if (recentAvg < earlierAvg * (1 - threshold)) return 'decreasing';
    return 'stable';
  }

  private calculateIdealBurndown(totalIssues: number, start: Date, end: Date, current: Date): number {
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = Math.ceil((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (currentDay <= 0) return totalIssues;
    if (currentDay >= totalDays) return 0;
    
    return Math.round(totalIssues * (1 - currentDay / totalDays));
  }

  private predictCompletion(dailyData: any[]): string {
    // Simple linear regression to predict completion
    const recentTrend = dailyData.slice(-7);
    if (recentTrend.length < 2) return 'Unknown';
    
    const avgDailyBurn = (recentTrend[0].remaining - recentTrend[recentTrend.length - 1].remaining) / recentTrend.length;
    
    if (avgDailyBurn <= 0) return 'At risk - no progress detected';
    
    const currentRemaining = dailyData[dailyData.length - 1].remaining;
    const daysToCompletion = Math.ceil(currentRemaining / avgDailyBurn);
    
    const lastDate = new Date(dailyData[dailyData.length - 1].date);
    const completionDate = new Date(lastDate.getTime() + (daysToCompletion * 24 * 60 * 60 * 1000));
    
    return completionDate.toISOString().split('T')[0];
  }

  private assessWorkloadBalance(users: any[]): string {
    if (users.length === 0) return 'No data';
    
    const workloads = users.map(u => u.totalIssues);
    const avg = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    const maxDeviation = Math.max(...workloads.map(w => Math.abs(w - avg)));
    
    if (maxDeviation / avg < 0.3) return 'Well balanced';
    if (maxDeviation / avg < 0.6) return 'Moderately balanced';
    return 'Imbalanced - consider redistribution';
  }

  private generateWorkloadRecommendations(users: any[]): string[] {
    const recommendations: string[] = [];
    
    if (users.length === 0) return recommendations;
    
    const workloads = users.map(u => u.totalIssues);
    const avg = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    
    const overloaded = users.filter(u => u.totalIssues > avg * 1.5);
    const underloaded = users.filter(u => u.totalIssues < avg * 0.5);
    
    if (overloaded.length > 0) {
      recommendations.push(`Consider redistributing work from: ${overloaded.map(u => u.user).join(', ')}`);
    }
    
    if (underloaded.length > 0) {
      recommendations.push(`Available capacity detected: ${underloaded.map(u => u.user).join(', ')}`);
    }
    
    return recommendations;
  }

  private calculateOverallRisk(risks: any[]): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (risks.length === 0) return 'Low';
    
    const maxSeverity = Math.max(...risks.map(r => r.severity));
    const avgSeverity = risks.reduce((acc, r) => acc + r.severity, 0) / risks.length;
    
    if (maxSeverity >= 5 || avgSeverity >= 4) return 'Critical';
    if (maxSeverity >= 4 || avgSeverity >= 3) return 'High';
    if (maxSeverity >= 3 || avgSeverity >= 2) return 'Medium';
    return 'Low';
  }

  private generateRiskRecommendations(risks: any[]): string[] {
    const recommendations: string[] = [];
    
    const scheduleRisks = risks.filter(r => r.category === 'schedule');
    if (scheduleRisks.length > 0) {
      recommendations.push('Review project timeline and consider resource reallocation');
    }
    
    const qualityRisks = risks.filter(r => r.category === 'quality');
    if (qualityRisks.length > 0) {
      recommendations.push('Implement additional quality assurance measures');
    }
    
    const teamRisks = risks.filter(r => r.category === 'team');
    if (teamRisks.length > 0) {
      recommendations.push('Balance workload and improve team coordination');
    }
    
    const criticalRisks = risks.filter(r => r.severity >= 4);
    if (criticalRisks.length > 0) {
      recommendations.push('Address critical risks immediately to prevent project delays');
    }
    
    return recommendations;
  }

  /**
   * FIXED: Create an epic issue
   */
  async createEpic(params: {
    projectId: string;
    title: string;
    description?: string;
    priority?: string;
    assignee?: string;
  }): Promise<MCPResponse> {
    try {
      logApiCall('POST', '/issues', { epic: true });

      const epicData = {
        summary: `[EPIC] ${params.title}`,
        description: params.description || 'Epic created via MCP',
        project: { id: params.projectId },
        type: { name: 'Epic' }, // Try Epic type first
      };

      // Add optional fields
      if (params.priority) {
        (epicData as any).priority = { name: params.priority };
      }
      if (params.assignee) {
        (epicData as any).assignee = { login: params.assignee };
      }

      try {
        const response = await this.api.post('/issues', epicData);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              message: '✅ Epic created successfully!',
              epicId: response.data.id,
              title: params.title,
              projectId: params.projectId,
            }, null, 2)
          }]
        };
      } catch (typeError) {
        // Fallback: Create as regular issue with Epic tag
        const fallbackData = {
          ...epicData,
          type: { name: 'Task' },
          tags: [{ name: 'Epic' }],
        };
        
        const response = await this.api.post('/issues', fallbackData);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              message: '✅ Epic created as tagged issue (Epic type may not be available)',
              epicId: response.data.id,
              title: params.title,
              projectId: params.projectId,
              fallbackMethod: true,
            }, null, 2)
          }]
        };
      }
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to create epic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * FIXED: Link issue to epic
   */
  async linkIssueToEpic(params: {
    issueId: string;
    epicId: string;
  }): Promise<MCPResponse> {
    try {
      logApiCall('POST', `/issues/${params.issueId}/links`, { target: params.epicId, type: 'parent' });

      // Create parent-child relationship using issue links
      const linkData = {
        linkType: { name: 'parent' },
        issues: [{ id: params.epicId }],
      };

      await this.api.post(`/issues/${params.issueId}/links`, linkData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: '✅ Issue successfully linked to epic',
            issueId: params.issueId,
            epicId: params.epicId,
            relationship: 'child → parent',
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      // Try alternative approach with depends/subtask relationship
      try {
        const alternativeLinkData = {
          linkType: { name: 'subtask' },
          issues: [{ id: params.epicId }],
        };
        await this.api.post(`/issues/${params.issueId}/links`, alternativeLinkData);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              message: '✅ Issue linked to epic using subtask relationship',
              issueId: params.issueId,
              epicId: params.epicId,
              relationship: 'subtask → epic',
            }, null, 2)
          }]
        };
      } catch (altError) {
        throw new Error(`Failed to link issue to epic: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * FIXED: Get epic progress
   */
  async getEpicProgress(epicId: string): Promise<MCPResponse> {
    try {
      logApiCall('GET', `/issues/${epicId}`, { includeChildIssues: true });

      // Get epic details
      const epicResponse = await this.api.get(`/issues/${epicId}`, {
        params: {
          fields: 'id,summary,description,state(name),customFields(name,value),links(linkType,issues(id,summary,state))',
        },
      });

      // Get all child issues linked to this epic
      const childIssuesResponse = await this.api.get('/issues', {
        params: {
          query: `parent: ${epicId}`,
          fields: 'id,summary,state(name),priority(name),assignee(login,fullName),customFields(name,value)',
          $top: 100,
        },
      });

      const epic = epicResponse.data;
      const childIssues = childIssuesResponse.data;

      // Calculate progress metrics
      const totalIssues = childIssues.length;
      const completedIssues = childIssues.filter((issue: any) => 
        issue.state?.name === 'Done' || issue.state?.name === 'Closed' || issue.state?.name === 'Resolved'
      ).length;
      const inProgressIssues = childIssues.filter((issue: any) => 
        issue.state?.name === 'In Progress' || issue.state?.name === 'In Review'
      ).length;
      const blockedIssues = childIssues.filter((issue: any) => 
        issue.state?.name === 'Blocked' || issue.state?.name === 'On Hold'
      ).length;

      const progressPercentage = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

      const progressReport = {
        epic: {
          id: epic.id,
          summary: epic.summary,
          state: epic.state?.name,
        },
        progress: {
          totalIssues,
          completedIssues,
          inProgressIssues,
          blockedIssues,
          remainingIssues: totalIssues - completedIssues,
          progressPercentage,
        },
        childIssues: childIssues.map((issue: any) => ({
          id: issue.id,
          summary: issue.summary,
          state: issue.state?.name,
          assignee: issue.assignee?.fullName || issue.assignee?.login,
          priority: issue.priority?.name,
        })),
        risks: blockedIssues > 0 ? [`${blockedIssues} issues are currently blocked`] : [],
        recommendations: this.generateEpicRecommendations(progressPercentage, blockedIssues, inProgressIssues),
        methodology: 'Real YouTrack epic-child issue tracking',
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(progressReport, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, { epicId });
      throw new Error(`Failed to get epic progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * FIXED: Create milestone
   */
  async createMilestone(params: {
    projectId: string;
    title: string;
    description?: string;
    targetDate?: string;
    priority?: string;
  }): Promise<MCPResponse> {
    try {
      logApiCall('POST', '/issues', { milestone: true });

      let description = params.description || 'Milestone created via MCP';
      if (params.targetDate) {
        description += `\n\nTarget Date: ${params.targetDate}`;
      }

      const milestoneData = {
        summary: `[MILESTONE] ${params.title}`,
        description,
        project: { id: params.projectId },
        type: { name: 'Task' },
        tags: [{ name: 'Milestone' }],
      };

      // Add optional fields
      if (params.priority) {
        (milestoneData as any).priority = { name: params.priority };
      }

      // Try to set due date as custom field
      if (params.targetDate) {
        (milestoneData as any).customFields = [
          {
            name: 'Due Date',
            value: params.targetDate,
          }
        ];
      }

      const response = await this.api.post('/issues', milestoneData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: '🎯 Milestone created successfully!',
            milestoneId: response.data.id,
            title: params.title,
            targetDate: params.targetDate,
            projectId: params.projectId,
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to create milestone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * FIXED: Assign issues to milestone
   */
  async assignIssuesToMilestone(params: {
    milestoneId: string;
    issueIds: string[];
  }): Promise<MCPResponse> {
    try {
      const results = [];

      for (const issueId of params.issueIds) {
        try {
          logApiCall('POST', `/issues/${issueId}/links`, { milestone: params.milestoneId });

          const linkData = {
            linkType: { name: 'relates' },
            issues: [{ id: params.milestoneId }],
          };

          await this.api.post(`/issues/${issueId}/links`, linkData);
          results.push({ issueId, status: 'success' });
        } catch (linkError) {
          results.push({ 
            issueId, 
            status: 'failed', 
            error: linkError instanceof Error ? linkError.message : 'Unknown error' 
          });
        }
      }

      const successCount = results.filter(r => r.status === 'success').length;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `📌 ${successCount}/${params.issueIds.length} issues linked to milestone`,
            milestoneId: params.milestoneId,
            results,
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to assign issues to milestone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * FIXED: Log work time
   */
  async logWorkTime(params: {
    issueId: string;
    duration: string;
    date?: string;
    description?: string;
    workType?: string;
  }): Promise<MCPResponse> {
    try {
      logApiCall('POST', `/issues/${params.issueId}/timeTracking/workItems`, params);

      // YouTrack expects duration in minutes
      const durationMinutes = this.parseDurationToMinutes(params.duration);
      
      const workItemData = {
        duration: durationMinutes,
        date: params.date || new Date().toISOString().split('T')[0],
        description: params.description || 'Work logged via MCP',
        type: { name: params.workType || 'Development' },
      };

      try {
        const response = await this.api.post(`/issues/${params.issueId}/timeTracking/workItems`, workItemData);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              message: '⏱️ Work time logged successfully!',
              issueId: params.issueId,
              duration: params.duration,
              durationMinutes,
              date: workItemData.date,
              description: workItemData.description,
              workType: params.workType || 'Development',
              workItemId: response.data.id,
            }, null, 2)
          }]
        };
      } catch (apiError) {
        // If time tracking API fails, add as comment instead
        logApiCall('POST', `/issues/${params.issueId}/comments`, { timeLog: true });
        
        const commentText = `⏱️ **Time Logged**: ${params.duration}\n📅 **Date**: ${workItemData.date}\n📝 **Description**: ${workItemData.description}\n🏷️ **Type**: ${params.workType || 'Development'}`;
        
        await this.api.post(`/issues/${params.issueId}/comments`, {
          text: commentText,
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              message: '⏱️ Work time logged as comment (time tracking may not be enabled)',
              issueId: params.issueId,
              duration: params.duration,
              date: workItemData.date,
              fallbackMethod: 'comment',
              comment: commentText,
            }, null, 2)
          }]
        };
      }
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to log work time: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * FIXED: Get time report
   */
  async getTimeReport(params: {
    projectId?: string;
    userId?: string;
    startDate: string;
    endDate: string;
    groupBy?: 'user' | 'issue' | 'workType' | 'date';
  }): Promise<MCPResponse> {
    try {
      logApiCall('GET', '/reports/time', params);

      let query = `created: ${params.startDate} .. ${params.endDate}`;
      if (params.projectId) query += ` project: ${params.projectId}`;
      if (params.userId) query += ` by: ${params.userId}`;

      const workItemsResponse = await this.api.get('/workItems', {
        params: {
          query,
          fields: 'id,duration,date,description,type,author(login,fullName),issue(id,summary,project(shortName))',
          $top: 1000,
        },
      });

      const workItems = workItemsResponse.data;
      const groupBy = params.groupBy || 'issue';

      const groupedData = this.groupTimeData(workItems, groupBy);
      const totalTime = workItems.reduce((sum: number, item: any) => sum + (item.duration || 0), 0);

      const report = {
        period: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
        summary: {
          totalWorkItems: workItems.length,
          totalTimeMinutes: totalTime,
          totalTimeFormatted: this.formatDuration(totalTime),
        },
        groupedBy: groupBy,
        data: groupedData,
        topContributors: this.getTopContributors(workItems),
        methodology: 'Real YouTrack work item tracking',
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(report, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to generate time report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods for the new functionality
  private parseDurationToMinutes(duration: string): number {
    // Parse duration strings like "2h 30m", "1d", "45m", "1.5h"
    let totalMinutes = 0;
    
    // Handle days (d)
    const dayMatch = duration.match(/(\d+(?:\.\d+)?)\s*d/i);
    if (dayMatch) {
      totalMinutes += parseFloat(dayMatch[1]) * 480; // 8 hours per day
    }
    
    // Handle hours (h)
    const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*h/i);
    if (hourMatch) {
      totalMinutes += parseFloat(hourMatch[1]) * 60;
    }
    
    // Handle minutes (m)
    const minuteMatch = duration.match(/(\d+(?:\.\d+)?)\s*m/i);
    if (minuteMatch) {
      totalMinutes += parseFloat(minuteMatch[1]);
    }
    
    // If no units found, assume minutes
    if (totalMinutes === 0) {
      const numericMatch = duration.match(/^\d+(?:\.\d+)?$/);
      if (numericMatch) {
        totalMinutes = parseFloat(duration);
      }
    }
    
    return Math.round(totalMinutes);
  }

  private groupTimeData(workItems: any[], groupBy: string): any {
    const grouped: { [key: string]: any } = {};
    
    workItems.forEach((item: any) => {
      let key: string;
      switch (groupBy) {
        case 'user':
          key = item.author?.fullName || item.author?.login || 'Unknown';
          break;
        case 'issue':
          key = `${item.issue?.id} - ${item.issue?.summary}`;
          break;
        case 'workType':
          key = item.type?.name || 'Unknown';
          break;
        case 'date':
          key = item.date;
          break;
        default:
          key = 'All';
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          items: [],
          totalMinutes: 0,
          totalFormatted: '',
        };
      }
      
      grouped[key].items.push(item);
      grouped[key].totalMinutes += item.duration || 0;
      grouped[key].totalFormatted = this.formatDuration(grouped[key].totalMinutes);
    });
    
    return grouped;
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  private getTopContributors(workItems: any[]): any[] {
    const contributors: { [key: string]: number } = {};
    
    workItems.forEach((item: any) => {
      const author = item.author?.fullName || item.author?.login || 'Unknown';
      contributors[author] = (contributors[author] || 0) + (item.duration || 0);
    });
    
    return Object.entries(contributors)
      .map(([name, minutes]) => ({ name, minutes, formatted: this.formatDuration(minutes) }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);
  }

  private generateEpicRecommendations(progressPercentage: number, blockedIssues: number, inProgressIssues: number): string[] {
    const recommendations: string[] = [];
    
    if (progressPercentage < 30) {
      recommendations.push('Consider breaking down large stories into smaller, manageable tasks');
    }
    if (blockedIssues > 0) {
      recommendations.push('Focus on unblocking issues to maintain momentum');
    }
    if (inProgressIssues > 5) {
      recommendations.push('Consider limiting work in progress to improve focus');
    }
    
    return recommendations;
  }
}
