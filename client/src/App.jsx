import { useAuth } from './contexts/AuthContext'
import Login from './components/auth/Login'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import LessonPlanner from './pages/LessonPlanner'
import UnitPlanner from './pages/UnitPlanner'
import SyllabusTracker from './pages/SyllabusTracker'
import CalendarPage from './pages/CalendarPage'
import PromptAssistant from './pages/PromptAssistant'
import ResearchAssistant from './pages/ResearchAssistant'
import Assessments from './pages/Assessments'
import ReportCards from './pages/ReportCards'
import Tools from './pages/Tools'
import Profile from './pages/Profile'
import SchoolList from './pages/SchoolList'
import SchoolDashboard from './pages/SchoolDashboard'
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
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/schools" replace />} />
          <Route path="/schools" element={user ? <Navigate to="/dashboard" replace /> : <SchoolList />} />
          <Route path="/schools/:schoolId/dashboard" element={user ? <Navigate to="/dashboard" replace /> : <SchoolDashboard />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

          {/* Protected Routes */}
          {user ? (
            <Route path="/" element={<MainLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="lessons" element={<LessonPlanner />} />
              <Route path="units" element={<UnitPlanner />} />
              <Route path="syllabus-tracker" element={<SyllabusTracker />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="prompt-assistant" element={<PromptAssistant />} />
              <Route path="research" element={<ResearchAssistant />} />
              <Route path="assessments" element={<Assessments />} />
              <Route path="report-cards" element={<ReportCards />} />
              <Route path="tools" element={<Tools />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/schools" replace />} />
          )}
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
