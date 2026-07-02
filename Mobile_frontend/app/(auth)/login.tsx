import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import apiClient from '../../lib/api';
import type { User } from '../../types';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email || !password) { setError('يرجى ملء جميع الحقول'); return; }
    try {
      setError(''); setLoading(true);

      // 1. Sign in via Supabase Auth directly
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }
        throw new Error(authError.message);
      }

      if (!authData.session) {
        throw new Error('فشل تسجيل الدخول. قد تحتاج إلى تأكيد بريدك الإلكتروني أولاً. تحقق من بريدك ثم حاول مجدداً.');
      }

      // 2. Fetch backend profile using the Supabase JWT
      const profileRes = await apiClient.get('/auth/profile', {
        headers: { Authorization: `Bearer ${authData.session.access_token}` },
      });
      const user = profileRes.data.user as User;

      // 3. Store session in SecureStore via auth store
      await login(user, authData.session.access_token);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">
        <View className="items-center mb-10">
          <View className="w-28 h-28 mb-4 overflow-hidden bg-transparent items-center justify-center">
            <Image
              source={require('../../assets/images/logo.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">المقرأة الإلكترونية</Text>
          <Text className="text-base text-gray-500 mt-2">سجل دخولك لمتابعة رحلتك التعليمية</Text>
        </View>

        {error ? <Text className="text-red-500 text-sm text-center mb-4 bg-red-50 p-3 rounded-xl">{error}</Text> : null}

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">البريد الإلكتروني</Text>
          <TextInput
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-base bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-right"
            placeholder="أدخل بريدك الإلكتروني"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">كلمة المرور</Text>
          <TextInput
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-base bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-right"
            placeholder="أدخل كلمة المرور"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Forgot Password link */}
        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} className="items-end mb-5">
          <Text className="text-primary-700 text-sm font-semibold">نسيت كلمة المرور؟</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className="w-full bg-primary-700 py-4 rounded-xl items-center mb-4"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-bold">تسجيل الدخول</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="items-center py-2">
          <Text className="text-primary-700 text-sm font-semibold">ليس لديك حساب؟ سجل الآن</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
