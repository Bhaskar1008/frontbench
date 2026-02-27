/**
 * Frontbench Backend API Server
 * Production-ready API with MongoDB, token tracking, and audit logging
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import dotenv from 'dotenv';
// pdf-parse is lazy-loaded to avoid test file loading issue
// import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { Langfuse } from 'langfuse';
import { connectDatabase, getConnectionStatus } from './config/database.js';
import { Session } from './models/Session.js';
import { TokenUsage } from './models/TokenUsage.js';
import { analyzeResume } from './services/resumeAnalyzer.js';
import { generateBenchmarks } from './services/benchmarkService.js';
import { generateCareerTrajectory } from './services/trajectoryService.js';
import { generateLearningPath } from './services/learningPathService.js';
import { logAuditEvent, getIpAddress, getUserAgent } from './utils/auditLogger.js';
import agentRoutes from './routes/agentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
// Allows requests from:
// 1. Local development (localhost:3000)
// 2. All Netlify subdomains (*.netlify.app)
// 3. Custom frontend URL from environment variable
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Allow all Netlify subdomains
    if (origin.includes('.netlify.app')) {
      return callback(null, true);
    }
    
    // Allow custom frontend URL from environment variable
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl && origin === frontendUrl) {
      return callback(null, true);
    }
    
    // Default: allow the request
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logAuditEvent({
      action: `${req.method} ${req.path}`,
      resource: req.path,
      status: res.statusCode >= 400 ? 'error' : 'success',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      duration,
      metadata: {
        statusCode: res.statusCode,
      },
    }).catch(() => {}); // Non-blocking
  });
  next();
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  },
});

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Langfuse
const langfuseHost = process.env.LANGFUSE_BASE_URL || process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';
console.log(`🔗 Langfuse Host: ${langfuseHost}`);

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: langfuseHost,
});

// Test Langfuse connection (non-blocking)
if (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY) {
  console.log('📊 Langfuse tracing enabled (errors will be handled gracefully)');
  langfuse.flushAsync().catch(() => {
    console.warn('⚠️  Langfuse credentials may be invalid - API will still work but traces may fail');
  });
} else {
  console.log('📊 Langfuse tracing disabled (no credentials)');
}

// Helper function to safely flush Langfuse without blocking API responses
function safeFlushLangfuse() {
  langfuse.flushAsync().catch((error: any) => {
    if (!error.message?.includes('401')) {
      console.warn('⚠️ Langfuse flush failed (non-blocking):', error.message);
    }
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  logAuditEvent({
    action: `${req.method} ${req.path}`,
    resource: req.path,
    status: 'error',
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req),
    errorMessage: err.message,
    requestData: { method: req.method, path: req.path },
  }).catch(() => {});

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  const dbStatus = getConnectionStatus();
  
  // Check Chroma/Vector Store status if RAG is enabled
  let chromaStatus = 'not_configured';
  let chromaError = null;
  
  if (process.env.ENABLE_RAG === 'true') {
    try {
      const { VectorStoreManager } = await import('./vector-store/VectorStoreManager.js');
      const vectorStore = new VectorStoreManager({
        collectionName: process.env.CHROMA_COLLECTION || 'frontbench_documents',
      });
      
      // Try to initialize (this will log the status)
      try {
        await vectorStore.initialize();
        chromaStatus = vectorStore.isAvailable() ? 'connected' : 'disconnected';
      } catch (error: any) {
        chromaStatus = 'error';
        chromaError = error.message;
      }
    } catch (error: any) {
      chromaStatus = 'error';
      chromaError = error.message;
    }
  }
  
  res.json({
    status: 'ok',
    message: 'Frontbench API is running',
    database: dbStatus ? 'connected' : 'disconnected',
    chroma: {
      enabled: process.env.ENABLE_RAG === 'true',
      status: chromaStatus,
      error: chromaError,
      configured: !!(process.env.CHROMA_API_KEY || process.env.CHROMA_URL),
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Upload and analyze resume
 */
