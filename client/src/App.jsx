import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AdvancedFilterPage from './pages/hr/AdvancedFilterPage'
import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './components/layout/Layout'
import CandidatesPage from './pages/hr/CandidatesPage'
import AddCandidate from './components/candidates/AddCandidate'
import EditCandidate from './components/candidates/EditCandidate'
import CandidateProfile from './pages/hr/CandidateProfile'
import ScheduleInterview from './pages/hr/ScheduleInterview'
import AddNotes from './pages/hr/AddNotes'
import MyInterviews from './pages/interviewer/MyInterviews'
import InterviewerCandidateProfile from './pages/interviewer/InterviewerCandidateProfile'
import Dashboard from './pages/interviewer/InterviewerDashboard'
import HRDashboard from './pages/hr/HRDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import AddHR from './components/users/AddHR'
import AddInterviewer from './components/users/AddInterviewer'
import ClientInterviewCandidate from './pages/ClientInterviewCandidate'
import Report from './pages/hr/Report'
import CandidateReport from './pages/hr/CandidateReport'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route path='/' element={<Navigate to='/login' replace />} />
          <Route path='/login' element={<LoginPage />} />

          {/* Public Client Interview Route */}
          <Route path='/client-interview/candidates/:id' element={<ClientInterviewCandidate />} />

          {/* ── HR ROUTES ── */}
          <Route
            path='/hr'
            element={
              <ProtectedRoute roles={['hr']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to='dashboard' replace />} />
            <Route path='dashboard' element={<HRDashboard />} />
            <Route path='candidates' element={<CandidatesPage />} />
            <Route path='candidates/add' element={<AddCandidate />} />
            <Route path='candidates/edit/:id' element={<EditCandidate />} />
            <Route path='candidates/filter' element={<AdvancedFilterPage />} />
            <Route path='reports' element={<Report />} />
            <Route path='reports/:id' element={<CandidateReport />} />
            <Route path='candidates/:id/schedule-interview' element={<ScheduleInterview />} />
            <Route path='candidates/:id/rounds/:roundId/notes' element={<AddNotes />} />
            <Route path='candidates/:id' element={<CandidateProfile />} />

            {/* Also allow /hr/schedule-interview without a pre-selected candidate */}
            <Route path='schedule-interview' element={<ScheduleInterview />} />
          </Route>

          {/* ── INTERVIEWER ROUTES ── */}
          <Route
            path='/interviewer'
            element={
              <ProtectedRoute roles={['interviewer']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to='dashboard' replace />} />
            <Route path='dashboard' element={<Dashboard />} />
            <Route path='my-interviews' element={<MyInterviews />} />
            <Route path='candidates/:id' element={<InterviewerCandidateProfile />} />

          </Route>

          {/* ── ADMIN ROUTES — with custom layout ── */}
          <Route
            path='/admin'
            element={
              <ProtectedRoute roles={['admin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to='dashboard' replace />} />
            <Route path='dashboard' element={<AdminDashboard />} />
            <Route path='candidates' element={<CandidatesPage />} />
            <Route path='candidates/add' element={<AddCandidate />} />
            <Route path='candidates/edit/:id' element={<EditCandidate />} />
            <Route path='candidates/:id' element={<CandidateProfile />} />
            <Route path='reports' element={<Report />} />
            <Route path='reports/:id' element={<CandidateReport />} />
            <Route path='add-hr' element={<AddHR />} />
            <Route path='add-interviewer' element={<AddInterviewer />} />

          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App