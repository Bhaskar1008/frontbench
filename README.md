# Frontbench

A comprehensive career trajectory and learning path platform that analyzes resumes, provides benchmark data, career trajectory insights, and personalized learning recommendations.

## Features

- 📄 **Resume Analysis**: Upload and parse resumes to extract structured information
- 📊 **Benchmark Data**: Compare your skills and experience with market standards
- 🚀 **Career Trajectory**: Visualize potential career paths and future opportunities
- 📚 **Learning Path**: Get personalized recommendations and resources for career advancement

## Project Structure

```
Frontbench/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── services/ # AI analysis services
│   │   └── index.ts  # Main server file
│   └── package.json
├── frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   └── pages/      # Page components
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```bash
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. Start both the backend and frontend servers
2. Open your browser and navigate to `http://localhost:3000`
3. Upload your resume (PDF format recommended)
4. Explore the analysis, benchmarks, career trajectory, and learning path recommendations

## API Endpoints

- `POST /api/resume/upload` - Upload and analyze resume
- `POST /api/benchmarks` - Get benchmark data
- `POST /api/trajectory` - Get career trajectory
- `POST /api/learning-path` - Get learning path recommendations
- `GET /api/analysis/:sessionId` - Get complete analysis data

## Technologies Used

### Backend
- Express.js
- TypeScript
- OpenAI API
- PDF parsing (pdf-parse)
- Multer (file uploads)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts (data visualization)
- React Router
- Axios

## License

MIT
