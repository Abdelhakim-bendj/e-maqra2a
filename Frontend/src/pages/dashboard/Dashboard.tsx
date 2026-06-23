import { useQuery } from '@tanstack/react-query';
import {
  Award,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Flame,
  GraduationCap,
  LineChart,
  Megaphone,
  PenSquare,
  Star,
  TrendingUp,
  Users,
  Zap,
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useLangStore } from '../../store/langStore';

type DashboardPayload = {
  dashboard: {
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    stats: Record<string, number>;
    dailyTask?: {
      id: string;
      surahNumber: number;
      ayahStart: number;
      ayahEnd: number;
      dueDate: string;
      teacher?: { fullName: string };
    } | null;
    notifications?: Array<{ id: string; title: string; message: string; isRead?: boolean; createdAt: string }>;
    upcomingExams?: Array<{ id: string; title: string; examType: string; startTime: string; timeLimitMinutes: number }>;
  };
};

const statLabels: Record<string, string> = {
  completedTasks: 'dashboard.stats.completedTasks',
  pendingTasks: 'dashboard.stats.pendingTasks',
  completedExams: 'dashboard.stats.completedExams',
  activeTasks: 'dashboard.stats.activeTasks',
  exams: 'dashboard.stats.exams',
  pendingReviews: 'dashboard.stats.pendingReviews',
  users: 'dashboard.stats.users',
  teachers: 'dashboard.stats.teachers',
  contentItems: 'dashboard.stats.contentItems',
  notifications: 'dashboard.stats.notifications',
  students: 'dashboard.stats.students',
};

const statIcons = [BookOpen, CheckCircle2, CalendarClock, Flame, Users, ClipboardList];
const statColors = [
  'bg-primary/10 text-primary',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
];

// ─── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ percent, size = 80, stroke = 8 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-muted" />
      <circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
        className="fill-none stroke-primary transition-all duration-1000 ease-out"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, index }: { label: string; value: number; index: number }) {
  const { t } = useLangStore();
  const Icon = statIcons[index % statIcons.length];
  const colorClass = statColors[index % statColors.length];

  return (
    <div
      className="group relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="absolute -left-4 -top-4 h-20 w-20 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
      <div className="relative flex items-start justify-between">
        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colorClass} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
          <Icon className="h-7 w-7" />
        </span>
        <span className="text-4xl font-black text-foreground tabular-nums">{value}</span>
      </div>
      <p className="relative mt-5 text-base font-bold text-muted-foreground">{t(label)}</p>
    </div>
  );
}

// ─── Weekly Progress Bar ──────────────────────────────────────────────────────
function WeekBar({ day, active }: { day: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-110' : 'bg-muted text-muted-foreground'}`}>
        {active && <CheckCircle2 className="h-5 w-5" />}
      </div>
      <span className="text-xs font-black text-muted-foreground">{day}</span>
    </div>
  );
}

