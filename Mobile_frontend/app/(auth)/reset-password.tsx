import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async () => {
    if (!otp || otp.length < 6) { setError('يرجى إدخال رمز التحقق كاملاً (6 أرقام)'); return; }
    if (!password) { setError('يرجى إدخال كلمة المرور الجديدة'); return; }
    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return; }
    if (password.length < 8) { setError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل'); return; }

    setError(''); setLoading(true);
    try {
      // Step 1: Verify the OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email!,
        token: otp,
        type: 'email',
      });

      if (verifyError) {
        if (verifyError.message.includes('expired') || verifyError.message.includes('invalid')) {
          throw new Error('رمز التحقق غير صحيح أو منتهي الصلاحية. يرجى طلب رمز جديد.');
        }
        throw new Error(verifyError.message);
      }

      // Step 2: Update the password while we have a valid session
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);

      // Step 3: Sign out so user logs in fresh
      await supabase.auth.signOut();

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'تعذر تحديث كلمة المرور.');
    } finally { setLoading(false); }
  };

  if (!email) {
    router.replace('/(auth)/forgot-password');
    return null;
  }

  if (isSuccess) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 items-center justify-center px-6">
        <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-5">
          <Text className="text-4xl">✅</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
          تم تغيير كلمة المرور!
        </Text>
        <Text className="text-sm text-gray-500 text-center mt-3 leading-6">
          تم تحديث كلمة مرورك بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          className="w-full bg-primary-700 py-4 rounded-xl items-center mt-8"
        >
          <Text className="text-white text-lg font-bold">تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-green-100 items-center justify-center mb-4">
            <Text className="text-3xl">🔑</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            تعيين كلمة مرور جديدة
          </Text>
          <Text className="text-sm text-gray-500 text-center mt-2">
            أدخل الرمز المرسل إلى{' '}
            <Text className="text-green-700 font-bold">{email}</Text>
          </Text>
        </View>

        {error ? (
          <Text className="text-red-500 text-sm text-center mb-4 bg-red-50 p-3 rounded-xl">
            {error}
          </Text>
        ) : null}

        {/* OTP Field */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">
            رمز التحقق (6 أرقام)
          </Text>
          <TextInput
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-2xl font-black bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-center tracking-widest"
            placeholder="000000"
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* New Password */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">
            كلمة المرور الجديدة
          </Text>
          <TextInput
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-base bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white"
            placeholder="8 أحرف على الأقل"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Confirm Password */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">
            تأكيد كلمة المرور
          </Text>
          <TextInput
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-base bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white"
            placeholder="أعد كتابة كلمة المرور"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity
          onPress={handleReset}
          disabled={loading || otp.length < 6}
          className="w-full bg-primary-700 py-4 rounded-xl items-center mb-4"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-bold">تحديث كلمة المرور</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/forgot-password')}
          className="items-center py-2"
        >
          <Text className="text-gray-500 text-sm font-semibold">لم يصلني الرمز — إرسال مجدداً</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
