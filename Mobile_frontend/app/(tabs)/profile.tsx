import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Switch, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import apiClient from '../../lib/api';
import * as DocumentPicker from 'expo-document-picker';
import { useLangStore, Language } from '../../store/langStore';

const roleLabels: Record<string, string> = {
  ADMIN: 'مدير المنصة',
  TEACHER: 'معلم',
  STUDENT: 'طالب',
};

function ProfileMenuItem({ icon, title, color, onPress, isDestructive = false, rightElement }: any) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress && !rightElement} className="flex-row items-center justify-between py-4 border-b border-gray-50 dark:border-gray-800" style={{ borderBottomWidth: 1 }}>
      <View className="flex-row items-center" style={{ gap: 14 }}>
        <View className="w-11 h-11 rounded-2xl items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text className={`text-base font-bold ${isDestructive ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{title}</Text>
      </View>
      {rightElement ? rightElement : <Ionicons name="chevron-back" size={20} color="#9ca3af" />}
    </TouchableOpacity>
  );
}

function ProfileSection({ title, children }: any) {
  return (
    <View className="mb-6">
      <Text className="text-sm font-black text-gray-500 dark:text-gray-400 mb-3 mx-2">{title}</Text>
      <View className="bg-white dark:bg-gray-900 rounded-3xl px-4 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {children}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, login, logout } = useAuthStore();
  const { t, language, setLanguage } = useLangStore();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useColorScheme();

  const [passwordModal, setPasswordModal] = useState(false);
  const [infoModal, setInfoModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const [editName, setEditName] = useState(user?.fullName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [infoLoading, setInfoLoading] = useState(false);

  const [helpMessage, setHelpMessage] = useState('');
  const [helpLoading, setHelpLoading] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'نعم',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const nav = (path: string) => router.push(path as any);

  const handleLanguageChange = () => {
    Alert.alert('اختيار اللغة (Language)', 'اختر لغة التطبيق المفضلة:', [
      { text: 'العربية (Arabic)', onPress: () => setLanguage('ar') },
      { text: 'English (الإنجليزية)', onPress: () => setLanguage('en') },
      { text: 'Français (الفرنسية)', onPress: () => setLanguage('fr') },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const updatePassword = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) { Alert.alert('يرجى ملء جميع الحقول'); return; }
    if (newPassword !== confirmNewPassword) { Alert.alert('خطأ', 'كلمتا المرور الجديدة غير متطابقتين'); return; }
    try {
      setPassLoading(true);
      await apiClient.put('/auth/update-password', { oldPassword, newPassword });
      Alert.alert('نجاح', 'تم تغيير كلمة المرور بنجاح');
      setPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      Alert.alert('خطأ', err.message);
    } finally {
      setPassLoading(false);
    }
  };

  const updateInfo = async () => {
    if (!editName) { Alert.alert('يرجى كتابة الاسم'); return; }
    try {
      setInfoLoading(true);
      const res = await apiClient.put('/auth/profile', { fullName: editName, phone: editPhone });
      login(res.data.user, apiClient.defaults.headers.common['Authorization']?.toString().replace('Bearer ', '') || '');
      Alert.alert('نجاح', 'تم تحديث البيانات بنجاح');
      setInfoModal(false);
    } catch (err: any) {
      Alert.alert('خطأ', err.message);
    } finally {
      setInfoLoading(false);
    }
  };

  const pickAvatar = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
      if (!result.canceled) {
        Alert.alert('نجاح', 'تم اختيار الصورة! (تحديث الصورة الفعلي يتطلب خادم)');
      }
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    }
  };

  const sendHelpMessage = async () => {
    if (!helpMessage) { Alert.alert('اكتب رسالة أولاً'); return; }
    try {
      setHelpLoading(true);
      await apiClient.post('/notifications/send', {
        title: 'رسالة مساعدة من ' + user.fullName,
        message: helpMessage,
        type: 'PRIVATE',
        recipientRole: 'ADMIN'
      });
      Alert.alert('نجاح', 'تم إرسال رسالتك للإدارة');
      setHelpModal(false);
      setHelpMessage('');
    } catch (err: any) {
      Alert.alert('خطأ', err.message);
    } finally {
      setHelpLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Profile Header Card */}
      <View className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 items-center shadow-sm mb-8">
        <View className="h-28 w-28 rounded-full bg-emerald-100 dark:bg-emerald-900 items-center justify-center mb-4 border-4 border-white dark:border-gray-900 shadow-md relative">
          <Text className="text-5xl font-black text-emerald-700 dark:text-emerald-400">{user.fullName.charAt(0)}</Text>
          <TouchableOpacity onPress={pickAvatar} className="absolute bottom-0 right-0 bg-emerald-600 w-8 h-8 rounded-full items-center justify-center border-2 border-white dark:border-gray-900">
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text className="text-2xl font-black text-gray-900 dark:text-white">{user.fullName}</Text>
        <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">{user.email}</Text>
        <View className="mt-4 flex-row items-center bg-emerald-50 dark:bg-emerald-900/40 px-4 py-2 rounded-2xl" style={{ gap: 6 }}>
          <Ionicons name="ribbon" size={18} color="#047857" />
          <Text className="text-sm font-black text-emerald-700 dark:text-emerald-400">{roleLabels[user.role]}</Text>
        </View>
      </View>

      {/* Account */}
      <ProfileSection title={t('profile.account')}>
        <ProfileMenuItem icon="person" title={t('profile.name')} color="#3b82f6" onPress={() => setInfoModal(true)} />
        <ProfileMenuItem icon="lock-closed" title={t('profile.change_password')} color="#8b5cf6" onPress={() => setPasswordModal(true)} />
      </ProfileSection>

      {/* Academic / Admin Management */}
      {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
        <ProfileSection title={user.role === 'ADMIN' ? 'الإدارة' : 'الأكاديمية'}>
          <ProfileMenuItem icon="people" title="الطلاب" color="#f59e0b" onPress={() => nav('/(tabs)/students')} />
          <ProfileMenuItem icon="videocam" title="الجلسات الحية" color="#10b981" onPress={() => nav('/(tabs)/sessions')} />
          <ProfileMenuItem icon="bar-chart" title="التقارير والإحصائيات" color="#f43f5e" onPress={() => nav('/(tabs)/reports')} />
          {user.role === 'ADMIN' && (
            <>
              <ProfileMenuItem icon="library" title="إدارة المحتوى" color="#6366f1" onPress={() => nav('/(tabs)/content')} />
              <ProfileMenuItem icon="settings" title="أدوات الإدارة" color="#475569" onPress={() => { }} />
            </>
          )}
        </ProfileSection>
      )}

      {/* Preferences */}
      <ProfileSection title={t('profile.preferences')}>
        <ProfileMenuItem icon="globe" title={t('profile.language')} color="#14b8a6" onPress={handleLanguageChange} />
        <ProfileMenuItem
          icon="color-palette"
          title={t('profile.theme')}
          color="#8b5cf6"
          rightElement={
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={toggleColorScheme}
              trackColor={{ false: '#d1d5db', true: '#10b981' }}
            />
          }
        />
      </ProfileSection>

      {/* Support */}
      <ProfileSection title={t('profile.support')}>
        <ProfileMenuItem icon="help-buoy" title={t('profile.help_center')} color="#0ea5e9" onPress={() => setHelpModal(true)} />
        <ProfileMenuItem icon="information-circle" title={t('profile.about')} color="#64748b" onPress={() => Linking.openURL('http://10.0.2.2:5173/')} />
      </ProfileSection>

      {/* Actions */}
      <ProfileSection title={t('profile.logout')}>
        <ProfileMenuItem icon="log-out" title={t('profile.logout')} color="#ef4444" isDestructive hideArrow onPress={handleLogout} />
      </ProfileSection>

      <Text className="text-center text-xs text-gray-400 mt-4 mb-10">الإصدار 1.0.0</Text>

      {/* --- MODALS --- */}

      {/* Info Modal */}
      <Modal visible={infoModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white dark:bg-gray-950 p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">المعلومات الشخصية</Text>
            <TouchableOpacity onPress={() => setInfoModal(false)}>
              <Ionicons name="close" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View className="mb-4">
            <Text className="text-gray-500 dark:text-gray-400 mb-2 font-bold">الاسم الكامل</Text>
            <TextInput value={editName} onChangeText={setEditName} className="border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl p-4 text-base font-bold" />
          </View>
          <View className="mb-6">
            <Text className="text-gray-500 dark:text-gray-400 mb-2 font-bold">رقم الهاتف</Text>
            <TextInput value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" className="border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl p-4 text-base font-bold" />
          </View>
          <TouchableOpacity onPress={updateInfo} disabled={infoLoading} className="bg-primary-600 rounded-xl p-4 items-center">
            {infoLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">حفظ التعديلات</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={passwordModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white dark:bg-gray-950 p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">تغيير كلمة المرور</Text>
            <TouchableOpacity onPress={() => setPasswordModal(false)}>
              <Ionicons name="close" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View className="mb-4">
            <Text className="text-gray-500 dark:text-gray-400 mb-2 font-bold">كلمة المرور الحالية</Text>
            <TextInput value={oldPassword} onChangeText={setOldPassword} secureTextEntry className="border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl p-4 text-base" />
          </View>
          <View className="mb-4">
            <Text className="text-gray-500 dark:text-gray-400 mb-2 font-bold">كلمة المرور الجديدة</Text>
            <TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry className="border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl p-4 text-base" />
          </View>
          <View className="mb-6">
            <Text className="text-gray-500 dark:text-gray-400 mb-2 font-bold">تأكيد كلمة المرور الجديدة</Text>
            <TextInput value={confirmNewPassword} onChangeText={setConfirmNewPassword} secureTextEntry className="border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl p-4 text-base" />
          </View>
          <TouchableOpacity onPress={updatePassword} disabled={passLoading} className="bg-primary-600 rounded-xl p-4 items-center">
            {passLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">تحديث كلمة المرور</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal visible={helpModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white dark:bg-gray-950 p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">مركز المساعدة</Text>
            <TouchableOpacity onPress={() => setHelpModal(false)}>
              <Ionicons name="close" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-600 dark:text-gray-400 mb-6 font-bold leading-relaxed">
            كيف يمكننا مساعدتك؟ يمكنك كتابة ملاحظاتك، شكواك، أو استفساراتك وسنقوم بالرد عليك في أقرب وقت.
          </Text>
          <View className="mb-6">
            <TextInput
              value={helpMessage}
              onChangeText={setHelpMessage}
              multiline
              className="border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl p-4 text-base h-40"
              style={{ textAlignVertical: 'top' }}
              placeholder="اكتب رسالتك هنا..."
              placeholderTextColor="#9ca3af"
            />
          </View>
          <TouchableOpacity onPress={sendHelpMessage} disabled={helpLoading} className="bg-emerald-600 rounded-xl p-4 items-center">
            {helpLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">إرسال للإدارة</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

    </ScrollView>
  );
}
