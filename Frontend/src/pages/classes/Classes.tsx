import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { Settings, Plus, Users, Trash2 } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  teacher: { id: string; fullName: string } | null;
  _count: { students: number };
}

export const Classes = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const { data: classesData, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiCall<{ classes: Class[] }>('/classes'),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiCall<{ users: { id: string, fullName: string, role: string }[] }>('/users'),
  });

  const createClass = useMutation({
    mutationFn: (data: any) => apiCall('/classes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsCreating(false);
    },
  });

  const updateClass = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiCall(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setEditingClass(null);
    },
  });

  const deleteClass = useMutation({
    mutationFn: (id: string) => apiCall(`/classes/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes'] }),
  });

  if (isLoading) {
    return <div className="p-8 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700 mx-auto" /></div>;
  }

  const teachers = users?.users?.filter(u => u.role === 'TEACHER') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-600" />
          إدارة الفصول
        </h1>
        <button
          onClick={() => { setIsCreating(true); setEditingClass(null); }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition"
        >
          <Plus className="h-4 w-4" />
          فصل جديد
        </button>
      </div>

      {(isCreating || editingClass) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">{editingClass ? 'تعديل الفصل' : 'إضافة فصل جديد'}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name'),
                description: formData.get('description'),
                teacherId: formData.get('teacherId') || undefined,
              };
              if (editingClass) {
                updateClass.mutate({ id: editingClass.id, data });
              } else {
                createClass.mutate(data);
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">اسم الفصل</label>
              <input name="name" defaultValue={editingClass?.name || ''} required className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">المعلم (اختياري)</label>
              <select name="teacherId" defaultValue={editingClass?.teacher?.id || ''} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                <option value="">بدون معلم محدد</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">الوصف</label>
              <textarea name="description" defaultValue={editingClass?.description || ''} rows={2} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => { setIsCreating(false); setEditingClass(null); }} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
              <button type="submit" disabled={createClass.isPending || updateClass.isPending} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700">{(createClass.isPending || updateClass.isPending) ? 'جاري الحفظ...' : 'حفظ الفصل'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classesData?.classes?.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
            لا توجد فصول حالياً
          </div>
        )}
        
        {classesData?.classes?.map((cls) => (
          <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-black text-slate-900">{cls.name}</h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => { setEditingClass(cls); setIsCreating(false); }}
                  className="text-emerald-500 hover:text-emerald-700 p-1"
                  title="تعديل"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => {
                    if (confirm('هل أنت متأكد من حذف هذا الفصل؟')) {
                      deleteClass.mutate(cls.id);
                    }
                  }}
                  className="text-red-400 hover:text-red-600 p-1"
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 mb-4 h-10">{cls.description || 'لا يوجد وصف'}</p>
            
            <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">المعلم:</span>
                <span className="font-bold text-slate-900">{cls.teacher?.fullName || 'غير محدد'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">الطلاب الملحقين:</span>
                <div className="flex items-center gap-1 font-bold text-emerald-600">
                  <Users className="h-3.5 w-3.5" />
                  <span>{cls._count.students} طالب</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
