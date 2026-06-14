import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  BookOpen, CheckCircle2, Clock, AlertTriangle, ChevronLeft, Plus, Mic,
} from 'lucide-react';

type Task = {
  id: string;
  taskType: 'NEW' | 'REVISION';
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  dueDate: string;
  status: 'ASSIGNED' | 'COMPLETED' | 'OVERDUE';
  notes?: string;
  teacher: { fullName: string };
  student: { fullName: string };
  submissions: { id: string; status: string }[];
};

const taskTypeLabel = { NEW: 'حفظ جديد', REVISION: 'مراجعة' };
const statusConfig = {
  ASSIGNED: { label: 'قيد التنفيذ', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  COMPLETED: { label: 'مكتملة', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  OVERDUE: { label: 'متأخرة', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
};

export const Tasks = () => {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<string>('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => apiCall<{ tasks: Task[] }>(`/tasks${filter ? `?status=${filter}` : ''}`),
  });

  const completeMutation = useMutation({
    mutationFn: (taskId: string) =>
      apiCall(`/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'COMPLETED' }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const tasks = data?.tasks ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">المهام اليومية</h1>
          <p className="mt-1 text-slate-500">تابع مهام الحفظ والمراجعة اليومية</p>
        </div>
        {user?.role === 'TEACHER' && (
          <Link
            to="/manage/tasks"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
          >
            <Plus className="h-4 w-4" />
            إنشاء مهمة
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'الكل' },
          { value: 'ASSIGNED', label: 'جارية' },
          { value: 'COMPLETED', label: 'مكتملة' },
          { value: 'OVERDUE', label: 'متأخرة' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
              filter === tab.value
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-slate-200" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 font-black text-slate-400">لا توجد مهام</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => {
            const cfg = statusConfig[task.status];
            const Icon = cfg.icon;
            const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

            return (
              <div
                key={task.id}
                className={`group relative rounded-3xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                  isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
                }`}
              >
                {/* Task type badge */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    {taskTypeLabel[task.taskType]}
                  </span>
                  <span className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-bold ${cfg.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </span>
                </div>

                {/* Surah info */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-slate-400 mb-1">السورة والآيات</p>
                  <h3 className="text-xl font-black text-slate-950">
                    سورة {task.surahNumber}
                  </h3>
                  <p className="text-slate-600 font-bold">
                    الآيات {task.ayahStart} – {task.ayahEnd}
                  </p>
                </div>

                {/* Due date */}
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span>موعد التسليم: {
                    (() => {
                      const d = new Date(task.dueDate);
                      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                    })()
                  }</span>
                </div>

                {task.notes && (
                  <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 font-medium">
                    {task.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {user?.role === 'STUDENT' && task.status === 'ASSIGNED' && (
                    <>
                      <button
                        onClick={() => completeMutation.mutate(task.id)}
                        disabled={completeMutation.isPending}
                        className="flex-1 rounded-xl bg-emerald-700 py-2 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
                      >
                        {completeMutation.isPending ? '...' : 'إتمام'}
                      </button>
                      <Link
                        to={`/tasks/${task.id}/submit`}
                        className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Link>
                    </>
                  )}
                  {user?.role !== 'STUDENT' && (
                    <span className="text-sm text-slate-500 font-bold">{task.student.fullName}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
