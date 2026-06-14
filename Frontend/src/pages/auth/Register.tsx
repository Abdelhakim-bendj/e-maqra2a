import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, Lock, Mail, UserRound, Users } from 'lucide-react';
import { ApiError, apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { User, UserRole } from '../../store/authStore';


export const Register = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'STUDENT' as Exclude<UserRole, 'ADMIN'>,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await apiCall<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setUser(data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ أثناء التسجيل. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-10 font-sans" dir="rtl">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl shadow-emerald-900/10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-emerald-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <BookOpen className="h-8 w-8" />
            </div>
            <h1 className="mt-8 text-4xl font-black leading-tight">ابدأ رحلة حفظ منظمة وواضحة</h1>
            <p className="mt-4 text-lg leading-8 text-emerald-50/80">
              أنشئ حسابك وتابع المهام، الاختبارات، والتنبيهات من لوحة واحدة مصممة للمتعلمين والمعلمين.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm font-bold">
            <div className="rounded-2xl bg-white/10 p-4">متابعة يومية</div>
            <div className="rounded-2xl bg-white/10 p-4">اختبارات دورية</div>
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-950">إنشاء حساب جديد</h2>
            <p className="mt-2 text-slate-500">انضم إلى مجتمع المقرأة الإلكترونية</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-700">اختر نوع الحساب</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { role: 'STUDENT' as const, label: 'طالب', icon: Users },
                  { role: 'TEACHER' as const, label: 'معلم', icon: GraduationCap },
                ].map((option) => {
                  const Icon = option.icon;
                  const active = formData.role === option.role;

                  return (
                    <button
                      key={option.role}
                      type="button"
                      onClick={() => setFormData((value) => ({ ...value, role: option.role }))}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-black transition ${
                        active
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-bold text-slate-700">
                الاسم الكامل
              </label>
              <div className="relative">
                <UserRound className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(event) => setFormData((value) => ({ ...value, fullName: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-200 py-3.5 pl-4 pr-12 font-medium outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  placeholder="محمد أحمد"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-bold text-slate-700">
                رقم الهاتف
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">📞</div>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => setFormData((value) => ({ ...value, phone: event.target.value }))}
                  required
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 py-3.5 pl-4 pr-12 font-medium outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 text-right"
                  placeholder="0500000000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((value) => ({ ...value, email: event.target.value }))}
                  required
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 py-3.5 pl-4 pr-12 font-medium outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData((value) => ({ ...value, password: event.target.value }))}
                  minLength={8}
                  required
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 py-3.5 pl-4 pr-12 font-medium outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  placeholder="8 أحرف على الأقل"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  إنشاء الحساب
                  <ArrowLeft className="h-5 w-5 transition group-hover:-translate-x-1" />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm font-medium text-slate-500">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="font-black text-emerald-700 hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};
