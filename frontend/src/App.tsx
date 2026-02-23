import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'

function App() {
  const [, setSessionId] = useState<string | null>(null)

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Header />
        <Routes>
          <Route path="/" element={<Home onResumeUploaded={setSessionId} />} />
          <Route path="/dashboard/:sessionId" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
