import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { BookOpen, Video, FileText, Plus, X, UploadCloud, Save, Trash2 } from 'lucide-react';

type Lesson = {
  id: string;
  title: string;
  description?: string;
  category: string;
  content: string;
  videoUrl?: string;
  pdfUrl?: string;
  creator: { fullName: string };
};

const categoryMap: Record<string, string> = {
  MAKHARIJ: 'مخارج الحروف',
  SIFAAT: 'صفات الحروف',
  NOON_SAKINAH: 'أحكام النون الساكنة',
  MEEM_SAKINAH: 'أحكام الميم الساكنة',
  MADD: 'المدود',
  GHUNNA: 'الغنة',
};

export const Tajweed = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'MAKHARIJ',
    content: 'محتوى الدرس...',
    pdfUrl: '',
    videoUrl: '',
  });
  const [fileName, setFileName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tajweed'],
    queryFn: () => apiCall<{ lessons: Lesson[] }>('/content/tajweed'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiCall('/content/tajweed', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tajweed'] });
      setIsModalOpen(false);
      setForm({ title: '', description: '', category: 'MAKHARIJ', content: 'محتوى الدرس...', pdfUrl: '', videoUrl: '' });
      setFileName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiCall(`/content/tajweed/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tajweed'] }),
  });

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.');
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm({ ...form, pdfUrl: event.target?.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset so the same file can be selected again
  };

  const handleSave = () => {
    if (!form.title) {
      alert('يرجى إدخال عنوان الدرس');
      return;
    }
    createMutation.mutate(form);
  };

  const lessons = data?.lessons ?? [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">أحكام التجويد</h1>
          <p className="mt-1 text-slate-500">
            {user?.role === 'TEACHER' ? 'إدارة دروس التجويد لطلابك' : 'دروس مبسطة وملفات مرجعية مخصصة لك'}
          </p>
        </div>
        {user?.role !== 'STUDENT' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
          >
            <Plus className="h-5 w-5" />
            إضافة درس ومرفقات
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-3xl bg-slate-200" />)}
        </div>
      ) : lessons.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 font-black text-slate-400">لا توجد دروس تجويد حالياً</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span className="mb-2 inline-block rounded-xl bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                    {categoryMap[lesson.category] || lesson.category}
                  </span>
                  <h3 className="text-xl font-black text-slate-900">{lesson.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">بواسطة: {lesson.creator?.fullName}</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <BookOpen className="h-8 w-8 text-slate-200" />
                  {user?.role !== 'STUDENT' && (
                    <button
                      onClick={() => handleDelete(lesson.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="حذف الدرس"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <p className="mb-6 flex-1 text-sm font-medium text-slate-600 line-clamp-3">
                {lesson.description || lesson.content}
              </p>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                {lesson.videoUrl && (
                  <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100">
                    <Video className="h-4 w-4" /> مرئي
                  </a>
                )}
                {lesson.pdfUrl && (
                  <a 
                    href={lesson.pdfUrl} 
                    download={`${lesson.title}_مرفق`}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-100"
                  >
                    <FileText className="h-4 w-4" /> تحميل المرفق
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-black text-slate-900">إضافة درس تجويد جديد</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">عنوان الدرس</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="مثال: الإدغام بغنة"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">القسم (الباب)</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-bold outline-none focus:border-emerald-500"
                  >
                    {Object.entries(categoryMap).map(([key, val]) => (
                      <option key={key} value={key}>{val}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">الوصف الموجز</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-emerald-500"
                />
              </div>

              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50/50">
                <UploadCloud className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
                <p className="font-bold text-slate-700">ارفع ملف الشرح (PDF, DOCX, TXT)</p>
                <p className="mt-1 text-xs text-slate-500">الحد الأقصى 5 ميجابايت (سيكون متاحاً لطلابك فقط)</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm border border-emerald-100 hover:bg-emerald-50"
                >
                  استعراض الملفات
                </button>
                {fileName && (
                  <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2 px-3 text-sm font-bold text-emerald-700 w-fit mx-auto border border-emerald-100 shadow-sm">
                    <span>📄 {fileName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileName('');
                        setForm({ ...form, pdfUrl: '' });
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-emerald-200 hover:text-emerald-900 transition"
                      title="حذف الملف"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 font-black text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {createMutation.isPending ? 'جاري الرفع...' : 'حفظ ونشر المرفق'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
