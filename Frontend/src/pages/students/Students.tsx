import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../../services/api';
import { Users, Mail, Phone, Calendar, BookOpen } from 'lucide-react';
import { quranSurahs } from '../tasks/ManageTasks';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  studentProfile?: {
    currentJuz?: number;
    currentSurah?: number;
    class?: { name: string };
  };
}

export const Students = () => {
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiCall<{ users: User[] }>('/users'),
  });

  if (isLoading) {
    return <div className="p-8 text-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700 mx-auto" /></div>;
  }

  const students = usersData?.users?.filter(u => u.role === 'STUDENT') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            إدارة الطلاب
          </h1>
          <p className="mt-1 text-slate-500 text-sm font-medium">عرض بيانات وتقدم الطلاب المسجلين تحت إشرافك</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">الاسم الكامل</th>
                <th className="px-6 py-4">معلومات الاتصال</th>
                <th className="px-6 py-4">الفصل</th>
                <th className="px-6 py-4">التقدم الحالي</th>
                <th className="px-6 py-4">تاريخ الانضمام</th>
                <th className="px-6 py-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    لا يوجد طلاب مسجلين
                  </td>
                </tr>
              )}
              {students.map((student) => {
                const surahName = student.studentProfile?.currentSurah 
                  ? quranSurahs[student.studentProfile.currentSurah - 1]?.name 
                  : null;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {student.fullName}
                    </td>
                    <td className="px-6 py-4 text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {student.email}
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span dir="ltr">{student.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {student.studentProfile?.class?.name ? (
                        <span className="inline-block rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                          {student.studentProfile.class.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">غير محدد</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {student.studentProfile?.currentJuz || surahName ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                          <BookOpen className="h-3.5 w-3.5" />
                          {student.studentProfile.currentJuz && `الجزء ${student.studentProfile.currentJuz}`}
                          {student.studentProfile.currentJuz && surahName && ' - '}
                          {surahName && `سورة ${surahName}`}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">لا يوجد بيانات</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {(() => {
                          const d = new Date(student.createdAt);
                          return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        student.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {student.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
