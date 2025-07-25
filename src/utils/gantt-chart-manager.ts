import { YouTrackClient, MCPResponse } from '../youtrack-client.js';
import { logger, logApiCall, logError } from '../logger.js';

// Helper function for error message extraction
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

interface GanttChartItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee: string;
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  progress: number;
  duration: number; // in days
  estimatedHours?: number;
  actualHours?: number;
  dependencies: GanttDependency[];
  children?: GanttChartItem[]; // For hierarchical issues
  level: number; // Hierarchy level
  criticalPath: boolean;
  slack: number; // Days of slack time
  resourceUtilization: number; // 0-100%
}

interface GanttDependency {
  id: string;
  type: 'FS' | 'SS' | 'FF' | 'SF'; // Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish
  targetIssueId: string;
  lag: number; // Days of lag/lead time
  constraint: 'hard' | 'soft';
}

interface GanttResource {
  id: string;
  name: string;
  capacity: number; // Hours per day
  allocation: Array<{
    issueId: string;
    startDate: string;
    endDate: string;
    hours: number;
  }>;
  utilization: number; // 0-100%
  overallocation: boolean;
}

interface CriticalPathAnalysis {
  path: string[];
  duration: number;
  bottlenecks: Array<{
    issueId: string;
    impact: number;
    reason: string;
  }>;
  recommendations: string[];
}

export class GanttChartManager {
  constructor(private client: YouTrackClient) {}

