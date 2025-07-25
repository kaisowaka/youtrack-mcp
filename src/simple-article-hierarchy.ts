/**
 * Simple Parent-Child Article Manager for YouTrack MCP
 * Focused on fixing the core parent-child relationship issues
 * Lightweight and failure-resistant approach
 */

import { YouTrackClient } from './youtrack-client.js';
import { logger } from './logger.js';

export interface ArticleReference {
  id: string;
  title: string;
  summary?: string;
}

export interface ParentChildResult {
  success: boolean;
  message: string;
  parentArticle?: ArticleReference;
  childArticle?: ArticleReference;
  error?: string;
}

/**
 * Simple utility class to handle parent-child article relationships
 * Focuses on the specific issues reported by users
 */
export class SimpleArticleHierarchy {
  private client: YouTrackClient;

  constructor(client: YouTrackClient) {
    this.client = client;
  }

  /**
   * Enhanced linkSubArticle with better error handling and validation
   * Addresses the core issue that existing linkSubArticle isn't working reliably
   */
  async linkChildToParent(params: {
    parentArticleId: string;
    childArticleId: string;
    addContentLinks?: boolean; // Add content-based cross-references as fallback
  }): Promise<ParentChildResult> {
    try {
      logger.info('Attempting to link child article to parent', {
        parentId: params.parentArticleId,
        childId: params.childArticleId
      });

      // Step 1: Validate both articles exist
      const validation = await this.validateArticles(params.parentArticleId, params.childArticleId);
      if (!validation.success) {
        return validation;
      }

      // Step 2: Try API linking first
      let apiLinkSuccess = false;
      try {
        await this.client.linkSubArticle({
          parentArticleId: params.parentArticleId,
          childArticleId: params.childArticleId
        });
        apiLinkSuccess = true;
        logger.info('API linking successful');
      } catch (apiError) {
        logger.warn('API linking failed, will try content-based approach', {
          error: apiError instanceof Error ? apiError.message : String(apiError)
        });
      }

      // Step 3: Add content-based cross-references as fallback/enhancement
      let contentLinksAdded = false;
      if (params.addContentLinks !== false) { // Default to true
        try {
          await this.addContentBasedLinks(params.parentArticleId, params.childArticleId);
          contentLinksAdded = true;
          logger.info('Content-based cross-references added');
        } catch (contentError) {
          logger.warn('Failed to add content links', {
            error: contentError instanceof Error ? contentError.message : String(contentError)
          });
        }
      }

      // Determine success based on what worked
      if (apiLinkSuccess) {
        return {
          success: true,
          message: contentLinksAdded 
            ? 'Successfully linked via API and added content cross-references'
            : 'Successfully linked via API',
          parentArticle: validation.parentArticle,
          childArticle: validation.childArticle
        };
      } else if (contentLinksAdded) {
        return {
          success: true,
          message: 'API linking failed, but content cross-references added successfully',
          parentArticle: validation.parentArticle,
          childArticle: validation.childArticle,
          error: 'API hierarchy not available, using content-based navigation'
        };
      } else {
        return {
          success: false,
          message: 'Both API linking and content linking failed',
          error: 'Unable to establish parent-child relationship'
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to link child to parent', { error: errorMessage });
      
      return {
        success: false,
        message: 'Failed to link articles',
        error: errorMessage
      };
    }
  }

  /**
   * Enhanced getSubArticles with better error handling
   * Tries both API method and content-based discovery
   */
  async getChildArticles(params: {
    parentArticleId: string;
    includeContent?: boolean;
    fallbackToContentSearch?: boolean; // Search for content-based references
  }): Promise<{
    success: boolean;
    children: ArticleReference[];
    method: 'api' | 'content-search' | 'mixed';
    error?: string;
  }> {
    try {
      const children: ArticleReference[] = [];
      let method: 'api' | 'content-search' | 'mixed' = 'api';

      // Try API method first
      try {
        const apiResult = await this.client.getSubArticles({
          parentArticleId: params.parentArticleId,
          includeContent: params.includeContent || false
        });

        if (apiResult.content && Array.isArray(apiResult.content)) {
          children.push(...this.extractArticleReferences(apiResult.content));
          logger.info(`Found ${children.length} child articles via API`);
        }
      } catch (apiError) {
        logger.warn('API getSubArticles failed', {
          error: apiError instanceof Error ? apiError.message : String(apiError)
        });
        
        // If API failed and fallback enabled, try content search
        if (params.fallbackToContentSearch !== false) {
          method = 'content-search';
          const contentChildren = await this.findChildrenByContent(params.parentArticleId);
          children.push(...contentChildren);
          logger.info(`Found ${contentChildren.length} child articles via content search`);
        }
      }

      return {
        success: true,
        children,
        method,
        error: method === 'content-search' ? 'API method failed, used content search' : undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get child articles', { error: errorMessage });
      
      return {
        success: false,
        children: [],
        method: 'api',
        error: errorMessage
      };
    }
  }

  /**
   * Add content-based cross-references between parent and child articles
   * This is the workaround approach the user mentioned in their feedback
   */
  private async addContentBasedLinks(parentId: string, childId: string): Promise<void> {
    // Get both articles
    const parentResponse = await this.client.getArticle({ articleId: parentId });
    const childResponse = await this.client.getArticle({ articleId: childId });

    const parentData = this.extractArticleData(parentResponse);
    const childData = this.extractArticleData(childResponse);

    if (!parentData || !childData) {
      throw new Error('Could not extract article data for content linking');
    }

    // Update parent article to reference child
    const parentNavigationSection = this.buildNavigationSection([{
      id: childId,
      title: childData.title,
      relationship: 'child'
    }]);

    const updatedParentContent = this.addOrUpdateNavigationSection(
      parentData.content, 
      parentNavigationSection
    );

    // Update child article to reference parent
    const childNavigationSection = this.buildNavigationSection([{
      id: parentId,
      title: parentData.title,
      relationship: 'parent'
    }]);

    const updatedChildContent = this.addOrUpdateNavigationSection(
      childData.content,
      childNavigationSection
    );

    // Save both articles
    await Promise.all([
      this.client.updateArticle({
        articleId: parentId,
        content: updatedParentContent
      }),
      this.client.updateArticle({
        articleId: childId,
        content: updatedChildContent
      })
    ]);
  }

  /**
   * Validate that both articles exist and extract basic info
   */
  private async validateArticles(parentId: string, childId: string): Promise<ParentChildResult> {
    try {
      const [parentResponse, childResponse] = await Promise.all([
        this.client.getArticle({ articleId: parentId }),
        this.client.getArticle({ articleId: childId })
      ]);

      const parentData = this.extractArticleData(parentResponse);
      const childData = this.extractArticleData(childResponse);

      if (!parentData) {
        return {
          success: false,
          message: `Parent article ${parentId} not found or inaccessible`,
          error: 'Parent article validation failed'
        };
      }

      if (!childData) {
        return {
          success: false,
          message: `Child article ${childId} not found or inaccessible`,
          error: 'Child article validation failed'
        };
      }

      return {
        success: true,
        message: 'Both articles validated successfully',
        parentArticle: { id: parentId, title: parentData.title, summary: parentData.summary },
        childArticle: { id: childId, title: childData.title, summary: childData.summary }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: 'Article validation failed',
        error: errorMessage
      };
    }
  }

  /**
   * Find child articles by searching content for references
   */
  private async findChildrenByContent(parentId: string): Promise<ArticleReference[]> {
    try {
      const parentResponse = await this.client.getArticle({ articleId: parentId });
      const parentData = this.extractArticleData(parentResponse);
      
      if (!parentData) return [];

      // Look for article references in content
      const articleReferences = this.extractArticleReferencesFromContent(parentData.content);
      
      // Validate these are actual articles
      const validChildren: ArticleReference[] = [];
      for (const ref of articleReferences) {
        try {
          const articleResponse = await this.client.getArticle({ articleId: ref.id });
          const articleData = this.extractArticleData(articleResponse);
          if (articleData) {
            validChildren.push({
              id: ref.id,
              title: articleData.title,
              summary: articleData.summary
            });
          }
        } catch {
          // Ignore invalid references
        }
      }

      return validChildren;
    } catch {
      return [];
    }
  }

  // Helper methods for content extraction and manipulation
  private extractArticleData(response: any): { title: string; content: string; summary?: string } | null {
    if (response.content && response.content[0] && response.content[0].text) {
      const text = response.content[0].text;
      // Extract title, content, etc. from response text
      // This would need to be adapted based on actual response format
      const lines = text.split('\n');
      const title = lines.find((line: string) => line.includes('Title:'))?.replace('Title:', '').trim() || 'Untitled';
      const content = text;
      
      return { title, content };
    }
    return null;
  }

  private extractArticleReferences(contentArray: any[]): ArticleReference[] {
    const references: ArticleReference[] = [];
    
    for (const item of contentArray) {
      if (item.text) {
        const articleRefs = this.extractArticleReferencesFromContent(item.text);
        references.push(...articleRefs);
      }
    }
    
    return references;
  }

  private extractArticleReferencesFromContent(content: string): ArticleReference[] {
    const references: ArticleReference[] = [];
    
    // Look for patterns like [Article Title](article-id) or Article ID: xyz
    const patterns = [
      /\[([^\]]+)\]\(article-([^)]+)\)/g,
      /Article ID:\s*([a-zA-Z0-9-]+)/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (pattern.source.includes('\\[')) {
          // Link pattern [title](article-id)
          references.push({
            id: match[2],
            title: match[1]
          });
        } else {
          // ID pattern Article ID: xyz
          references.push({
            id: match[1],
            title: 'Referenced Article'
          });
        }
      }
    }
    
    return references;
  }

