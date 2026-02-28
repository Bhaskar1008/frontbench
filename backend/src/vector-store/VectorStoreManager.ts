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
   * Note: For Chroma Cloud, we always recreate the connection with full config
   * to ensure tenant/database are properly set (LangChain Chroma loses config)
   */
  async addDocuments(
    chunks: DocumentChunk[],
    metadata?: Record<string, any>
  ): Promise<string[]> {
    await this.initialize();

    if (!this.chromaConfig || !this.isAvailable()) {
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

    // For Chroma Cloud, always recreate connection with full config to ensure tenant/database are set
    // This is a workaround for LangChain Chroma losing config when calling addDocuments
    const isChromaCloud = !!this.chromaConfig.chroma_cloud_api_key;
    
    if (isChromaCloud) {
      console.log('📤 Adding documents to Chroma Cloud...');
      console.log('🔍 Using config:', {
        ...this.chromaConfig,
        chroma_cloud_api_key: '[REDACTED]',
      });
      
      try {
        // Generate embeddings for all documents first
        console.log('🔍 Generating embeddings for documents...');
        const texts = documents.map(doc => doc.pageContent);
        const embeddings = await this.embeddings.embedDocuments(texts);
        console.log(`✅ Generated ${embeddings.length} embeddings`);
        
        // Use Chroma CloudClient directly to ensure tenant/database config is preserved
        // This bypasses LangChain's config loss issue
        const chromadb = await import('chromadb');
        
        // Use CloudClient for Chroma Cloud (not ChromaClient)
        const CloudClient = chromadb.CloudClient || chromadb.ChromaClient;
        
        console.log('🔍 Creating Chroma CloudClient with:', {
          tenant: this.chromaConfig.tenant,
          database: this.chromaConfig.database,
          collectionName: this.chromaConfig.collectionName,
        });
        
        // Chroma Cloud uses CloudClient with tenant, database, and API key
        const chromaClient = new CloudClient({
          tenant: this.chromaConfig.tenant,
          database: this.chromaConfig.database,
          apiKey: this.chromaConfig.chroma_cloud_api_key,
        });
        
        
        // Get or create collection
        const collection = await chromaClient.getOrCreateCollection({
          name: this.chromaConfig.collectionName,
        });
        
        console.log('✅ Collection obtained:', collection.name);
        
        // Prepare data for Chroma
        const ids: string[] = documents.map((_, index) => 
          `${Date.now()}-${index}-${Math.random().toString(36).substring(7)}`
        );
        const metadatas = documents.map(doc => doc.metadata);
        
        // Add documents to Chroma
        console.log(`📤 Adding ${ids.length} documents to Chroma collection...`);
        await collection.add({
          ids: ids,
          embeddings: embeddings,
          documents: texts,
          metadatas: metadatas,
        });
        
        console.log('✅ Successfully added documents to Chroma Cloud');
        console.log(`📊 Added ${ids.length} documents with IDs`);
        
        // Recreate LangChain Chroma instance for future operations
        this.vectorStore = await Chroma.fromExistingCollection(
          this.embeddings,
          this.chromaConfig
        );
        
        return ids;
      } catch (error: any) {
        console.error('❌ Failed to add documents to Chroma Cloud:', {
          message: error.message,
          errorType: error.name,
          stack: error.stack?.substring(0, 500),
          config: {
            ...this.chromaConfig,
            chroma_cloud_api_key: '[REDACTED]',
          },
        });
        throw error;
      }
    } else {
      // For self-hosted Chroma, use the existing vector store
      if (!this.vectorStore) {
        throw new Error('Vector store not initialized');
      }
      
      try {
        console.log('📤 Adding documents to self-hosted Chroma...');
        const ids = await this.vectorStore.addDocuments(documents);
        console.log('✅ Successfully added documents');
        return ids;
      } catch (error: any) {
        console.error('❌ Failed to add documents:', error.message);
        throw error;
      }
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
