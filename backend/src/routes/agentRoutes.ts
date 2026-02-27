/**
 * Agent API Routes
 * Endpoints for agentic AI functionality
 */

import { Router } from 'express';
import { AgentIntegration } from '../agents/integration/AgentIntegration.js';
import { AgentAnalytics } from '../analytics/AgentAnalytics.js';
import { DocumentIntelligence } from '../document-processing/DocumentIntelligence.js';
import { logAuditEvent, getIpAddress, getUserAgent } from '../utils/auditLogger.js';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Initialize analytics
const analytics = new AgentAnalytics();
const documentIntelligence = new DocumentIntelligence();

/**
 * POST /api/agent/resume/analyze
 * Analyze resume using agentic AI
 */
router.post('/resume/analyze', upload.single('resume'), async (req, res) => {
  try {
    const { sessionId } = req.body;
    const resumeText = req.body.resumeText || '';

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const agentIntegration = new AgentIntegration({
      sessionId,
      enableRAG: process.env.ENABLE_RAG === 'true',
      enableMemory: true,
    });

    let filePath: string | undefined;
    if (req.file) {
      filePath = req.file.path;
    }

    const result = await agentIntegration.processResumeUpload(resumeText, filePath);

    await logAuditEvent({
      sessionId,
      action: 'agent_resume_analysis',
      status: 'success',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      metadata: {
        agentName: 'resume_analysis',
        tokenUsage: result.tokenUsage,
      },
    } as any);

    res.json({
      success: true,
      analysis: result.analysis,
      tokenUsage: result.tokenUsage,
    });
  } catch (error: any) {
    await logAuditEvent({
      sessionId: req.body.sessionId,
      action: 'agent_resume_analysis',
      status: 'error',
      metadata: { error: error.message },
    } as any);

    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agent/benchmarks
 * Generate benchmarks using agentic AI
 */
router.post('/benchmarks', async (req, res) => {
  try {
    const { sessionId, resumeAnalysis } = req.body;

    if (!sessionId || !resumeAnalysis) {
      return res.status(400).json({ error: 'sessionId and resumeAnalysis are required' });
    }

    const agentIntegration = new AgentIntegration({
      sessionId,
      enableRAG: process.env.ENABLE_RAG === 'true',
    });

    const result = await agentIntegration.generateBenchmarks(resumeAnalysis);

    res.json({
      success: true,
      benchmarks: result.benchmarks,
      tokenUsage: result.tokenUsage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agent/trajectory
 * Generate trajectory using agentic AI
 */
router.post('/trajectory', async (req, res) => {
  try {
    const { sessionId, resumeAnalysis } = req.body;

    if (!sessionId || !resumeAnalysis) {
      return res.status(400).json({ error: 'sessionId and resumeAnalysis are required' });
    }

    const agentIntegration = new AgentIntegration({
      sessionId,
      enableRAG: process.env.ENABLE_RAG === 'true',
    });

    const result = await agentIntegration.generateTrajectory(resumeAnalysis);

    res.json({
      success: true,
      trajectory: result.trajectory,
      tokenUsage: result.tokenUsage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agent/learning-path
 * Generate learning path using agentic AI
 */
router.post('/learning-path', async (req, res) => {
  try {
    const { sessionId, resumeAnalysis, trajectory } = req.body;

    if (!sessionId || !resumeAnalysis) {
      return res.status(400).json({ error: 'sessionId and resumeAnalysis are required' });
    }

    const agentIntegration = new AgentIntegration({
      sessionId,
      enableRAG: process.env.ENABLE_RAG === 'true',
    });

    const result = await agentIntegration.generateLearningPath(resumeAnalysis, trajectory);

    res.json({
      success: true,
      learningPath: result.learningPath,
      tokenUsage: result.tokenUsage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agent/analyze-async
 * Execute full analysis asynchronously
 */
router.post('/analyze-async', upload.single('resume'), async (req, res) => {
  try {
    const { sessionId } = req.body;
    const resumeText = req.body.resumeText || '';

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const agentIntegration = new AgentIntegration({
      sessionId,
      enableRAG: process.env.ENABLE_RAG === 'true',
      enableMemory: true,
    });

    const jobId = await agentIntegration.executeFullAnalysisAsync(resumeText);

    res.json({
      success: true,
      jobId,
      message: 'Analysis started. Use GET /api/agent/job/:jobId to check status',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agent/job/:jobId
 * Get job status
 */
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const agentIntegration = new AgentIntegration({
      sessionId: sessionId as string,
    });

    const status = agentIntegration.getJobStatus(jobId);

    res.json({
      success: true,
      status,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agent/analytics
 * Get agent analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { agentName, startDate, endDate } = req.query;

    if (agentName) {
      const metrics = await analytics.getAgentMetrics(
        agentName as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      return res.json({ success: true, metrics });
    }

    const topAgents = await analytics.getTopAgents(10);
    const tokenUsage = await analytics.getTokenUsageByAgent(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      topAgents,
      tokenUsage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agent/analytics/session/:sessionId
 * Get session analytics
 */
router.get('/analytics/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionAnalytics = await analytics.getSessionAnalytics(sessionId);

    res.json({
      success: true,
      analytics: sessionAnalytics,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agent/document/intelligence
 * Document intelligence operations
 */
router.post('/document/intelligence', upload.single('document'), async (req, res) => {
  try {
    const { operation } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Document file is required' });
    }

    const processor = new (await import('../document-processing/DocumentProcessor.js')).DocumentProcessor();
    const document = await processor.processFile(req.file.path);

    let result: any;

    switch (operation) {
      case 'summarize':
        const level = req.body.level || 'detailed';
        result = await documentIntelligence.generateSummary(document, level);
        break;
      case 'extract-entities':
        result = await documentIntelligence.extractEntities(document);
        break;
      case 'extract-tables':
        result = await documentIntelligence.extractTables(document);
        break;
      case 'detect-inconsistencies':
        result = await documentIntelligence.detectInconsistencies(document);
        break;
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
