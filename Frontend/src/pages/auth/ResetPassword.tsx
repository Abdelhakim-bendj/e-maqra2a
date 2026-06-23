import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, KeyRound } from 'lucide-react';
import { ApiError, apiCall } from '../../services/api';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string | undefined;

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  if (!email) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiCall<null>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token, password }),
      });
      navigate('/login', { replace: true, state: { message: 'تم تحديث كلمة المرور بنجاح.' } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تحديث كلمة المرور.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-4 py-10 font-sans" dir="rtl">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl shadow-emerald-900/10">
        <h1 className="text-3xl font-black text-slate-950">تعيين كلمة مرور جديدة</h1>
        <p className="mt-2 text-slate-500">اختر كلمة مرور قوية لحماية حسابك.</p>

        {error && <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div className="rounded-xl bg-primary/10 p-4 text-center">
            <p className="text-sm font-bold text-primary">
              تم إرسال رمز التحقق إلى: <br/> <span className="text-lg" dir="ltr">{email}</span>
            </p>
          </div>

          <div>
            <label htmlFor="token" className="mb-2 block text-sm font-bold text-slate-700">
              رمز التحقق (6 أرقام)
            </label>
            <div className="relative">
              <KeyRound className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="token"
                type="text"
                maxLength={6}
                value={token}
                onChange={(event) => setToken(event.target.value.replace(/\D/g, ''))}
                required
                dir="ltr"
                placeholder="000000"
                className="w-full rounded-xl border border-slate-200 py-3.5 pl-4 pr-12 text-center text-2xl font-black tracking-[1em] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                dir="ltr"
                className="w-full rounded-xl border border-slate-200 py-3.5 pl-4 pr-12 font-medium outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-4 font-black text-white transition hover:bg-emerald-800 disabled:opacity-70"
          >
            {isLoading ? 'جار الحفظ...' : 'تحديث كلمة المرور'}
            {!isLoading && <ArrowLeft className="h-5 w-5" />}
          </button>
        </form>

        <Link to="/login" className="mt-7 block text-center text-sm font-black text-emerald-700 hover:underline">
          العودة إلى تسجيل الدخول
        </Link>
      </section>
    </main>
  );
};
