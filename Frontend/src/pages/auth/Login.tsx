import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail, Sparkles, LogIn } from 'lucide-react';
import { ApiError, apiCall } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../store/authStore';
import logoUrl from '../../assets/logo.png';

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
    <main className="relative min-h-screen w-full overflow-hidden bg-background font-sans text-foreground" dir="rtl">
      
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] h-[40vw] w-[40vw] animate-[spin_20s_linear_infinite] rounded-full bg-primary/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40vw] w-[40vw] animate-[spin_25s_linear_infinite_reverse] rounded-full bg-accent/20 blur-[100px]" />
      <div className="absolute top-[20%] right-[20%] h-[20vw] w-[20vw] animate-pulse rounded-full bg-secondary/20 blur-[80px]" />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row items-center justify-center p-4 sm:p-8">
        
        {/* Navigation to Landing Page */}
        <div className="absolute top-8 right-8 z-20 animate-in fade-in duration-700">
          <Link to="/" className="group flex items-center gap-2 rounded-full bg-white/40 px-5 py-2.5 text-sm font-bold text-foreground backdrop-blur-md shadow-sm border border-white/50 transition-all hover:bg-white/60 hover:scale-105 active:scale-95">
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            تعرف على المنصة
          </Link>
        </div>

        <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.08)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-700 p-8 sm:p-12">
          
          <div className="text-center animate-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-[2rem] bg-transparent shadow-none transition-transform hover:scale-110 hover:rotate-3 duration-300 overflow-hidden">
              <img src={logoUrl} alt="E-Maqra2a Logo" className="h-full w-full object-contain drop-shadow-md" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              تسجيل الدخول
            </h2>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              أدخل بياناتك للمتابعة إلى حسابك
            </p>
          </div>

          {error && (
            <div className="mt-6 animate-in fade-in slide-in-from-top-2 rounded-2xl border-2 border-destructive/20 bg-destructive/10 p-4 text-center text-sm font-bold text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5 animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="space-y-1.5 group">
              <label htmlFor="email" className="text-sm font-bold text-foreground transition-colors group-focus-within:text-primary">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  dir="ltr"
                  required
                  className="w-full rounded-2xl border-2 border-border bg-background/50 py-3.5 pl-4 pr-12 text-base font-bold text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 hover:border-primary/50"
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-bold text-foreground transition-colors group-focus-within:text-primary">
                  كلمة المرور
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-primary transition-colors hover:text-primary/80">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  dir="ltr"
                  required
                  className="w-full rounded-2xl border-2 border-border bg-background/50 py-3.5 pl-12 pr-12 text-base font-bold text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 hover:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-lg font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100 overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform group-hover:translate-x-full duration-1000 ease-in-out" />
              {isLoading ? (
                <span className="h-6 w-6 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              ) : (
                <>
                  <LogIn className="h-6 w-6" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <p className="text-sm font-bold text-muted-foreground">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="text-primary transition-all hover:underline underline-offset-4 font-black">
                أنشئ حساباً جديداً
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};