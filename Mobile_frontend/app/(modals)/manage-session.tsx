import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../lib/api';
import DateTimePickerModal from '../components/ui/DateTimePickerModal';

export default function ManageSessionScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    title: '',
    description: '',
    sessionType: 'MEMORIZATION' as 'MEMORIZATION' | 'TAJWEED' | 'EDUCATIONAL',
    scheduledAt: new Date(Date.now() + 3600000), // Next hour
    durationMinutes: 45,
    maxParticipants: 20,
    meetingUrl: '',
  });

  const [showPicker, setShowPicker] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/sessions', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err.message || 'حدث خطأ أثناء جدولة الجلسة');
    },
  });

  const handleSave = () => {
    if (!form.title.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان الجلسة');
      return;
    }
    createMutation.mutate({
      ...form,
      scheduledAt: form.scheduledAt.toISOString(),
      meetingUrl: form.meetingUrl || undefined,
    });
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Title */}
      <View className="mb-4">
        <Text className="mb-2 text-sm font-black text-gray-900">عنوان الجلسة</Text>
        <TextInput
          value={form.title}
          onChangeText={(t) => setForm({ ...form, title: t })}
          placeholder="أدخل عنوان الجلسة"
          className="bg-white border border-gray-200 rounded-xl p-3 font-bold"
        />
      </View>

      {/* Session Type */}
      <View className="mb-4">
        <Text className="mb-2 text-sm font-black text-gray-900">نوع الجلسة</Text>
        <View className="flex-row" style={{ gap: 8 }}>
          {(['MEMORIZATION', 'TAJWEED', 'EDUCATIONAL'] as const).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setForm({ ...form, sessionType: t })}
              className={`flex-1 py-3 rounded-xl border-2 items-center ${
                form.sessionType === t ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'
              }`}
            >
              <Text className={`font-bold text-xs ${form.sessionType === t ? 'text-emerald-700' : 'text-gray-500'}`}>
                {t === 'MEMORIZATION' ? 'تسميع' : t === 'TAJWEED' ? 'تجويد' : 'درس تربوي'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Scheduled At */}
      <View className="mb-4">
        <Text className="mb-2 text-sm font-black text-gray-900">تاريخ ووقت البدء</Text>
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          className="bg-white border border-gray-200 rounded-xl p-3 flex-row items-center justify-between"
        >
          <Text className="font-bold text-gray-700">
            {form.scheduledAt.toISOString().slice(0, 10)} {form.scheduledAt.getHours().toString().padStart(2, '0')}:{form.scheduledAt.getMinutes().toString().padStart(2, '0')}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#059669" />
        </TouchableOpacity>
        <DateTimePickerModal
          visible={showPicker}
          mode="datetime"
          value={form.scheduledAt}
          minimumDate={new Date()}
          onChange={(d) => setForm({ ...form, scheduledAt: d })}
          onClose={() => setShowPicker(false)}
        />
      </View>

      {/* Duration and Participants */}
      <View className="flex-row mb-4" style={{ gap: 12 }}>
        <View className="flex-1">
          <Text className="mb-2 text-sm font-black text-gray-900">المدة (دقائق)</Text>
          <TextInput
            value={String(form.durationMinutes)}
            onChangeText={(t) => setForm({ ...form, durationMinutes: parseInt(t) || 45 })}
            keyboardType="numeric"
            className="bg-white border border-gray-200 rounded-xl p-3 text-center font-bold"
          />
        </View>
        <View className="flex-1">
          <Text className="mb-2 text-sm font-black text-gray-900">الحد الأقصى للمشاركين</Text>
          <TextInput
            value={String(form.maxParticipants)}
            onChangeText={(t) => setForm({ ...form, maxParticipants: parseInt(t) || 20 })}
            keyboardType="numeric"
            className="bg-white border border-gray-200 rounded-xl p-3 text-center font-bold"
          />
        </View>
      </View>

      {/* Meeting URL */}
      <View className="mb-4">
        <Text className="mb-2 text-sm font-black text-gray-900">رابط الاجتماع (اختياري)</Text>
        <TextInput
          value={form.meetingUrl}
          onChangeText={(t) => setForm({ ...form, meetingUrl: t })}
          placeholder="https://meet.google.com/..."
          className="bg-white border border-gray-200 rounded-xl p-3 font-medium text-left"
          style={{ textAlign: 'left' }}
        />
      </View>

      {/* Description */}
      <View className="mb-6">
        <Text className="mb-2 text-sm font-black text-gray-900">الوصف (اختياري)</Text>
        <TextInput
          value={form.description}
          onChangeText={(t) => setForm({ ...form, description: t })}
          multiline
          numberOfLines={3}
          placeholder="تفاصيل الجلسة..."
          className="bg-white border border-gray-200 rounded-xl p-3 font-medium"
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={createMutation.isPending}
        className="bg-emerald-600 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-emerald-600/30"
        style={{ gap: 8 }}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="videocam" size={20} color="#fff" />
        )}
        <Text className="text-white font-black text-base">
          {createMutation.isPending ? 'جاري الجدولة...' : 'جدولة الجلسة'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
