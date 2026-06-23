import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle2, Shield, Zap, TrendingUp, Users, Target } from 'lucide-react';
import logoUrl from '../../assets/logo.png';

export const LandingPage = () => {
  return (
    <main className="relative flex min-h-screen flex-col w-full overflow-hidden bg-background font-sans text-foreground" dir="rtl">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] h-[40vw] w-[40vw] animate-[spin_20s_linear_infinite] rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40vw] w-[40vw] animate-[spin_25s_linear_infinite_reverse] rounded-full bg-accent/10 blur-[100px]" />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 lg:px-16">
        <div className="flex items-center gap-3 group">
          <div className="flex h-12 w-16 items-center justify-center bg-transparent transition-transform group-hover:scale-105">
            <img src={logoUrl} alt="E-Maqra2a Logo" className="h-full w-full object-contain drop-shadow-sm" />
          </div>
          <span className="text-2xl font-black tracking-tight text-foreground">منصة التعلم الذكية</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            تسجيل الدخول
          </Link>
          <Link to="/register" className="rounded-2xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-105 active:scale-95">
            ابدأ رحلتك مجاناً
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex min-h-[90vh] flex-col items-center justify-center px-4 pt-10 pb-20 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-primary/20 bg-primary/5 px-6 py-3 text-base font-black text-primary animate-in slide-in-from-bottom-4 duration-700 shadow-sm backdrop-blur-sm">
          <Sparkles className="h-6 w-6 text-amber-500" />
          الجيل الجديد من منصات التعليم
        </div>

        <h1 className="mt-12 max-w-5xl text-6xl font-black leading-tight tracking-tight text-foreground sm:text-7xl lg:text-8xl drop-shadow-sm animate-in slide-in-from-bottom-6 duration-700 delay-100">
          ابنِ مستقبلك، <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">خطوة بخطوة 🚀</span>
        </h1>

        <p className="mt-10 max-w-3xl text-xl sm:text-2xl font-bold text-muted-foreground leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-200">
          منصة تعليمية متكاملة تجمع بين التقنية الحديثة وأساليب التعلم التفاعلية. تتبع تقدمك، شارك في التحديات، واكسب النقاط أثناء تعلمك في بيئة محفزة.
        </p>

        <div className="mt-16 flex flex-col sm:flex-row gap-6 w-full sm:w-auto justify-center animate-in fade-in duration-1000 delay-300">
          <Link to="/register" className="group relative flex items-center justify-center gap-4 rounded-[2rem] bg-primary px-10 py-5 text-2xl font-black text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-primary/30 transition-all hover:scale-105 active:scale-95">
            أنشئ حسابك مجاناً
            <ArrowLeft className="h-8 w-8 transition-transform group-hover:-translate-x-2" />
          </Link>
          <Link to="/login" className="flex items-center justify-center rounded-[2rem] border-4 border-border bg-card px-10 py-5 text-2xl font-black text-foreground transition-all hover:bg-muted hover:border-primary/20 active:scale-95">
            تسجيل الدخول
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 border-y border-border bg-card/40 backdrop-blur-sm py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            {[
              { label: 'طالب نشط', value: '+10,000' },
              { label: 'دورة تعليمية', value: '+500' },
              { label: 'مهمة منجزة', value: '+50K' },
              { label: 'معلم خبير', value: '+200' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center space-y-2">
                <span className="text-4xl sm:text-5xl font-black text-primary">{stat.value}</span>
                <span className="text-lg font-bold text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        <div className="text-center mb-20 animate-in slide-in-from-bottom-10 duration-700">
          <h2 className="text-4xl font-black text-foreground sm:text-5xl lg:text-6xl mb-6">لماذا تختار منصتنا؟</h2>
          <p className="text-xl text-muted-foreground font-bold max-w-2xl mx-auto">صممنا كل جزء من المنصة لتوفير تجربة تعليمية لا تُنسى تجمع بين المتعة والفائدة.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'تتبع تقدمك اليومي',
              desc: 'لوحة تحكم ذكية تعرض إحصائياتك ومهامك اليومية بوضوح لتشجيعك على الاستمرار.',
              icon: CheckCircle2,
              color: 'text-emerald-600',
              bg: 'bg-emerald-100',
            },
            {
              title: 'نظام النقاط والمكافآت',
              desc: 'العب وتعلم! اكسب النقاط عند إنجاز مهامك واستبدلها بمكافآت وتصميمات مخصصة.',
              icon: Zap,
              color: 'text-amber-600',
              bg: 'bg-amber-100',
            },
            {
              title: 'آمنة ومستقلة',
              desc: 'بياناتك مشفرة ومحفوظة. نظام يعتمد على بيئة تعليمية آمنة وموثوقة لكل طالب.',
              icon: Shield,
              color: 'text-blue-600',
              bg: 'bg-blue-100',
            },
          ].map((feature, i) => (
            <div key={i} className="group relative overflow-hidden rounded-[2.5rem] border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl duration-300">
              <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${feature.bg} ${feature.color} shadow-inner transition-transform group-hover:scale-110`}>
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-black text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground font-bold leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative z-10 bg-primary/5 py-32 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-foreground sm:text-5xl lg:text-6xl mb-6">كيف تبدأ رحلتك؟</h2>
          </div>
          <div className="grid gap-12 sm:grid-cols-3 relative">
            {/* Connecting Line */}
            <div className="hidden sm:block absolute top-12 left-1/6 right-1/6 h-2 bg-gradient-to-l from-primary/20 to-accent/20 rounded-full z-0" />
            
            {[
              { icon: Users, title: 'سجل مجاناً', desc: 'قم بإنشاء حسابك في أقل من دقيقة وانضم لمجتمعنا.' },
              { icon: Target, title: 'اختر مسارك', desc: 'تصفح الدورات والمناهج وابدأ في ما يناسب مستواك.' },
              { icon: TrendingUp, title: 'تطور ونافس', desc: 'أنجز مهامك، تصدر لوحة الشرف، واكسب الجوائز!' },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl border-8 border-background text-3xl font-black">
                  <step.icon className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground mb-3">{step.title}</h3>
                  <p className="text-lg text-muted-foreground font-bold leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="relative z-10 mt-auto border-t border-border bg-card/80 py-24 text-center backdrop-blur-xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-8 drop-shadow-sm">هل أنت مستعد لبدء التعلم؟</h2>
        <p className="text-xl text-muted-foreground font-bold mb-12 max-w-2xl mx-auto">انضم الآن وكن جزءاً من أكبر مجتمع تعليمي تفاعلي في العالم العربي.</p>
        <Link to="/register" className="inline-block rounded-[2rem] bg-foreground px-12 py-5 text-2xl font-black text-background shadow-xl transition-all hover:scale-105 active:scale-95 hover:bg-primary hover:text-primary-foreground hover:shadow-primary/30">
          انضم إلينا الآن
        </Link>
        <p className="mt-20 text-base font-bold text-slate-400">© 2026 منصة التعلم الذكية. جميع الحقوق محفوظة.</p>
      </footer>
    </main>
  );
};
