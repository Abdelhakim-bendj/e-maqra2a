import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import {
  BookOpen, Calendar, ChevronRight, Plus, Save, Trash2, Users,
} from 'lucide-react';

type Class = { id: string; name: string; _count: { students: number } };

export const quranSurahs = [
  { id: 1, name: "الفاتحة", ayahs: 7 }, { id: 2, name: "البقرة", ayahs: 286 }, { id: 3, name: "آل عمران", ayahs: 200 },
  { id: 4, name: "النساء", ayahs: 176 }, { id: 5, name: "المائدة", ayahs: 120 }, { id: 6, name: "الأنعام", ayahs: 165 },
  { id: 7, name: "الأعراف", ayahs: 206 }, { id: 8, name: "الأنفال", ayahs: 75 }, { id: 9, name: "التوبة", ayahs: 129 },
  { id: 10, name: "يونس", ayahs: 109 }, { id: 11, name: "هود", ayahs: 123 }, { id: 12, name: "يوسف", ayahs: 111 },
  { id: 13, name: "الرعد", ayahs: 43 }, { id: 14, name: "إبراهيم", ayahs: 52 }, { id: 15, name: "الحجر", ayahs: 99 },
  { id: 16, name: "النحل", ayahs: 128 }, { id: 17, name: "الإسراء", ayahs: 111 }, { id: 18, name: "الكهف", ayahs: 110 },
  { id: 19, name: "مريم", ayahs: 98 }, { id: 20, name: "طه", ayahs: 135 }, { id: 21, name: "الأنبياء", ayahs: 112 },
  { id: 22, name: "الحج", ayahs: 78 }, { id: 23, name: "المؤمنون", ayahs: 118 }, { id: 24, name: "النور", ayahs: 64 },
  { id: 25, name: "الفرقان", ayahs: 77 }, { id: 26, name: "الشعراء", ayahs: 227 }, { id: 27, name: "النمل", ayahs: 93 },
  { id: 28, name: "القصص", ayahs: 88 }, { id: 29, name: "العنكبوت", ayahs: 69 }, { id: 30, name: "الروم", ayahs: 60 },
  { id: 31, name: "لقمان", ayahs: 34 }, { id: 32, name: "السجدة", ayahs: 30 }, { id: 33, name: "الأحزاب", ayahs: 73 },
  { id: 34, name: "سبأ", ayahs: 54 }, { id: 35, name: "فاطر", ayahs: 45 }, { id: 36, name: "يس", ayahs: 83 },
  { id: 37, name: "الصافات", ayahs: 182 }, { id: 38, name: "ص", ayahs: 88 }, { id: 39, name: "الزمر", ayahs: 75 },
  { id: 40, name: "غافر", ayahs: 85 }, { id: 41, name: "فصلت", ayahs: 54 }, { id: 42, name: "الشورى", ayahs: 53 },
  { id: 43, name: "الزخرف", ayahs: 89 }, { id: 44, name: "الدخان", ayahs: 59 }, { id: 45, name: "الجاثية", ayahs: 37 },
  { id: 46, name: "الأحقاف", ayahs: 35 }, { id: 47, name: "محمد", ayahs: 38 }, { id: 48, name: "الفتح", ayahs: 29 },
  { id: 49, name: "الحجرات", ayahs: 18 }, { id: 50, name: "ق", ayahs: 45 }, { id: 51, name: "الذاريات", ayahs: 60 },
  { id: 52, name: "الطور", ayahs: 49 }, { id: 53, name: "النجم", ayahs: 62 }, { id: 54, name: "القمر", ayahs: 55 },
  { id: 55, name: "الرحمن", ayahs: 78 }, { id: 56, name: "الواقعة", ayahs: 96 }, { id: 57, name: "الحديد", ayahs: 29 },
  { id: 58, name: "المجادلة", ayahs: 22 }, { id: 59, name: "الحشر", ayahs: 24 }, { id: 60, name: "الممتحنة", ayahs: 13 },
  { id: 61, name: "الصف", ayahs: 14 }, { id: 62, name: "الجمعة", ayahs: 11 }, { id: 63, name: "المنافقون", ayahs: 11 },
  { id: 64, name: "التغابن", ayahs: 18 }, { id: 65, name: "الطلاق", ayahs: 12 }, { id: 66, name: "التحريم", ayahs: 12 },
  { id: 67, name: "الملك", ayahs: 30 }, { id: 68, name: "القلم", ayahs: 52 }, { id: 69, name: "الحاقة", ayahs: 52 },
  { id: 70, name: "المعارج", ayahs: 44 }, { id: 71, name: "نوح", ayahs: 28 }, { id: 72, name: "الجن", ayahs: 28 },
  { id: 73, name: "المزمل", ayahs: 20 }, { id: 74, name: "المدثر", ayahs: 56 }, { id: 75, name: "القيامة", ayahs: 40 },
  { id: 76, name: "الإنسان", ayahs: 31 }, { id: 77, name: "المرسلات", ayahs: 50 }, { id: 78, name: "النبأ", ayahs: 40 },
  { id: 79, name: "النازعات", ayahs: 46 }, { id: 80, name: "عبس", ayahs: 42 }, { id: 81, name: "التكوير", ayahs: 29 },
  { id: 82, name: "الإنفطار", ayahs: 19 }, { id: 83, name: "المطففين", ayahs: 36 }, { id: 84, name: "الإنشقاق", ayahs: 25 },
  { id: 85, name: "البروج", ayahs: 22 }, { id: 86, name: "الطارق", ayahs: 17 }, { id: 87, name: "الأعلى", ayahs: 19 },
  { id: 88, name: "الغاشية", ayahs: 26 }, { id: 89, name: "الفجر", ayahs: 30 }, { id: 90, name: "البلد", ayahs: 20 },
  { id: 91, name: "الشمس", ayahs: 15 }, { id: 92, name: "الليل", ayahs: 21 }, { id: 93, name: "الضحى", ayahs: 11 },
  { id: 94, name: "الشرح", ayahs: 8 }, { id: 95, name: "التين", ayahs: 8 }, { id: 96, name: "العلق", ayahs: 19 },
  { id: 97, name: "القدر", ayahs: 5 }, { id: 98, name: "البينة", ayahs: 8 }, { id: 99, name: "الزلزلة", ayahs: 8 },
  { id: 100, name: "العاديات", ayahs: 11 }, { id: 101, name: "القارعة", ayahs: 11 }, { id: 102, name: "التكاثر", ayahs: 8 },
  { id: 103, name: "العصر", ayahs: 3 }, { id: 104, name: "الهمزة", ayahs: 9 }, { id: 105, name: "الفيل", ayahs: 5 },
  { id: 106, name: "قريش", ayahs: 4 }, { id: 107, name: "الماعون", ayahs: 7 }, { id: 108, name: "الكوثر", ayahs: 3 },
  { id: 109, name: "الكافرون", ayahs: 6 }, { id: 110, name: "النصر", ayahs: 3 }, { id: 111, name: "المسد", ayahs: 5 },
  { id: 112, name: "الإخلاص", ayahs: 4 }, { id: 113, name: "الفلق", ayahs: 5 }, { id: 114, name: "الناس", ayahs: 6 }
];

