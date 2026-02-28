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
  private chromaConfig: any = null; // Store Chroma config for reuse

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

    const chromaApiKey = process.env.CHROMA_API_KEY;
    const chromaTenant = process.env.CHROMA_TENANT;
    const chromaDatabase = process.env.CHROMA_DATABASE;
    const chromaHost = process.env.CHROMA_HOST;
    const chromaUrl = process.env.CHROMA_URL;

    // Check if Chroma Cloud mode (has API key)
    const isChromaCloud = !!chromaApiKey;

    // If no Chroma URL/Cloud config is set and RAG is not explicitly enabled, skip initialization
    if (!isChromaCloud && !chromaUrl && process.env.ENABLE_RAG !== 'true') {
      console.warn('⚠️  Chroma URL not set. RAG features will be disabled.');
      this.initialized = true;
      return;
    }

    // Validate required configuration
    if (isChromaCloud) {
      // Chroma Cloud mode: require API key, tenant, and database
      if (!chromaTenant || !chromaDatabase) {
        const error = new Error(
          'Chroma Cloud mode requires CHROMA_API_KEY, CHROMA_TENANT, and CHROMA_DATABASE environment variables'
        );
        this.initializationError = error;
        this.initialized = true;
        throw error;
      }
    } else {
      // Self-hosted mode: require CHROMA_URL
      if (!chromaUrl) {
        const error = new Error('CHROMA_URL environment variable is required when ENABLE_RAG=true');
        this.initializationError = error;
        this.initialized = true;
        throw error;
      }
    }

    // Build configuration object
    const collectionName = chromaDatabase || this.collectionName;
    
    let connectionInfo: string;
    let config: any = {
      collectionName: collectionName,
    };

    if (isChromaCloud) {
      // Chroma Cloud configuration
      let cloudUrl = 'https://api.trychroma.com';
      if (chromaHost) {
        // Handle both with and without protocol
        cloudUrl = chromaHost.startsWith('http://') || chromaHost.startsWith('https://')
          ? chromaHost
          : `https://${chromaHost}`;
      }
      
      // Chroma Cloud requires specific configuration format
      // Store config for reuse when adding documents
      this.chromaConfig = {
        collectionName: collectionName,
        url: cloudUrl,
        chroma_cloud_api_key: chromaApiKey,
        tenant: chromaTenant,
        database: chromaDatabase,
      };
      config = this.chromaConfig;
      
      connectionInfo = `Chroma Cloud (${cloudUrl}, tenant: ${chromaTenant}, database: ${chromaDatabase})`;
      
      console.log('🔍 ChromaDB Cloud Configuration:', {
        url: cloudUrl,
        tenant: chromaTenant,
        database: chromaDatabase,
        collectionName: collectionName,
        hasApiKey: !!chromaApiKey,
      });
    } else {
      // Self-hosted configuration
      this.chromaConfig = {
        collectionName: collectionName,
        url: chromaUrl,
      };
      config = this.chromaConfig;
      connectionInfo = chromaUrl!;
    }

    try {
      console.log('🔍 Attempting to connect to ChromaDB with config:', {
        ...config,
        chroma_cloud_api_key: config.chroma_cloud_api_key ? '[REDACTED]' : undefined,
      });
      
      this.vectorStore = await Chroma.fromExistingCollection(
        this.embeddings,
        config
      );
      this.initialized = true;
      console.log(`✅ Vector store initialized: ${connectionInfo}`);
    } catch (error: any) {
      console.error('❌ Failed to connect to existing collection:', {
        message: error.message,
        errorType: error.name,
        config: {
          ...config,
          chroma_cloud_api_key: config.chroma_cloud_api_key ? '[REDACTED]' : undefined,
        },
      });
      
      try {
        // If collection doesn't exist, create a new one
        console.log('🔍 Attempting to create new ChromaDB collection...');
        this.vectorStore = await Chroma.fromDocuments(
          [],
          this.embeddings,
          config
        );
        this.initialized = true;
        console.log(`✅ Vector store created: ${connectionInfo}`);
      } catch (createError: any) {
        this.initializationError = createError;
        this.initialized = true;
        console.error(`❌ Failed to create vector store:`, {
          message: createError.message,
          errorType: createError.name,
          stack: createError.stack?.substring(0, 500),
          config: {
            ...config,
            chroma_cloud_api_key: config.chroma_cloud_api_key ? '[REDACTED]' : undefined,
          },
        });
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

    try {
      // Try to add documents using the existing vector store
      console.log('📤 Attempting to add documents to existing ChromaDB collection...');
      const ids = await this.vectorStore.addDocuments(documents);
      console.log('✅ Successfully added documents using addDocuments');
      return ids;
    } catch (error: any) {
      // If adding fails (possibly due to config loss), use fromDocuments with existing + new docs
      if ((error.message?.includes('default_tenant') || error.message?.includes('Unauthorized')) && this.chromaConfig) {
        console.warn('⚠️  addDocuments failed, using fromDocuments with proper config...');
        console.log('🔍 Recreating ChromaDB connection with config:', {
          ...this.chromaConfig,
          chroma_cloud_api_key: '[REDACTED]',
        });
        
        try {
          // Use fromDocuments which properly handles the config
          // This will add documents to the existing collection
          const newVectorStore = await Chroma.fromDocuments(
            documents,
            this.embeddings,
            this.chromaConfig
          );
          
          // Update the stored vector store instance
          this.vectorStore = newVectorStore;
          
          // Generate IDs for the documents (fromDocuments doesn't return them)
          const ids: string[] = documents.map((_, index) => 
            `${Date.now()}-${index}-${Math.random().toString(36).substring(7)}`
          );
          
          console.log('✅ Successfully added documents using fromDocuments');
          console.log(`📊 Added ${ids.length} documents with generated IDs`);
          return ids;
        } catch (recreateError: any) {
          console.error('❌ Failed to add documents using fromDocuments:', {
            message: recreateError.message,
            errorType: recreateError.name,
            stack: recreateError.stack?.substring(0, 300),
          });
          throw recreateError;
        }
      }
      throw error;
    }
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