  private buildNavigationSection(references: Array<{id: string; title: string; relationship: string}>): string {
    if (references.length === 0) return '';

    let section = '\n\n---\n\n## Related Articles\n\n';
    
    const grouped = references.reduce((acc, ref) => {
      if (!acc[ref.relationship]) acc[ref.relationship] = [];
      acc[ref.relationship].push(ref);
      return acc;
    }, {} as Record<string, typeof references>);

    if (grouped.parent) {
      section += '### Parent Article\n\n';
      grouped.parent.forEach(ref => {
        section += `- [${ref.title}](article-${ref.id})\n`;
      });
      section += '\n';
    }

    if (grouped.child) {
      section += '### Child Articles\n\n';
      grouped.child.forEach(ref => {
        section += `- [${ref.title}](article-${ref.id})\n`;
      });
      section += '\n';
    }

    return section;
  }

  private addOrUpdateNavigationSection(content: string, navigationSection: string): string {
    // Remove existing navigation section if present
    const navigationPattern = /\n\n---\n\n## Related Articles\n\n[\s\S]*?(?=\n\n---|\n\n##|$)/;
    const cleanContent = content.replace(navigationPattern, '');
    
    // Add new navigation section
    return cleanContent + navigationSection;
  }
}

/**
 * Simple function to create enhanced parent-child article linking
 * This addresses the user's core issue with a lightweight approach
 */
export async function enhancedLinkSubArticle(
  client: YouTrackClient,
  parentArticleId: string,
  childArticleId: string
): Promise<ParentChildResult> {
  const hierarchy = new SimpleArticleHierarchy(client);
  return await hierarchy.linkChildToParent({
    parentArticleId,
    childArticleId,
    addContentLinks: true
  });
}

/**
 * Simple function to get child articles with fallback mechanisms
 */
export async function enhancedGetSubArticles(
  client: YouTrackClient,
  parentArticleId: string,
  includeContent: boolean = false
): Promise<{
  success: boolean;
  children: ArticleReference[];
  method: string;
  error?: string;
}> {
  const hierarchy = new SimpleArticleHierarchy(client);
  return await hierarchy.getChildArticles({
    parentArticleId,
    includeContent,
    fallbackToContentSearch: true
  });
}
