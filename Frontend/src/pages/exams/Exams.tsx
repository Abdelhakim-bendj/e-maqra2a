import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { GraduationCap, Clock, FileText, CheckCircle2, ChevronLeft, Plus, Settings, Trash2 } from 'lucide-react';
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
  maxScore?: number;
  submissions?: { id: string; totalScore: number | null; status: string }[];
};

export const Exams = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => apiCall<{ exams: Exam[] }>('/exams'),
  });

  const updateExam = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiCall(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setEditingExam(null);
    },
  });

  const deleteExam = useMutation({
    mutationFn: (id: string) => apiCall(`/exams/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exams'] }),
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

      {editingExam && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">تعديل إعدادات الاختبار</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const payload = {
                title: formData.get('title'),
                timeLimitMinutes: parseInt(formData.get('timeLimitMinutes') as string),
                passingScore: parseInt(formData.get('passingScore') as string),
                startTime: formData.get('startTime') ? new Date(formData.get('startTime') as string).toISOString() : undefined,
                endTime: formData.get('endTime') ? new Date(formData.get('endTime') as string).toISOString() : undefined,
              };
              updateExam.mutate({ id: editingExam.id, data: payload });
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">عنوان الاختبار</label>
              <input name="title" defaultValue={editingExam.title} required className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">المدة (دقائق)</label>
              <input type="number" name="timeLimitMinutes" defaultValue={editingExam.timeLimitMinutes} required className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">درجة النجاح (%)</label>
              <input type="number" name="passingScore" defaultValue={editingExam.passingScore} required className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">تاريخ ووقت البدء</label>
              <input type="datetime-local" name="startTime" defaultValue={new Date(editingExam.startTime).toISOString().slice(0, 16)} required className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">تاريخ ووقت الانتهاء</label>
              <input type="datetime-local" name="endTime" defaultValue={new Date(editingExam.endTime).toISOString().slice(0, 16)} required className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setEditingExam(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
              <button type="submit" disabled={updateExam.isPending} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700">{updateExam.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
            </div>
          </form>
        </div>
      )}

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

                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-black text-slate-900">{exam.title}</h3>
                  {user?.role !== 'STUDENT' && (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { setEditingExam(exam); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                        className="text-emerald-500 hover:text-emerald-700 bg-emerald-50 p-1.5 rounded-lg"
                        title="تعديل الإعدادات"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف هذا الاختبار؟ (سيتم حذف جميع الإجابات المرتبطة به)')) {
                            deleteExam.mutate(exam.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-lg"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                
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
                  {exam.submissions && exam.submissions.length > 0 && exam.submissions[0].totalScore !== null && exam.maxScore ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-600 font-bold">
                        نسبة النجاح المحققة: {Math.round((exam.submissions[0].totalScore / exam.maxScore) * 100)}٪
                      </span>
                    </div>
                  ) : null}
                </div>

                {user?.role === 'STUDENT' ? (
                  exam.submissions && exam.submissions.length > 0 ? (
                    <div className="space-y-2 mt-4">
                      <div className="flex w-full items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 border border-emerald-100 text-sm font-black text-emerald-800">
                        <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> مكتمل</span>
                        <span>{exam.submissions[0].totalScore !== null ? `النتيجة: ${exam.submissions[0].totalScore}/${exam.maxScore || 10}` : 'تم التسليم'}</span>
                      </div>
                      <Link
                        to={`/exams/${exam.id}/results`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3 text-sm font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        عرض الإجابات
                      </Link>
                    </div>
                  ) : isActive ? (
                    <Link
                      to={`/exams/${exam.id}/take`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white transition hover:bg-emerald-700 mt-4"
                    >
                      بدء الاختبار <ChevronLeft className="h-4 w-4" />
                    </Link>
                  ) : (
                    <div className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3 text-sm font-black text-slate-400 bg-slate-50 mt-4">
                      الاختبار غير متاح حالياً
                    </div>
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
