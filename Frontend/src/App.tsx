import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Dashboard } from './pages/dashboard/Dashboard';
import { apiCall } from './services/api';
import { useAuthStore } from './store/authStore';
import type { User } from './store/authStore';
import { Tasks } from './pages/tasks/Tasks';
import { ManageTasks } from './pages/tasks/ManageTasks';
import { SubmitTask } from './pages/tasks/SubmitTask';
import { Exams } from './pages/exams/Exams';
import { ManageExams } from './pages/exams/ManageExams';
import { Submissions } from './pages/submissions/Submissions';
import { IslamicContent } from './pages/content/IslamicContent';
import { Tajweed } from './pages/content/Tajweed';
import { Messages } from './pages/messages/Messages';
import { Notifications } from './pages/notifications/Notifications';
import { Sessions } from './pages/sessions/Sessions';
import { Classes } from './pages/classes/Classes';
import { Students } from './pages/students/Students';
import { Reports } from './pages/reports/Reports';


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

    apiCall<{ user: User }>('/auth/profile')
      .then((data) => {
        if (isMounted) setUser(data.user);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [setLoading, setUser]);

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

          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="manage/tasks" element={<ProtectedRoute><ManageTasks /></ProtectedRoute>} />
            <Route path="tasks/:taskId/submit" element={<ProtectedRoute><SubmitTask /></ProtectedRoute>} />
            <Route path="exams" element={<ProtectedRoute><Exams /></ProtectedRoute>} />
            <Route path="manage/exams" element={<ProtectedRoute><ManageExams /></ProtectedRoute>} />
            <Route path="submissions" element={<ProtectedRoute><Submissions /></ProtectedRoute>} />
            <Route path="tajweed" element={<ProtectedRoute><Tajweed /></ProtectedRoute>} />
            <Route path="content" element={<ProtectedRoute><IslamicContent /></ProtectedRoute>} />
            <Route path="messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
            <Route path="admin/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
            <Route path="students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

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
