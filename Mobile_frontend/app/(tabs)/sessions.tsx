import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import type { Session } from '../../types';

const sessionTypeLabel: Record<string, string> = {
  MEMORIZATION: 'تسميع',
  TAJWEED: 'تجويد',
  EDUCATIONAL: 'درس',
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'جارية الآن', color: '#047857', bg: '#d1fae5' },
  COMPLETED: { label: 'مكتملة', color: '#4b5563', bg: '#f3f4f6' },
  SCHEDULED: { label: 'مجدولة', color: '#b45309', bg: '#fef3c7' },
};

export default function SessionsScreen() {
  const user = useAuthStore((s: any) => s.user);
  const qc = useQueryClient();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => apiClient.get('/sessions').then((r: any) => r.data.sessions as Session[]),
  });

  const startSession = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/sessions/${id}/status`, { status: 'ACTIVE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const endSession = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/sessions/${id}/status`, { status: 'COMPLETED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ['sessions'] });
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-950"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
    >
      {(!sessions || sessions.length === 0) && (
        <View className="py-16 items-center">
          <Ionicons name="videocam-outline" size={48} color="#d1d5db" />
          <Text className="mt-4 text-gray-400 font-bold text-base">لا توجد جلسات حية مجدولة حالياً</Text>
        </View>
      )}

      <View className="space-y-4">
        {sessions?.map((session: Session) => {
          const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
          const sc = statusConfig[session.status] || statusConfig.SCHEDULED;
          const d = new Date(session.scheduledAt);
          const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          const dateStr = `${d.getDate()} ${arabicMonths[d.getMonth()]}`;
          const participantPercent = Math.min(100, Math.round((session._count.attendances / session.maxParticipants) * 100));

          return (
            <View key={session.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 mb-4 shadow-sm overflow-hidden">
              {/* Header: Teacher & Status */}
              <View className="flex-row items-center justify-between p-4 pb-3 border-b border-gray-50">
                <View className="flex-row items-center" style={{ gap: 10 }}>
                  <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center border-2 border-emerald-50">
                    <Text className="text-lg font-black text-emerald-700">{session.teacher.fullName.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-gray-900 dark:text-white">{session.teacher.fullName}</Text>
                    <Text className="text-xs font-bold text-gray-400">معلم الحلقة</Text>
                  </View>
                </View>
                <View className="px-3 py-1.5 rounded-2xl" style={{ backgroundColor: sc.bg }}>
                  <Text className="text-xs font-black" style={{ color: sc.color }}>{sc.label}</Text>
                </View>
              </View>

              {/* Body: Title, Type, Time */}
              <View className="p-4 pb-2">
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="flex-1 text-lg font-black text-gray-900 dark:text-white leading-tight">{session.title}</Text>
                  <View className="ml-3 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-100">
                    <Text className="text-xs font-black text-blue-600">{sessionTypeLabel[session.sessionType] || session.sessionType}</Text>
                  </View>
                </View>

                {session.description && (
                  <Text className="text-sm text-gray-500 mb-4 leading-relaxed" numberOfLines={2}>{session.description}</Text>
                )}

                <View className="flex-row items-center bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl mb-4" style={{ gap: 16 }}>
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Ionicons name="calendar" size={18} color="#047857" />
                    <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">{dateStr}</Text>
                  </View>
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Ionicons name="time" size={18} color="#047857" />
                    <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">{timeStr}</Text>
                  </View>
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Ionicons name="hourglass" size={18} color="#047857" />
                    <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">{session.durationMinutes} د</Text>
                  </View>
                </View>

                {/* Progress Indicator */}
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-xs font-bold text-gray-500">المقاعد المشغولة</Text>
                    <Text className="text-xs font-black text-gray-700 dark:text-gray-300">{session._count.attendances} / {session.maxParticipants}</Text>
                  </View>
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View className="h-full rounded-full" style={{ width: `${participantPercent}%`, backgroundColor: participantPercent > 90 ? '#ef4444' : '#0ea5e9' }} />
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row items-center justify-end pt-1" style={{ gap: 10 }}>
                  {session.status === 'ACTIVE' && session.meetingUrl && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(session.meetingUrl!)}
                      className="flex-1 flex-row justify-center items-center bg-emerald-600 py-3 rounded-2xl shadow-sm"
                      style={{ gap: 6 }}
                    >
                      <Ionicons name="videocam" size={18} color="#fff" />
                      <Text className="text-white text-sm font-black">الانضمام للجلسة</Text>
                    </TouchableOpacity>
                  )}
                  
                  {user?.role !== 'STUDENT' && session.status === 'SCHEDULED' && (
                    <TouchableOpacity
                      onPress={() => startSession.mutate(session.id)}
                      className="flex-1 items-center bg-emerald-100 py-3 rounded-2xl"
                    >
                      <Text className="text-emerald-700 text-sm font-black">بدء الجلسة</Text>
                    </TouchableOpacity>
                  )}
                  
                  {user?.role !== 'STUDENT' && session.status === 'ACTIVE' && (
                    <TouchableOpacity
                      onPress={() => endSession.mutate(session.id)}
                      className="flex-row items-center justify-center bg-red-50 py-3 px-4 rounded-2xl border border-red-100"
                      style={{ gap: 6 }}
                    >
                      <Ionicons name="stop-circle" size={18} color="#ef4444" />
                      <Text className="text-red-600 text-sm font-black">إنهاء</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {user?.role !== 'STUDENT' && (
        <TouchableOpacity
          onPress={() => router.push('/manage-session')}
          className="absolute bottom-6 left-6 w-14 h-14 bg-emerald-600 rounded-full items-center justify-center shadow-lg shadow-emerald-600/30"
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
