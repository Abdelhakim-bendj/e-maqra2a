import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { BookOpen, Mic, Square, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

export const SubmitTask = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const timerRef = useRef<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => apiCall<{ task: any }>(`/tasks/${id}`),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { taskId: string; audioUrl: string }) =>
      apiCall('/submissions', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/tasks');
    },
    onError: (err: any) => setError(err.message),
  });

  const task = data?.task;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioUrl(reader.result as string);
        };
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

  const handleSubmit = () => {
    if (!audioUrl || !id) return;
    submitMutation.mutate({ taskId: id, audioUrl });
  };

  if (isLoading) return <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />;
  if (!task) return <div className="p-8 text-center text-slate-500 font-bold">المهمة غير موجودة</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">تسليم التسميع</h1>
        <p className="mt-1 text-slate-500">قم بتسجيل تسميعك وإرساله للمعلم</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Task Details */}
        <div className="mb-8 rounded-2xl bg-emerald-50 p-6 text-emerald-900">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-6 w-6 text-emerald-700" />
            <h2 className="text-xl font-black">
              سورة {task.surahNumber}
            </h2>
          </div>
          <p className="text-sm font-bold text-emerald-700">الآيات: {task.ayahStart} - {task.ayahEnd}</p>
          {task.notes && <p className="mt-3 text-sm">{task.notes}</p>}
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Recording Area */}
        <div className="flex flex-col items-center justify-center space-y-6 py-8">
          <div className={`relative flex h-32 w-32 items-center justify-center rounded-full transition-all duration-500 ${isRecording ? 'bg-red-50 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'bg-slate-50'}`}>
            {isRecording && (
              <div className="absolute inset-0 animate-ping rounded-full border-2 border-red-400 opacity-20"></div>
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {isRecording ? <Square className="h-8 w-8 fill-current" /> : <Mic className="h-10 w-10" />}
            </button>
          </div>

          <div className="text-center">
            {isRecording ? (
              <p className="text-2xl font-black text-red-500 font-mono tracking-wider">{formatTime(recordingTime)}</p>
            ) : audioUrl ? (
              <div className="space-y-4">
                <p className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  تم تجهيز الملف الصوتي بنجاح (جاهز للإرسال)
                </p>
                <audio src={audioUrl} controls className="mx-auto" />
                <button
                  onClick={() => setAudioUrl('')}
                  className="text-xs font-bold text-red-500 hover:text-red-600 underline"
                >
                  إلغاء وإعادة التسجيل / الرفع
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm font-bold text-slate-500">اضغط للبدء في تسجيل تسميعك</p>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400">أو</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
                <div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100">
                    <UploadCloud className="h-5 w-5" />
                    <span>رفع ملف صوتي (MP3, WAV...)</span>
                    <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!audioUrl || submitMutation.isPending}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          <UploadCloud className="h-5 w-5" />
          {submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال التسميع'}
        </button>
      </div>
    </div>
  );
};
