import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { GraduationCap, Clock, FileText, CheckCircle2, ChevronLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

type Exam = {
  id: string;
  title: string;
  examType: 'WEEKLY' | 'MONTHLY';
  startTime: string;
  endTime: string;
  timeLimitMinutes: number;
  passingScore: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  teacher: { fullName: string };
  _count: { questions: number; submissions: number };
};

export const Exams = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => apiCall<{ exams: Exam[] }>('/exams'),
  });

  const exams = data?.exams ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">الاختبارات</h1>
          <p className="mt-1 text-slate-500">
            {user?.role === 'STUDENT' ? 'الاختبارات المتاحة ونتائجك السابقة' : 'إدارة ومتابعة اختبارات الطلاب'}
          </p>
        </div>
        {user?.role !== 'STUDENT' && (
          <Link
            to="/manage/exams"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
          >
            <Plus className="h-4 w-4" />
            إنشاء اختبار
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-slate-200" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 font-black text-slate-400">لا توجد اختبارات حالياً</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => {
            const now = new Date();
            const start = new Date(exam.startTime);
            const end = new Date(exam.endTime);
            const isActive = now >= start && now <= end && exam.status === 'PUBLISHED';
            const isUpcoming = now < start && exam.status === 'PUBLISHED';

            return (
              <div key={exam.id} className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <span className={`rounded-xl px-3 py-1 text-xs font-black ${exam.examType === 'WEEKLY' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {exam.examType === 'WEEKLY' ? 'أسبوعي' : 'شهري'}
                  </span>
                  {isActive && <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> متاح الآن</span>}
                  {isUpcoming && <span className="text-xs font-bold text-amber-600">قريباً</span>}
                </div>

                <h3 className="mb-2 text-xl font-black text-slate-900">{exam.title}</h3>
                
                {user?.role === 'ADMIN' && (
                  <p className="mb-4 text-xs font-bold text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded-md border border-slate-100">
                    بواسطة: {exam.teacher?.fullName || 'غير معروف'}
                  </p>
                )}
                
                <div className="mb-6 space-y-2 text-sm font-medium text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>المدة: {exam.timeLimitMinutes} دقيقة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span>الأسئلة: {exam._count.questions} أسئلة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    <span>درجة النجاح: {exam.passingScore}٪</span>
                  </div>
                </div>

                {user?.role === 'STUDENT' ? (
                  isActive ? (
                    <Link
                      to={`/exams/${exam.id}/take`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                      بدء الاختبار <ChevronLeft className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      to={`/exams/${exam.id}/results`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3 text-sm font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      عرض النتائج
                    </Link>
                  )
                ) : (
                  <div className="flex gap-2">
                     <Link
                      to={`/exams/${exam.id}/results`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
                    >
                      الإجابات ({exam._count.submissions})
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
