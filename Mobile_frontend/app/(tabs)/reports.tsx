import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface AdminReport {
  users: { total: number; students: number; teachers: number };
  content: { classes: number; tasks: number; completedTasks: number; exams: number; sessions: number };
  submissions: { total: number; avgScore: number | null };
  taskCompletionRate: number;
}

const statCards = [
  { key: 'users.total', label: 'إجمالي المستخدمين', icon: 'people' as const, color: '#2563eb', bg: '#eff6ff' },
  { key: 'users.students', label: 'الطلاب المسجلين', icon: 'school' as const, color: '#059669', bg: '#ecfdf5' },
  { key: 'users.teachers', label: 'المعلمين', icon: 'person' as const, color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'content.classes', label: 'الفصول الدراسية', icon: 'business' as const, color: '#ea580c', bg: '#fff7ed' },
  { key: 'taskCompletionRate', label: 'نسبة إنجاز المهام', icon: 'checkmark-done' as const, color: '#0d9488', bg: '#f0fdfa', suffix: '%' },
  { key: 'content.exams', label: 'الاختبارات', icon: 'document-text' as const, color: '#e11d48', bg: '#fff1f2' },
  { key: 'content.sessions', label: 'الجلسات الحية', icon: 'videocam' as const, color: '#4f46e5', bg: '#eef2ff' },
  { key: 'submissions.total', label: 'التسميعات المرفوعة', icon: 'mic' as const, color: '#0891b2', bg: '#ecfeff' },
];

function getNestedValue(obj: any, path: string): number {
  return path.split('.').reduce((o, k) => o?.[k], obj) ?? 0;
}

export default function ReportsScreen() {
  const user = useAuthStore((s: any) => s.user);

  const { data: report, isLoading } = useQuery({
    queryKey: ['admin-report'],
    queryFn: () => apiClient.get('/reports/admin').then((r: any) => r.data.data as AdminReport),
    enabled: user?.role === 'ADMIN',
  });

  if (user?.role !== 'ADMIN') {
    return (
      <View className="flex-1 items-center justify-center bg-white p-8">
        <Ionicons name="bar-chart-outline" size={48} color="#d1d5db" />
        <Text className="mt-4 text-gray-500 text-center font-bold">
          التقارير التفصيلية متاحة للمدراء حالياً. جاري العمل على تقارير المعلمين.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-xl font-black text-gray-900 mb-4">التقارير والإحصائيات</Text>

      <View className="flex-row flex-wrap" style={{ gap: 12 }}>
        {statCards.map((card) => {
          const value = getNestedValue(report, card.key);
          return (
            <View key={card.key} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex-row items-center" style={{ width: '48%', gap: 12 }}>
              <View className="h-11 w-11 rounded-xl items-center justify-center" style={{ backgroundColor: card.bg }}>
                <Ionicons name={card.icon} size={22} color={card.color} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-gray-500 mb-0.5">{card.label}</Text>
                <Text className="text-2xl font-black text-gray-900">
                  {value}{card.suffix || ''}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
