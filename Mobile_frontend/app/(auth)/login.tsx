import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../lib/api';
import type { AuthResponse } from '../../types';

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
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, token } = res.data as AuthResponse;
      await login(user, token);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">
        <View className="items-center mb-10">
          <View className="w-28 h-28 mb-4 overflow-hidden bg-transparent items-center justify-center">
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-3xl font-bold text-gray-900">المقرأة الإلكترونية</Text>
          <Text className="text-base text-gray-500 mt-2">سجل دخولك لمتابعة رحلتك التعليمية</Text>
        </View>

        {error ? <Text className="text-red-500 text-sm text-center mb-4 bg-red-50 p-3 rounded-xl">{error}</Text> : null}

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2 text-right">البريد الإلكتروني</Text>
          <TextInput
            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base bg-gray-50 text-right"
            placeholder="أدخل بريدك الإلكتروني"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2 text-right">كلمة المرور</Text>
          <TextInput
            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base bg-gray-50 text-right"
            placeholder="أدخل كلمة المرور"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#9ca3af"
          />
        </View>

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
