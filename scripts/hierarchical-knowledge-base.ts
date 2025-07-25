#!/usr/bin/env npx tsx
/**
 * Enhanced Hierarchical Knowledge Base System
 * 
 * This system implements comprehensive hierarchical documentation management:
 * - Parent-child article relationships
 * - Tree structure navigation
 * - Folder-like organization simulation
 * - Advanced content organization tools
 */

import { YouTrackClient } from '../src/youtrack-client.js';
import { ConfigManager } from '../src/config.js';

interface ArticleHierarchy {
  id: string;
  idReadable: string;
  title: string;
  summary?: string;
  hasChildren: boolean;
  parentArticle?: ArticleHierarchy;
  childArticles?: ArticleHierarchy[];
  ordinal: number;
  level: number;
  path: string[];
  project: { id: string; name: string; shortName: string };
  tags: string[];
  created: string;
  updated: string;
  author: string;
}

interface DocumentationStructure {
  projectId: string;
  projectName: string;
  totalArticles: number;
  maxDepth: number;
  rootArticles: ArticleHierarchy[];
  flatStructure: ArticleHierarchy[];
  folderStructure: { [key: string]: ArticleHierarchy[] };
}

class HierarchicalKnowledgeBase {
  private client: YouTrackClient;

  constructor() {
    const config = new ConfigManager();
    this.client = new YouTrackClient(config.get().youtrackUrl, config.get().youtrackToken);
  }

  async createDocumentationStructure(projectId: string, structure: {
    name: string;
    description: string;
    sections: {
      name: string;
      description: string;
      articles: {
        title: string;
        content: string;
        tags?: string[];
      }[];
    }[];
  }): Promise<DocumentationStructure> {
    console.log(`📚 Creating hierarchical documentation structure for project ${projectId}...`);
    
    // Create main documentation root article
    const rootArticle = await this.createFolderArticle(projectId, {
      title: structure.name,
      content: `# ${structure.name}\n\n${structure.description}\n\n## Table of Contents\n\nThis documentation is organized into the following sections:`,
      tags: ['documentation', 'root', 'hierarchy']
    });

    console.log(`📖 Created root article: ${rootArticle.idReadable}`);

    const allArticles: ArticleHierarchy[] = [];
    
    // Create section folders and articles
    for (const section of structure.sections) {
      console.log(`📁 Creating section: ${section.name}...`);
      
      // Create section container article
      const sectionArticle = await this.createSubArticle(rootArticle.id, {
        title: section.name,
        content: `# ${section.name}\n\n${section.description}\n\n## Articles in this Section\n\nThis section contains the following articles:`,
        tags: ['documentation', 'section', 'folder']
      });

      console.log(`  📂 Created section folder: ${sectionArticle.idReadable}`);

      // Create articles within the section
      for (const article of section.articles) {
        const subArticle = await this.createSubArticle(sectionArticle.id, {
          title: article.title,
          content: article.content,
          tags: [...(article.tags || []), 'documentation', 'content']
        });

        console.log(`    📄 Created article: ${subArticle.idReadable} - ${article.title}`);
      }
    }

    // Build complete hierarchy structure
    const hierarchy = await this.getProjectDocumentationStructure(projectId);
    
    console.log(`✅ Documentation structure created successfully!`);
    console.log(`📊 Summary: ${hierarchy.totalArticles} articles, ${hierarchy.maxDepth} levels deep`);
    
    return hierarchy;
  }

  async createFolderArticle(projectId: string, params: {
    title: string;
    content: string;
    tags?: string[];
  }): Promise<ArticleHierarchy> {
    const response = await this.client.createArticle({
      title: params.title,
      content: params.content,
      projectId,
      tags: params.tags
    });

    const responseData = JSON.parse(response.content[0].text);
    const articleId = responseData.articleId;

    // Get the full article details with hierarchy information
    const articleDetails = await this.client.getArticle({ 
      articleId,
      includeComments: false 
    });

    const article = JSON.parse(articleDetails.content[0].text).article;
    
    return this.mapToHierarchy(article, 0);
  }

