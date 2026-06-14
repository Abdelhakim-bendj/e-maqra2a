import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../services/api';
import { Plus, Trash2, Save, GripVertical, CheckCircle2 } from 'lucide-react';
import { ClockTimePicker } from '../../components/ui/ClockTimePicker';

type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';

type Question = {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  points: number;
};

export const ManageExams = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('اختبار بدون عنوان');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [passingScore, setPassingScore] = useState(60);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      questionText: '',
      questionType: 'MULTIPLE_CHOICE',
      options: ['الخيار 1'],
      correctAnswer: '',
      points: 1,
    },
  ]);
  const [activeQuestionId, setActiveQuestionId] = useState<string>(questions[0].id);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiCall('/exams', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      navigate('/exams');
    },
  });

  const addQuestion = () => {
    const newId = crypto.randomUUID();
    setQuestions([...questions, {
      id: newId,
      questionText: '',
      questionType: 'MULTIPLE_CHOICE',
      options: ['الخيار 1'],
      correctAnswer: '',
      points: 1,
    }]);
    setActiveQuestionId(newId);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    if (questions.length === 1) return;
    const newQuestions = questions.filter(q => q.id !== id);
    setQuestions(newQuestions);
    if (activeQuestionId === id) {
      setActiveQuestionId(newQuestions[newQuestions.length - 1].id);
    }
  };

  const handleSave = () => {
    try {
      if (!startTime || !endTime) {
        alert('يرجى تحديد وقت البداية والنهاية للاختبار');
        return;
      }

      let hasError = false;
      const mappedQuestions = questions.map((q, i) => {
        if (!q.questionText || q.questionText.trim().length < 5) {
          alert(`السؤال رقم ${i + 1} يجب أن يكون 5 أحرف على الأقل`);
          hasError = true;
        }
        if (!q.correctAnswer) {
          alert(`يرجى تحديد الإجابة الصحيحة للسؤال رقم ${i + 1}`);
          hasError = true;
        }

        return {
          questionText: q.questionText,
          questionType: q.questionType,
          points: q.points,
          options: q.questionType === 'MULTIPLE_CHOICE' ? q.options : undefined,
          correctAnswer: q.correctAnswer,
          orderIndex: i,
        };
      });

      if (hasError) return;

      const payload = {
        title,
        description,
        examType,
        timeLimitMinutes,
        passingScore,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        questions: mappedQuestions,
      };

      createMutation.mutate(payload);
    } catch (e) {
      alert('الرجاء التأكد من صحة التواريخ المدخلة');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      {/* Exam Header */}
      <div className="rounded-3xl border-t-8 border-t-emerald-600 bg-white p-8 shadow-sm">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-none bg-transparent text-4xl font-black text-slate-900 outline-none placeholder:text-slate-300 focus:border-b-2 focus:border-emerald-600 focus:pb-2 transition-all"
          placeholder="عنوان الاختبار"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="وصف الاختبار (اختياري)"
          className="mt-4 w-full resize-none border-none bg-transparent text-slate-600 outline-none placeholder:text-slate-400 focus:border-b-2 focus:border-slate-300 focus:pb-1"
          rows={2}
        />
        
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">نوع الاختبار</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="WEEKLY">أسبوعي</option>
              <option value="MONTHLY">شهري</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">المدة (دقائق)</label>
            <input
              type="number"
              min={1}
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 30)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">تاريخ ووقت البدء</label>
            <div className="flex gap-2 relative">
              <input
                type="date"
                value={startTime.split('T')[0] || ''}
                onChange={(e) => setStartTime(`${e.target.value}T${startTime.split('T')[1] || '00:00'}`)}
                className="w-1/2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <div className="w-1/2">
                <ClockTimePicker
                  value={startTime.split('T')[1]?.slice(0, 5) || ''}
                  onChange={(time) => setStartTime(`${startTime.split('T')[0] || new Date().toISOString().split('T')[0]}T${time}`)}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">تاريخ ووقت الانتهاء</label>
            <div className="flex gap-2 relative">
              <input
                type="date"
                value={endTime.split('T')[0] || ''}
                onChange={(e) => setEndTime(`${e.target.value}T${endTime.split('T')[1] || '00:00'}`)}
                className="w-1/2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <div className="w-1/2">
                <ClockTimePicker
                  value={endTime.split('T')[1]?.slice(0, 5) || ''}
                  onChange={(time) => setEndTime(`${endTime.split('T')[0] || new Date().toISOString().split('T')[0]}T${time}`)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4 relative">
        {questions.map((q, index) => {
          const isActive = activeQuestionId === q.id;

          return (
            <div
              key={q.id}
              onClick={() => setActiveQuestionId(q.id)}
              className={`relative flex rounded-3xl border bg-white transition-all duration-200 ${
                isActive ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20' : 'border-slate-200 shadow-sm hover:border-emerald-300'
              }`}
            >
              <div className="flex w-10 cursor-move items-center justify-center border-l border-slate-100 bg-slate-50 rounded-r-3xl">
                <GripVertical className="h-5 w-5 text-slate-400" />
              </div>
              
              <div className="flex-1 p-6">
                {isActive ? (
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => updateQuestion(q.id, { questionText: e.target.value })}
                        placeholder={`السؤال ${index + 1}`}
                        className="flex-1 rounded-xl bg-slate-50 px-4 py-3 font-medium outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <select
                        value={q.questionType}
                        onChange={(e) => updateQuestion(q.id, { questionType: e.target.value as QuestionType })}
                        className="w-48 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700 outline-none"
                      >
                        <option value="MULTIPLE_CHOICE">خيارات متعددة</option>
                        <option value="TRUE_FALSE">صح أو خطأ</option>
                        <option value="SHORT_ANSWER">إجابة قصيرة</option>
                      </select>
                    </div>

                    {q.questionType === 'MULTIPLE_CHOICE' && (
                      <div className="space-y-3 pl-4 border-r-2 border-slate-100">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuestion(q.id, { correctAnswer: opt })}
                              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                                q.correctAnswer === opt ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'
                              }`}
                            >
                              {q.correctAnswer === opt && <CheckCircle2 className="h-4 w-4" />}
                            </button>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...q.options];
                                newOptions[oIndex] = e.target.value;
                                updateQuestion(q.id, { options: newOptions });
                                if (q.correctAnswer === opt) {
                                  updateQuestion(q.id, { correctAnswer: e.target.value });
                                }
                              }}
                              className="flex-1 border-b border-transparent bg-transparent py-1 font-medium outline-none hover:border-slate-300 focus:border-emerald-500"
                              placeholder={`الخيار ${oIndex + 1}`}
                            />
                            <button
                              onClick={() => {
                                const newOptions = q.options.filter((_, i) => i !== oIndex);
                                updateQuestion(q.id, { options: newOptions });
                              }}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => updateQuestion(q.id, { options: [...q.options, `الخيار ${q.options.length + 1}`] })}
                          className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          + إضافة خيار
                        </button>
                      </div>
                    )}

                    {q.questionType === 'TRUE_FALSE' && (
                      <div className="space-y-3 pl-4 border-r-2 border-slate-100">
                        {['صح', 'خطأ'].map((opt) => (
                          <div key={opt} className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuestion(q.id, { correctAnswer: opt })}
                              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                                q.correctAnswer === opt ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'
                              }`}
                            >
                              {q.correctAnswer === opt && <CheckCircle2 className="h-4 w-4" />}
                            </button>
                            <span className="font-medium">{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.questionType === 'SHORT_ANSWER' && (
                      <div className="pl-4 border-r-2 border-slate-100 space-y-3">
                        <p className="text-sm text-slate-400 italic">سيقوم الطالب بكتابة الإجابة هنا</p>
                        <div>
                          <label className="text-xs font-bold text-emerald-600 block mb-2">نموذج الإجابة الصحيحة (للتصحيح التلقائي / المرجعي)</label>
                          <input
                            type="text"
                            value={q.correctAnswer}
                            onChange={(e) => updateQuestion(q.id, { correctAnswer: e.target.value })}
                            className="w-full border-b-2 border-slate-200 bg-slate-50 py-2 px-3 font-medium outline-none focus:border-emerald-500 rounded-t-lg"
                            placeholder="اكتب الإجابة النموذجية..."
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-600">النقاط:</span>
                        <input
                          type="number"
                          min={1}
                          value={q.points}
                          onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })}
                          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        onClick={() => removeQuestion(q.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cursor-pointer">
                    <p className="font-bold text-slate-800 text-lg">{q.questionText || 'سؤال بدون عنوان'}</p>
                    <div className="mt-2 text-sm font-medium text-slate-500 flex gap-4">
                      <span>النوع: {q.questionType === 'MULTIPLE_CHOICE' ? 'خيارات' : q.questionType === 'TRUE_FALSE' ? 'صح/خطأ' : 'نصي'}</span>
                      <span>النقاط: {q.points}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Floating Action Menu (Google Docs style) */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-full bg-white px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 z-50">
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 transition"
            title="إضافة سؤال"
          >
            <Plus className="h-5 w-5" />
            سؤال جديد
          </button>
          
          <div className="w-px h-8 bg-slate-200 mx-2"></div>
          
          <button
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 hover:-translate-y-0.5 transition disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Save className="h-5 w-5" />
            {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ ونشر الاختبار'}
          </button>
        </div>
      </div>
    </div>
  );
};