export const ManageTasks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editTask = location.state?.editTask;
  const qc = useQueryClient();

  const [assignMode, setAssignMode] = useState<'student' | 'class'>('student');
  const [form, setForm] = useState({
    studentId: editTask?.studentId || '',
    classId: '',
    taskType: editTask?.taskType || ('NEW' as 'NEW' | 'REVISION'),
    surahNumber: editTask?.surahNumber || 1,
    ayahStart: editTask?.ayahStart || 1,
    ayahEnd: editTask?.ayahEnd || 7,
    dueDate: editTask?.dueDate ? new Date(editTask.dueDate).toISOString().slice(0, 10) : new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    notes: editTask?.notes || '',
  });
  const [error, setError] = useState('');

  const { data: classData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiCall<{ classes: Class[] }>('/classes'),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiCall<{ users: any[] }>('/users'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: object) => {
      if (editTask) {
        return apiCall(`/tasks/${editTask.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      }
      return assignMode === 'student'
        ? apiCall('/tasks', { method: 'POST', body: JSON.stringify(payload) })
        : apiCall('/tasks/bulk', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/tasks');
    },
    onError: (err: any) => {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors.map((e: any) => e.message).join('، '));
      } else {
        setError(err.message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...(assignMode === 'student' ? { studentId: form.studentId } : { classId: form.classId }),
      taskType: form.taskType,
      surahNumber: form.surahNumber,
      ayahStart: form.ayahStart,
      ayahEnd: form.ayahEnd,
      dueDate: new Date(form.dueDate).toISOString(),
      notes: form.notes || undefined,
    };
    createMutation.mutate(payload);
  };

  const classes = classData?.classes ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">{editTask ? 'تعديل المهمة' : 'تحديد الورد اليومي'}</h1>
        <p className="mt-1.5 text-muted-foreground font-medium">{editTask ? 'تعديل تفاصيل ورد الطالب' : 'قم بتعيين ورد الحفظ أو المراجعة للطلاب أو الفصول وانطلق بهم نحو التفوق'}</p>
      </div>

      <div className="mx-auto max-w-2xl rounded-[2rem] border-2 border-border bg-card p-8 shadow-xl shadow-foreground/5 sm:p-10 animate-slide-up">
        {/* Assign mode tabs */}
        {!editTask && (
          <div className="mb-8 grid grid-cols-2 gap-3 rounded-[1.5rem] bg-muted/50 p-1.5">
            {[
              { value: 'student' as const, label: 'طالب محدد', icon: Users },
              { value: 'class' as const, label: 'فصل كامل', icon: Users },
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setAssignMode(mode.value)}
                  className={`flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-black transition-all duration-300 active:scale-95 ${
                    assignMode === mode.value
                      ? 'bg-card text-primary shadow-sm ring-1 ring-border'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {mode.label}
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl bg-destructive/10 p-4 text-sm font-black text-destructive border-2 border-destructive/20 animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target */}
          {!editTask && (assignMode === 'class' ? (
            <div>
              <label className="mb-2.5 block text-base font-black text-foreground">الفصل الدراسي</label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                required
                className="w-full rounded-2xl border-2 border-border bg-muted/30 py-4 px-5 text-base font-bold text-foreground outline-none transition-all focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-primary/50"
              >
                <option value="">اختر الفصل...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls._count.students} طالب)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-2.5 block text-base font-black text-foreground">اختر الطالب</label>
              <select
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                required
                className="w-full rounded-2xl border-2 border-border bg-muted/30 py-4 px-5 text-base font-bold text-foreground outline-none transition-all focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-primary/50"
              >
                <option value="">اختر الطالب...</option>
                {studentsData?.users?.filter(u => u.role === 'STUDENT').map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Task type */}
          <div>
            <label className="mb-2.5 block text-base font-black text-foreground">نوع الورد</label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'NEW' as const, label: 'حفظ جديد' },
                { value: 'REVISION' as const, label: 'مراجعة' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, taskType: type.value })}
                  className={`rounded-2xl border-2 py-4 font-black transition-all duration-300 active:scale-95 ${
                    form.taskType === type.value
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Surah selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="mb-2.5 block text-sm font-black text-foreground">السورة</label>
              <select
                value={form.surahNumber}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setForm({ ...form, surahNumber: val, ayahStart: 1, ayahEnd: quranSurahs[val - 1]?.ayahs || 1 });
                }}
                required
                className="w-full rounded-2xl border-2 border-border bg-muted/30 py-4 px-4 text-sm font-bold text-foreground outline-none transition-all focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-primary/50"
              >
                {quranSurahs.map((surah) => (
                  <option key={surah.id} value={surah.id}>
                    {surah.id}. {surah.name} ({surah.ayahs} آية)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-black text-foreground">آية البداية</label>
              <input
                type="number"
                min={1}
                max={quranSurahs[form.surahNumber - 1]?.ayahs || 1}
                value={form.ayahStart}
                onChange={(e) => setForm({ ...form, ayahStart: parseInt(e.target.value, 10) || 1 })}
                required
                className="w-full rounded-2xl border-2 border-border bg-muted/30 py-4 px-4 text-lg font-black text-foreground text-center outline-none transition-all focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-primary/50"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-sm font-black text-foreground">آية النهاية</label>
              <input
                type="number"
                min={form.ayahStart}
                max={quranSurahs[form.surahNumber - 1]?.ayahs || 1}
                value={form.ayahEnd}
                onChange={(e) => setForm({ ...form, ayahEnd: parseInt(e.target.value, 10) || 1 })}
                required
                className="w-full rounded-2xl border-2 border-border bg-muted/30 py-4 px-4 text-lg font-black text-foreground text-center outline-none transition-all focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-primary/50"
              />
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="mb-2.5 flex items-center gap-2 text-base font-black text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              تاريخ الاستحقاق
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
              dir="ltr"
              className="w-full rounded-2xl border-2 border-border bg-muted/30 py-4 px-5 font-black text-foreground outline-none transition-all focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-primary/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2.5 block text-base font-black text-foreground">ملاحظات والتوجيهات</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              maxLength={500}
              placeholder="اكتب هنا توجيهاتك لتشجيع الطالب... (اختياري)"
              className="w-full rounded-2xl border-2 border-border bg-muted/30 py-4 px-5 text-base font-bold text-foreground outline-none transition-all focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20 hover:border-primary/50 resize-none leading-relaxed"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-5 font-black text-lg text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Save className="h-6 w-6 transition-transform group-hover:scale-110" />
              {createMutation.isPending ? 'جاري الاعتماد...' : 'تأكيد الورد وإرساله'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