// ─── Student Dashboard ────────────────────────────────────────────────────────
function StudentDashboard({ dashboard }: { dashboard: DashboardPayload['dashboard'] }) {
  const stats = dashboard.stats;
  const progress = stats.progressPercent || 0;
  const streak = stats.learningStreak || 0;
  const weekDays = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(stats)
          .filter(([key]) => key !== 'learningStreak' && key !== 'progressPercent')
          .map(([key, value], index) => (
            <StatCard key={key} label={statLabels[key] || key} value={value} index={index} />
          ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Daily Task Card */}
          <div className="relative overflow-hidden rounded-[2rem] bg-card border border-border p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20">
            <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-black text-primary">
                  <BookOpen className="h-5 w-5" /> ورد اليوم
                </span>
              </div>
              <h2 className="text-2xl font-black text-foreground sm:text-3xl">
                {dashboard.dailyTask
                  ? `سورة ${dashboard.dailyTask.surahNumber}، الآيات ${dashboard.dailyTask.ayahStart}–${dashboard.dailyTask.ayahEnd}`
                  : 'لا توجد مهمة مخصصة اليوم'}
              </h2>
              <p className="mt-2 text-base font-medium text-muted-foreground">
                {dashboard.dailyTask?.teacher?.fullName || 'سيظهر اسم المعلم عند إسناد المهمة'}
              </p>

              {/* Progress Bar */}
              <div className="mt-8 rounded-2xl bg-muted/40 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-black text-muted-foreground flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> تقدمك العام</span>
                  <span className="text-lg font-black text-primary">{progress}%</span>
                </div>
                <div className="h-5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-primary to-accent transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <button className="mt-6 rounded-2xl bg-primary px-8 py-4 text-base font-black text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300 hover:scale-105 hover:bg-primary/90 active:scale-95">
                بدء التسميع الآن
              </button>
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Zap className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-black text-foreground">نشاط الأسبوع</h2>
                <p className="text-sm font-bold text-muted-foreground">تابع مسيرتك اليومية</p>
              </div>
            </div>
            <div className="flex justify-between gap-2">
              {weekDays.map((day, i) => (
                <WeekBar key={day} day={day} active={i < Math.min(streak, 7)} />
              ))}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Award className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-black text-foreground">الاختبارات القادمة</h2>
            </div>
            <div className="space-y-3">
              {(dashboard.upcomingExams || []).length > 0 ? (
                dashboard.upcomingExams?.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors p-5">
                    <div>
                      <p className="font-black text-foreground text-base">{exam.title}</p>
                      <p className="mt-1 text-sm font-bold text-muted-foreground">{new Date(exam.startTime).toLocaleString('ar-MA')}</p>
                    </div>
                    <span className="rounded-2xl bg-primary/10 px-4 py-2 text-sm font-black text-primary">
                      {exam.timeLimitMinutes} د
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-muted/40 p-8 text-center">
                  <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-base font-black text-muted-foreground">لا توجد اختبارات قادمة حالياً.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Streak Card */}
          <div className="group relative overflow-hidden rounded-[2rem] bg-foreground p-8 text-background shadow-2xl shadow-foreground/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-foreground/30">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/20 blur-3xl transition-transform duration-500 group-hover:scale-150" />
            <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-primary/30 blur-2xl" />
            <div className="relative">
              <Flame className="h-12 w-12 text-amber-400 drop-shadow-lg" />
              <p className="mt-4 text-sm font-black text-background/70 uppercase tracking-widest">سلسلة التعلم</p>
              <p className="mt-2 text-7xl font-black tracking-tight">{streak}</p>
              <p className="text-2xl font-black text-background/80">يوم</p>
              <p className="mt-4 text-sm leading-relaxed text-background/60">
                حافظ على وردك لتفتح شارات الإنجاز وتصل للمستوى التالي!
              </p>
              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-background/10 p-3">
                <Star className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-black text-background/80">استمر لـ{' '}{7 - (streak % 7)} أيام للحصول على شارة</span>
              </div>
            </div>
          </div>

          {/* Progress Ring Card */}
          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm text-center">
            <h2 className="text-xl font-black text-foreground mb-6">نسبة الإنجاز</h2>
            <div className="relative flex items-center justify-center">
              <ProgressRing percent={progress} size={140} stroke={12} />
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black text-foreground">{progress}%</span>
                <span className="text-xs font-bold text-muted-foreground">مكتمل</span>
              </div>
            </div>
            <p className="mt-6 text-sm font-bold text-muted-foreground leading-relaxed">
              {progress >= 80 ? '🎉 أداء رائع! أنت قريب من الهدف.' : progress >= 50 ? '👍 في المنتصف، استمر!' : '💪 في البداية، كل خطوة تحسب!'}
            </p>
          </div>

          {/* Notification Panel */}
          <NotificationPanel notifications={dashboard.notifications || []} />
        </div>
      </div>
    </div>
  );
}

// ─── Teacher Dashboard ────────────────────────────────────────────────────────
function TeacherDashboard({ dashboard }: { dashboard: DashboardPayload['dashboard'] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(dashboard.stats).map(([key, value], index) => (
          <StatCard key={key} label={statLabels[key] || key} value={value} index={index} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { title: 'إدارة الورد اليومي', icon: PenSquare, text: 'أنشئ مهام حفظ ومراجعة دقيقة لكل طالب.', color: 'bg-primary/10 text-primary' },
          { title: 'إدارة الاختبارات', icon: ClipboardList, text: 'حضّر اختبارات أسبوعية وشهرية وأسئلة اختيار من متعدد.', color: 'bg-blue-100 text-blue-700' },
          { title: 'تنبيهات الطلاب', icon: Megaphone, text: 'أرسل رسائل تحفيزية وتنبيهات متابعة للطلاب.', color: 'bg-amber-100 text-amber-700' },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20"
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-[2]" />
              <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl ${item.color} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                <Icon className="h-8 w-8" />
              </div>
              <h2 className="mt-6 text-xl font-black text-foreground">{item.title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ dashboard }: { dashboard: DashboardPayload['dashboard'] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(dashboard.stats).map(([key, value], index) => (
          <StatCard key={key} label={statLabels[key] || key} value={value} index={index} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LineChart className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-foreground">تحليلات المنصة</h2>
              <p className="text-sm font-bold text-muted-foreground">نشاط الأسبوع الماضي</p>
            </div>
          </div>
          <div className="h-64 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 p-6 border border-border/50">
            <div className="flex h-full items-end gap-3">
              {[42, 68, 55, 82, 74, 91, 88].map((height, index) => (
                <div
                  key={index}
                  className="group relative flex-1 rounded-t-2xl bg-primary/50 transition-all duration-500 hover:bg-primary"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-foreground text-background text-xs font-black px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap">
                    {height}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 mb-6">
              <Users className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-black text-foreground">إدارة المحتوى</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">راجع الدروس، الإعلانات، والمواد التعليمية المنشورة للطلاب.</p>
          </div>
          <button className="mt-8 w-full rounded-2xl bg-foreground px-6 py-4 text-base font-black text-background transition-all duration-300 hover:scale-105 active:scale-95 shadow-md">
            فتح إدارة المحتوى
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Panel ───────────────────────────────────────────────────────
function NotificationPanel({ notifications }: { notifications: NonNullable<DashboardPayload['dashboard']['notifications']> }) {
  return (
    <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Bell className="h-6 w-6" />
        </span>
        <h2 className="text-xl font-black text-foreground">آخر الإشعارات</h2>
      </div>
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="group rounded-2xl bg-muted/40 p-4 transition-all duration-200 hover:bg-muted hover:-translate-y-0.5"
            >
              <p className="font-black text-foreground text-sm group-hover:text-primary transition-colors">{notification.title}</p>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{notification.message}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-muted/40 p-8 text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-black text-muted-foreground">لا توجد إشعارات جديدة.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export const Dashboard = () => {
  const { user } = useAuthStore();
  const { t } = useLangStore();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiCall<DashboardPayload>('/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-[2.5rem] bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 rounded-[2rem] bg-muted" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <div className="h-80 rounded-[2rem] bg-muted" />
          <div className="h-80 rounded-[2rem] bg-muted" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-[2rem] border border-destructive/30 bg-destructive/5 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <Bell className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-lg font-black text-destructive">تعذر تحميل لوحة التحكم.</p>
        <p className="mt-2 text-sm font-bold text-muted-foreground">حاول تحديث الصفحة أو التواصل مع الدعم الفني.</p>
      </div>
    );
  }

  const dashboard = data.dashboard;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-foreground p-8 text-background shadow-2xl sm:p-12 transition-all duration-500 hover:shadow-foreground/20">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute right-40 -top-10 h-32 w-32 rounded-full bg-secondary/20 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/30 px-4 py-1.5 text-sm font-black text-primary-foreground mb-4 border border-primary/40">
              {dashboard.role === 'STUDENT' ? '🎓 حساب طالب' : dashboard.role === 'TEACHER' ? '👨‍🏫 حساب معلم' : '⚙️ لوحة الإدارة'}
            </span>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl drop-shadow-sm">
              {t('dashboard.welcome')}، {user?.fullName} 👋
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-background/75">
              تابع رحلتك التعليمية، راقب الإنجاز، وأدر مهام القرآن الكريم من مساحة واحدة منظمة.
            </p>
          </div>
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-background/10 backdrop-blur-sm border border-background/20 shadow-inner transition-transform duration-300 hover:scale-105">
            {dashboard.role === 'TEACHER'
              ? <GraduationCap className="h-14 w-14 text-background/90" />
              : <BookOpen className="h-14 w-14 text-background/90" />}
          </div>
        </div>
      </section>

      {dashboard.role === 'STUDENT' && <StudentDashboard dashboard={dashboard} />}
      {dashboard.role === 'TEACHER' && <TeacherDashboard dashboard={dashboard} />}
      {dashboard.role === 'ADMIN' && <AdminDashboard dashboard={dashboard} />}
    </div>
  );
};
