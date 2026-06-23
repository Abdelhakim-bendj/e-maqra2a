import { useAuthStore } from '../../store/authStore';
import { Mail, Shield, User, Award, Camera, Loader2, Globe, Phone, Lock, Edit, MessageSquare } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { apiCall } from '../../services/api';
import { useLangStore } from '../../store/langStore';
import { ImageCropper } from '../../components/ui/ImageCropper';

export const Profile = () => {
  const { user, setUser } = useAuthStore();
  const { t, language, setLanguage } = useLangStore();

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [editName, setEditName] = useState(user?.fullName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editBio, setEditBio] = useState(user?.bio || '');

  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [helpMessage, setHelpMessage] = useState('');

  // Theme toggle
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const roleLabels = {
    ADMIN: t('profile.role') + ': مدير',
    TEACHER: t('profile.role') + ': معلم',
    STUDENT: t('profile.role') + ': طالب',
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة يجب أن لا يتجاوز 2 ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCropSrc(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (base64Str: string) => {
    setCropSrc(null);
    setIsUploading(true);
    try {
      const res = await apiCall<{ user: any }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ avatarUrl: base64Str, fullName: user?.fullName, phone: user?.phone }),
      });
      if (user) {
        setUser(res.user);
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiCall<{ user: any }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName: editName, phone: editPhone, bio: editBio, avatarUrl: user?.avatarUrl }),
      });
      setUser(res.user);
      setShowEditInfo(false);
      alert(t('profile.save') + ' بنجاح');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert(t('profile.confirm_password') + ' غير متطابق');
      return;
    }
    setLoading(true);
    try {
      await apiCall('/auth/update-password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      setShowEditPass(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert(t('profile.save') + ' بنجاح');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiCall('/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: 'رسالة مساعدة من ' + user?.fullName,
          message: helpMessage,
          type: 'PRIVATE',
          recipientRole: 'ADMIN'
        }),
      });
      setShowHelp(false);
      setHelpMessage('');
      alert(t('profile.save') + ' بنجاح');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-10">
      {cropSrc && (
        <ImageCropper 
          imageSrc={cropSrc} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setCropSrc(null)} 
        />
      )}
      {/* Header Profile Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-card border-2 border-border p-8 shadow-sm text-center flex flex-col items-center">
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center mb-6 group">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 text-primary border-4 border-card shadow-xl overflow-hidden transition-all duration-300 group-hover:shadow-primary/20">
            {isUploading ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-6xl font-black">{user.fullName.charAt(0)}</span>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]"
            >
              <Camera className="h-8 w-8 text-white" />
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-foreground tracking-tight">{user.fullName}</h1>
        <span className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-secondary/10 px-5 py-2 text-sm font-black text-secondary">
          <Award className="h-5 w-5" />
          {roleLabels[user.role as keyof typeof roleLabels] || user.role}
        </span>
      </div>

      {/* Info Details */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-[2rem] bg-card border-2 border-border p-6 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:border-primary/20 cursor-pointer" onClick={() => setShowEditInfo(true)}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <User className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">{t('profile.name')}</p>
              <p className="mt-1 text-lg font-black text-foreground">{user.fullName}</p>
            </div>
          </div>
          <Edit className="h-5 w-5 text-muted-foreground opacity-50" />
        </div>

        <div className="rounded-[2rem] bg-card border-2 border-border p-6 shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Mail className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground">{t('profile.email')}</p>
            <p className="mt-1 text-lg font-black text-foreground truncate">{user.email}</p>
          </div>
        </div>

        <div className="rounded-[2rem] bg-card border-2 border-border p-6 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:border-primary/20 cursor-pointer" onClick={() => setShowEditInfo(true)}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <Phone className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">{t('profile.phone')}</p>
              <p className="mt-1 text-lg font-black text-foreground truncate">{user.phone || '---'}</p>
            </div>
          </div>
          <Edit className="h-5 w-5 text-muted-foreground opacity-50" />
        </div>

        <div className="sm:col-span-2 rounded-[2rem] bg-card border-2 border-border p-6 shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-md hover:border-primary/20 cursor-pointer" onClick={() => setShowEditInfo(true)}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-muted-foreground">النبذة الشخصية (Bio)</p>
            <Edit className="h-5 w-5 text-muted-foreground opacity-50" />
          </div>
          <p className="text-base font-bold text-foreground leading-relaxed whitespace-pre-wrap">{user.bio || 'لا توجد نبذة شخصية أو تفاصيل مضافة حتى الآن.'}</p>
        </div>

        <div className="rounded-[2rem] bg-card border-2 border-border p-6 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:border-primary/20 cursor-pointer" onClick={() => setShowEditPass(true)}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <Lock className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">{t('profile.change_password')}</p>
              <p className="mt-1 text-lg font-black text-foreground">********</p>
            </div>
          </div>
          <Edit className="h-5 w-5 text-muted-foreground opacity-50" />
        </div>
      </div>

      {/* Settings / Preferences */}
      <div className="rounded-[2.5rem] bg-card border-2 border-border p-8 shadow-sm">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          {t('profile.preferences')}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">{t('profile.language')}</label>
            <select
              className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 font-bold text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
            >
              <option value="ar">العربية (Arabic)</option>
              <option value="en">English (الإنجليزية)</option>
              <option value="fr">Français (الفرنسية)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">{t('profile.theme')}</label>
            <div
              className="w-full flex items-center justify-between rounded-2xl border-2 border-border bg-background px-4 py-3 font-bold text-foreground cursor-pointer hover:bg-muted"
              onClick={toggleTheme}
            >
              <span>{isDark ? 'داكن (Dark)' : 'فاتح (Light)'}</span>
              <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${isDark ? 'bg-primary' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDark ? 'translate-x-0' : '-translate-x-6'}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 w-full justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 py-4 rounded-2xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            {t('profile.help_center')}
          </button>
        </div>
      </div>

      {/* --- MODALS --- */}

      {showEditInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card rounded-[2rem] p-8 shadow-2xl border-2 border-border animate-in zoom-in-95">
            <h3 className="text-xl font-black mb-6">{t('profile.update_info')}</h3>
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">{t('profile.name')}</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} required className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t('profile.phone')}</label>
                <input value={editPhone} onChange={e => setEditPhone(e.target.value)} type="tel" dir="ltr" className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background text-right" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">النبذة الشخصية / المؤهلات</label>
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={4} className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background resize-none" placeholder="اكتب نبذة عنك، مؤهلاتك، إجازاتك..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold flex justify-center">{loading ? <Loader2 className="animate-spin w-6 h-6" /> : t('profile.save')}</button>
                <button type="button" onClick={() => setShowEditInfo(false)} className="flex-1 bg-muted text-muted-foreground py-3 rounded-xl font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card rounded-[2rem] p-8 shadow-2xl border-2 border-border animate-in zoom-in-95">
            <h3 className="text-xl font-black mb-6">{t('profile.change_password')}</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">{t('profile.old_password')}</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t('profile.new_password')}</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t('profile.confirm_password')}</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold flex justify-center">{loading ? <Loader2 className="animate-spin w-6 h-6" /> : t('profile.save')}</button>
                <button type="button" onClick={() => setShowEditPass(false)} className="flex-1 bg-muted text-muted-foreground py-3 rounded-xl font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card rounded-[2rem] p-8 shadow-2xl border-2 border-border animate-in zoom-in-95">
            <h3 className="text-xl font-black mb-2">{t('profile.help_center')}</h3>
            <p className="text-muted-foreground text-sm mb-6">{t('profile.help_desc')}</p>
            <form onSubmit={handleSendHelp} className="space-y-4">
              <textarea
                value={helpMessage}
                onChange={e => setHelpMessage(e.target.value)}
                required
                className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background h-32 resize-none"
              />
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold flex justify-center">{loading ? <Loader2 className="animate-spin w-6 h-6" /> : t('profile.send_admin')}</button>
                <button type="button" onClick={() => setShowHelp(false)} className="flex-1 bg-muted text-muted-foreground py-3 rounded-xl font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
