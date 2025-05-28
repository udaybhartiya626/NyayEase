import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import FileCase from './pages/dashboard/FileCase';
import Cases from './pages/dashboard/Cases';
import MyCases from './pages/dashboard/MyCases';
import CaseDetails from './pages/dashboard/CaseDetails';
import Profile from './pages/dashboard/Profile';
import Notifications from './pages/dashboard/Notifications';
import NotFound from './pages/NotFound';
import UnauthorizedPage from './pages/UnauthorizedPage';
import FindAdvocate from './pages/dashboard/FindAdvocate';
import Messages from './pages/dashboard/Messages';
import CaseRequests from './pages/dashboard/CaseRequests';
import CaseRequestDetails from './pages/dashboard/CaseRequestDetails';
import PendingCases from './pages/dashboard/PendingCases';
import Hearings from './pages/dashboard/Hearings';
import CourtCaseDetails from './pages/dashboard/CourtCaseDetails';
import CaseManagement from './pages/dashboard/CaseManagement';
import ScheduleHearing from './pages/dashboard/ScheduleHearing';
import HearingScheduleModal from './components/HearingScheduleModal';
// Other pages to be implemented
const AboutPage = () => <div className="p-5">About Page (To be implemented)</div>;
const TestUser = () => <div className="p-5">Test User Page (To be implemented)</div>;

function App() {
  return (
    <AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />
          <Route path="test-user" element={<TestUser />} />
        </Route>
        
        {/* Protected Dashboard Layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          {/* General dashboard routes accessible to all authenticated users */}
          <Route index element={<DashboardHome />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<Messages />} />
          
          {/* Litigant specific routes */}
          <Route path="file-case" element={
            <ProtectedRoute allowedRoles={['litigant']}>
              <FileCase />
            </ProtectedRoute>
          } />
          
          {/* Routes for litigants */}
          <Route path="cases" element={
            <ProtectedRoute allowedRoles={['litigant', 'court-officer']}>
              <Cases />
            </ProtectedRoute>
          } />
          
          {/* Routes for advocates */}
          <Route path="my-cases" element={
            <ProtectedRoute allowedRoles={['advocate']}>
              <MyCases />
            </ProtectedRoute>
          } />
          
          <Route path="cases/:caseId" element={
            <ProtectedRoute allowedRoles={['litigant', 'advocate', 'court-officer']}>
              <CaseDetails />
            </ProtectedRoute>
          } />

          <Route path="advocates" element={<FindAdvocate />} />
          
          <Route path="requests" element={
            <ProtectedRoute allowedRoles={['litigant', 'advocate']}>
              <CaseRequests />
            </ProtectedRoute>
          } />
          <Route path="requests/:id" element={
            <ProtectedRoute allowedRoles={['litigant', 'advocate']}>
              <CaseRequestDetails />
            </ProtectedRoute>
          } />

          {/* Court Officer specific routes */}
          <Route path="case-details/:caseId" element={
            <ProtectedRoute allowedRoles={['litigant', 'advocate', 'court-officer']}>
              <CaseDetails />
            </ProtectedRoute>
          } />

          <Route path="court-case-details/:caseId" element={
            <ProtectedRoute allowedRoles={['court-officer']}>
              <CourtCaseDetails />
            </ProtectedRoute>
          } />
          <Route path="hearings" element={
            <ProtectedRoute allowedRoles={['court-officer', 'litigant', 'advocate']}>
              <Hearings/>
            </ProtectedRoute>
          } />
          <Route path="hearings/:caseId" element={
            <ProtectedRoute allowedRoles={['court-officer', 'litigant', 'advocate']}>
              <ScheduleHearing />
            </ProtectedRoute>
          } />
          <Route path="cases/:caseId/hearings/:hearingId/edit" element={
            <ProtectedRoute allowedRoles={['court-officer']}>
              <ScheduleHearing />
            </ProtectedRoute>
          } />
          
          <Route path="case-management/:caseId" element={
            <ProtectedRoute allowedRoles={['court-officer']}>
              <CaseManagement />
            </ProtectedRoute>
          } />
          
         <Route path="pending-cases" element={
          <ProtectedRoute allowedRoles={['court-officer']}>
            <PendingCases/>
          </ProtectedRoute>
         }/>
         <Route path="pending-cases/:caseId" element={
          <ProtectedRoute allowedRoles={['court-officer']}>
            <CourtCaseDetails/>
          </ProtectedRoute>
         }/>

        </Route>
        
       

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