app.post('/api/resume/upload', upload.single('resume'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No resume file uploaded' });
  }

  const sessionId = uuidv4();
  const trace = langfuse.trace({
    name: 'resume-upload-and-analysis',
    userId: req.body.userId || 'anonymous',
    metadata: {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      sessionId,
    },
    tags: ['resume', 'upload', 'analysis'],
  });

  try {
    let extractedText = '';

    // Span: PDF text extraction
    const extractionSpan = trace.span({
      name: 'pdf-text-extraction',
      metadata: { operation: 'extract-text-from-pdf' },
    });

    // Extract text from PDF
    if (req.file.mimetype === 'application/pdf') {
      const pdfBuffer = req.file.buffer;
      // Use wrapper function to handle pdf-parse module issues
      const { parsePDF } = await import('./utils/pdfParser.js');
      const pdfData = await parsePDF(pdfBuffer);
      extractedText = pdfData.text;

      extractionSpan.update({
        metadata: {
          pageCount: pdfData.numpages,
          textLength: extractedText.length,
          extracted: true,
        },
      });
    } else {
      extractionSpan.end();
      return res.status(400).json({
        success: false,
        error: 'Word documents not yet supported. Please upload a PDF.',
      });
    }
    extractionSpan.end();

    if (!extractedText || extractedText.trim().length === 0) {
      trace.update({
        metadata: { error: 'No text extracted from PDF' },
      });
      safeFlushLangfuse();
      return res.status(400).json({
        success: false,
        error: 'Could not extract text from resume. Please ensure the PDF contains readable text.',
      });
    }

    // Store document in Chroma vector store for RAG (if enabled)
    let chromaDocumentIds: string[] = [];
    if (process.env.ENABLE_RAG === 'true') {
      try {
        const ragSpan = trace.span({
          name: 'rag-document-indexing',
          metadata: { operation: 'index-document-in-vector-store' },
        });

        const { VectorStoreManager } = await import('./vector-store/VectorStoreManager.js');
        const { DocumentProcessor } = await import('./document-processing/DocumentProcessor.js');
        
        const vectorStore = new VectorStoreManager({
          collectionName: process.env.CHROMA_COLLECTION || 'frontbench_documents',
        });
        const documentProcessor = new DocumentProcessor();

        // Create a temporary file for processing (since DocumentProcessor expects file path)
        const fs = await import('fs/promises');
        const path = await import('path');
        const tempDir = 'uploads';
        await fs.mkdir(tempDir, { recursive: true });
        const tempFilePath = path.join(tempDir, `${sessionId}-${req.file.originalname}`);
        await fs.writeFile(tempFilePath, req.file.buffer);

        try {
          // Process document
          const document = await documentProcessor.processFile(tempFilePath);
          const chunks = documentProcessor.chunkDocument(document, 1000, 200);

          // Add to vector store
          await vectorStore.initialize();
          if (vectorStore.isAvailable()) {
            chromaDocumentIds = await vectorStore.addDocuments(chunks, {
              sessionId,
              documentType: 'resume',
              fileName: req.file.originalname,
              uploadedAt: new Date().toISOString(),
            });
            
            ragSpan.update({
              metadata: {
                chunksIndexed: chunks.length,
                documentIds: chromaDocumentIds.length,
                indexed: true,
              },
            });
          } else {
            ragSpan.update({
              metadata: { warning: 'Vector store not available, skipping indexing' },
            });
          }

          // Clean up temp file
          await fs.unlink(tempFilePath).catch(() => {});
        } catch (ragError: any) {
          // Clean up temp file on error
          await fs.unlink(tempFilePath).catch(() => {});
          console.warn('⚠️  Failed to index document in vector store:', ragError.message);
          ragSpan.update({
            metadata: { error: ragError.message, indexed: false },
          });
        }

        ragSpan.end();
      } catch (ragInitError: any) {
        console.warn('⚠️  RAG indexing skipped:', ragInitError.message);
        // Continue with analysis even if RAG fails
      }
    }

    // Analyze resume using AI
    const { analysis, tokenUsage } = await analyzeResume(extractedText, openai, trace, sessionId);

    // Create session in database
    const session = await Session.create({
      sessionId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedAt: new Date(),
      extractedText,
      analysis,
      tokenUsage: {
        totalTokens: tokenUsage.totalTokens,
        promptTokens: tokenUsage.promptTokens,
        completionTokens: tokenUsage.completionTokens,
        estimatedCost: tokenUsage.estimatedCost,
      },
      metadata: {
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        name: analysis.name,
        email: analysis.email,
      },
    });

    trace.update({
      metadata: {
        sessionId,
        analysisComplete: true,
        currentRole: analysis.currentRole,
        yearsOfExperience: analysis.yearsOfExperience,
        tokenUsage: tokenUsage.totalTokens,
        estimatedCost: tokenUsage.estimatedCost,
        chromaIndexed: chromaDocumentIds.length > 0,
        chromaDocumentIds: chromaDocumentIds.length,
      },
    });

    safeFlushLangfuse();

    // Log audit event
    await logAuditEvent({
      sessionId,
      action: 'resume-upload',
      resource: '/api/resume/upload',
      status: 'success',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        currentRole: analysis.currentRole,
      },
    });

    res.json({
      success: true,
      sessionId,
      analysis,
      tokenUsage,
      traceId: trace.id,
      rag: {
        enabled: process.env.ENABLE_RAG === 'true',
        indexed: chromaDocumentIds.length > 0,
        documentIds: chromaDocumentIds.length,
      },
    });
  } catch (error: any) {
    console.error('Error processing resume:', error);
    trace.update({
      metadata: {
        error: error.message,
        stack: error.stack,
      },
    });
    safeFlushLangfuse();

    await logAuditEvent({
      sessionId,
      action: 'resume-upload',
      resource: '/api/resume/upload',
      status: 'error',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      errorMessage: error.message,
    });

    next(error);
  }
});

