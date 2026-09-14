import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ExplorePage } from './pages/ExplorePage';
import { DashboardPage } from './pages/DashboardPage';
import { StudySetFormPage } from './pages/StudySetFormPage';
import { StudySetDetailPage } from './pages/StudySetDetailPage';
import { LearnPage } from './pages/LearnPage';
import { ProfilePage } from './pages/ProfilePage';
import {
  AdminCategoriesPage,
  AdminHomePage,
  AdminLayout,
  AdminStudySetsPage,
  AdminUsersPage,
} from './pages/AdminPages';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="study-sets/:id" element={<StudySetDetailPage />} />
            <Route path="study-sets/:id/learn" element={<LearnPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="study-sets/new" element={<StudySetFormPage />} />
              <Route path="study-sets/:id/edit" element={<StudySetFormPage />} />
            </Route>

            <Route path="admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminHomePage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="study-sets" element={<AdminStudySetsPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
