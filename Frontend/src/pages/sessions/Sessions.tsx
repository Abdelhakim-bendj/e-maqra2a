import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Video, Plus, Calendar, Clock, Users, ExternalLink } from 'lucide-react';
import { ClockTimePicker } from '../../components/ui/ClockTimePicker';

interface Session {
  id: string;
  title: string;
  description?: string;
  sessionType: 'MEMORIZATION' | 'TAJWEED' | 'EDUCATIONAL';
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants: number;
  meetingUrl?: string;
  teacher: { id: string; fullName: string };
  _count: { attendances: number };
}

const ClockTimePickerWrapper = () => {
  const [time, setTime] = useState('10:00');
  return (
    <>
      <input type="hidden" name="scheduledTime" value={time} />
      <ClockTimePicker value={time} onChange={setTime} />
    </>
  );
};

export const Sessions = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => apiCall<{ sessions: Session[] }>('/sessions').then(res => res.sessions),
  });

  const createSession = useMutation({
    mutationFn: (data: any) => apiCall('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setShowForm(false);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      apiCall(`/sessions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  if (isLoading) {
    return <div className="p-8 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700 mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Video className="h-6 w-6 text-emerald-600" />
          الجلسات الحية
        </h1>
        {user?.role !== 'STUDENT' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            جلسة جديدة
          </button>
        )}
      </div>

      {showForm && user?.role !== 'STUDENT' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">جدولة جلسة جديدة</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createSession.mutate({
                title: formData.get('title'),
                description: formData.get('description'),
                sessionType: formData.get('sessionType'),
                scheduledAt: new Date(`${formData.get('scheduledDate')}T${formData.get('scheduledTime')}`).toISOString(),
                durationMinutes: parseInt(formData.get('durationMinutes') as string),
                maxParticipants: parseInt(formData.get('maxParticipants') as string),
                meetingUrl: formData.get('meetingUrl') || undefined,
              });
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">عنوان الجلسة</label>
              <input name="title" required className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">نوع الجلسة</label>
              <select name="sessionType" required className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                <option value="MEMORIZATION">تسميع</option>
                <option value="TAJWEED">تجويد</option>
                <option value="EDUCATIONAL">درس تربوي</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">تاريخ ووقت البدء</label>
              <div className="flex gap-2 relative">
                <input type="date" name="scheduledDate" required className="w-1/2 rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                <div className="w-1/2">
                  <ClockTimePickerWrapper />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">المدة (بالدقائق)</label>
              <input type="number" name="durationMinutes" min="15" max="180" defaultValue="45" required className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">الحد الأقصى للمشاركين</label>
              <input type="number" name="maxParticipants" min="2" max="100" defaultValue="20" required className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">رابط الاجتماع (اختياري)</label>
              <input type="url" name="meetingUrl" placeholder="https://meet.google.com/..." className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">الوصف</label>
              <textarea name="description" rows={2} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
              <button type="submit" disabled={createSession.isPending} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700">{createSession.isPending ? 'جاري الحفظ...' : 'حفظ الجلسة'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions?.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
            لا توجد جلسات حية مجدولة حالياً
          </div>
        )}
        
        {sessions?.map((session) => (
          <div key={session.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full w-max ${
                  session.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                  session.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' : 
                  'bg-amber-100 text-amber-700'
                }`}>
                  {session.status === 'ACTIVE' ? 'جارية الآن' : session.status === 'COMPLETED' ? 'مكتملة' : 'مجدولة'}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">{session.title}</h3>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                {session.sessionType === 'MEMORIZATION' ? 'تسميع' : session.sessionType === 'TAJWEED' ? 'تجويد' : 'درس'}
              </span>
            </div>
            
            <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">{session.description || 'لا يوجد وصف'}</p>
            
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span dir="ltr">{(() => {
                  const d = new Date(session.scheduledAt);
                  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} - ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                })()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{session.durationMinutes} دقيقة</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4 text-slate-400" />
                <span>المشاركين: {session._count.attendances} / {session.maxParticipants}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">المعلم: {session.teacher.fullName}</span>
              
              <div className="flex gap-2">
                {session.status === 'ACTIVE' && session.meetingUrl && (
                  <a href={session.meetingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition">
                    <ExternalLink className="h-3.5 w-3.5" /> انضمام
                  </a>
                )}
                
                {user?.role !== 'STUDENT' && session.status === 'SCHEDULED' && (
                  <button onClick={() => updateStatus.mutate({ id: session.id, status: 'ACTIVE' })} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-200 transition">
                    بدء
                  </button>
                )}
                
                {user?.role !== 'STUDENT' && session.status === 'ACTIVE' && (
                  <button onClick={() => updateStatus.mutate({ id: session.id, status: 'COMPLETED' })} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 transition">
                    إنهاء
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
