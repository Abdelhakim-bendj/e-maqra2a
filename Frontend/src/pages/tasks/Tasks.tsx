import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  BookOpen, CheckCircle2, Clock, AlertTriangle, ChevronLeft, Plus, Mic,
} from 'lucide-react';
import { quranSurahs } from './ManageTasks';

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

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => apiCall(`/tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const tasks = data?.tasks ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">المهام اليومية</h1>
          <p className="mt-1.5 text-muted-foreground font-medium">تابع مهام الحفظ والمراجعة اليومية وانطلق نحو القمة</p>
        </div>
        {user?.role === 'TEACHER' && (
          <Link
            to="/manage/tasks"
            className="inline-flex items-center gap-3 rounded-2xl bg-primary px-6 py-4 font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-primary/40 text-lg"
          >
            <Plus className="h-7 w-7" />
            إنشاء مهمة
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-3 flex-wrap animate-fade-in" style={{ animationDelay: '100ms' }}>
        {[
          { value: '', label: 'الكل' },
          { value: 'ASSIGNED', label: 'جارية' },
          { value: 'COMPLETED', label: 'مكتملة' },
          { value: 'OVERDUE', label: 'متأخرة' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-2xl border-2 px-6 py-2.5 text-sm font-black transition-all duration-300 active:scale-95 ${
              filter === tab.value
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-[2rem] bg-muted" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-[2rem] border-2 border-dashed border-border bg-card/50 p-24 text-center animate-fade-in">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-muted mb-8">
            <BookOpen className="h-16 w-16 text-muted-foreground/50" />
          </div>
          <p className="text-xl font-black text-foreground">لا توجد مهام حالياً</p>
          <p className="mt-2 text-sm font-bold text-muted-foreground">استمتع بوقتك، أو راجع ما حفظته سابقاً.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task, index) => {
            const cfg = statusConfig[task.status];
            const Icon = cfg.icon;
            const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

            return (
              <div
                key={task.id}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border-2 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl animate-slide-up ${
                  isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-border/50 hover:border-primary/30'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Task type badge */}
                <div className="mb-6 flex items-center justify-between">
                  <span className="rounded-xl bg-accent/10 px-3.5 py-1.5 text-xs font-black text-primary">
                    {taskTypeLabel[task.taskType]}
                  </span>
                  <span className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-black shadow-sm ${
                    task.status === 'COMPLETED' ? 'bg-success/10 text-success border-success/20' : 
                    isOverdue ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                    'bg-secondary/10 text-secondary border-secondary/20'
                  }`}>
                    <Icon className="h-4 w-4" />
                    {cfg.label}
                  </span>
                </div>

                {/* Surah info */}
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                     <BookOpen className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight">
                      سورة {quranSurahs[task.surahNumber - 1]?.name || task.surahNumber}
                    </h3>
                    <p className="mt-1 text-sm font-bold text-muted-foreground">
                      الآيات {task.ayahStart} – {task.ayahEnd}
                    </p>
                  </div>
                </div>

                {/* Due date */}
                <div className="mb-6 flex items-center gap-3 rounded-2xl bg-muted/50 p-4 text-base font-bold text-muted-foreground">
                  <Clock className="h-7 w-7 text-primary" />
                  <span>موعد التسليم: {
                    (() => {
                      const d = new Date(task.dueDate);
                      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                    })()
                  }</span>
                </div>

                {task.notes && (
                  <p className="mb-6 rounded-2xl bg-amber-500/10 px-4 py-3 text-xs font-bold leading-relaxed text-amber-700">
                    {task.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-auto flex gap-3">
                  {user?.role === 'STUDENT' && task.status === 'ASSIGNED' && (
                    <>
                      <button
                        onClick={() => completeMutation.mutate(task.id)}
                        disabled={completeMutation.isPending}
                        className="flex-1 rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground shadow-md transition-all duration-300 hover:scale-105 hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {completeMutation.isPending ? 'جاري الإتمام...' : 'إتمام المهمة'}
                      </button>
                      <Link
                        to={`/tasks/${task.id}/submit`}
                        className="flex items-center justify-center rounded-2xl border-2 border-border bg-card px-5 py-4 text-muted-foreground transition-all duration-300 hover:scale-105 hover:bg-muted active:scale-95"
                      >
                        <ChevronLeft className="h-7 w-7" />
                      </Link>
                    </>
                  )}
                  {user?.role !== 'STUDENT' && (
                    <div className="flex w-full items-center justify-between rounded-2xl bg-muted/30 p-2">
                      <span className="text-sm text-foreground font-black px-2">{task.student.fullName}</span>
                      <div className="flex gap-1.5">
                        <Link
                          to="/manage/tasks"
                          state={{ editTask: task }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                          title="تعديل"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
                              deleteMutation.mutate(task.id);
                            }
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-95"
                          title="حذف"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
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
