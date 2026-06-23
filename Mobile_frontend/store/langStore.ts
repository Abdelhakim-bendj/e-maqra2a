import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { I18nManager } from 'react-native';

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await SecureStore.getItemAsync(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export type Language = 'ar' | 'en' | 'fr';

interface LangState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    'profile.title': 'الملف الشخصي',
    'profile.email': 'البريد الإلكتروني',
    'profile.name': 'المعلومات الشخصية',
    'profile.role': 'الصلاحية',
    'profile.update_info': 'تحديث البيانات',
    'profile.phone': 'رقم الهاتف',
    'profile.change_password': 'تغيير كلمة المرور',
    'profile.old_password': 'كلمة المرور الحالية',
    'profile.new_password': 'كلمة المرور الجديدة',
    'profile.confirm_password': 'تأكيد كلمة المرور الجديدة',
    'profile.save': 'حفظ التعديلات',
    'profile.help_center': 'مركز المساعدة',
    'profile.help_desc': 'كيف يمكننا مساعدتك؟ يمكنك كتابة رسالتك وسنقوم بالرد عليك.',
    'profile.send_admin': 'إرسال للإدارة',
    'profile.preferences': 'التفضيلات والإعدادات',
    'profile.language': 'لغة التطبيق (Language)',
    'profile.theme': 'المظهر',
    'profile.account': 'الحساب الشخصي',
    'profile.logout': 'تسجيل الخروج',
    'profile.support': 'الدعم والمساعدة',
    'profile.about': 'عن التطبيق',
    'nav.dashboard': 'لوحة التحكم',
    'nav.tasks': 'المهام',
    'nav.exams': 'الاختبارات',
    'nav.submissions': 'التسميع',
    'nav.profile': 'حسابي',
    'nav.messages': 'الرسائل',
    'nav.sessions': 'الجلسات',
    'nav.content': 'المحتوى',
    'nav.notifications': 'الإشعارات',
    'nav.students': 'الطلاب',
    'nav.reports': 'التقارير',
    'nav.logout': 'تسجيل خروج',
  },
  en: {
    'profile.title': 'Profile',
    'profile.email': 'Email',
    'profile.name': 'Personal Info',
    'profile.role': 'Role',
    'profile.update_info': 'Update Info',
    'profile.phone': 'Phone Number',
    'profile.change_password': 'Change Password',
    'profile.old_password': 'Current Password',
    'profile.new_password': 'New Password',
    'profile.confirm_password': 'Confirm New Password',
    'profile.save': 'Save Changes',
    'profile.help_center': 'Help Center',
    'profile.help_desc': 'How can we help? Write your message and we will respond.',
    'profile.send_admin': 'Send to Admin',
    'profile.preferences': 'Preferences',
    'profile.language': 'App Language',
    'profile.theme': 'Theme',
    'profile.account': 'Account',
    'profile.logout': 'Logout',
    'profile.support': 'Support',
    'profile.about': 'About App',
    'nav.dashboard': 'Dashboard',
    'nav.tasks': 'Tasks',
    'nav.exams': 'Exams',
    'nav.submissions': 'Submissions',
    'nav.profile': 'Profile',
    'nav.messages': 'Messages',
    'nav.sessions': 'Sessions',
    'nav.content': 'Content',
    'nav.notifications': 'Notifications',
    'nav.students': 'Students',
    'nav.reports': 'Reports',
    'nav.logout': 'Logout',
  },
  fr: {
    'profile.title': 'Profil',
    'profile.email': 'E-mail',
    'profile.name': 'Infos Personnelles',
    'profile.role': 'Rôle',
    'profile.update_info': 'Mettre à jour',
    'profile.phone': 'Numéro de téléphone',
    'profile.change_password': 'Changer le mot de passe',
    'profile.old_password': 'Mot de passe actuel',
    'profile.new_password': 'Nouveau mot de passe',
    'profile.confirm_password': 'Confirmer le mot de passe',
    'profile.save': 'Enregistrer',
    'profile.help_center': 'Centre d\'aide',
    'profile.help_desc': 'Comment pouvons-nous aider ?',
    'profile.send_admin': 'Envoyer à l\'admin',
    'profile.preferences': 'Préférences',
    'profile.language': 'Langue de l\'application',
    'profile.theme': 'Thème',
    'profile.account': 'Compte',
    'profile.logout': 'Déconnexion',
    'profile.support': 'Support',
    'profile.about': 'À propos',
    'nav.dashboard': 'Tableau de bord',
    'nav.tasks': 'Tâches',
    'nav.exams': 'Examens',
    'nav.submissions': 'Soumissions',
    'nav.profile': 'Profil',
    'nav.messages': 'Messages',
    'nav.sessions': 'Sessions',
    'nav.content': 'Contenu',
    'nav.notifications': 'Notifications',
    'nav.students': 'Étudiants',
    'nav.reports': 'Rapports',
    'nav.logout': 'Déconnexion',
  }
};

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      language: 'ar',
      setLanguage: (lang) => {
        set({ language: lang });
        // Set layout direction
        const isRTL = lang === 'ar';
        if (I18nManager.isRTL !== isRTL) {
          I18nManager.forceRTL(isRTL);
          I18nManager.allowRTL(isRTL);
        }
      },
      t: (key) => {
        const lang = get().language;
        return translations[lang][key] || key;
      },
    }),
    {
      name: 'lang-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
