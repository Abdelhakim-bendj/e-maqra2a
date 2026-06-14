import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { ApiError, apiCall } from '../../services/api';


export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setDevToken('');
    setIsLoading(true);

    try {
      const data = await apiCall<{ resetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage('إذا كان البريد مسجلاً، ستصلك تعليمات إعادة التعيين.');
      setDevToken(data?.resetToken || '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر إرسال طلب إعادة التعيين.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-4 py-10 font-sans" dir="rtl">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl shadow-emerald-900/10">
        <h1 className="text-3xl font-black text-slate-950">استعادة كلمة المرور</h1>
        <p className="mt-2 text-slate-500">أدخل بريدك الإلكتروني وسنرسل لك تعليمات إعادة التعيين.</p>

        {error && <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
        {message && <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{message}</div>}
        {devToken && (
          <Link
            to={`/reset-password?token=${encodeURIComponent(devToken)}`}
            className="mt-3 block rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800"
          >
            رابط التطوير: الانتقال لإعادة تعيين كلمة المرور
          </Link>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                dir="ltr"
                className="w-full rounded-xl border border-slate-200 py-3.5 pl-4 pr-12 font-medium outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-4 font-black text-white transition hover:bg-emerald-800 disabled:opacity-70"
          >
            {isLoading ? 'جار الإرسال...' : 'إرسال التعليمات'}
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
