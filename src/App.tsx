import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { triggerAutoSyncToGoogleSheets } from './lib/googleSheetsSync';

import { DashboardPage } from './features/dashboard/DashboardPage';
import { SubmitWorkPage } from './features/submissions/SubmitWorkPage';
import { SubmissionListPage } from './features/submissions/SubmissionListPage';
import { SubmissionDetailPage } from './features/submissions/SubmissionDetailPage';
import { LibraryPage } from './features/library/LibraryPage';
import { MembersPage } from './features/admin/MembersPage';
import { TopicsPage } from './features/admin/TopicsPage';
import { SubmissionTypesPage } from './features/admin/SubmissionTypesPage';
import { RoundsPage } from './features/admin/RoundsPage';
import { ActivityLogsPage } from './features/admin/ActivityLogsPage';
import { SettingsPage } from './features/admin/SettingsPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { LoginPage } from './features/auth/LoginPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  useEffect(() => {
    // Initial sync to Google Sheets on app startup
    triggerAutoSyncToGoogleSheets('APP_STARTUP');

    // Auto-sync whenever data is updated anywhere in the system
    const handleDataChanged = (e: any) => {
      const action = e?.detail?.action || 'MUTATION';
      triggerAutoSyncToGoogleSheets(action);
    };

    window.addEventListener('sent_work_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('sent_work_data_changed', handleDataChanged);
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="submit" element={<SubmitWorkPage />} />
            <Route path="submissions" element={<SubmissionListPage />} />
            <Route path="submissions/:id" element={<SubmissionDetailPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* Admin Management Routes */}
            <Route path="admin/topics" element={<TopicsPage />} />
            <Route path="admin/members" element={<MembersPage />} />
            <Route path="admin/submission-types" element={<SubmissionTypesPage />} />
            <Route path="admin/rounds" element={<RoundsPage />} />
            <Route path="admin/activity-logs" element={<ActivityLogsPage />} />
            <Route path="admin/settings" element={<SettingsPage />} />
          </Route>

          {/* Wildcard fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
