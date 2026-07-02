import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSend = async () => {
    if (!email) { setError('يرجى إدخال بريدك الإلكتروني'); return; }
    setError(''); setLoading(true);
    try {
      // Send a 6-digit OTP to the user's email via Supabase
      const { error: supabaseError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });

      // Don't reveal if the email exists — always show success for security
      if (supabaseError && !supabaseError.message.includes('User not found')) {
        throw new Error(supabaseError.message);
      }

      setIsSent(true);
    } catch (err: any) {
      setError(err.message || 'تعذر إرسال رمز التحقق.');
    } finally { setLoading(false); }
  };

  const handleContinue = () => {
    router.push({ pathname: '/(auth)/reset-password', params: { email } });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">

        {!isSent ? (
          <>
            <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-2xl bg-green-100 items-center justify-center mb-4">
                <Text className="text-3xl">📧</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                استعادة كلمة المرور
              </Text>
              <Text className="text-sm text-gray-500 text-center mt-2">
                أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق
              </Text>
            </View>

            {error ? (
              <Text className="text-red-500 text-sm text-center mb-4 bg-red-50 p-3 rounded-xl">
                {error}
              </Text>
            ) : null}

            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">
                البريد الإلكتروني
              </Text>
              <TextInput
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-base bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
                textAlign="left"
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={loading}
              className="w-full bg-primary-700 py-4 rounded-xl items-center mb-4"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-bold">إرسال رمز التحقق</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} className="items-center py-2">
              <Text className="text-primary-700 text-sm font-semibold">العودة إلى تسجيل الدخول</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Success state */
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-5">
              <Text className="text-4xl">✅</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              تم إرسال الرمز!
            </Text>
            <Text className="text-sm text-gray-500 text-center mt-3 leading-6">
              إذا كان البريد <Text className="text-green-700 font-bold">{email}</Text> مسجلاً لدينا،
              {'\n'}ستصله رسالة تحتوي على رمز مؤلف من 6 أرقام.
            </Text>
            <Text className="text-xs text-gray-400 text-center mt-2">
              تحقق من مجلد البريد المزعج (Spam) إن لم تجده.
            </Text>

            <TouchableOpacity
              onPress={handleContinue}
              className="w-full bg-primary-700 py-4 rounded-xl items-center mt-8"
            >
              <Text className="text-white text-lg font-bold">أدخل رمز التحقق</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setIsSent(false); setError(''); }}
              className="items-center py-3 mt-2"
            >
              <Text className="text-gray-500 text-sm font-semibold">إرسال مرة أخرى</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
