import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Mic, PlayCircle, UserRound, CheckCircle, Star, Plus, Square, UploadCloud, AlertCircle } from 'lucide-react';
import { useRef } from 'react';

type Submission = {
  id: string;
  status: 'PENDING' | 'REVIEWED' | 'REVISION_NEEDED';
  audioUrl: string;
  submittedAt: string;
  student: { fullName: string };
  task: { surahNumber: number; ayahStart: number; ayahEnd: number; taskType: string };
  assessment: any;
};
const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' سنوات';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' أشهر';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' أيام';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' ساعات';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' دقائق';
  return 'الآن';
};

export const Submissions = () => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [scores, setScores] = useState({ memorization: 10, tajweed: 10, fluency: 10, feedback: '' });
  
  // New Submission Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [studentNotes, setStudentNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => apiCall<{ submissions: Submission[] }>(`/submissions${user?.role === 'TEACHER' ? '?status=PENDING' : ''}`),
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'ASSIGNED'],
    queryFn: () => apiCall<{ tasks: any[] }>('/tasks?status=ASSIGNED'),
    enabled: user?.role === 'STUDENT' && isNewModalOpen,
  });

  const assessMutation = useMutation({
    mutationFn: (payload: any) => apiCall('/submissions/assess', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      setSelectedSub(null);
    },
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { audioUrl: string; notes?: string }) =>
      apiCall('/submissions', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      setIsNewModalOpen(false);
      setAudioUrl('');
      setStudentNotes('');
    },
    onError: (err: any) => setError(err.message),
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => setAudioUrl(reader.result as string);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('تعذر الوصول إلى الميكروفون. يرجى التأكد من منح الصلاحيات.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('يرجى رفع ملف صوتي فقط (مثل MP3, WAV)');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setAudioUrl(reader.result as string);
    reader.onerror = () => setError('حدث خطأ أثناء قراءة الملف');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const subs = data?.submissions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">
            {user?.role === 'STUDENT' ? 'سجل التسميعات' : 'تقييم التسميعات'}
          </h1>
          <p className="mt-1 text-slate-500">
            {user?.role === 'STUDENT' ? 'متابعة تسميعاتك السابقة وتقييمات المعلم' : 'مراجعة التسجيلات الصوتية وتقييم الطلاب'}
          </p>
        </div>
        {user?.role === 'STUDENT' && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-lg transition hover:bg-emerald-700 hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            تسليم تسميع جديد
          </button>
        )}
      </div>

      {isNewModalOpen && user?.role === 'STUDENT' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-emerald-600 px-6 py-6 text-white relative">
              <h2 className="text-xl font-black">إرسال تسميع جديد</h2>
              <p className="text-emerald-100 text-sm mt-1">قم باختيار المهمة وتسجيل صوتك أو رفع ملف جاهز</p>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="absolute top-6 left-6 text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">ملاحظات (اختياري)</label>
                <textarea
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="أضف أي ملاحظات لمعلمك هنا (مثال: أسمع سورة الفاتحة)..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 resize-none h-24"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 p-6 text-center">
                {isRecording ? (
                  <div className="space-y-6">
                    <p className="text-3xl font-black text-red-500 font-mono tracking-wider animate-pulse">{formatTime(recordingTime)}</p>
                    <button
                      onClick={stopRecording}
                      className="mx-auto flex items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-red-600 hover:-translate-y-0.5"
                    >
                      <Square className="h-5 w-5 fill-current" />
                      إيقاف التسجيل
                    </button>
                  </div>
                ) : audioUrl ? (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      تم تجهيز الملف الصوتي
                    </p>
                    <audio src={audioUrl} controls className="mx-auto w-full max-w-[250px]" />
                    <button
                      onClick={() => setAudioUrl('')}
                      className="text-xs font-bold text-red-500 hover:text-red-600 underline"
                    >
                      إلغاء التسجيل / الرفع
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <button
                      onClick={startRecording}
                      className="mx-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 font-bold text-white shadow-lg transition hover:bg-emerald-700 hover:-translate-y-0.5"
                    >
                      <Mic className="h-6 w-6" />
                      ابدأ التسجيل الصوتي
                    </button>
                    
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400">أو</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>
                    
                    <label className="inline-flex cursor-pointer w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100">
                      <UploadCloud className="h-5 w-5" />
                      <span>رفع ملف صوتي (MP3, WAV)</span>
                      <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              <button
                onClick={() => submitMutation.mutate({ audioUrl, notes: studentNotes })}
                disabled={!audioUrl || submitMutation.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال التسميع للمعلم'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
      ) : subs.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
          <p className="mt-4 font-black text-slate-500">
            {user?.role === 'STUDENT' ? 'لم تقم بتسليم أي تسميع بعد' : 'لا توجد تسميعات بانتظار التقييم'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* List */}
          <div className="space-y-3">
            {subs.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSub(sub)}
                className={`w-full flex items-center justify-between rounded-2xl border p-4 text-right transition ${
                  selectedSub?.id === sub.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{sub.student.fullName}</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {sub.task?.notes === 'تسميع حر - غير مرتبط بمهمة' ? 'تسميع حر' : `سورة ${sub.task.surahNumber} (${sub.task.ayahStart}-${sub.task.ayahEnd})`}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="block text-xs text-slate-400 font-bold mb-1">
                    {timeAgo(new Date(sub.submittedAt))}
                  </span>
                  {user?.role === 'STUDENT' && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      sub.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                      sub.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sub.status === 'PENDING' ? 'قيد المراجعة' : sub.status === 'REVIEWED' ? 'تم التقييم' : 'يحتاج مراجعة'}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Assessment Panel */}
          {selectedSub && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <UserRound className="h-8 w-8 text-slate-300" />
                <div>
                  <h3 className="font-black text-lg">{selectedSub.student.fullName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-emerald-600">
                      {selectedSub.task?.notes === 'تسميع حر - غير مرتبط بمهمة' ? 'تسميع حر' : `سورة ${selectedSub.task?.surahNumber}`}
                    </span>
                  </div>
                </div>
              </div>

              {(selectedSub.teacherNotes || (selectedSub.task?.notes && selectedSub.task.notes !== 'تسميع حر - غير مرتبط بمهمة')) && (
                <div className="mb-6 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm font-bold text-slate-700">
                  <span className="text-emerald-600 block mb-1">ملاحظات الطالب:</span>
                  {selectedSub.teacherNotes || selectedSub.task.notes}
                </div>
              )}

              <div className="mb-8 rounded-2xl bg-slate-900 p-6 text-center text-white">
                {selectedSub.audioUrl?.startsWith('data:') ? (
                  <audio src={selectedSub.audioUrl} controls className="mx-auto w-full" />
                ) : (
                  <>
                    <PlayCircle className="mx-auto h-12 w-12 opacity-80 cursor-pointer hover:opacity-100 hover:text-emerald-400 transition" />
                    <p className="mt-2 text-xs font-bold text-slate-400">ملف الصوت غير متوفر أو بتنسيق قديم</p>
                  </>
                )}
              </div>

              {user?.role === 'TEACHER' ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  assessMutation.mutate({
                    submissionId: selectedSub.id,
                    memorizationScore: scores.memorization,
                    tajweedScore: scores.tajweed,
                    fluencyScore: scores.fluency,
                    feedback: scores.feedback
                  });
                }} className="space-y-4">
                  {['memorization', 'tajweed', 'fluency'].map((criterion) => (
                    <div key={criterion} className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-700">
                        {criterion === 'memorization' ? 'الحفظ' : criterion === 'tajweed' ? 'التجويد' : 'الطلاقة'}
                      </label>
                      <input
                        type="number" min="1" max="10" required
                        value={scores[criterion as keyof typeof scores] as number}
                        onChange={(e) => setScores({ ...scores, [criterion]: parseInt(e.target.value) || 0 })}
                        className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center font-bold outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                  
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">ملاحظات توجيهية</label>
                    <textarea
                      value={scores.feedback} onChange={(e) => setScores({ ...scores, feedback: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500 resize-none h-24"
                      placeholder="ملاحظات حول الأخطاء ومواضع التحسين..."
                    />
                  </div>

                  <button
                    type="submit" disabled={assessMutation.isPending}
                    className="w-full rounded-xl bg-emerald-600 py-3 font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {assessMutation.isPending ? 'جاري الحفظ...' : 'اعتماد التقييم'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {selectedSub.status === 'PENDING' ? (
                    <div className="rounded-xl bg-amber-50 p-6 text-center text-amber-700 border border-amber-200">
                      <p className="font-bold">التسميع قيد المراجعة من قبل المعلم</p>
                      <p className="text-sm mt-2 opacity-80">ستتلقى إشعاراً فور اعتماد التقييم</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <Star className="h-8 w-8 text-amber-400 fill-amber-400" />
                        <span className="text-4xl font-black text-slate-900">{selectedSub.assessment?.overallScore || '-'}</span>
                        <span className="text-xl text-slate-400 font-bold">/10</span>
                      </div>
                      
                      {['memorization', 'tajweed', 'fluency'].map((criterion) => (
                        <div key={criterion} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <label className="text-sm font-bold text-slate-700">
                            {criterion === 'memorization' ? 'الحفظ' : criterion === 'tajweed' ? 'التجويد' : 'الطلاقة'}
                          </label>
                          <span className="font-black text-emerald-600">
                            {selectedSub.assessment?.[`${criterion}Score` as keyof typeof selectedSub.assessment] || '-'} / 10
                          </span>
                        </div>
                      ))}

                      {selectedSub.assessment?.feedback && (
                        <div className="mt-6">
                          <label className="mb-2 block text-sm font-bold text-slate-700">ملاحظات المعلم</label>
                          <div className="rounded-xl bg-blue-50 text-blue-900 p-4 text-sm font-medium border border-blue-100">
                            {selectedSub.assessment.feedback}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
