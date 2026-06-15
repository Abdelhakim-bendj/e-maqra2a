import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { CheckCircle2, XCircle, ChevronRight, Award } from 'lucide-react';

type Answer = {
  id: string;
  studentAnswer: string;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  question: {
    questionText: string;
    points: number;
    questionType: string;
  };
};

type Submission = {
  id: string;
  student: { fullName: string; id: string };
  totalScore: number | null;
  submittedAt: string;
  answers: Answer[];
};

export const ExamResults = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['exam-results', id],
    queryFn: () => apiCall<{ submissions: Submission[] }>(`/exams/${id}/results`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
      </div>
    );
  }

  const submissions = data?.submissions || [];

  if (submissions.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
        <Award className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-4 font-black text-slate-400">لا توجد نتائج لعرضها حالياً</p>
        <Link to="/exams" className="mt-4 inline-block text-emerald-600 font-bold hover:underline">العودة للاختبارات</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-950">نتائج الاختبار</h1>
        <Link to="/exams" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold">
          العودة
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-8">
        {submissions.map((sub) => (
          <div key={sub.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">{sub.student.fullName}</h2>
                <p className="text-sm font-bold text-slate-500 mt-1">
                  تاريخ التسليم: {new Date(sub.submittedAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-center">
                <span className="block text-xs font-bold text-slate-500 mb-1">النتيجة</span>
                <span className="text-3xl font-black text-emerald-600">{sub.totalScore ?? '?'}</span>
                <span className="text-lg font-bold text-slate-400"> / {sub.answers.reduce((acc, a) => acc + a.question.points, 0)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-slate-700">تفاصيل الإجابات:</h3>
              {sub.answers.map((answer, index) => (
                <div key={answer.id} className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-bold text-slate-900 leading-relaxed">
                      <span className="text-emerald-600 ml-1">{index + 1}.</span>
                      {answer.question.questionText}
                    </p>
                    <span className="shrink-0 text-xs font-bold bg-white px-2 py-1 rounded-lg border border-slate-200">
                      {answer.question.points} نقاط
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2 bg-white p-3 rounded-xl border border-slate-100">
                    {answer.isCorrect === true ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : answer.isCorrect === false ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <span className="h-5 w-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">؟</span>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">
                        <span className="font-bold text-slate-400 ml-2">إجابة الطالب:</span>
                        {answer.studentAnswer}
                      </p>
                    </div>
                    {answer.pointsAwarded !== null && (
                      <span className={`font-black ${answer.pointsAwarded > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        +{answer.pointsAwarded}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