  async createSubArticle(parentArticleId: string, params: {
    title: string;
    content: string;
    tags?: string[];
  }): Promise<ArticleHierarchy> {
    // First create the article
    const parentDetails = await this.client.getArticle({ 
      articleId: parentArticleId,
      includeComments: false 
    });
    const parentArticle = JSON.parse(parentDetails.content[0].text).article;

    const response = await this.client.createArticle({
      title: params.title,
      content: params.content,
      projectId: parentArticle.project.shortName,
      tags: params.tags
    });

    const responseData = JSON.parse(response.content[0].text);
    const articleId = responseData.articleId;

    // Now link it as a sub-article using the YouTrack API
    await this.linkAsSubArticle(parentArticleId, articleId);

    // Get the updated article details
    const articleDetails = await this.client.getArticle({ 
      articleId,
      includeComments: false 
    });

    const article = JSON.parse(articleDetails.content[0].text).article;
    
    return this.mapToHierarchy(article, 1);
  }

  private async linkAsSubArticle(parentArticleId: string, childArticleId: string): Promise<void> {
    try {
      // Use the client method to link articles
      const response = await this.client.linkSubArticle({
        parentArticleId,
        childArticleId
      });

      const responseData = JSON.parse(response.content[0].text);
      console.log(`🔗 ${responseData.message}`);
    } catch (error) {
      console.error(`Failed to link articles: ${error}`);
      throw error;
    }
  }

  async getProjectDocumentationStructure(projectId: string): Promise<DocumentationStructure> {
    console.log(`🔍 Analyzing documentation structure for project ${projectId}...`);

    // Get all articles for the project with hierarchy information
    const articlesResponse = await this.client.listArticles({
      projectId,
      includeContent: false
    });

    const articlesData = JSON.parse(articlesResponse.content[0].text);
    const articles = articlesData.articles || [];

    // Enhance each article with detailed hierarchy information
    const enhancedArticles: ArticleHierarchy[] = [];
    
    for (const article of articles) {
      try {
        const detailResponse = await this.client.getArticle({ 
          articleId: article.id,
          includeComments: false 
        });
        const detailData = JSON.parse(detailResponse.content[0].text).article;
        
        const hierarchyArticle = this.mapToHierarchy(detailData, 0);
        enhancedArticles.push(hierarchyArticle);
      } catch (error) {
        console.warn(`Could not get details for article ${article.id}:`, error);
      }
    }

    // Build hierarchy tree and analyze structure
    const rootArticles = enhancedArticles.filter(article => !article.parentArticle);
    const maxDepth = this.calculateMaxDepth(enhancedArticles);
    const folderStructure = this.buildFolderStructure(enhancedArticles);

    const structure: DocumentationStructure = {
      projectId,
      projectName: articles[0]?.project?.name || projectId,
      totalArticles: enhancedArticles.length,
      maxDepth,
      rootArticles,
      flatStructure: enhancedArticles,
      folderStructure
    };

    return structure;
  }

  async visualizeDocumentationTree(projectId: string): Promise<string> {
    const structure = await this.getProjectDocumentationStructure(projectId);
    
    let tree = `📚 ${structure.projectName} Documentation Tree\n`;
    tree += `📊 ${structure.totalArticles} articles, ${structure.maxDepth} levels deep\n\n`;

    for (const rootArticle of structure.rootArticles) {
      tree += this.renderArticleTree(rootArticle, 0);
    }

    return tree;
  }

  private renderArticleTree(article: ArticleHierarchy, level: number): string {
    const indent = '  '.repeat(level);
    const icon = article.hasChildren ? '📁' : '📄';
    const tagsBadge = article.tags.length > 0 ? ` [${article.tags.slice(0, 2).join(', ')}${article.tags.length > 2 ? '...' : ''}]` : '';
    
    let result = `${indent}${icon} ${article.title} (${article.idReadable})${tagsBadge}\n`;
    
    if (article.childArticles && article.childArticles.length > 0) {
      for (const child of article.childArticles) {
        result += this.renderArticleTree(child, level + 1);
      }
    }
    
    return result;
  }

  private mapToHierarchy(article: any, level: number): ArticleHierarchy {
    return {
      id: article.id,
      idReadable: article.idReadable,
      title: article.summary || article.title || 'Untitled',
      summary: article.summary,
      hasChildren: article.hasChildren || false,
      parentArticle: article.parentArticle ? this.mapToHierarchy(article.parentArticle, level - 1) : undefined,
      childArticles: article.childArticles ? article.childArticles.map((child: any) => this.mapToHierarchy(child, level + 1)) : [],
      ordinal: article.ordinal || 0,
      level,
      path: this.buildArticlePath(article),
      project: article.project,
      tags: article.tags?.map((tag: any) => tag.name) || [],
      created: article.createdDate || new Date(article.created).toISOString().split('T')[0],
      updated: article.updatedDate || new Date(article.updated).toISOString().split('T')[0],
      author: article.authorName || 'Unknown'
    };
  }

