/**
 * Vector Store Manager
 * Manages vector embeddings and similarity search
 */

import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { DocumentChunk } from '../document-processing/DocumentProcessor.js';

export interface VectorStoreConfig {
  collectionName?: string;
  persistDirectory?: string;
}

export class VectorStoreManager {
  private vectorStore: Chroma | null = null;
  private embeddings: OpenAIEmbeddings;
  private collectionName: string;
  private persistDirectory?: string;

  constructor(config: VectorStoreConfig = {}) {
    this.collectionName = config.collectionName || 'frontbench_documents';
    this.persistDirectory = config.persistDirectory;

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small', // Cost-effective embedding model
    });
  }

  private initialized: boolean = false;
  private initializationError: Error | null = null;

  /**
   * Initialize the vector store
   */
  async initialize(): Promise<void> {
    if (this.vectorStore) {
      return;
    }

    if (this.initialized && this.initializationError) {
      throw this.initializationError;
    }

    const chromaUrl = process.env.CHROMA_URL;

    // If no Chroma URL is set and RAG is not explicitly enabled, skip initialization
    if (!chromaUrl && process.env.ENABLE_RAG !== 'true') {
      console.warn('⚠️  Chroma URL not set. RAG features will be disabled.');
      this.initialized = true;
      return;
    }

    if (!chromaUrl) {
      const error = new Error('CHROMA_URL environment variable is required when ENABLE_RAG=true');
      this.initializationError = error;
      this.initialized = true;
      throw error;
    }

    try {
      this.vectorStore = await Chroma.fromExistingCollection(
        this.embeddings,
        {
          collectionName: this.collectionName,
          url: chromaUrl,
        }
      );
      this.initialized = true;
      console.log(`✅ Vector store initialized: ${chromaUrl}`);
    } catch (error: any) {
      try {
        // If collection doesn't exist, create a new one
        this.vectorStore = await Chroma.fromDocuments(
          [],
          this.embeddings,
          {
            collectionName: this.collectionName,
            url: chromaUrl,
          }
        );
        this.initialized = true;
        console.log(`✅ Vector store created: ${chromaUrl}`);
      } catch (createError: any) {
        this.initializationError = createError;
        this.initialized = true;
        console.error(`❌ Failed to initialize vector store: ${createError.message}`);
        throw new Error(`Vector store initialization failed: ${createError.message}`);
      }
    }
  }

  /**
   * Check if vector store is available
   */
  isAvailable(): boolean {
    return this.vectorStore !== null && !this.initializationError;
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(
    chunks: DocumentChunk[],
    metadata?: Record<string, any>
  ): Promise<string[]> {
    await this.initialize();

    if (!this.vectorStore || !this.isAvailable()) {
      console.warn('⚠️  Vector store not available. Skipping document indexing.');
      return [];
    }

    const documents = chunks.map((chunk) => {
      return new Document({
        pageContent: chunk.content,
        metadata: {
          ...chunk.metadata,
          ...metadata,
          chunkIndex: chunk.chunkIndex,
          startChar: chunk.startChar,
          endChar: chunk.endChar,
        },
      });
    });

    const ids = await this.vectorStore.addDocuments(documents);
    return ids;
  }

  /**
   * Search for similar documents
   */
  async similaritySearch(
    query: string,
    k: number = 5,
    filter?: Record<string, any>
  ): Promise<Document[]> {
    await this.initialize();

    if (!this.vectorStore || !this.isAvailable()) {
      console.warn('⚠️  Vector store not available. Returning empty results.');
      return [];
    }

    return this.vectorStore.similaritySearch(query, k, filter);
  }

  /**
   * Search with score threshold
   */
  async similaritySearchWithScore(
    query: string,
    k: number = 5,
    scoreThreshold: number = 0.7
  ): Promise<Array<[Document, number]>> {
    await this.initialize();

    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const results = await this.vectorStore.similaritySearchWithScore(query, k);
    
    // Filter by score threshold
    return results.filter(([, score]) => score >= scoreThreshold);
  }

  /**
   * Delete documents by IDs
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    await this.initialize();

    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    // Chroma delete implementation
    // This may vary based on Chroma client version
    await this.vectorStore.delete({ ids });
  }

  /**
   * Get vector store instance (for direct access)
   */
  getVectorStore(): Chroma {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized. Call initialize() first.');
    }
    return this.vectorStore;
  }
}
