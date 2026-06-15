import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, BookOpen, ClipboardList, GraduationCap, LayoutDashboard,
  LogOut, MessageSquare, Mic, Moon, Settings, Users, Video,
} from 'lucide-react';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../store/authStore';

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'مدير',
  TEACHER: 'معلم',
  STUDENT: 'طالب',
};

type NavItem = { label: string; to: string; icon: React.ElementType; roles: UserRole[] };

const navItems: NavItem[] = [
  { label: 'لوحة التحكم', to: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { label: 'الورد اليومي', to: '/tasks', icon: ClipboardList, roles: ['STUDENT'] },
  { label: 'إدارة الورد اليومي', to: '/manage/tasks', icon: ClipboardList, roles: ['TEACHER'] },
  { label: 'الاختبارات', to: '/exams', icon: GraduationCap, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { label: 'التسميعات', to: '/submissions', icon: Mic, roles: ['STUDENT', 'TEACHER'] },
  { label: 'الجلسات الحية', to: '/sessions', icon: Video, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { label: 'أحكام التجويد', to: '/tajweed', icon: BookOpen, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { label: 'المحتوى الإسلامي', to: '/content', icon: Moon, roles: ['STUDENT'] },
  { label: 'الطلاب', to: '/students', icon: Users, roles: ['TEACHER', 'ADMIN'] },
  { label: 'الفصول', to: '/admin/classes', icon: Settings, roles: ['ADMIN'] },
  { label: 'التقارير', to: '/reports', icon: LayoutDashboard, roles: ['TEACHER', 'ADMIN'] },
  { label: 'الرسائل', to: '/messages', icon: MessageSquare, roles: ['STUDENT', 'TEACHER'] },
  { label: 'الإشعارات', to: '/notifications', icon: Bell, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
];

export const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => apiCall<{ unreadCount: number }>('/notifications?unreadOnly=true'),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: msgData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiCall<{ conversations: Array<{ unread: number }> }>('/messages/conversations'),
    enabled: !!user && user.role !== 'ADMIN', // Admins don't have direct conversations in the current UI logic
    refetchInterval: 15000,
  });

  const unreadNotifications = notifData?.unreadCount || 0;
  const unreadMessages = msgData?.conversations?.reduce((acc, c) => acc + (c.unread || 0), 0) || 0;

  const handleLogout = async () => {
    try {
      await apiCall<null>('/auth/logout', { method: 'POST' }, false);
    } finally {
      queryClient.clear();
      logout();
      navigate('/login', { replace: true });
    }
  };

  const visibleNav = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 shrink-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30">
              <BookOpen className="h-5 w-5" />
            </span>
            <div className="hidden sm:block">
              <p className="text-base font-black leading-none text-slate-950">المقرأة الإلكترونية</p>
              <p className="mt-0.5 text-xs font-bold text-emerald-600">منصة تعليم القرآن الكريم</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 xl:flex">
            {visibleNav.slice(0, 7).map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User area */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/notifications"
                className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white">
                    {unreadNotifications > 9 ? '+9' : unreadNotifications}
                  </span>
                )}
              </Link>
              {user.role !== 'ADMIN' && (
                <Link
                  to="/messages"
                  className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white">
                      {unreadMessages > 9 ? '+9' : unreadMessages}
                    </span>
                  )}
                </Link>
              )}
              <div className="hidden text-right sm:block">
                <p className="text-sm font-black text-slate-900 leading-none">{user.fullName}</p>
                <p className="mt-0.5 text-xs font-bold text-emerald-600">{roleLabels[user.role]}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 font-black text-sm">
                {user.fullName.charAt(0)}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                title="تسجيل الخروج"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">
              تسجيل الدخول
            </Link>
          )}
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md xl:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {visibleNav.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-bold transition-all ${
                  active ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 xl:pb-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 hidden xl:block">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center text-xs font-medium text-slate-400 sm:px-6 md:flex-row lg:px-8">
          <p>© 2026 منصة المقرأة الإلكترونية — جميع الحقوق محفوظة</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#" className="hover:text-emerald-600 transition-colors">الشروط والأحكام</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">تواصل معنا</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
