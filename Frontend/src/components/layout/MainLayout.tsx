import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, BookOpen, ClipboardList, GraduationCap, LayoutDashboard,
  LogOut, MessageSquare, Mic, Moon, Sun, Settings, Users, Video, ShieldAlert
} from 'lucide-react';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../store/authStore';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLangStore } from '../../store/langStore';
import logoUrl from '../../assets/logo.png';

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'مدير',
  TEACHER: 'معلم',
  STUDENT: 'طالب',
};

type NavItem = { label: string; to: string; icon: React.ElementType; roles: UserRole[] };

const navItems: NavItem[] = [
  { label: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { label: 'nav.tasks', to: '/tasks', icon: ClipboardList, roles: ['STUDENT'] },
  { label: 'nav.daily_tasks', to: '/manage/tasks', icon: ClipboardList, roles: ['TEACHER'] },
  { label: 'nav.exams', to: '/exams', icon: GraduationCap, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { label: 'nav.submissions', to: '/submissions', icon: Mic, roles: ['STUDENT', 'TEACHER'] },
  { label: 'nav.sessions', to: '/sessions', icon: Video, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { label: 'nav.tajweed', to: '/tajweed', icon: BookOpen, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { label: 'nav.content', to: '/content', icon: Moon, roles: ['STUDENT'] },
  { label: 'nav.students', to: '/students', icon: Users, roles: ['TEACHER', 'ADMIN'] },
  { label: 'nav.classes', to: '/admin/classes', icon: Settings, roles: ['ADMIN'] },
  { label: 'nav.reports', to: '/reports', icon: LayoutDashboard, roles: ['TEACHER', 'ADMIN'] },
  { label: 'nav.messages', to: '/messages', icon: MessageSquare, roles: ['STUDENT', 'TEACHER'] },
  { label: 'nav.notifications', to: '/notifications', icon: Bell, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { label: 'nav.profile', to: '/profile', icon: Users, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
];

export const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const { t } = useLangStore();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const [teacherSearch, setTeacherSearch] = useState('');

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => apiCall<{ users: any[] }>('/users'),
    enabled: !!user && user.role === 'STUDENT' && !user.studentProfile?.teacherId,
  });

  const selectTeacherMutation = useMutation({
    mutationFn: (teacherId: string) => apiCall('/users/select-teacher', { method: 'POST', body: JSON.stringify({ teacherId }) }),
    onSuccess: () => {
      alert('تم إرسال طلبك للمعلم بنجاح! يرجى الانتظار حتى يتم القبول.');
      setShowTeacherModal(false);
      window.location.reload(); // Quick refresh to update restricted state
    },
    onError: (err: any) => alert(err.message),
  });

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

  const { data: statsData } = useQuery({
    queryKey: ['navbar-stats'],
    queryFn: () => apiCall<{ newTasks: number; newExams: number; pendingSubmissions: number }>('/dashboard/navbar-stats'),
    enabled: !!user,
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

  let visibleNav = navItems.filter((item) => user && item.roles.includes(user.role));

  const isStudentRestricted = user?.role === 'STUDENT' && user.studentProfile?.teacherStatus !== 'ACCEPTED';
  if (isStudentRestricted) {
    visibleNav = visibleNav.filter(item => item.to === '/messages' || item.to === '/profile' || item.to === '/notifications');
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-300" dir="rtl">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md shadow-sm animate-fade-in">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 shrink-0 group transition-transform hover:scale-105 active:scale-95">
            <span className="flex h-11 w-11 items-center justify-center bg-transparent transition-all overflow-hidden">
              <img src={logoUrl} alt="E-Maqra2a Logo" className="h-full w-full object-contain" />
            </span>
            <div className="hidden sm:block">
              <p className="text-lg font-black leading-none text-foreground tracking-tight">المقرأة الإلكترونية</p>
              <p className="mt-1 text-xs font-bold text-accent">منصة تعليم القرآن الكريم</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 xl:flex">
            {visibleNav.slice(0, 7).map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
              const showBadge = 
                ((item.to === '/tasks' || item.to === '/manage/tasks') && (statsData?.newTasks || 0) > 0) ||
                (item.to === '/exams' && (statsData?.newExams || 0) > 0) ||
                (item.to === '/submissions' && (statsData?.pendingSubmissions || 0) > 0);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-800'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{t(item.label)}</span>
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-destructive-foreground ring-2 ring-card" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User area */}
          {user ? (
            <div className="flex items-center gap-3 animate-fade-in">
              <button
                onClick={() => setIsDark(!isDark)}
                className="rounded-xl p-2.5 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95"
                title="تغيير المظهر"
              >
                {isDark ? <Sun className="h-6 w-6 text-amber-500" /> : <Moon className="h-6 w-6 text-slate-500" />}
              </button>
              <Link
                to="/notifications"
                className="relative rounded-xl p-2.5 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95 dark:hover:bg-slate-800"
              >
                <Bell className="h-7 w-7" />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground ring-2 ring-card animate-pulse">
                    {unreadNotifications > 9 ? '+9' : unreadNotifications}
                  </span>
                )}
              </Link>
              {user.role !== 'ADMIN' && (
                <Link
                  to="/messages"
                  className="relative rounded-xl p-2.5 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95"
                >
                  <MessageSquare className="h-7 w-7" />
                  {unreadMessages > 0 && (
                     <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground ring-2 ring-card animate-pulse">
                      {unreadMessages > 9 ? '+9' : unreadMessages}
                    </span>
                  )}
                </Link>
              )}
              <Link to="/profile" className="flex items-center group transition-transform hover:scale-105 active:scale-95">
                <div className="hidden text-right sm:block ml-3">
                  <p className="text-sm font-black text-foreground leading-none group-hover:text-primary transition-colors">{t('nav.profile')}</p>
                  <p className="mt-1 text-xs font-bold text-accent">{user.fullName}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary font-black text-lg shadow-inner transition-colors group-hover:bg-primary group-hover:text-primary-foreground border-2 border-transparent group-hover:border-primary/20 overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                  ) : (
                    user.fullName.charAt(0)
                  )}
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl p-2.5 text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:scale-105 active:scale-95"
                title="تسجيل الخروج"
              >
                <LogOut className="h-7 w-7" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-105 active:scale-95">
              تسجيل الدخول
            </Link>
          )}
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg pb-safe xl:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around px-2 py-3">
          {visibleNav.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            const showBadge = 
              ((item.to === '/tasks' || item.to === '/manage/tasks') && (statsData?.newTasks || 0) > 0) ||
              (item.to === '/exams' && (statsData?.newExams || 0) > 0) ||
              (item.to === '/submissions' && (statsData?.pendingSubmissions || 0) > 0);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-bold transition-all duration-300 active:scale-95 ${
                  active ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`h-8 w-8 transition-transform duration-300 ${active ? 'scale-110 mb-0.5' : ''}`} />
                {t(item.label)}
                {showBadge && (
                  <span className="absolute top-1 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-destructive ring-2 ring-card" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 xl:pb-8 lg:px-8 animate-slide-up relative">
        {isStudentRestricted && !location.pathname.startsWith('/messages') && !location.pathname.startsWith('/profile') && !location.pathname.startsWith('/notifications') ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm pt-20 px-4">
            <div className="text-center bg-card p-8 rounded-3xl shadow-xl w-full max-w-2xl border border-border flex flex-col max-h-[85vh]">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shrink-0">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black mb-2 text-foreground shrink-0">الحساب قيد المراجعة</h2>
              <p className="text-muted-foreground mb-6 shrink-0">
                {user.studentProfile?.teacherId 
                  ? 'طلبك قيد المراجعة من قبل المعلم. يرجى الانتظار حتى يتم قبولك لتتمكن من استخدام كافة ميزات المنصة.' 
                  : 'يجب عليك اختيار معلم أولاً لتبدأ رحلتك التعليمية.'}
              </p>
              
              {!user.studentProfile?.teacherId && (
                <div className="flex-1 flex flex-col overflow-hidden text-right">
                  <div className="mb-4 shrink-0">
                    <input
                      type="text"
                      placeholder="ابحث عن معلم بالاسم..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <div className="overflow-y-auto pr-2 space-y-3 flex-1 custom-scrollbar text-right">
                    {teachersData?.users?.filter(u => u.role === 'TEACHER' && u.fullName.includes(teacherSearch)).map(teacher => (
                      <div key={teacher.id} className="border-2 border-border p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-background">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-xl overflow-hidden shrink-0">
                            {teacher.avatarUrl ? <img src={teacher.avatarUrl} className="w-full h-full object-cover" /> : teacher.fullName[0]}
                          </div>
                          <div>
                            <h4 className="font-black text-lg">{teacher.fullName}</h4>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => selectTeacherMutation.mutate(teacher.id)}
                            disabled={selectTeacherMutation.isPending}
                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition text-center text-sm"
                          >
                            طلب انضمام
                          </button>
                          <button 
                            onClick={() => navigate('/messages', { state: { openChatWith: teacher.id } })}
                            className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm"
                          >
                            <MessageSquare className="w-4 h-4" /> مراسلة
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!teachersData?.users || teachersData.users.filter(u => u.role === 'TEACHER' && u.fullName.includes(teacherSearch)).length === 0) && (
                      <p className="text-center text-muted-foreground py-8 font-bold">لم يتم العثور على معلمين بهذه المواصفات.</p>
                    )}
                  </div>
                </div>
              )}

              {user.studentProfile?.teacherId && (
                <button 
                  onClick={() => navigate('/messages')}
                  className="bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-bold inline-flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors mx-auto shrink-0 mt-4"
                >
                  <MessageSquare className="w-5 h-5" />
                  مراسلة المعلم
                </button>
              )}
            </div>
          </div>
        ) : null}
        

        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 hidden xl:block mt-auto">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-sm font-medium text-muted-foreground sm:px-6 md:flex-row lg:px-8">
          <p>© 2026 منصة المقرأة الإلكترونية — جميع الحقوق محفوظة</p>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">الشروط والأحكام</a>
            <a href="#" className="hover:text-primary transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-primary transition-colors">تواصل معنا</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
