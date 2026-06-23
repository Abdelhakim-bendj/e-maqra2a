import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../lib/api';
import { quranSurahs } from '../../lib/utils';

interface StudentUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  studentProfile?: {
    currentJuz?: number;
    currentSurah?: number;
    class?: { name: string };
  };
}

export default function StudentsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users').then((r: any) => r.data.users as StudentUser[]),
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const students = (data ?? []).filter((u: StudentUser) => u.role === 'STUDENT');

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View className="mb-4">
        <Text className="text-xl font-black text-gray-900 flex-row items-center">
          <Ionicons name="people" size={22} color="#059669" /> إدارة الطلاب
        </Text>
        <Text className="mt-1 text-sm text-gray-500 font-medium">عرض بيانات وتقدم الطلاب المسجلين تحت إشرافك</Text>
      </View>

      {students.length === 0 ? (
        <View className="py-16 items-center">
          <Ionicons name="people-outline" size={48} color="#d1d5db" />
          <Text className="mt-4 text-gray-400 font-bold text-base">لا يوجد طلاب مسجلين</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {students.map((student) => {
            const surahName = student.studentProfile?.currentSurah
              ? quranSurahs[student.studentProfile.currentSurah - 1]?.name
              : null;
            const d = new Date(student.createdAt);
            const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

            return (
              <View key={student.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-black text-gray-900">{student.fullName}</Text>
                    <Text className="text-xs text-gray-500 mt-1">{student.email}</Text>
                  </View>
                  <View className={`px-2.5 py-1 rounded-full ${student.isActive ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    <Text className={`text-xs font-bold ${student.isActive ? 'text-emerald-700' : 'text-red-700'}`}>
                      {student.isActive ? 'نشط' : 'غير نشط'}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 8 }}>
                  {student.phone && (
                    <View className="flex-row items-center gap-1 mt-1">
                      <Ionicons name="call" size={12} color="#4b5563" />
                      <Text className="text-xs text-gray-600" style={{ textAlign: 'left' }}>{student.phone}</Text>
                    </View>
                  )}
                  {student.studentProfile?.class?.name && (
                    <View className="self-start px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-100">
                      <Text className="text-xs font-bold text-indigo-700">{student.studentProfile.class.name}</Text>
                    </View>
                  )}
                  {(student.studentProfile?.currentJuz || surahName) && (
                    <View className="flex-row items-center bg-emerald-50 px-2 py-1 rounded-lg self-start" style={{ gap: 4 }}>
                      <Ionicons name="book-outline" size={14} color="#047857" />
                      <Text className="text-xs font-bold text-emerald-700">
                        {student.studentProfile?.currentJuz ? `الجزء ${student.studentProfile.currentJuz}` : ''}
                        {student.studentProfile?.currentJuz && surahName ? ' - ' : ''}
                        {surahName ? `سورة ${surahName}` : ''}
                      </Text>
                    </View>
                  )}
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                    <Text className="text-xs text-gray-500">{dateStr}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
