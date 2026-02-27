# 🚀 Agentic AI Implementation Guide

## Quick Start

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Set Up Vector Store (Chroma)

**Option A: Local Chroma (Development)**
```bash
# Install Chroma
pip install chromadb

# Start Chroma server
chroma run --host localhost --port 8000
```

**Option B: Chroma Cloud (Production)**
- Sign up at https://www.trychroma.com/
- Get your API key and endpoint
- Set `CHROMA_URL` environment variable

### Step 3: Environment Variables

Add to `backend/.env`:
```env
# Existing variables
OPENAI_API_KEY=your_key
MONGODB_URI=your_mongodb_uri
DATABASE_NAME=frontbench-dev

# New variables for Agentic AI
CHROMA_URL=http://localhost:8000  # Or your Chroma cloud URL
CHROMA_COLLECTION=frontbench_documents
ENABLE_AGENTIC_AI=true
```

### Step 4: Initialize Vector Store

The vector store will be automatically initialized on first use. For manual initialization:

```typescript
import { VectorStoreManager } from './src/vector-store/VectorStoreManager';

const vectorStore = new VectorStoreManager({
  collectionName: 'frontbench_documents',
});

await vectorStore.initialize();
```

## Usage Examples

### Example 1: Basic Agent Usage

```typescript
import { ResumeAnalysisAgent } from './src/agents/ResumeAnalysisAgent';
import { Langfuse } from 'langfuse';

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
});

const agent = new ResumeAnalysisAgent({
  langfuseClient: langfuse,
  traceId: 'trace-123',
});

const result = await agent.execute('Analyze this resume: [resume text]');
console.log(result.output);
```

### Example 2: Multi-Agent Orchestration

```typescript
import { AgentOrchestrator } from './src/agents/orchestrator/AgentOrchestrator';
import { ResumeAnalysisAgent } from './src/agents/ResumeAnalysisAgent';

const orchestrator = new AgentOrchestrator({
  langfuseClient: langfuse,
});

// Register agents
const resumeAgent = new ResumeAnalysisAgent();
orchestrator.registerAgent('resume_analysis', resumeAgent);

// Execute task
const result = await orchestrator.executeTask({
  id: 'task-1',
  type: 'analysis',
  description: 'Analyze resume and generate benchmarks',
  input: { resumeText: '...' },
});
```

### Example 3: Document Processing

```typescript
import { DocumentProcessor } from './src/document-processing/DocumentProcessor';
import { VectorStoreManager } from './src/vector-store/VectorStoreManager';

const processor = new DocumentProcessor();
const vectorStore = new VectorStoreManager();

// Process document
const document = await processor.processFile('./resume.pdf');

// Chunk document
const chunks = processor.chunkDocument(document, 1000, 200);

// Add to vector store
await vectorStore.addDocuments(chunks, {
  sessionId: 'session-123',
  documentType: 'resume',
});
```

### Example 4: Using Guardrails

```typescript
import { Guardrails } from './src/security/Guardrails';

const guardrails = new Guardrails({
  enablePromptInjectionDetection: true,
  enablePIIDetection: true,
});

const validation = guardrails.validateInput(userInput);
if (!validation.isValid) {
  console.warn('Input validation warnings:', validation.warnings);
}

const sanitizedInput = validation.sanitized;
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         API Endpoints (Express)         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Agent Orchestrator                   │
│  ┌────────────────────────────────────┐  │
│  │  ResumeAnalysisAgent               │  │
│  │  - ResumeAnalysisTool              │  │
│  │  - DocumentSearchTool              │  │
│  └────────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼────┐
│Vector │ │Memory │ │Guard-  │
│Store  │ │Manager│ │rails   │
└───────┘ └───────┘ └────────┘
```

## Next Steps

1. **Integrate with existing endpoints**: Update `/api/resume/upload` to use agents
2. **Add more agents**: Create BenchmarkAgent, TrajectoryAgent, etc.
3. **Implement RAG**: Connect document search to analysis workflows
4. **Add memory**: Enable conversation context across sessions
5. **Enhance security**: Integrate guardrails into all agent calls

## Testing

```bash
# Run type checking
npm run type-check

# Run in development
npm run dev

# Build for production
npm run build
```

## Troubleshooting

### Chroma Connection Issues
- Ensure Chroma server is running: `chroma run --host localhost --port 8000`
- Check `CHROMA_URL` environment variable
- Verify network connectivity

### Agent Execution Errors
- Check OpenAI API key is set
- Verify Langfuse credentials
- Review agent logs for specific errors

### Memory Issues
- Ensure MongoDB connection is active
- Check session ID is valid
- Verify memory configuration
