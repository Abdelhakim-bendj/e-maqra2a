import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Ask Supabase to send a 6-digit OTP (email OTP) to the user's email.
      // The user will receive a code they can use to reset their password.
      const { error: supabaseError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Setting shouldCreateUser to false ensures only existing users get the OTP.
          shouldCreateUser: false,
        },
      });

      if (supabaseError) {
        if (supabaseError.message.includes('User not found') || supabaseError.status === 422) {
          // Don't reveal if email exists for security, but show a generic success
          setIsSent(true);
          return;
        }
        throw new Error(supabaseError.message);
      }

      setIsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إرسال طلب إعادة التعيين.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/reset-password', { state: { email } });
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background font-sans text-foreground" dir="rtl">
      {/* Animated Background */}
      <div className="absolute top-[-10%] left-[-10%] h-[40vw] w-[40vw] animate-[spin_20s_linear_infinite] rounded-full bg-primary/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40vw] w-[40vw] animate-[spin_25s_linear_infinite_reverse] rounded-full bg-accent/20 blur-[100px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-8">
        <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.08)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-700 p-8 sm:p-12">

          {!isSent ? (
            <>
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">
                  استعادة كلمة المرور
                </h1>
                <p className="mt-2 text-sm font-bold text-muted-foreground">
                  أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق.
                </p>
              </div>

              {error && (
                <div className="mt-6 animate-in fade-in rounded-2xl border-2 border-destructive/20 bg-destructive/10 p-4 text-center text-sm font-bold text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                      required
                      dir="ltr"
                      placeholder="name@example.com"
                      className="w-full rounded-2xl border-2 border-border bg-background/50 py-3.5 pl-4 pr-12 text-base font-bold text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 hover:border-primary/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-lg font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 overflow-hidden"
                >
                  <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform group-hover:translate-x-full duration-1000 ease-in-out" />
                  {isLoading ? (
                    <span className="h-6 w-6 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <ArrowLeft className="h-5 w-5" />
                      إرسال رمز التحقق
                    </>
                  )}
                </button>
              </form>

              <Link to="/login" className="mt-7 block text-center text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                العودة إلى تسجيل الدخول
              </Link>
            </>
          ) : (
            /* Success state */
            <div className="text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-foreground">تم إرسال الرمز!</h2>
              <p className="mt-3 text-sm font-bold text-muted-foreground leading-relaxed">
                إذا كان البريد <span dir="ltr" className="text-primary">{email}</span> مسجلاً لدينا،
                ستصله رسالة تحتوي على رمز تحقق مؤلف من 6 أرقام.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                تحقق من مجلد البريد المزعج (Spam) إن لم تجده.
              </p>

              <button
                onClick={handleContinue}
                className="mt-8 group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-lg font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform group-hover:translate-x-full duration-1000 ease-in-out" />
                <ArrowLeft className="h-5 w-5" />
                أدخل رمز التحقق
              </button>

              <button
                onClick={() => { setIsSent(false); setError(''); }}
                className="mt-4 block w-full text-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                إرسال مرة أخرى
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