/**
 * Get benchmark data for current role
 */
app.post('/api/benchmarks', async (req, res, next) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'Session ID is required' });
  }

  try {
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Resume data not found' });
    }

    if (session.benchmarks) {
      // Return cached benchmarks
      const tokenUsage = await TokenUsage.find({ sessionId, operation: 'benchmarks' });
      const totalCost = tokenUsage.reduce((sum, usage: any) => sum + (usage.estimatedCost || 0), 0);

      return res.json({
        success: true,
        benchmarks: session.benchmarks,
        tokenUsage: {
          totalTokens: session.tokenUsage?.totalTokens || 0,
          estimatedCost: totalCost,
        },
      });
    }

    if (!session.analysis) {
      return res.status(400).json({ success: false, error: 'Resume analysis not found' });
    }

    const trace = langfuse.trace({
      name: 'generate-benchmarks',
      userId: sessionId,
      metadata: {
        sessionId,
        currentRole: session.analysis?.currentRole,
      },
      tags: ['benchmarks', 'analysis'],
    });

    const { benchmarks, tokenUsage } = await generateBenchmarks(session.analysis, openai, trace, sessionId);

    // Update session in database
    session.benchmarks = benchmarks;
    session.tokenUsage = {
      totalTokens: (session.tokenUsage?.totalTokens || 0) + tokenUsage.totalTokens,
      promptTokens: (session.tokenUsage?.promptTokens || 0) + tokenUsage.promptTokens,
      completionTokens: (session.tokenUsage?.completionTokens || 0) + tokenUsage.completionTokens,
      estimatedCost: (session.tokenUsage?.estimatedCost || 0) + tokenUsage.estimatedCost,
    };
    await session.save();

    trace.update({
      metadata: {
        benchmarksGenerated: true,
        role: benchmarks.role,
        percentile: benchmarks.competitivePosition?.percentile,
        tokenUsage: tokenUsage.totalTokens,
        estimatedCost: tokenUsage.estimatedCost,
      },
    });

    safeFlushLangfuse();

    await logAuditEvent({
      sessionId,
      action: 'generate-benchmarks',
      resource: '/api/benchmarks',
      status: 'success',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        role: benchmarks.role,
      },
    });

    res.json({
      success: true,
      benchmarks,
      tokenUsage,
      traceId: trace.id,
    });
  } catch (error: any) {
    console.error('Error generating benchmarks:', error);
    await logAuditEvent({
      sessionId,
      action: 'generate-benchmarks',
      resource: '/api/benchmarks',
      status: 'error',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      errorMessage: error.message,
    });
    next(error);
  }
});

