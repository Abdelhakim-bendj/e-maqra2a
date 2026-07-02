import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/layout/MainLayout';
import { Suspense, lazy } from 'react';
import { useAuthStore, type User } from './store/authStore';
import { apiCall } from './services/api';
import { supabase } from './lib/supabase';

const Login = lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/auth/Register').then(module => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword').then(module => ({ default: module.ResetPassword })));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const Tasks = lazy(() => import('./pages/tasks/Tasks').then(module => ({ default: module.Tasks })));
const ManageTasks = lazy(() => import('./pages/tasks/ManageTasks').then(module => ({ default: module.ManageTasks })));
const SubmitTask = lazy(() => import('./pages/tasks/SubmitTask').then(module => ({ default: module.SubmitTask })));
const Exams = lazy(() => import('./pages/exams/Exams').then(module => ({ default: module.Exams })));
const ManageExams = lazy(() => import('./pages/exams/ManageExams').then(module => ({ default: module.ManageExams })));
const TakeExam = lazy(() => import('./pages/exams/TakeExam').then(module => ({ default: module.TakeExam })));
const ExamResults = lazy(() => import('./pages/exams/ExamResults').then(module => ({ default: module.ExamResults })));
const Submissions = lazy(() => import('./pages/submissions/Submissions').then(module => ({ default: module.Submissions })));
const IslamicContent = lazy(() => import('./pages/content/IslamicContent').then(module => ({ default: module.IslamicContent })));
const Tajweed = lazy(() => import('./pages/content/Tajweed').then(module => ({ default: module.Tajweed })));
const Messages = lazy(() => import('./pages/messages/Messages').then(module => ({ default: module.Messages })));
const Notifications = lazy(() => import('./pages/notifications/Notifications').then(module => ({ default: module.Notifications })));
const Sessions = lazy(() => import('./pages/sessions/Sessions').then(module => ({ default: module.Sessions })));
const Classes = lazy(() => import('./pages/classes/Classes').then(module => ({ default: module.Classes })));
const Students = lazy(() => import('./pages/students/Students').then(module => ({ default: module.Students })));
const Reports = lazy(() => import('./pages/reports/Reports').then(module => ({ default: module.Reports })));
const Profile = lazy(() => import('./pages/profile/Profile').then(module => ({ default: module.Profile })));
const LandingPage = lazy(() => import('./pages/landing/LandingPage').then(module => ({ default: module.LandingPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AuthBootstrap() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    // Listen to Supabase auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (!session) {
        setUser(null);
        return;
      }

      // Fetch backend profile using the Supabase JWT
      try {
        const data = await apiCall<{ user: User }>('/auth/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (isMounted) setUser(data.user);
      } catch {
        if (isMounted) setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  return null;
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function PublicLandingRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
      </div>
    );
  }

  // If already logged in, skip the landing page and go straight to the app
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={<PublicLandingRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><LandingPage /></Suspense></PublicLandingRoute>} />
          
          <Route element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" /></div>}>
                    <Dashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route path="/tasks" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><Tasks /></Suspense></ProtectedRoute>} />
            <Route path="/manage/tasks" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><ManageTasks /></Suspense></ProtectedRoute>} />
            <Route path="/tasks/:taskId/submit" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><SubmitTask /></Suspense></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><Exams /></Suspense></ProtectedRoute>} />
            <Route path="/exams/:id/take" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><TakeExam /></Suspense></ProtectedRoute>} />
            <Route path="/exams/:id/results" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><ExamResults /></Suspense></ProtectedRoute>} />
            <Route path="/manage/exams" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><ManageExams /></Suspense></ProtectedRoute>} />
            <Route path="/submissions" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><Submissions /></Suspense></ProtectedRoute>} />
            <Route path="/tajweed" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><Tajweed /></Suspense></ProtectedRoute>} />
            <Route path="/content" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><IslamicContent /></Suspense></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><Messages /></Suspense></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><Notifications /></Suspense></ProtectedRoute>} />
            <Route path="/sessions" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><Sessions /></Suspense></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><Classes /></Suspense></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><Students /></Suspense></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><Reports /></Suspense></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Suspense fallback={<div className="p-8 text-center">جاري التحميل...</div>}><Profile /></Suspense></ProtectedRoute>} />

            <Route
              path="*"
              element={
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <h1 className="text-3xl font-black text-slate-900">404 - الصفحة غير موجودة</h1>
                  <p className="mt-3 text-slate-500">عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
                </div>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