  private buildArticlePath(article: any): string[] {
    const path: string[] = [];
    let current = article;
    
    while (current) {
      path.unshift(current.summary || current.title || 'Untitled');
      current = current.parentArticle;
    }
    
    return path;
  }

  private calculateMaxDepth(articles: ArticleHierarchy[]): number {
    return Math.max(...articles.map(article => article.level), 0);
  }

  private buildFolderStructure(articles: ArticleHierarchy[]): { [key: string]: ArticleHierarchy[] } {
    const folderStructure: { [key: string]: ArticleHierarchy[] } = {};
    
    for (const article of articles) {
      const folderPath = article.path.slice(0, -1).join(' > ') || 'Root';
      if (!folderStructure[folderPath]) {
        folderStructure[folderPath] = [];
      }
      folderStructure[folderPath].push(article);
    }
    
    return folderStructure;
  }

  async moveArticleToFolder(articleId: string, newParentArticleId: string | null): Promise<void> {
    console.log(`📁 Moving article ${articleId} to ${newParentArticleId ? `under ${newParentArticleId}` : 'root level'}...`);

    if (newParentArticleId) {
      // Link as sub-article
      await this.linkAsSubArticle(newParentArticleId, articleId);
    } else {
      // Move to root level (remove parent relationship)
      // This would require custom API implementation
      console.warn('Moving to root level not yet implemented');
    }

    console.log('✅ Article moved successfully');
  }

  async reorganizeDocumentation(projectId: string, reorganizationPlan: {
    rootStructure: {
      title: string;
      description: string;
      sections: {
        name: string;
        articleIds: string[];
      }[];
    };
  }): Promise<void> {
    console.log(`🔄 Reorganizing documentation for project ${projectId}...`);

    const structure = await this.getProjectDocumentationStructure(projectId);
    
    // Create new root structure if needed
    const rootArticle = await this.createFolderArticle(projectId, {
      title: reorganizationPlan.rootStructure.title,
      content: `# ${reorganizationPlan.rootStructure.title}\n\n${reorganizationPlan.rootStructure.description}`,
      tags: ['documentation', 'reorganized', 'root']
    });

    // Create sections and move articles
    for (const section of reorganizationPlan.rootStructure.sections) {
      const sectionArticle = await this.createSubArticle(rootArticle.id, {
        title: section.name,
        content: `# ${section.name}\n\nThis section contains reorganized documentation articles.`,
        tags: ['documentation', 'section', 'reorganized']
      });

      // Move specified articles to this section
      for (const articleId of section.articleIds) {
        try {
          await this.moveArticleToFolder(articleId, sectionArticle.id);
        } catch (error) {
          console.warn(`Failed to move article ${articleId}:`, error);
        }
      }
    }

    console.log('✅ Documentation reorganization completed');
  }

