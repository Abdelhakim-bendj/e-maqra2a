import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string | undefined;

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  if (!email) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    if (password.length < 8) {
      setError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Verify the OTP token sent to the user's email
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (verifyError) {
        if (verifyError.message.includes('Token has expired') || verifyError.message.includes('invalid')) {
          throw new Error('رمز التحقق غير صحيح أو منتهي الصلاحية. يرجى طلب رمز جديد.');
        }
        throw new Error(verifyError.message);
      }

      // Step 2: Now that we have a valid session, update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Step 3: Sign out so user logs in fresh with new password
      await supabase.auth.signOut();

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث كلمة المرور.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden bg-background font-sans text-foreground" dir="rtl">
        <div className="absolute top-[-10%] left-[-10%] h-[40vw] w-[40vw] animate-[spin_20s_linear_infinite] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40vw] w-[40vw] animate-[spin_25s_linear_infinite_reverse] rounded-full bg-accent/20 blur-[100px]" />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
          <div className="relative z-10 flex w-full max-w-md flex-col items-center overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.08)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-700 p-8 sm:p-12 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-foreground">تم تغيير كلمة المرور!</h2>
            <p className="mt-3 text-sm font-bold text-muted-foreground">
              تم تحديث كلمة مرورك بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-8 group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-lg font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform group-hover:translate-x-full duration-1000 ease-in-out" />
              تسجيل الدخول
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background font-sans text-foreground" dir="rtl">
      {/* Animated Background */}
      <div className="absolute top-[-10%] left-[-10%] h-[40vw] w-[40vw] animate-[spin_20s_linear_infinite] rounded-full bg-primary/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40vw] w-[40vw] animate-[spin_25s_linear_infinite_reverse] rounded-full bg-accent/20 blur-[100px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-8">
        <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.08)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-700 p-8 sm:p-12">

          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              تعيين كلمة مرور جديدة
            </h1>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              أدخل رمز التحقق الذي أُرسل إلى بريدك واختر كلمة مرور جديدة.
            </p>
          </div>

          {/* Email indicator */}
          <div className="mt-5 rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-sm font-bold text-primary">
              تم إرسال الرمز إلى: <span dir="ltr" className="text-base">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mt-4 animate-in fade-in rounded-2xl border-2 border-destructive/20 bg-destructive/10 p-4 text-center text-sm font-bold text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* OTP Input */}
            <div className="space-y-1.5 group">
              <label htmlFor="otp" className="text-sm font-bold text-foreground transition-colors group-focus-within:text-primary">
                رمز التحقق (6 أرقام)
              </label>
              <div className="relative">
                <KeyRound className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                  required
                  dir="ltr"
                  placeholder="000000"
                  className="w-full rounded-2xl border-2 border-border bg-background/50 py-3.5 pl-4 pr-12 text-center text-2xl font-black tracking-[0.8em] outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 hover:border-primary/50"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5 group">
              <label htmlFor="password" className="text-sm font-bold text-foreground transition-colors group-focus-within:text-primary">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                  dir="ltr"
                  placeholder="8 أحرف على الأقل"
                  className="w-full rounded-2xl border-2 border-border bg-background/50 py-3.5 pl-12 pr-12 text-base font-bold text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 hover:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5 group">
              <label htmlFor="confirmPassword" className="text-sm font-bold text-foreground transition-colors group-focus-within:text-primary">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                  dir="ltr"
                  placeholder="أعد كتابة كلمة المرور"
                  className="w-full rounded-2xl border-2 border-border bg-background/50 py-3.5 pl-4 pr-12 text-base font-bold text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/20 hover:border-primary/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-lg font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform group-hover:translate-x-full duration-1000 ease-in-out" />
              {isLoading ? (
                <span className="h-6 w-6 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              ) : (
                <>
                  <ArrowLeft className="h-5 w-5" />
                  تحديث كلمة المرور
                </>
              )}
            </button>
          </form>

          <Link to="/forgot-password" className="mt-6 block text-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            لم يصلني الرمز — إرسال مجدداً
          </Link>
        </div>
      </div>
    </main>
  );
};
