import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, Eye, EyeOff, Lock, Mail, Star } from 'lucide-react';
import { ApiError, apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../store/authStore';


export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await apiCall<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setUser(data.user);
      navigate((location.state as { from?: string } | null)?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل تسجيل الدخول. تأكد من بياناتك.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-200" dir="rtl">
      <div className="flex min-h-screen flex-col-reverse lg:flex-row">
        
        {/* Left Side: Friendly & Colorful Info Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-teal-400 via-emerald-400 to-green-500 px-6 py-12 text-white lg:w-[55%] lg:px-16 flex items-center">
          {/* Playful background pattern */}
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_2px_2px,white_2px,transparent_0)] [background-size:40px_40px]" />
          
          {/* Decorative abstract blobs */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-teal-800/10 blur-3xl" />

          <div className="relative mx-auto flex w-full max-w-2xl flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-2xl border-2 border-white/30 bg-white/20 px-5 py-2.5 text-sm font-bold backdrop-blur-md shadow-sm">
              <Star className="h-6 w-6 fill-amber-300 text-amber-300 animate-pulse" />
              انضم لأكثر من 10,000 طالب وطالبة!
            </div>

            <h1 className="mt-10 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl drop-shadow-md">
              رحلتك الممتعة مع <span className="text-amber-300">القرآن الكريم</span> تبدأ هنا 🌟
            </h1>

            <div className="mt-12 flex flex-col gap-4">
              {[
                'جلسات تسميع مباشرة مع معلمين ودودين',
                'أوسمة ومكافآت عند حفظ السور الجديدة',
                'ألعاب وأنشطة تفاعلية تناسب عمرك',
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-4 rounded-3xl border-2 border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-transform hover:-translate-y-1 hover:bg-white/20"
                >
                  <span className="flex h-12 w-12 shrink-0 -rotate-3 items-center justify-center rounded-2xl bg-amber-300 text-emerald-800 shadow-sm">
                    <CheckCircle2 className="h-7 w-7" />
                  </span>
                  <p className="text-xl font-bold text-white drop-shadow-sm">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Side: Floating Login Card */}
        <section className="flex min-h-screen items-center justify-center px-6 py-10 lg:w-[45%] bg-slate-50">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            
            <div className="mb-8 text-center flex flex-col items-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-teal-100 text-teal-600 shadow-inner rotate-3">
                <BookOpen className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
                أهلاً بك مجدداً 👋
              </h2>
              <p className="mt-3 text-base font-bold text-slate-400">
                هيا بنا نكمل رحلة التعلم!
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-center text-sm font-bold text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-base font-bold text-slate-600 px-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    dir="ltr"
                    required
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-4 pl-4 pr-14 text-lg font-bold text-slate-700 outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4 px-1">
                  <label htmlFor="password" className="text-base font-bold text-slate-600">
                    كلمة المرور
                  </label>
                  <Link to="/forgot-password" className="text-sm font-bold text-teal-500 transition-colors hover:text-teal-600">
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    dir="ltr"
                    required
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-4 pl-14 pr-14 text-lg font-bold text-slate-700 outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-teal-600"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
              </div>

              {/* 3D Gamified Button Style */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border-b-4 border-teal-700 bg-teal-500 px-5 py-4 text-xl font-black text-white transition-all hover:bg-teal-400 active:border-b-0 active:translate-y-1 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:active:translate-y-0"
              >
                {isLoading ? (
                  <span className="h-7 w-7 animate-spin rounded-full border-4 border-white border-t-transparent" />
                ) : (
                  <>
                    تسجيل الدخول
                    <ArrowLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-base font-bold text-slate-500">
                صديق جديد؟{' '}
                <Link to="/register" className="text-teal-500 transition-colors hover:text-teal-600">
                  سجل من هنا!
                </Link>
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
};