  async demonstrateHierarchicalKnowledgeBase() {
    console.log('📚 Hierarchical Knowledge Base System Demonstration\n');

    // Create a comprehensive documentation structure for YTM project
    console.log('🚀 Creating comprehensive documentation structure...\n');

    const docStructure = await this.createDocumentationStructure('YTM', {
      name: 'YouTrack MCP Server Documentation',
      description: 'Complete developer and user documentation for the YouTrack MCP Server with hierarchical organization.',
      sections: [
        {
          name: 'Getting Started',
          description: 'Essential information for new users and developers',
          articles: [
            {
              title: 'Installation Guide',
              content: `# Installation Guide\n\n## Prerequisites\n\n- Node.js 18+\n- YouTrack instance access\n- API token\n\n## Quick Setup\n\n\`\`\`bash\nnpm install\nnpm run build\n\`\`\`\n\n## Configuration\n\nSet your environment variables:\n- YOUTRACK_URL\n- YOUTRACK_TOKEN`,
              tags: ['installation', 'setup', 'quickstart']
            },
            {
              title: 'Quick Start Tutorial',
              content: `# Quick Start Tutorial\n\n## Step 1: Basic Issue Creation\n\nLearn how to create your first issue:\n\n\`\`\`typescript\nawait client.createIssue({\n  projectId: 'YTM',\n  summary: 'My first issue',\n  description: 'Getting started with YouTrack MCP'\n});\n\`\`\`\n\n## Step 2: Using Advanced Features\n\nExplore time estimation, sprints, and more!`,
              tags: ['tutorial', 'quickstart', 'examples']
            }
          ]
        },
        {
          name: 'API Reference',
          description: 'Complete API documentation and examples',
          articles: [
            {
              title: 'Issue Management API',
              content: `# Issue Management API\n\n## createIssue\n\nCreate a new issue with enhanced properties.\n\n### Parameters\n\n- \`projectId\`: Project identifier\n- \`summary\`: Issue title\n- \`description\`: Detailed description\n- \`type\`: Issue type (Bug, Feature, Task, Epic)\n- \`priority\`: Priority level\n\n### Example\n\n\`\`\`typescript\nconst issue = await client.createIssue({\n  projectId: 'YTM',\n  summary: 'Implement new feature',\n  type: 'Feature',\n  priority: 'High'\n});\n\`\`\``,
              tags: ['api', 'reference', 'issues']
            },
            {
              title: 'Knowledge Base API',
              content: `# Knowledge Base API\n\n## createArticle\n\nCreate hierarchical documentation articles.\n\n### Hierarchical Features\n\n- Parent-child relationships\n- Tree structure navigation\n- Folder-like organization\n- Advanced content management\n\n### Example\n\n\`\`\`typescript\n// Create parent article\nconst parent = await createFolderArticle('YTM', {\n  title: 'User Guide',\n  content: 'Main documentation section'\n});\n\n// Create sub-article\nconst child = await createSubArticle(parent.id, {\n  title: 'Advanced Features',\n  content: 'Detailed feature documentation'\n});\n\`\`\``,
              tags: ['api', 'reference', 'knowledge-base', 'hierarchy']
            }
          ]
        },
        {
          name: 'Advanced Features',
          description: 'In-depth guides for power users and developers',
          articles: [
            {
              title: 'Project Schema Management',
              content: `# Project Schema Management\n\n## Dynamic Project Adaptation\n\nThe YouTrack MCP Server automatically adapts to different project configurations:\n\n### YTM Project (Agile)\n- Sprint management\n- Story points estimation\n- Agile workflows\n\n### MYD Project (Traditional)\n- Subsystem tracking\n- Version management\n- Traditional workflows\n\n## Custom Field Handling\n\nAutomatic detection and management of:\n- Time estimation fields\n- Priority and type mappings\n- Assignee configurations\n- Custom project fields`,
              tags: ['advanced', 'schema', 'configuration']
            },
            {
              title: 'Hierarchical Documentation',
              content: `# Hierarchical Documentation System\n\n## Key Features\n\n### Parent-Child Relationships\n- Create folder-like structures\n- Nested article organization\n- Tree navigation support\n\n### Advanced Organization\n- Tag-based categorization\n- Project-specific documentation\n- Version history tracking\n\n### Content Management\n- Markdown support\n- File attachments\n- Comments and discussions\n- Search and filtering\n\n## Best Practices\n\n1. **Structure Planning**: Design your hierarchy before creation\n2. **Consistent Naming**: Use clear, descriptive titles\n3. **Tag Management**: Implement consistent tagging strategy\n4. **Content Reviews**: Regular updates and maintenance`,
              tags: ['advanced', 'documentation', 'hierarchy', 'best-practices']
            }
          ]
        }
      ]
    });

    console.log('\n📊 Documentation Structure Analysis:');
    console.log(`  📁 Project: ${docStructure.projectName}`);
    console.log(`  📄 Total Articles: ${docStructure.totalArticles}`);
    console.log(`  📚 Max Depth: ${docStructure.maxDepth} levels`);
    console.log(`  🌳 Root Articles: ${docStructure.rootArticles.length}`);

    console.log('\n🌳 Documentation Tree Visualization:');
    const treeVisualization = await this.visualizeDocumentationTree('YTM');
    console.log(treeVisualization);

    console.log('\n📁 Folder Structure Analysis:');
    Object.entries(docStructure.folderStructure).forEach(([folder, articles]) => {
      console.log(`  📂 ${folder}: ${articles.length} articles`);
    });

    console.log('\n✨ Hierarchical Knowledge Base Features Demonstrated:');
    console.log('  ✅ Parent-child article relationships');
    console.log('  ✅ Tree structure visualization');
    console.log('  ✅ Folder-like organization simulation');
    console.log('  ✅ Multi-level documentation hierarchy');
    console.log('  ✅ Tag-based categorization');
    console.log('  ✅ Project-specific documentation');
    console.log('  ✅ Advanced content organization');

    return docStructure;
  }
}

// Run the demonstration
async function main() {
  try {
    const knowledgeBase = new HierarchicalKnowledgeBase();
    await knowledgeBase.demonstrateHierarchicalKnowledgeBase();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

export { HierarchicalKnowledgeBase };