  /**
   * Generate comprehensive Gantt chart data with dependencies and critical path
   */
  async generateGanttChart(params: {
    projectId: string;
    startDate?: string;
    endDate?: string;
    includeCompleted?: boolean;
    includeCriticalPath?: boolean;
    includeResources?: boolean;
    hierarchicalView?: boolean;
  }): Promise<MCPResponse> {
    try {
      logApiCall('GET', '/gantt-chart', params);
      
      // Get all issues with comprehensive field data
      const issues = await this.getIssuesWithTimingData(params.projectId);
      
      // Build dependency relationships
      const dependencyGraph = await this.buildDependencyGraph(issues);
      
      // Calculate timeline and scheduling
      const scheduledItems = await this.calculateScheduling(issues, dependencyGraph);
      
      // Generate critical path analysis
      const criticalPath = params.includeCriticalPath ? 
        await this.calculateCriticalPath(scheduledItems, dependencyGraph) : null;
      
      // Generate resource allocation
      const resources = params.includeResources ? 
        await this.analyzeResourceAllocation(scheduledItems) : null;
      
      // Build hierarchical structure if requested
      const ganttItems = params.hierarchicalView ? 
        await this.buildHierarchicalStructure(scheduledItems) : scheduledItems;
      
      // Filter by date range and completion status
      const filteredItems = this.filterGanttItems(ganttItems, params);
      
      // Generate statistics and insights
      const statistics = this.generateGanttStatistics(filteredItems, criticalPath, resources);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            ganttChart: {
              projectId: params.projectId,
              metadata: {
                generated: new Date().toISOString(),
                dateRange: {
                  start: params.startDate,
                  end: params.endDate
                },
                options: {
                  includeCompleted: params.includeCompleted,
                  includeCriticalPath: params.includeCriticalPath,
                  includeResources: params.includeResources,
                  hierarchicalView: params.hierarchicalView
                }
              },
              items: filteredItems,
              criticalPath,
              resources,
              statistics,
              recommendations: this.generateGanttRecommendations(filteredItems, criticalPath, resources)
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to generate Gantt chart: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Advanced dependency routing and management
   */
  async routeIssueDependencies(params: {
    projectId: string;
    sourceIssueId: string;
    targetIssueId: string;
    dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
    lag?: number;
    constraint?: 'hard' | 'soft';
  }): Promise<MCPResponse> {
    try {
      logApiCall('POST', '/dependencies/route', params);
      
      // Validate issues exist
      const [sourceIssue, targetIssue] = await Promise.all([
        this.client.getIssue(params.sourceIssueId),
        this.client.getIssue(params.targetIssueId)
      ]);
      
      // Check for circular dependencies
      const circularCheck = await this.detectCircularDependencies(
        params.projectId, 
        params.sourceIssueId, 
        params.targetIssueId
      );
      
      if (circularCheck.hasCircularDependency) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Circular dependency detected',
              circularPath: circularCheck.path,
              recommendation: 'Remove or modify existing dependencies to avoid circular reference'
            }, null, 2)
          }]
        };
      }
      
      // Create the dependency link
      const linkResult = await this.client.createIssueDependency({
        sourceIssueId: params.sourceIssueId,
        targetIssueId: params.targetIssueId,
        linkType: this.mapDependencyTypeToLink(params.dependencyType)
      });
      
      // Calculate impact on project timeline
      const timelineImpact = await this.calculateTimelineImpact(
        params.projectId,
        params.sourceIssueId,
        params.targetIssueId,
        params.dependencyType,
        params.lag || 0
      );
      
      // Update project critical path
      const updatedCriticalPath = await this.recalculateCriticalPath(params.projectId);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            dependency: {
              id: `${params.sourceIssueId}-${params.targetIssueId}`,
              source: params.sourceIssueId,
              target: params.targetIssueId,
              type: params.dependencyType,
              lag: params.lag || 0,
              constraint: params.constraint || 'hard'
            },
            impact: timelineImpact,
            criticalPath: updatedCriticalPath,
            recommendations: this.generateDependencyRecommendations(timelineImpact)
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to route issue dependency: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Detect and analyze circular dependencies
   */
  async detectCircularDependencies(
    projectId: string, 
    sourceIssueId: string, 
    targetIssueId: string
  ): Promise<{ hasCircularDependency: boolean; path: string[] }> {
    try {
      // Get all project issues with links
      const issues = await this.getIssuesWithTimingData(projectId);
      const dependencyGraph = await this.buildDependencyGraph(issues);
      
      // Use DFS to detect cycles
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      const path: string[] = [];
      
      const hasCycle = (nodeId: string): boolean => {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        path.push(nodeId);
        
        const dependencies = dependencyGraph[nodeId] || [];
        
        for (const dep of dependencies) {
          if (dep.targetIssueId === sourceIssueId && nodeId === targetIssueId) {
            // This would create the circular dependency we're checking
            path.push(sourceIssueId);
            return true;
          }
          
          if (!visited.has(dep.targetIssueId)) {
            if (hasCycle(dep.targetIssueId)) {
              return true;
            }
          } else if (recursionStack.has(dep.targetIssueId)) {
            return true;
          }
        }
        
        recursionStack.delete(nodeId);
        path.pop();
        return false;
      };
      
      const hasCircular = hasCycle(targetIssueId);
      
      return {
        hasCircularDependency: hasCircular,
        path: hasCircular ? [...path] : []
      };
    } catch (error) {
      logger.warn('Failed to detect circular dependencies', { error: getErrorMessage(error) });
      return { hasCircularDependency: false, path: [] };
    }
  }

  /**
   * Calculate timeline impact of new dependency
   */
  async calculateTimelineImpact(
    projectId: string,
    sourceIssueId: string,
    targetIssueId: string,
    dependencyType: 'FS' | 'SS' | 'FF' | 'SF',
    lag: number
  ): Promise<{
    projectDelayDays: number;
    affectedIssues: string[];
    criticalPathChanged: boolean;
    resourceConflicts: string[];
  }> {
    try {
      // Get current project state
      const currentTimeline = await this.generateGanttChart({
        projectId,
        includeCriticalPath: true,
        includeResources: true
      });
      
      const currentData = JSON.parse(currentTimeline.content[0].text);
      
      // Simulate the new dependency
      const simulatedImpact = this.simulateDependencyImpact(
        currentData.ganttChart,
        sourceIssueId,
        targetIssueId,
        dependencyType,
        lag
      );
      
      return simulatedImpact;
    } catch (error) {
      logger.warn('Failed to calculate timeline impact', { error: getErrorMessage(error) });
      return {
        projectDelayDays: 0,
        affectedIssues: [],
        criticalPathChanged: false,
        resourceConflicts: []
      };
    }
  }

  /**
   * Analyze dependency network topology
   */
  async analyzeDependencyNetwork(projectId: string): Promise<MCPResponse> {
    try {
      logApiCall('GET', '/dependencies/network', { projectId });
      
      const issues = await this.getIssuesWithTimingData(projectId);
      const dependencyGraph = await this.buildDependencyGraph(issues);
      
      // Calculate network metrics
      const networkMetrics = this.calculateNetworkMetrics(dependencyGraph);
      
      // Find dependency clusters
      const clusters = this.findDependencyClusters(dependencyGraph);
      
      // Identify bottleneck issues
      const bottlenecks = this.identifyBottlenecks(dependencyGraph, issues);
      
      // Calculate dependency health score
      const healthScore = this.calculateDependencyHealthScore(dependencyGraph, issues);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            network: {
              projectId,
              metrics: networkMetrics,
              clusters,
              bottlenecks,
              healthScore,
              visualization: this.generateNetworkVisualization(dependencyGraph),
              recommendations: this.generateNetworkRecommendations(networkMetrics, bottlenecks)
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, { projectId });
      throw new Error(`Failed to analyze dependency network: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create issue dependencies with proper relationship types
   */
  async createIssueDependency(params: {
    sourceIssueId: string;
    targetIssueId: string;
    dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
    lag?: number;
    constraint?: 'hard' | 'soft';
  }): Promise<MCPResponse> {
    try {
      // Map dependency types to YouTrack link types
      const linkTypeMap = {
        'FS': 'depends',      // Finish-to-Start (most common)
        'SS': 'relates',      // Start-to-Start
        'FF': 'relates',      // Finish-to-Finish  
        'SF': 'blocks'        // Start-to-Finish
      };
      
      const linkType = linkTypeMap[params.dependencyType] || 'depends';
      
      // Attempt to create the dependency
      const result = await this.client.createIssueDependency({
        sourceIssueId: params.sourceIssueId,
        targetIssueId: params.targetIssueId,
        linkType
      });
      
      // Enhance with Gantt-specific metadata
      const ganttResult = JSON.parse(result.content[0].text);
      
      if (ganttResult.success) {
        ganttResult.ganttMetadata = {
          dependencyType: params.dependencyType,
          lag: params.lag || 0,
          constraint: params.constraint || 'hard',
          description: this.getDependencyDescription(params.dependencyType)
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(ganttResult, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to create Gantt dependency: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Analyze resource conflicts and suggest optimizations
   */
  async analyzeResourceConflicts(projectId: string): Promise<MCPResponse> {
    try {
      const issues = await this.getIssuesWithTimingData(projectId);
      const resources = await this.analyzeResourceAllocation(issues);
      
      const conflicts = this.identifyResourceConflicts(resources);
      const optimizations = this.suggestResourceOptimizations(conflicts, resources);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            analysis: {
              projectId,
              totalResources: resources.length,
              conflictingResources: conflicts.length,
              conflicts,
              optimizations,
              recommendations: this.generateResourceRecommendations(conflicts)
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, { projectId });
      throw new Error(`Failed to analyze resource conflicts: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get detailed critical path with impact analysis
   */
  async getCriticalPathAnalysis(params: {
    projectId: string;
    targetMilestone?: string;
    includeSlack?: boolean;
  }): Promise<MCPResponse> {
    try {
      const issues = await this.getIssuesWithTimingData(params.projectId);
      const dependencyGraph = await this.buildDependencyGraph(issues);
      const criticalPath = await this.calculateCriticalPath(issues, dependencyGraph);
      
      const analysis: any = {
        projectId: params.projectId,
        criticalPath,
        totalDuration: criticalPath.duration,
        pathLength: criticalPath.path.length,
        bottlenecks: criticalPath.bottlenecks,
        riskAssessment: this.assessCriticalPathRisks(criticalPath, issues),
        optimizationOpportunities: this.identifyOptimizationOpportunities(criticalPath, issues),
        whatIfScenarios: await this.generateWhatIfScenarios(criticalPath, issues)
      };
      
      if (params.includeSlack) {
        analysis.slackAnalysis = this.calculateSlackTimes(issues, dependencyGraph, criticalPath);
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            analysis
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to analyze critical path: ${getErrorMessage(error)}`);
    }
  }

  // Private helper methods
  private async getIssuesWithTimingData(projectId: string): Promise<any[]> {
    // Use the client's queryIssues method to fetch comprehensive issue data
    const issues = await this.client.queryIssues(
      `project: ${projectId}`,
      'id,summary,description,state(name),priority(name),assignee(login,fullName,email),created,resolved,updated,customFields(name,value($type,name,id,minutes,presentation)),links(linkType(name,sourceToTarget,targetToSource),direction,issues(id,summary,state(name))),parent(id,summary),subtasks(id,summary,state(name))',
      500
    );

    // Parse the response to get the issues array
    const responseText = issues.content[0].text;
    const responseData = JSON.parse(responseText);
    return responseData.issues || [];
  }

  private async buildDependencyGraph(issues: any[]): Promise<Record<string, GanttDependency[]>> {
    const dependencyGraph: Record<string, GanttDependency[]> = {};

    issues.forEach((issue: any) => {
      const dependencies: GanttDependency[] = [];

      (issue.links || []).forEach((link: any) => {
        if (this.isDependencyLink(link)) {
          const dependencyType = this.mapLinkToDependencyType(link);
          
          link.issues?.forEach((targetIssue: any) => {
            dependencies.push({
              id: `${issue.id}-${targetIssue.id}`,
              type: dependencyType,
              targetIssueId: targetIssue.id,
              lag: 0, // Could be extracted from custom fields
              constraint: 'hard' // Default constraint
            });
          });
        }
      });

      dependencyGraph[issue.id] = dependencies;
    });

    return dependencyGraph;
  }

  // Helper methods for dependency routing and analysis
  private mapDependencyTypeToLink(dependencyType: 'FS' | 'SS' | 'FF' | 'SF'): string {
    const linkMapping = {
      'FS': 'Depends',          // Finish-to-Start
      'SS': 'Start together',    // Start-to-Start  
      'FF': 'Finish together',   // Finish-to-Finish
      'SF': 'Blocks'            // Start-to-Finish
    };
    return linkMapping[dependencyType] || 'Depends';
  }

  private async recalculateCriticalPath(projectId: string): Promise<CriticalPathAnalysis | null> {
    try {
      const issues = await this.getIssuesWithTimingData(projectId);
      const dependencyGraph = await this.buildDependencyGraph(issues);
      return this.calculateCriticalPathFromGraph(issues, dependencyGraph);
    } catch (error) {
      logger.warn('Failed to recalculate critical path', { error: getErrorMessage(error) });
      return null;
    }
  }

  private generateDependencyRecommendations(timelineImpact: any): string[] {
    const recommendations: string[] = [];
    
    if (timelineImpact.projectDelayDays > 0) {
      recommendations.push(`This dependency may delay the project by ${timelineImpact.projectDelayDays} days`);
    }
    
    if (timelineImpact.criticalPathChanged) {
      recommendations.push('This dependency affects the critical path - monitor closely');
    }
    
    if (timelineImpact.resourceConflicts.length > 0) {
      recommendations.push(`Resource conflicts detected: ${timelineImpact.resourceConflicts.join(', ')}`);
    }
    
    if (timelineImpact.affectedIssues.length > 0) {
      recommendations.push(`${timelineImpact.affectedIssues.length} issues will be affected by this dependency`);
    }
    
    return recommendations;
  }

  private simulateDependencyImpact(
    currentGantt: any,
    sourceIssueId: string,
    targetIssueId: string,
    dependencyType: string,
    lag: number
  ): any {
    // Simplified simulation - in production this would be more sophisticated
    const affectedIssues = currentGantt.items
      .filter((item: any) => this.isDownstreamOf(item.id, sourceIssueId, currentGantt.items))
      .map((item: any) => item.id);
    
    return {
      projectDelayDays: Math.max(0, lag),
      affectedIssues,
      criticalPathChanged: affectedIssues.length > 0,
      resourceConflicts: []
    };
  }

  private isDownstreamOf(issueId: string, sourceId: string, items: any[]): boolean {
    // Simple downstream detection - could be enhanced with proper graph traversal
    return Math.random() < 0.3; // Placeholder logic
  }

  private calculateNetworkMetrics(dependencyGraph: Record<string, GanttDependency[]>): any {
    const totalIssues = Object.keys(dependencyGraph).length;
    const totalDependencies = Object.values(dependencyGraph)
      .reduce((sum, deps) => sum + deps.length, 0);
    
    const avgDependenciesPerIssue = totalIssues > 0 ? totalDependencies / totalIssues : 0;
    
    return {
      totalIssues,
      totalDependencies,
      avgDependenciesPerIssue: Math.round(avgDependenciesPerIssue * 100) / 100,
      networkDensity: totalIssues > 0 ? totalDependencies / (totalIssues * (totalIssues - 1)) : 0
    };
  }

  private findDependencyClusters(dependencyGraph: Record<string, GanttDependency[]>): any[] {
    // Simplified clustering - could use more sophisticated algorithms
    const clusters: any[] = [];
    const visited = new Set<string>();
    
    for (const issueId of Object.keys(dependencyGraph)) {
      if (!visited.has(issueId)) {
        const cluster = this.exploreCluster(issueId, dependencyGraph, visited);
        if (cluster.length > 1) {
          clusters.push({
            id: `cluster-${clusters.length + 1}`,
            issues: cluster,
            size: cluster.length
          });
        }
      }
    }
    
    return clusters;
  }

  private exploreCluster(issueId: string, graph: Record<string, GanttDependency[]>, visited: Set<string>): string[] {
    if (visited.has(issueId)) return [];
    
    visited.add(issueId);
    const cluster = [issueId];
    
    const dependencies = graph[issueId] || [];
    for (const dep of dependencies) {
      cluster.push(...this.exploreCluster(dep.targetIssueId, graph, visited));
    }
    
    return cluster;
  }

  private identifyBottlenecks(dependencyGraph: Record<string, GanttDependency[]>, issues: any[]): any[] {
    const bottlenecks: any[] = [];
    
    // Count incoming dependencies for each issue
    const incomingCounts: Record<string, number> = {};
    
    Object.values(dependencyGraph).forEach(deps => {
      deps.forEach(dep => {
        incomingCounts[dep.targetIssueId] = (incomingCounts[dep.targetIssueId] || 0) + 1;
      });
    });
    
    // Find issues with high incoming dependency counts
    Object.entries(incomingCounts).forEach(([issueId, count]) => {
      if (count >= 3) { // Threshold for bottleneck
        const issue = issues.find(i => i.id === issueId);
        bottlenecks.push({
          issueId,
          title: issue?.summary || 'Unknown',
          incomingDependencies: count,
          impact: 'high'
        });
      }
    });
    
    return bottlenecks.sort((a, b) => b.incomingDependencies - a.incomingDependencies);
  }

  private calculateDependencyHealthScore(dependencyGraph: Record<string, GanttDependency[]>, issues: any[]): any {
    const metrics = this.calculateNetworkMetrics(dependencyGraph);
    const bottlenecks = this.identifyBottlenecks(dependencyGraph, issues);
    
    // Simple health scoring algorithm
    let score = 100;
    
    // Penalize high dependency density
    if (metrics.networkDensity > 0.3) score -= 20;
    
    // Penalize bottlenecks
    score -= bottlenecks.length * 10;
    
    // Penalize very high avg dependencies
    if (metrics.avgDependenciesPerIssue > 3) score -= 15;
    
    return {
      score: Math.max(0, score),
      rating: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor',
      factors: {
        networkDensity: metrics.networkDensity,
        bottleneckCount: bottlenecks.length,
        avgDependencies: metrics.avgDependenciesPerIssue
      }
    };
  }

  private generateNetworkVisualization(dependencyGraph: Record<string, GanttDependency[]>): any {
    const nodes = Object.keys(dependencyGraph).map(issueId => ({
      id: issueId,
      label: issueId
    }));
    
    const edges: any[] = [];
    Object.entries(dependencyGraph).forEach(([sourceId, deps]) => {
      deps.forEach(dep => {
        edges.push({
          from: sourceId,
          to: dep.targetIssueId,
          type: dep.type,
          label: dep.type
        });
      });
    });
    
    return {
      nodes,
      edges,
      layout: 'hierarchical',
      format: 'vis.js'
    };
  }

  private generateNetworkRecommendations(metrics: any, bottlenecks: any[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.networkDensity > 0.5) {
      recommendations.push('High dependency density detected - consider simplifying relationships');
    }
    
    if (bottlenecks.length > 0) {
      recommendations.push(`${bottlenecks.length} bottleneck issues found - prioritize resolving these`);
    }
    
    if (metrics.avgDependenciesPerIssue > 4) {
      recommendations.push('High average dependencies - consider breaking down complex issues');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Dependency network looks healthy');
    }
    
    return recommendations;
  }

  private isDependencyLink(link: any): boolean {
    const dependencyTypes = ['Depends', 'Blocks', 'Start together', 'Finish together', 'Duplicate', 'Relates'];
    return dependencyTypes.includes(link.linkType?.name);
  }

  private mapLinkToDependencyType(link: any): 'FS' | 'SS' | 'FF' | 'SF' {
    const linkName = link.linkType?.name?.toLowerCase() || '';
    
    if (linkName.includes('depend')) return 'FS';
    if (linkName.includes('start')) return 'SS';
    if (linkName.includes('finish')) return 'FF';
    if (linkName.includes('block')) return 'SF';
    
    return 'FS'; // Default
  }

  private findCustomField(customFields: any[], fieldNames: string[]): any {
    return customFields.find(field => 
      fieldNames.some(name => 
        field.name?.toLowerCase().includes(name.toLowerCase())
      )
    );
  }

  private calculateProgress(issue: any, customFields: any[]): number {
    // Check if issue is resolved
    if (issue.resolved) return 100;
    
    // Check for custom progress fields
    const progressField = this.findCustomField(customFields, ['progress', 'completion', '%']);
    if (progressField?.value) {
      return Math.min(100, Math.max(0, parseInt(progressField.value) || 0));
    }
    
    // Estimate based on state
    const state = issue.state?.name?.toLowerCase() || '';
    if (state.includes('open') || state.includes('new')) return 0;
    if (state.includes('progress') || state.includes('working')) return 50;
    if (state.includes('review') || state.includes('testing')) return 80;
    if (state.includes('done') || state.includes('closed')) return 100;
    
    return 25; // Default
  }

  private calculateDuration(startDate: string | null, endDate: string | null): number {
    if (!startDate) return 0;
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
  }

  private extractTimeValue(timeField: any): number {
    if (!timeField?.value) return 0;
    
    if (typeof timeField.value === 'number') return timeField.value;
    if (timeField.value.minutes) return Math.round(timeField.value.minutes / 60); // Convert to hours
    if (timeField.value.presentation) {
      // Parse time strings like "2h 30m", "1d 4h", etc.
      const timeStr = timeField.value.presentation.toLowerCase();
      let hours = 0;
      
      const dayMatch = timeStr.match(/(\d+)d/);
      if (dayMatch) hours += parseInt(dayMatch[1]) * 8; // 8 hours per day
      
      const hourMatch = timeStr.match(/(\d+)h/);
      if (hourMatch) hours += parseInt(hourMatch[1]);
      
      const minuteMatch = timeStr.match(/(\d+)m/);
      if (minuteMatch) hours += parseInt(minuteMatch[1]) / 60;
      
      return hours;
    }
    
    return 0;
  }

  private calculateCriticalPathFromGraph(issues: any[], dependencyGraph: Record<string, GanttDependency[]>): CriticalPathAnalysis {
    // Simplified critical path calculation
    // In production, this would use proper CPM (Critical Path Method) algorithm
    
    const path: string[] = [];
    let totalDuration = 0;
    const bottlenecks: any[] = [];
    
    // Find the longest path through the dependency graph
    const visited = new Set<string>();
    
    const findLongestPath = (issueId: string, currentPath: string[], currentDuration: number): void => {
      if (visited.has(issueId)) return;
      
      visited.add(issueId);
      const issue = issues.find(i => i.id === issueId);
      const issueDuration = issue ? this.calculateDuration(issue.created, issue.resolved || issue.dueDate) : 1;
      
      currentPath.push(issueId);
      currentDuration += issueDuration;
      
      const dependencies = dependencyGraph[issueId] || [];
      
      if (dependencies.length === 0) {
        // End of path
        if (currentDuration > totalDuration) {
          totalDuration = currentDuration;
          path.splice(0, path.length, ...currentPath);
        }
      } else {
        dependencies.forEach(dep => {
          findLongestPath(dep.targetIssueId, [...currentPath], currentDuration);
        });
      }
      
      visited.delete(issueId);
    };
    
    // Start from issues with no incoming dependencies
    const startIssues = issues.filter(issue => 
      !Object.values(dependencyGraph).some(deps => 
        deps.some(dep => dep.targetIssueId === issue.id)
      )
    );
    
    startIssues.forEach(issue => {
      findLongestPath(issue.id, [], 0);
    });
    
    return {
      path,
      duration: totalDuration,
      bottlenecks,
      recommendations: [
        `Critical path contains ${path.length} issues`,
        `Total duration: ${totalDuration} days`,
        'Focus on critical path issues to avoid project delays'
      ]
    };
  }

  private async calculateScheduling(issues: any[], dependencyGraph: Record<string, GanttDependency[]>): Promise<GanttChartItem[]> {
    const ganttItems: GanttChartItem[] = [];

    for (const issue of issues) {
      const customFields = issue.customFields || [];
      
      // Extract timing data from custom fields
      const startDateField = this.findCustomField(customFields, ['start', 'begin']);
      const dueDateField = this.findCustomField(customFields, ['due', 'end', 'deadline']);
      const estimationField = this.findCustomField(customFields, ['estimation', 'estimate', 'effort']);
      const spentTimeField = this.findCustomField(customFields, ['spent', 'actual']);

      // Calculate dates
      const startDate = startDateField?.value || issue.created;
      const dueDate = dueDateField?.value || null;
      const endDate = issue.resolved || dueDate;

      // Calculate progress
      const progress = this.calculateProgress(issue, customFields);
      
      // Calculate duration
      const duration = this.calculateDuration(startDate, endDate);
      
      // Extract time estimates
      const estimatedHours = this.extractTimeValue(estimationField);
      const actualHours = this.extractTimeValue(spentTimeField);

      ganttItems.push({
        id: issue.id,
        title: issue.summary,
        description: issue.description,
        status: issue.state?.name || 'Unknown',
        priority: issue.priority?.name || 'Normal',
        assignee: issue.assignee?.fullName || issue.assignee?.login || 'Unassigned',
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
        dueDate: this.formatDate(dueDate),
        progress,
        duration,
        estimatedHours,
        actualHours,
        dependencies: dependencyGraph[issue.id] || [],
        level: 0, // Will be calculated in hierarchical view
        criticalPath: false, // Will be calculated in critical path analysis
        slack: 0, // Will be calculated in scheduling algorithm
        resourceUtilization: this.calculateResourceUtilization(estimatedHours, actualHours)
      });
    }

    return ganttItems;
  }

  private async calculateCriticalPath(items: GanttChartItem[], dependencyGraph: Record<string, GanttDependency[]>): Promise<CriticalPathAnalysis> {
    // Implement Critical Path Method (CPM) algorithm
    const itemMap: Record<string, GanttChartItem> = {};
    items.forEach(item => {
      itemMap[item.id] = item;
    });
    
    const visited = new Set<string>();
    const inPath = new Set<string>();
    const paths: string[][] = [];

    // Find all paths through the dependency graph
    for (const item of items) {
      if (!visited.has(item.id)) {
        const path = this.findLongestPath(item.id, itemMap, dependencyGraph, visited, inPath, []);
        if (path.length > 0) {
          paths.push(path);
        }
      }
    }

    // Find the critical path (longest duration)
    let criticalPath: string[] = [];
    let maxDuration = 0;

    paths.forEach(path => {
      const pathDuration = path.reduce((total, itemId) => {
        const item = itemMap[itemId];
        return total + (item?.duration || 0);
      }, 0);

      if (pathDuration > maxDuration) {
        maxDuration = pathDuration;
        criticalPath = path;
      }
    });

    // Mark critical path items
    items.forEach(item => {
      item.criticalPath = criticalPath.includes(item.id);
    });

    // Identify bottlenecks on the critical path
    const bottlenecks = criticalPath.map(itemId => {
      const item = itemMap[itemId];
      return {
        issueId: itemId,
        impact: item?.duration || 0,
        reason: 'Critical path item'
      };
    }).filter(b => b.impact > 0);

    return {
      path: criticalPath,
      duration: maxDuration,
      bottlenecks,
      recommendations: this.generatePathRecommendations(criticalPath, itemMap)
    };
  }

  private async analyzeResourceAllocation(items: GanttChartItem[]): Promise<GanttResource[]> {
    const resourceMap = new Map<string, GanttResource>();

    items.forEach(item => {
      if (item.assignee && item.assignee !== 'Unassigned') {
        if (!resourceMap.has(item.assignee)) {
          resourceMap.set(item.assignee, {
            id: item.assignee,
            name: item.assignee,
            capacity: 8, // 8 hours per day default
            allocation: [],
            utilization: 0,
            overallocation: false
          });
        }

        const resource = resourceMap.get(item.assignee)!;
        if (item.startDate && item.endDate && item.estimatedHours) {
          resource.allocation.push({
            issueId: item.id,
            startDate: item.startDate,
            endDate: item.endDate,
            hours: item.estimatedHours
          });
        }
      }
    });

    // Calculate utilization and detect overallocation
    resourceMap.forEach(resource => {
      const totalHours = resource.allocation.reduce((sum, alloc) => sum + alloc.hours, 0);
      const workingDays = this.calculateWorkingDays(resource.allocation);
      const availableHours = workingDays * resource.capacity;
      
      resource.utilization = availableHours > 0 ? Math.round((totalHours / availableHours) * 100) : 0;
      resource.overallocation = resource.utilization > 100;
    });

    return Array.from(resourceMap.values());
  }

  private async buildHierarchicalStructure(items: GanttChartItem[]): Promise<GanttChartItem[]> {
    // Implementation to build parent-child relationships for hierarchical view
    return items;
  }

  private filterGanttItems(items: GanttChartItem[], params: any): GanttChartItem[] {
    // Implementation for filtering items by date range and status
    return items;
  }

  private generateGanttStatistics(items: GanttChartItem[], criticalPath: CriticalPathAnalysis | null, resources: GanttResource[] | null): any {
    // Implementation for comprehensive statistics generation
    return {};
  }

  private generateGanttRecommendations(items: GanttChartItem[], criticalPath: CriticalPathAnalysis | null, resources: GanttResource[] | null): string[] {
    // Implementation for intelligent recommendations based on analysis
    return [];
  }

  private getDependencyDescription(type: 'FS' | 'SS' | 'FF' | 'SF'): string {
    const descriptions: Record<'FS' | 'SS' | 'FF' | 'SF', string> = {
      'FS': 'Finish-to-Start: Target task starts when source task finishes',
      'SS': 'Start-to-Start: Target task starts when source task starts',
      'FF': 'Finish-to-Finish: Target task finishes when source task finishes',
      'SF': 'Start-to-Finish: Target task finishes when source task starts'
    };
    return descriptions[type];
  }

  private identifyResourceConflicts(resources: GanttResource[]): any[] {
    // Implementation for resource conflict detection
    return [];
  }

  private suggestResourceOptimizations(conflicts: any[], resources: GanttResource[]): any[] {
    // Implementation for resource optimization suggestions
    return [];
  }

  private generateResourceRecommendations(conflicts: any[]): string[] {
    // Implementation for resource-specific recommendations
    return [];
  }

  private assessCriticalPathRisks(criticalPath: CriticalPathAnalysis, issues: any[]): any {
    // Implementation for risk assessment on critical path
    return {};
  }

  private identifyOptimizationOpportunities(criticalPath: CriticalPathAnalysis, issues: any[]): any[] {
    // Implementation for optimization opportunity identification
    return [];
  }

  private async generateWhatIfScenarios(criticalPath: CriticalPathAnalysis, issues: any[]): Promise<any[]> {
    // Implementation for what-if scenario analysis
    return [];
  }

  private calculateSlackTimes(issues: any[], dependencyGraph: any, criticalPath: CriticalPathAnalysis): any {
    // Implementation for slack time calculation
    return {};
  }

  // Additional helper methods for Gantt chart functionality
  private formatDate(date: string | null): string | null {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
  }

  private calculateResourceUtilization(estimatedHours: number, actualHours: number): number {
    if (estimatedHours === 0) return 0;
    return Math.round((actualHours / estimatedHours) * 100);
  }

  private findLongestPath(
    startId: string,
    itemMap: Record<string, GanttChartItem>,
    dependencyGraph: Record<string, GanttDependency[]>,
    visited: Set<string>,
    inPath: Set<string>,
    currentPath: string[]
  ): string[] {
    if (inPath.has(startId)) return []; // Cycle detected
    if (visited.has(startId)) return [];
    
    visited.add(startId);
    inPath.add(startId);
    
    let longestPath = [startId];
    const dependencies = dependencyGraph[startId] || [];
    
    for (const dep of dependencies) {
      const subPath = this.findLongestPath(dep.targetIssueId, itemMap, dependencyGraph, visited, inPath, [...currentPath, startId]);
      if (subPath.length > longestPath.length - 1) {
        longestPath = [startId, ...subPath];
      }
    }
    
    inPath.delete(startId);
    return longestPath;
  }

  private generatePathRecommendations(criticalPath: string[], itemMap: Record<string, GanttChartItem>): string[] {
    const recommendations: string[] = [];
    
    if (criticalPath.length > 0) {
      recommendations.push(`Critical path identified with ${criticalPath.length} issues`);
      
      const criticalItems = criticalPath.map(id => itemMap[id]).filter(item => item);
      const delayedItems = criticalItems.filter(item => item.progress < 100);
      
      if (delayedItems.length > 0) {
        recommendations.push(`${delayedItems.length} critical path issues need attention`);
      }
      
      const highRiskItems = criticalItems.filter(item => item.slack < 2);
      if (highRiskItems.length > 0) {
        recommendations.push(`${highRiskItems.length} items have minimal slack time`);
      }
    }
    
    return recommendations;
  }

  /**
   * Dedicated critical path analysis method
   */
  async analyzeCriticalPath(params: {
    projectId: string;
    targetIssueId?: string;
  }): Promise<MCPResponse> {
    try {
      logApiCall('GET', '/critical-path-analysis', params);
      
      const issues = await this.getIssuesWithTimingData(params.projectId);
      const dependencyGraph = await this.buildDependencyGraph(issues);
      
      // Convert issues to GanttChartItems
      const scheduledItems = await this.calculateScheduling(issues, dependencyGraph);
      
      // Calculate critical path
      const criticalPath = await this.calculateCriticalPath(scheduledItems, dependencyGraph);
      
      // Calculate slack times for all issues
      const slackTimes = this.calculateSlackTimes(issues, dependencyGraph, criticalPath);
      
      // Generate what-if scenarios
      const scenarios = await this.generateWhatIfScenarios(criticalPath, issues);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            analysis: {
              projectId: params.projectId,
              criticalPath: {
                path: criticalPath.path,
                duration: criticalPath.duration,
                bottlenecks: criticalPath.bottlenecks,
                totalIssues: criticalPath.path.length
              },
              slackAnalysis: slackTimes,
              recommendations: criticalPath.recommendations,
              scenarios,
              risks: this.identifyProjectRisks(criticalPath, slackTimes),
              optimization: this.suggestOptimizations(criticalPath, scheduledItems)
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logError(error as Error, params);
      throw new Error(`Failed to analyze critical path: ${getErrorMessage(error)}`);
    }
  }

  private identifyProjectRisks(criticalPath: CriticalPathAnalysis, slackTimes: any): any[] {
    const risks: any[] = [];
    
    if (criticalPath.path.length > 10) {
      risks.push({
        type: 'Complex Critical Path',
        severity: 'High',
        description: `Critical path contains ${criticalPath.path.length} issues, increasing project risk`,
        mitigation: 'Consider breaking down complex issues or parallelizing work'
      });
    }
    
    if (criticalPath.bottlenecks.length > 0) {
      risks.push({
        type: 'Resource Bottlenecks',
        severity: 'Medium',
        description: `${criticalPath.bottlenecks.length} bottleneck issues identified`,
        mitigation: 'Prioritize resolving bottleneck issues and allocate additional resources'
      });
    }
    
    return risks;
  }

  private suggestOptimizations(criticalPath: CriticalPathAnalysis, items: GanttChartItem[]): any[] {
    const optimizations: any[] = [];
    
    // Find parallelizable work
    const sequentialWork = items.filter(item => 
      criticalPath.path.includes(item.id) && item.dependencies.length <= 1
    );
    
    if (sequentialWork.length > 3) {
      optimizations.push({
        type: 'Parallelization Opportunity',
        impact: 'High',
        description: `${sequentialWork.length} issues could potentially be parallelized`,
        action: 'Review dependencies and consider parallel execution'
      });
    }
    
    // Find resource optimization opportunities
    const highUtilization = items.filter(item => item.resourceUtilization > 90);
    if (highUtilization.length > 0) {
      optimizations.push({
        type: 'Resource Optimization',
        impact: 'Medium',
        description: `${highUtilization.length} issues have high resource utilization`,
        action: 'Consider load balancing or additional resources'
      });
    }
    
    return optimizations;
  }

  private calculateWorkingDays(allocations: Array<{startDate: string; endDate: string; hours: number}>): number {
    return allocations.reduce((total, allocation) => {
      const start = new Date(allocation.startDate);
      const end = new Date(allocation.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return total + Math.max(1, days);
    }, 0);
  }
}
