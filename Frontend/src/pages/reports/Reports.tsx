import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Users, BookOpen, GraduationCap, Video, CheckCircle2 } from 'lucide-react';

interface AdminReport {
  users: { total: number; students: number; teachers: number };
  content: { classes: number; tasks: number; completedTasks: number; exams: number; sessions: number };
  submissions: { total: number; avgScore: number | null };
  taskCompletionRate: number;
}

export const Reports = () => {
  const { user } = useAuthStore();
  
  const { data: report, isLoading } = useQuery({
    queryKey: ['admin-report'],
    queryFn: () => apiCall<{ data: AdminReport }>('/reports/admin').then(res => res.data),
    enabled: user?.role === 'ADMIN',
  });

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        التقارير التفصيلية متاحة للمدراء حالياً. جاري العمل على تقارير المعلمين.
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700 mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-emerald-600" />
          التقارير والإحصائيات
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">إجمالي المستخدمين</p>
            <p className="text-2xl font-black text-slate-900">{report?.users.total || 0}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">الطلاب المسجلين</p>
            <p className="text-2xl font-black text-slate-900">{report?.users.students || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">المعلمين</p>
            <p className="text-2xl font-black text-slate-900">{report?.users.teachers || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">الفصول الدراسية</p>
            <p className="text-2xl font-black text-slate-900">{report?.content.classes || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">نسبة إنجاز المهام</p>
            <p className="text-2xl font-black text-slate-900">{report?.taskCompletionRate || 0}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">الاختبارات</p>
            <p className="text-2xl font-black text-slate-900">{report?.content.exams || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">الجلسات الحية</p>
            <p className="text-2xl font-black text-slate-900">{report?.content.sessions || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">التسميعات المرفوعة</p>
            <p className="text-2xl font-black text-slate-900">{report?.submissions.total || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
