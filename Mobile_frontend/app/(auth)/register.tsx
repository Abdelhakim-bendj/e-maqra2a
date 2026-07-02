import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../lib/api';
import { supabase } from '../../lib/supabase';
import type { AuthResponse } from '../../types';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s: any) => s.login);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword || !phone) { setError('يرجى ملء جميع الحقول'); return; }
    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return; }
    try {
      setError(''); setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
            throw new Error('البريد الإلكتروني مسجل بالفعل.');
        }
        if (authError.message.toLowerCase().includes('rate limit')) {
            throw new Error('تم تجاوز الحد المسموح به. يرجى الانتظار قليلاً أو تعطيل تأكيد البريد من Supabase.');
        }
        throw new Error(authError.message);
      }

      if (!authData.session) {
        throw new Error('فشل التسجيل. قد تحتاج إلى تأكيد بريدك الإلكتروني. تحقق من بريدك ثم سجل الدخول.');
      }

      await apiClient.post('/auth/sync-profile', { fullName, role }, {
        headers: { Authorization: `Bearer ${authData.session.access_token}` },
      });

      const res = await apiClient.get('/auth/profile', {
        headers: { Authorization: `Bearer ${authData.session.access_token}` },
      });
      const { user } = res.data;
      await login(user, authData.session.access_token);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'فشل إنشاء الحساب.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6 py-8">
        <View className="items-center mb-8">
          <View className="w-20 h-20 mb-4 overflow-hidden bg-transparent items-center justify-center">
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">إنشاء حساب جديد</Text>
          <Text className="text-base text-gray-500 mt-2">انضم إلى المقرأة الإلكترونية</Text>
        </View>

        {error ? <Text className="text-red-500 text-sm text-center mb-4 bg-red-50 p-3 rounded-xl">{error}</Text> : null}

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">الاسم الكامل</Text>
          <TextInput className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-base bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-right" placeholder="أدخل اسمك الكامل" value={fullName} onChangeText={setFullName} placeholderTextColor="#9ca3af" />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">البريد الإلكتروني</Text>
          <TextInput className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-base bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-right" placeholder="أدخل بريدك الإلكتروني" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9ca3af" />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">رقم الهاتف</Text>
          <TextInput className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-base bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-right" placeholder="أدخل رقم الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#9ca3af" />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">كلمة المرور</Text>
          <TextInput className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-base bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-right" placeholder="أدخل كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#9ca3af" />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">تأكيد كلمة المرور</Text>
          <TextInput className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-base bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-right" placeholder="أعد إدخال كلمة المرور" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholderTextColor="#9ca3af" />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">نوع الحساب</Text>
          <View className="flex-row gap-3">
            {(['STUDENT', 'TEACHER'] as const).map((r) => (
              <TouchableOpacity key={r} onPress={() => setRole(r)} className={`flex-1 py-3.5 rounded-xl border-2 items-center ${role === r ? 'border-primary-600 bg-primary-50' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950'}`}>
                <Text className={`font-bold ${role === r ? 'text-primary-700' : 'text-gray-500'}`}>{r === 'STUDENT' ? 'طالب' : 'معلم'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={handleRegister} disabled={loading} className="w-full bg-primary-700 py-4 rounded-xl items-center mb-4">
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">إنشاء الحساب</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} className="items-center py-2">
          <Text className="text-primary-700 text-sm font-semibold">لديك حساب بالفعل؟ سجل الدخول</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
