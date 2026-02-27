/**
 * Document Search Tool
 * Enables agents to search through document knowledge base
 */

import { Tool } from '@langchain/core/tools';
import { z } from 'zod';
import { VectorStore } from '@langchain/core/vectorstores';

export interface DocumentSearchToolConfig {
  vectorStore: VectorStore;
  k?: number; // Number of results to return
}

export class DocumentSearchTool extends Tool {
  name = 'document_search';
  description = `Search through uploaded documents and knowledge base. 
  Use this tool to find relevant information from resumes, documents, or previous analyses.
  Input should be a search query string.`;

  private vectorStore: VectorStore;
  private k: number;

  constructor(config: DocumentSearchToolConfig) {
    const schema = z.object({
      query: z.string().describe('The search query to find relevant documents'),
    });

    super({
      name: 'document_search',
      description: `Search through uploaded documents and knowledge base. 
      Use this tool to find relevant information from resumes, documents, or previous analyses.
      Input should be a search query string.`,
      schema,
    } as any);

    this.vectorStore = config.vectorStore;
    this.k = config.k || 5;
  }

  async _call(input: string): Promise<string> {
    try {
      const results = await this.vectorStore.similaritySearch(input, this.k);

      if (results.length === 0) {
        return 'No relevant documents found for the query.';
      }

      const formattedResults = results
        .map((doc, index) => {
          const metadata = doc.metadata || {};
          return `
[Document ${index + 1}]
Content: ${doc.pageContent.substring(0, 500)}${doc.pageContent.length > 500 ? '...' : ''}
Source: ${metadata.source || 'Unknown'}
${metadata.page ? `Page: ${metadata.page}` : ''}
${metadata.chunkIndex !== undefined ? `Chunk: ${metadata.chunkIndex}` : ''}
`;
        })
        .join('\n---\n');

      return `Found ${results.length} relevant document(s):\n${formattedResults}`;
    } catch (error: any) {
      return `Error searching documents: ${error.message}`;
    }
  }
}