/**
 * Get career trajectory
 */
app.post('/api/trajectory', async (req, res, next) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'Session ID is required' });
  }

  try {
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Resume data not found' });
    }

    if (session.trajectory) {
      // Return cached trajectory
      const tokenUsage = await TokenUsage.find({ sessionId, operation: 'trajectory' });
      const totalCost = tokenUsage.reduce((sum, usage: any) => sum + (usage.estimatedCost || 0), 0);

      return res.json({
        success: true,
        trajectory: session.trajectory,
        tokenUsage: {
          totalTokens: session.tokenUsage?.totalTokens || 0,
          estimatedCost: totalCost,
        },
      });
    }

    if (!session.analysis) {
      return res.status(400).json({ success: false, error: 'Resume analysis not found' });
    }

    const trace = langfuse.trace({
      name: 'generate-career-trajectory',
      userId: sessionId,
      metadata: {
        sessionId,
        currentRole: session.analysis?.currentRole,
      },
      tags: ['trajectory', 'career'],
    });

    const { trajectory, tokenUsage } = await generateCareerTrajectory(session.analysis, openai, trace, sessionId);

    // Update session in database
    session.trajectory = trajectory;
    session.tokenUsage = {
      totalTokens: (session.tokenUsage?.totalTokens || 0) + tokenUsage.totalTokens,
      promptTokens: (session.tokenUsage?.promptTokens || 0) + tokenUsage.promptTokens,
      completionTokens: (session.tokenUsage?.completionTokens || 0) + tokenUsage.completionTokens,
      estimatedCost: (session.tokenUsage?.estimatedCost || 0) + tokenUsage.estimatedCost,
    };
    await session.save();

    trace.update({
      metadata: {
        trajectoryGenerated: true,
        targetRole: trajectory.longTermVision?.targetRole,
        nextStepsCount: trajectory.nextSteps?.length || 0,
        tokenUsage: tokenUsage.totalTokens,
        estimatedCost: tokenUsage.estimatedCost,
      },
    });

    safeFlushLangfuse();

    await logAuditEvent({
      sessionId,
      action: 'generate-trajectory',
      resource: '/api/trajectory',
      status: 'success',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        targetRole: trajectory.longTermVision?.targetRole,
      },
    });

    res.json({
      success: true,
      trajectory,
      tokenUsage,
      traceId: trace.id,
    });
  } catch (error: any) {
    console.error('Error generating trajectory:', error);
    await logAuditEvent({
      sessionId,
      action: 'generate-trajectory',
      resource: '/api/trajectory',
      status: 'error',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      errorMessage: error.message,
    });
    next(error);
  }
});

/**
 * Get learning path recommendations
 */
