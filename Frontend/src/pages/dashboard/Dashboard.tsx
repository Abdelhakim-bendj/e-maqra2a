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
  Users,
} from 'lucide-react';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

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
  completedTasks: 'مهام مكتملة',
  pendingTasks: 'مهام قيد التنفيذ',
  completedExams: 'اختبارات منجزة',
  learningStreak: 'أيام متتالية',
  progressPercent: 'نسبة الإنجاز',
  students: 'الطلاب',
  activeTasks: 'مهام نشطة',
  exams: 'الاختبارات',
  pendingReviews: 'تسميعات للمراجعة',
  users: 'المستخدمون',
  teachers: 'المعلمون',
  contentItems: 'مواد المحتوى',
  notifications: 'الإشعارات',
};

const statIcons = [BookOpen, CheckCircle2, CalendarClock, Flame, Users, ClipboardList];

function StatCard({ label, value, index }: { label: string; value: number; index: number }) {
  const Icon = statIcons[index % statIcons.length];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70">
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-2xl font-black text-slate-950">{value}</span>
      </div>
      <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function StudentDashboard({ dashboard }: { dashboard: DashboardPayload['dashboard'] }) {
  const stats = dashboard.stats;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(stats).map(([key, value], index) => (
            <StatCard key={key} label={statLabels[key] || key} value={value} index={index} />
          ))}
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-emerald-700">ورد اليوم</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {dashboard.dailyTask
                  ? `سورة ${dashboard.dailyTask.surahNumber}، الآيات ${dashboard.dailyTask.ayahStart}-${dashboard.dailyTask.ayahEnd}`
                  : 'لا توجد مهمة مخصصة اليوم'}
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                {dashboard.dailyTask?.teacher?.fullName || 'سيظهر اسم المعلم هنا عند إسناد المهمة'}
              </p>
            </div>
            <button className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800">
              بدء التسميع
            </button>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm font-bold text-slate-500">
              <span>تقدمك العام</span>
              <span>{stats.progressPercent || 0}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${stats.progressPercent || 0}%` }} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-black text-slate-950">الاختبارات القادمة</h2>
          </div>
          <div className="space-y-3">
            {(dashboard.upcomingExams || []).length > 0 ? (
              dashboard.upcomingExams?.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="font-black text-slate-900">{exam.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{new Date(exam.startTime).toLocaleString('ar-MA')}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">
                    {exam.timeLimitMinutes} دقيقة
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">لا توجد اختبارات قادمة حالياً.</p>
            )}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10">
          <Flame className="h-8 w-8 text-amber-300" />
          <p className="mt-4 text-sm font-bold text-slate-300">سلسلة التعلم</p>
          <p className="mt-1 text-4xl font-black">{stats.learningStreak || 0} يوم</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">حافظ على وردك اليومي لتزيد نقاط الإنجاز.</p>
        </div>

        <NotificationPanel notifications={dashboard.notifications || []} />
      </aside>
    </div>
  );
}

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
          { title: 'إدارة الورد اليومي', icon: PenSquare, text: 'أنشئ مهام حفظ ومراجعة دقيقة لكل طالب.' },
          { title: 'إدارة الاختبارات', icon: ClipboardList, text: 'حضّر اختبارات أسبوعية وشهرية وأسئلة اختيار من متعدد.' },
          { title: 'تنبيهات الطلاب', icon: Megaphone, text: 'أرسل رسائل تحفيزية وتنبيهات متابعة للطلاب.' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <Icon className="h-8 w-8 text-emerald-700" />
              <h2 className="mt-5 text-xl font-black text-slate-950">{item.title}</h2>
              <p className="mt-2 leading-7 text-slate-500">{item.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminDashboard({ dashboard }: { dashboard: DashboardPayload['dashboard'] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(dashboard.stats).map(([key, value], index) => (
          <StatCard key={key} label={statLabels[key] || key} value={value} index={index} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-emerald-700" />
            <h2 className="text-xl font-black text-slate-950">تحليلات المنصة</h2>
          </div>
          <div className="mt-6 h-64 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
            <div className="flex h-full items-end gap-3">
              {[42, 68, 55, 82, 74, 91, 88].map((height, index) => (
                <div key={index} className="flex-1 rounded-t-xl bg-emerald-600/80" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">إدارة المحتوى</h2>
          <p className="mt-2 leading-7 text-slate-500">راجع الدروس، الإعلانات، والمواد التعليمية المنشورة للطلاب.</p>
          <button className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-emerald-800">
            فتح إدارة المحتوى
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationPanel({ notifications }: { notifications: NonNullable<DashboardPayload['dashboard']['notifications']> }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Bell className="h-5 w-5 text-emerald-700" />
        <h2 className="text-xl font-black text-slate-950">آخر الإشعارات</h2>
      </div>
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-black text-slate-900">{notification.title}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{notification.message}</p>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">لا توجد إشعارات جديدة.</p>
        )}
      </div>
    </div>
  );
}

export const Dashboard = () => {
  const { user } = useAuthStore();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiCall<DashboardPayload>('/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center font-bold text-red-700">
        تعذر تحميل لوحة التحكم. حاول تحديث الصفحة.
      </div>
    );
  }

  const dashboard = data.dashboard;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-300">
              {dashboard.role === 'STUDENT' ? 'حساب طالب' : dashboard.role === 'TEACHER' ? 'حساب معلم' : 'لوحة الإدارة'}
            </p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">أهلاً بك، {user?.fullName}</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              تابع رحلتك التعليمية، راقب الإنجاز، وأدر مهام القرآن الكريم من مساحة واحدة منظمة.
            </p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10">
            {dashboard.role === 'TEACHER' ? <GraduationCap className="h-10 w-10" /> : <BookOpen className="h-10 w-10" />}
          </div>
        </div>
      </section>

      {dashboard.role === 'STUDENT' && <StudentDashboard dashboard={dashboard} />}
      {dashboard.role === 'TEACHER' && <TeacherDashboard dashboard={dashboard} />}
      {dashboard.role === 'ADMIN' && <AdminDashboard dashboard={dashboard} />}
    </div>
  );
};
