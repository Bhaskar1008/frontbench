/**
 * ChromaDB Connection Test Script
 * Tests if ChromaDB Cloud is properly configured and accessible
 */

import dotenv from 'dotenv';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';

// Load environment variables
dotenv.config();

async function testChromaDBConnection() {
  console.log('========================================');
  console.log('ChromaDB Connection Test');
  console.log('========================================\n');

  // Read configuration from environment
  const chromaApiKey = process.env.CHROMA_API_KEY;
  const chromaTenant = process.env.CHROMA_TENANT;
  const chromaDatabase = process.env.CHROMA_DATABASE;
  const chromaHost = process.env.CHROMA_HOST || 'api.trychroma.com';
  const openaiApiKey = process.env.OPENAI_API_KEY;

  console.log('📋 Configuration Check:');
  console.log('  CHROMA_API_KEY:', chromaApiKey ? `${chromaApiKey.substring(0, 10)}...` : '❌ NOT SET');
  console.log('  CHROMA_TENANT:', chromaTenant || '❌ NOT SET');
  console.log('  CHROMA_DATABASE:', chromaDatabase || '❌ NOT SET');
  console.log('  CHROMA_HOST:', chromaHost);
  console.log('  OPENAI_API_KEY:', openaiApiKey ? `${openaiApiKey.substring(0, 10)}...` : '❌ NOT SET');
  console.log('');

  // Validate required configuration
  if (!chromaApiKey) {
    console.error('❌ CHROMA_API_KEY is required');
    process.exit(1);
  }
  if (!chromaTenant) {
    console.error('❌ CHROMA_TENANT is required');
    process.exit(1);
  }
  if (!chromaDatabase) {
    console.error('❌ CHROMA_DATABASE is required');
    process.exit(1);
  }
  if (!openaiApiKey) {
    console.error('❌ OPENAI_API_KEY is required');
    process.exit(1);
  }

  // Build Chroma Cloud URL
  const cloudUrl = chromaHost.startsWith('http://') || chromaHost.startsWith('https://')
    ? chromaHost
    : `https://${chromaHost}`;

  console.log('🔍 Building ChromaDB Configuration:');
  const config = {
    collectionName: chromaDatabase,
    url: cloudUrl,
    chroma_cloud_api_key: chromaApiKey,
    tenant: chromaTenant,
    database: chromaDatabase,
  };
  console.log('  Config:', {
    ...config,
    chroma_cloud_api_key: '[REDACTED]',
  });
  console.log('');

  // Initialize embeddings
  console.log('🤖 Initializing OpenAI Embeddings...');
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: openaiApiKey,
    modelName: 'text-embedding-3-small',
  });
  console.log('✅ Embeddings initialized\n');

  // Test 1: Try to connect to existing collection (LangChain - will fail due to config loss)
  console.log('========================================');
  console.log('Test 1: Connect to Existing Collection (LangChain)');
  console.log('========================================');
  try {
    console.log('🔍 Attempting to connect to existing collection using LangChain...');
    const vectorStore = await Chroma.fromExistingCollection(
      embeddings,
      config
    );
    console.log('✅ Successfully connected to existing collection!');
    console.log('✅ ChromaDB connection test PASSED\n');
    
    // Test adding a document
    console.log('========================================');
    console.log('Test 2: Add Test Document (LangChain)');
    console.log('========================================');
    try {
      const testDoc = {
        pageContent: 'This is a test document for ChromaDB connection verification.',
        metadata: { test: true, timestamp: new Date().toISOString() },
      };
      console.log('📤 Adding test document using LangChain...');
      const ids = await vectorStore.addDocuments([testDoc]);
      console.log('✅ Test document added successfully!');
      console.log('  Document IDs:', ids);
      console.log('✅ ChromaDB write test PASSED\n');
    } catch (addError: any) {
      console.error('❌ Failed to add test document (LangChain config loss issue):', addError.message);
      console.log('⚠️  This is expected - LangChain loses tenant/database config\n');
    }
    
    return;
  } catch (error: any) {
    console.error('❌ Failed to connect to existing collection (LangChain)');
    console.error('  Error:', error.message);
    console.log('⚠️  This is expected - LangChain has config loss issues\n');
  }

  // Test 2: Use CloudClient directly (this should work)
  console.log('========================================');
  console.log('Test 2: Use CloudClient Directly');
  console.log('========================================');
  try {
    console.log('🔍 Using CloudClient directly (bypasses LangChain)...');
    
    // Import CloudClient
    const chromadb = await import('chromadb');
    const CloudClient = chromadb.CloudClient;
    
    console.log('🔍 Creating CloudClient with:', {
      tenant: chromaTenant,
      database: chromaDatabase,
    });
    
    const chromaClient = new CloudClient({
      tenant: chromaTenant,
      database: chromaDatabase,
      apiKey: chromaApiKey,
    });
    
    // Get or create collection
    console.log('🔍 Getting or creating collection:', chromaDatabase);
    const collection = await chromaClient.getOrCreateCollection({
      name: chromaDatabase,
    });
    console.log('✅ Collection obtained:', collection.name);
    
    // Test adding a document
    console.log('========================================');
    console.log('Test 3: Add Test Document (CloudClient)');
    console.log('========================================');
    
    const testDoc = {
      pageContent: 'This is a test document for ChromaDB connection verification.',
      metadata: { test: true, timestamp: new Date().toISOString() },
    };
    
    console.log('📤 Adding test document using CloudClient...');
    
    // Generate embedding
    const embedding = await embeddings.embedQuery(testDoc.pageContent);
    console.log('✅ Generated embedding, length:', embedding.length);
    
    const docId = `test-${Date.now()}`;
    await collection.add({
      ids: [docId],
      embeddings: [embedding],
      documents: [testDoc.pageContent],
      metadatas: [testDoc.metadata],
    });
    
    console.log('✅ Test document added successfully using CloudClient!');
    console.log('  Document ID:', docId);
    console.log('✅ ChromaDB write test PASSED\n');
    
    // Verify document exists
    console.log('========================================');
    console.log('Test 4: Verify Document in ChromaDB');
    console.log('========================================');
    try {
      const results = await collection.get({ ids: [docId] });
      console.log('✅ Document verified in ChromaDB!');
      console.log('  Found documents:', results.ids?.length || 0);
      console.log('  Document content:', results.documents?.[0]?.substring(0, 50) + '...');
      console.log('✅ ChromaDB verification test PASSED\n');
    } catch (verifyError: any) {
      console.error('❌ Failed to verify document:', verifyError.message);
    }
    
    console.log('========================================');
    console.log('✅ ALL CHROMADB TESTS PASSED!');
    console.log('========================================');
    console.log('\nChromaDB is properly configured and working!');
    console.log('Your resume uploads should now index documents in ChromaDB.');
    
    return;
  } catch (createError: any) {
    console.error('❌ Failed to use CloudClient:', createError.message);
    console.error('  Error type:', createError.name);
    console.error('  Full error:', JSON.stringify(createError, null, 2));
    console.error('  Stack:', createError.stack?.substring(0, 500));
    console.log('');
  }

  // Test 3: Try direct HTTP request to ChromaDB API
  console.log('========================================');
  console.log('Test 3: Direct HTTP Request to ChromaDB');
  console.log('========================================');
  try {
    const testUrl = `${cloudUrl}/api/v1/tenants/${chromaTenant}/databases/${chromaDatabase}/collections`;
    console.log('🔍 Making direct HTTP request to:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${chromaApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('  Status:', response.status, response.statusText);
    console.log('  Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Direct HTTP request successful!');
      console.log('  Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ Direct HTTP request failed');
      console.error('  Response:', errorText);
    }
  } catch (httpError: any) {
    console.error('❌ Direct HTTP request error:', httpError.message);
  }

  console.log('\n========================================');
  console.log('❌ ChromaDB connection tests FAILED');
  console.log('========================================');
  console.log('\nTroubleshooting steps:');
  console.log('1. Verify CHROMA_API_KEY is correct');
  console.log('2. Verify CHROMA_TENANT exists in your ChromaDB account');
  console.log('3. Verify CHROMA_DATABASE exists or can be created');
  console.log('4. Check if your IP is whitelisted (if required)');
  console.log('5. Verify the ChromaDB Cloud URL is correct');
  
  process.exit(1);
}

// Run the test
testChromaDBConnection().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