app.post('/api/learning-path', async (req, res, next) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'Session ID is required' });
  }

  try {
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Resume data not found' });
    }

    if (session.learningPath) {
      // Return cached learning path
      const tokenUsage = await TokenUsage.find({ sessionId, operation: 'learning-path' });
      const totalCost = tokenUsage.reduce((sum, usage: any) => sum + (usage.estimatedCost || 0), 0);

      return res.json({
        success: true,
        learningPath: session.learningPath,
        tokenUsage: {
          totalTokens: session.tokenUsage?.totalTokens || 0,
          estimatedCost: totalCost,
        },
      });
    }

    if (!session.analysis) {
      return res.status(400).json({ success: false, error: 'Resume analysis not found' });
    }

    const trace = langfuse.trace({
      name: 'generate-learning-path',
      userId: sessionId,
      metadata: {
        sessionId,
        currentRole: session.analysis?.currentRole,
        hasTrajectory: !!session.trajectory,
      },
      tags: ['learning-path', 'recommendations'],
    });

    const { learningPath, tokenUsage } = await generateLearningPath(
      session.analysis,
      session.trajectory,
      openai,
      trace,
      sessionId
    );

    // Update session in database
    session.learningPath = learningPath;
    session.tokenUsage = {
      totalTokens: (session.tokenUsage?.totalTokens || 0) + tokenUsage.totalTokens,
      promptTokens: (session.tokenUsage?.promptTokens || 0) + tokenUsage.promptTokens,
      completionTokens: (session.tokenUsage?.completionTokens || 0) + tokenUsage.completionTokens,
      estimatedCost: (session.tokenUsage?.estimatedCost || 0) + tokenUsage.estimatedCost,
    };
    await session.save();

    trace.update({
      metadata: {
        learningPathGenerated: true,
        phasesCount: learningPath.phases?.length || 0,
        quickWinsCount: learningPath.quickWins?.length || 0,
        tokenUsage: tokenUsage.totalTokens,
        estimatedCost: tokenUsage.estimatedCost,
      },
    });

    safeFlushLangfuse();

    await logAuditEvent({
      sessionId,
      action: 'generate-learning-path',
      resource: '/api/learning-path',
      status: 'success',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        phasesCount: learningPath.phases?.length || 0,
      },
    });

    res.json({
      success: true,
      learningPath,
      tokenUsage,
      traceId: trace.id,
    });
  } catch (error: any) {
    console.error('Error generating learning path:', error);
    await logAuditEvent({
      sessionId,
      action: 'generate-learning-path',
      resource: '/api/learning-path',
      status: 'error',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      errorMessage: error.message,
    });
    next(error);
  }
});

/**
 * Get complete analysis (all data at once)
 */
app.get('/api/analysis/:sessionId', async (req, res, next) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Analysis not found' });
    }

    // Get all token usage for this session
    const tokenUsageRecords = await TokenUsage.find({ sessionId }).sort({ createdAt: -1 });
    const totalCost = tokenUsageRecords.reduce((sum, usage: any) => sum + (usage.estimatedCost || 0), 0);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        analysis: session.analysis,
        benchmarks: session.benchmarks,
        trajectory: session.trajectory,
        learningPath: session.learningPath,
        tokenUsage: {
          totalTokens: session.tokenUsage?.totalTokens || 0,
          promptTokens: session.tokenUsage?.promptTokens || 0,
          completionTokens: session.tokenUsage?.completionTokens || 0,
          estimatedCost: totalCost,
          breakdown: tokenUsageRecords.map((usage: any) => ({
            operation: usage.operation,
            tokens: usage.totalTokens,
            cost: usage.estimatedCost,
            model: usage.modelName,
            createdAt: usage.createdAt,
          })),
        },
        uploadedAt: session.uploadedAt,
        metadata: session.metadata,
      },
    });
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    next(error);
  }
});

/**
 * Get token usage statistics for a session
 */
app.get('/api/token-usage/:sessionId', async (req, res, next) => {
  const { sessionId } = req.params;

  try {
    const tokenUsageRecords = await TokenUsage.find({ sessionId }).sort({ createdAt: -1 });
    const totalCost = tokenUsageRecords.reduce((sum, usage: any) => sum + (usage.estimatedCost || 0), 0);
    const totalTokens = tokenUsageRecords.reduce((sum, usage: any) => sum + (usage.totalTokens || 0), 0);

    res.json({
      success: true,
      tokenUsage: {
        totalTokens,
        totalCost,
        breakdown: tokenUsageRecords.map((usage: any) => ({
          operation: usage.operation,
          model: usage.modelName,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          estimatedCost: usage.estimatedCost,
          createdAt: usage.createdAt,
          metadata: usage.metadata,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching token usage:', error);
    next(error);
  }
});

// Agentic AI Routes
if (process.env.ENABLE_AGENTIC_AI === 'true') {
  app.use('/api/agent', agentRoutes);
  console.log('🤖 Agentic AI routes enabled');
}

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Frontbench API Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${process.env.DATABASE_NAME || 'frontbench-dev'}`);
    });
  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();
