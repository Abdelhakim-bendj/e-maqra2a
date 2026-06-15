import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { Clock, CheckCircle2, ChevronRight, Save } from 'lucide-react';

type Question = {
  id: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  questionText: string;
  options?: string[];
  points: number;
};

export const TakeExam = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // 1. Fetch exam metadata
  const { data: examData, isLoading: examLoading, error: examError } = useQuery({
    queryKey: ['exam', id],
    queryFn: () => apiCall<{ exam: any }>(`/exams/${id}`),
    enabled: !!id,
    retry: false,
  });

  // 2. Start exam mutation
  const startMutation = useMutation({
    mutationFn: () => apiCall<{ submission: any, questions: Question[] }>(`/exams/${id}/start`, { method: 'POST' }),
    onSuccess: (data) => {
      // Initialize timer if not already set
      if (examData?.exam?.timeLimitMinutes && timeLeft === null) {
        setTimeLeft(examData.exam.timeLimitMinutes * 60);
      }
    },
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { answers: { questionId: string; studentAnswer: string }[] }) =>
      apiCall(`/exams/${id}/submit`, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      navigate('/exams');
    },
  });

  // Auto-start exam when exam metadata loads
  useEffect(() => {
    if (examData?.exam && !startMutation.data && !startMutation.isPending && !startMutation.isError) {
      startMutation.mutate();
    }
  }, [examData, startMutation]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = () => {
    const formattedAnswers = Object.keys(answers).map(qId => ({
      questionId: qId,
      studentAnswer: answers[qId],
    }));
    submitMutation.mutate({ answers: formattedAnswers });
  };

  if (examLoading || startMutation.isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
      </div>
    );
  }

  if (examError || startMutation.isError) {
    return (
      <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-10 text-center">
        <h2 className="text-xl font-black text-red-700 mb-2">لا يمكن بدء الاختبار</h2>
        <p className="text-red-600 font-bold">{(examError as any)?.message || (startMutation.error as any)?.message || 'تأكد من أن الاختبار متاح في هذا الوقت'}</p>
        <button onClick={() => navigate('/exams')} className="mt-6 rounded-xl bg-red-600 px-6 py-2 font-bold text-white hover:bg-red-700">العودة</button>
      </div>
    );
  }

  const questions = startMutation.data?.questions || [];
  const exam = examData?.exam;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-24">
      {/* Header */}
      <div className="sticky top-4 z-10 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{exam?.title}</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">
            الإجابة على {Object.keys(answers).length} من {questions.length} سؤال
          </p>
        </div>
        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2 font-black font-mono text-lg ${
              timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-700'
            }`}>
              <Clock className="h-5 w-5" />
              {formatTime(timeLeft)}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitMutation.isPending ? 'جاري التسليم...' : 'إنهاء وتسليم'}
            <Save className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q: Question, idx: number) => (
          <div key={q.id} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <h3 className="text-xl font-bold text-slate-900 leading-relaxed">
                <span className="text-emerald-600 ml-2">{idx + 1}.</span>
                {q.questionText}
              </h3>
              <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500">
                {q.points} نقاط
              </span>
            </div>

            <div className="space-y-3">
              {q.questionType === 'MULTIPLE_CHOICE' && q.options?.map((opt, oIdx) => (
                <label key={oIdx} className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all hover:bg-slate-50 ${
                  answers[q.id] === opt ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'
                }`}>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    answers[q.id] === opt ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                  }`}>
                    {answers[q.id] === opt && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </div>
                  <span className="font-medium text-slate-700">{opt}</span>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt}
                    className="hidden"
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                </label>
              ))}

              {q.questionType === 'TRUE_FALSE' && ['صح', 'خطأ'].map((opt, oIdx) => (
                <label key={oIdx} className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all hover:bg-slate-50 ${
                  answers[q.id] === opt ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'
                }`}>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    answers[q.id] === opt ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                  }`}>
                    {answers[q.id] === opt && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </div>
                  <span className="font-medium text-slate-700">{opt}</span>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt}
                    className="hidden"
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                </label>
              ))}

              {q.questionType === 'SHORT_ANSWER' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="اكتب إجابتك هنا..."
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-4 font-medium outline-none transition focus:border-emerald-500 focus:bg-white min-h-[120px] resize-y"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
