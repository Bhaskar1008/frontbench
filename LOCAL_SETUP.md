# Local Development Setup Guide

This guide will help you run Frontbench locally for testing.

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key
- ChromaDB Cloud account (or local ChromaDB)

## Quick Start

### Option 1: Run Both Services (Recommended)

Open **two terminal windows**:

#### Terminal 1 - Backend:
```bash
cd backend
npm install
npm run dev
```

Backend will run on: `http://localhost:3001`

#### Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: `http://localhost:3000`

The frontend is configured to proxy API requests to the backend automatically.

### Option 2: Use the Start Scripts

#### Windows (PowerShell):
```powershell
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

#### Mac/Linux:
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)

Make sure `backend/.env` has these variables:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=frontbench-dev

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Langfuse Configuration (Optional)
LANGFUSE_SECRET_KEY=your_langfuse_secret_key
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com

# RAG & ChromaDB Configuration
ENABLE_RAG=true
CHROMA_API_KEY=your_chroma_api_key
CHROMA_TENANT=your_chroma_tenant
CHROMA_DATABASE=frontbench_documents
CHROMA_HOST=api.trychroma.com
```

### Frontend

The frontend uses Vite's proxy configuration (in `vite.config.ts`) to automatically forward `/api` requests to `http://localhost:3001`. No environment variables needed for local development.

## Testing the Application

1. **Start Backend**: `cd backend && npm run dev`
   - Should see: `🚀 Frontbench API Server running on http://localhost:3001`

2. **Start Frontend**: `cd frontend && npm run dev`
   - Should see: `Local: http://localhost:3000/`

3. **Open Browser**: Navigate to `http://localhost:3000`

4. **Test Resume Upload**:
   - Upload a PDF resume
   - Check backend terminal for detailed logs
   - Verify RAG/ChromaDB indexing logs

## Verifying RAG/ChromaDB

When you upload a resume, you should see these logs in the backend terminal:

```
🔍 Starting RAG indexing for session: xxx
🔍 Getting vector store...
✅ Vector store obtained, available: true
💾 Writing file to disk for processing, buffer size: XXXX
✅ File written to: uploads/xxx.pdf
📄 Processing document...
✅ Document processed successfully in XXXms
📦 Created X chunks in XXXms
📤 Adding documents to vector store...
✅ Successfully indexed X document chunks in Chroma
✅ ChromaDB indexing verification: Documents should be available
✅ Background RAG indexing completed successfully
```

## Troubleshooting

### Backend won't start
- Check if port 3001 is already in use
- Verify all environment variables are set in `backend/.env`
- Run `npm install` in the backend directory

### Frontend won't connect to backend
- Ensure backend is running on port 3001
- Check browser console for CORS errors
- Verify `vite.config.ts` proxy configuration

### RAG/ChromaDB not working
- Verify `ENABLE_RAG=true` in backend `.env`
- Check ChromaDB credentials are correct
- Look for error messages in backend logs

### MongoDB connection issues
- Verify MongoDB Atlas IP whitelist includes your IP
- Check MongoDB connection string format
- Ensure database name matches `DATABASE_NAME` in `.env`

## Ports Used

- **Backend**: `3001`
- **Frontend**: `3000`

Make sure these ports are available on your machine.

## Development Scripts

### Backend:
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build
- `npm run type-check` - Type check without building

### Frontend:
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Next Steps

After both services are running:
1. Open `http://localhost:3000` in your browser
2. Upload a test resume PDF
3. Check backend logs for RAG/ChromaDB indexing
4. Verify the resume analysis appears in the frontend
