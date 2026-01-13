import { useAuth } from './contexts/AuthContext'
import Login from './components/auth/Login'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import LessonPlanner from './pages/LessonPlanner'
import UnitPlanner from './pages/UnitPlanner'
import YearPlan from './pages/YearPlan'
import CalendarPage from './pages/CalendarPage'
import PromptAssistant from './pages/PromptAssistant'
import ResearchAssistant from './pages/ResearchAssistant'
import QuizGenerator from './pages/QuizGenerator'
import ReportCards from './pages/ReportCards'
import Tools from './pages/Tools'
import Profile from './pages/Profile'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="App">
        {user ? (
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="lessons" element={<LessonPlanner />} />
              <Route path="units" element={<UnitPlanner />} />
              <Route path="year-plan" element={<YearPlan />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="prompt-assistant" element={<PromptAssistant />} />
              <Route path="research" element={<ResearchAssistant />} />
              <Route path="assessments" element={<QuizGenerator />} />
              <Route path="report-cards" element={<ReportCards />} />
              <Route path="tools" element={<Tools />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        ) : (
          <Login />
        )}
      </div>
    </BrowserRouter>
  )
}

export default App
