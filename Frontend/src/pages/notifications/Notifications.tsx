import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { Bell, CheckCircle2, Info, Mail, ShieldAlert, Plus, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'ANNOUNCEMENT' | 'PRIVATE' | 'AUTO';
  isRead: boolean;
  createdAt: string;
  sender?: { fullName: string; role: string };
};

const typeConfig = {
  ANNOUNCEMENT: { icon: Bell, color: 'text-amber-600', bg: 'bg-amber-100' },
  PRIVATE: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100' },
  AUTO: { icon: Info, color: 'text-emerald-600', bg: 'bg-emerald-100' },
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

export const Notifications = () => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendForm, setSendForm] = useState({
    title: '',
    message: '',
    type: 'PRIVATE',
    recipientRole: 'STUDENT',
    classId: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiCall<{ notifications: Notification[]; unreadCount: number }>('/notifications'),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiCall<{ classes: any[] }>('/classes'),
    enabled: isSendModalOpen && user?.role !== 'STUDENT',
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiCall(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiCall('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => apiCall('/notifications/send', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      setIsSendModalOpen(false);
      setSendForm({ title: '', message: '', type: 'PRIVATE', recipientRole: 'STUDENT', classId: '' });
      alert('تم إرسال الإشعار بنجاح');
    },
    onError: (err: any) => alert('خطأ: ' + err.message),
  });

  const notifications = data?.notifications ?? [];

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendForm.title || !sendForm.message) return;
    
    const payload: any = {
      title: sendForm.title,
      message: sendForm.message,
      type: user?.role === 'ADMIN' ? sendForm.type : 'PRIVATE',
    };

    if (sendForm.classId) {
      payload.classId = sendForm.classId;
    } else {
      payload.recipientRole = sendForm.recipientRole;
    }

    sendMutation.mutate(payload);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950">الإشعارات</h1>
          <p className="mt-1 text-slate-500">تابع أحدث المستجدات والرسائل</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role !== 'STUDENT' && (
            <button
              onClick={() => setIsSendModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-800 shadow-md shadow-emerald-700/20"
            >
              <Plus className="h-4 w-4" />
              إرسال إشعار
            </button>
          )}
          {data?.unreadCount ? (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
            >
              <CheckCircle2 className="h-4 w-4" />
              تحديد الكل كمقروء
            </button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
          <Bell className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 font-black text-slate-400">لا توجد إشعارات حالياً</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.AUTO;
            const Icon = config.icon;

            return (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && markReadMutation.mutate(notif.id)}
                className={`relative flex gap-4 rounded-2xl border p-4 transition-all ${
                  notif.isRead
                    ? 'border-slate-200 bg-white'
                    : 'cursor-pointer border-emerald-200 bg-emerald-50 hover:bg-emerald-100/50'
                }`}
              >
                {!notif.isRead && (
                  <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald-500" />
                )}
                
                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bg} ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className={`font-black ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                      {notif.title}
                    </h3>
                    <span className="shrink-0 text-xs font-bold text-slate-400">
                      {timeAgo(new Date(notif.createdAt))}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    {notif.message}
                  </p>
                  {notif.sender && (
                    <p className="mt-2 text-xs font-bold text-slate-400">
                      بواسطة: {notif.sender.fullName}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Send Notification Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-black text-slate-900">إرسال إشعار</h2>
              <button onClick={() => setIsSendModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSendSubmit} className="p-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">عنوان الإشعار</label>
                <input
                  type="text"
                  required
                  value={sendForm.title}
                  onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                  placeholder="مثال: تذكير بموعد الجلسة"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">رسالة التعليق / الإشعار</label>
                <textarea
                  required
                  rows={4}
                  value={sendForm.message}
                  onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                  placeholder="اكتب ملاحظاتك، تعليقاتك على الدرس، أو أي تنبيه لطلابك..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">المجموعة المستهدفة</label>
                <select
                  value={sendForm.classId}
                  onChange={(e) => setSendForm({ ...sendForm, classId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-bold outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">جميع الطلاب ({user?.role === 'ADMIN' ? 'الكل' : 'طلابي'})</option>
                  {classesData?.classes?.map(c => (
                    <option key={c.id} value={c.id}>فصل: {c.name}</option>
                  ))}
                </select>
              </div>

              {user?.role === 'ADMIN' && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">نوع الإشعار</label>
                  <select
                    value={sendForm.type}
                    onChange={(e) => setSendForm({ ...sendForm, type: e.target.value as 'ANNOUNCEMENT' | 'PRIVATE' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-bold outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ANNOUNCEMENT">إعلان عام (للجميع)</option>
                    <option value="PRIVATE">رسالة خاصة</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={sendMutation.isPending}
                  className="rounded-xl bg-emerald-700 px-6 py-2.5 font-black text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 disabled:opacity-50"
                >
                  {sendMutation.isPending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
