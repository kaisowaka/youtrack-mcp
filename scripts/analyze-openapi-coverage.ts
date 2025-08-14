#!/usr/bin/env tsx
// OpenAPI Coverage Analysis Script
import fs from 'fs';
import path from 'path';

interface OpenAPIPath {
  path: string;
  methods: string[];
  description?: string;
  implemented: boolean;
  mcpTools: string[];
}

function analyzeOpenAPICoverage() {
  // Load OpenAPI specification
  const openApiPath = path.join(process.cwd(), 'openapi.json');
  const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
  
  // Load current tools
  const toolsPath = path.join(process.cwd(), 'src/tools.ts');
  const toolsContent = fs.readFileSync(toolsPath, 'utf8');
  
  // Extract all OpenAPI paths
  const paths: OpenAPIPath[] = [];
  
  for (const [pathPattern, pathData] of Object.entries(openApiSpec.paths as Record<string, any>)) {
    const record = pathData as Record<string, any>;
    const methods = Object.keys(record).filter(key => 
      ['get', 'post', 'put', 'delete', 'patch'].includes(key.toLowerCase())
    );
    
    paths.push({
      path: pathPattern,
      methods,
  description: record.description,
      implemented: false, // Will be determined by analysis
      mcpTools: []
    });
  }
  
  // Categorize endpoints by domain
  const domains = {
    issues: paths.filter(p => p.path.includes('/issues')),
    projects: paths.filter(p => p.path.includes('/projects')),
    agiles: paths.filter(p => p.path.includes('/agiles')),
    articles: paths.filter(p => p.path.includes('/articles')),
    users: paths.filter(p => p.path.includes('/users')),
    activities: paths.filter(p => p.path.includes('/activities')),
    workItems: paths.filter(p => p.path.includes('/workItems')),
    admin: paths.filter(p => p.path.includes('/admin')),
    customFields: paths.filter(p => p.path.includes('/customFieldSettings'))
  };
  
  console.log('OpenAPI Coverage Analysis');
  console.log('==================================');
  
  for (const [domain, domainPaths] of Object.entries(domains)) {
  console.log(`\n${domain.toUpperCase()} Domain:`);
    console.log(`   Total Endpoints: ${domainPaths.length}`);
    
    // Check implementation status
    const implemented = domainPaths.filter(p => {
      // Simple heuristic: check if path pattern appears in tools
      return toolsContent.includes(p.path.replace(/\{[^}]+\}/g, '')) ||
             toolsContent.includes(domain);
    });
    
    console.log(`   Implemented: ${implemented.length}`);
    console.log(`   Coverage: ${((implemented.length / domainPaths.length) * 100).toFixed(1)}%`);
    
    if (domainPaths.length - implemented.length > 0) {
  console.log(`   Missing ${domainPaths.length - implemented.length} endpoints`);
    }
  }
  
  // High-value missing endpoints
  const highValueMissing = [
    '/admin/globalSettings',
    '/admin/databaseBackup',
    '/activitiesPage',
    '/issues/{issueID}/activities',
    '/issues/{issueID}/attachments',
    '/agiles/{agileID}/columns',
    '/projects/{projectID}/customFields',
    '/users/me',
    '/users/{userID}/profiles'
  ];
  
  console.log('\nHigh-Value Missing Endpoints:');
  highValueMissing.forEach(endpoint => {
    console.log(`   - ${endpoint}`);
  });
  
  // Generate improvement recommendations
  console.log('\nRecommendations:');
  console.log('   1. Implement OpenAPI client generation');
  console.log('   2. Add missing high-value endpoints');
  console.log('   3. Create domain-specific API modules');
  console.log('   4. Establish consistent error handling');
  console.log('   5. Add comprehensive test coverage');
  
  return {
    totalEndpoints: paths.length,
    domains,
    highValueMissing,
    coverageReport: Object.fromEntries(
      Object.entries(domains).map(([domain, domainPaths]) => [
        domain,
        {
          total: domainPaths.length,
          implemented: domainPaths.filter(p => 
            toolsContent.includes(p.path.replace(/\{[^}]+\}/g, '')) || 
            toolsContent.includes(domain)
          ).length
        }
      ])
    )
  };
}

// Export for use in other scripts
export { analyzeOpenAPICoverage };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeOpenAPICoverage();
}
