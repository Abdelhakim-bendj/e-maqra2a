import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../lib/api';
import { quranSurahs } from '../../lib/utils';
import type { Task } from '../../types';

const taskTypeLabel: Record<string, string> = { NEW: 'حفظ جديد', REVISION: 'مراجعة' };
const statusConfig: Record<string, { label: string; color: string }> = {
  ASSIGNED: { label: 'قيد التنفيذ', color: 'text-blue-700 bg-blue-50' },
  COMPLETED: { label: 'مكتملة', color: 'text-emerald-700 bg-emerald-50' },
  OVERDUE: { label: 'متأخرة', color: 'text-red-700 bg-red-50' },
};

export default function TasksScreen() {
  const user = useAuthStore((s: any) => s.user);
  const [filter, setFilter] = useState('');
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => apiClient.get(`/tasks${filter ? `?status=${filter}` : ''}`).then((r) => r.data as { tasks: Task[] }),
  });

  const completeMutation = useMutation({
    mutationFn: (taskId: string) => apiClient.patch(`/tasks/${taskId}/status`, { status: 'COMPLETED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => apiClient.delete(`/tasks/${taskId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const tasks = data?.tasks ?? [];
  const filters = [
    { value: '', label: 'الكل' },
    { value: 'ASSIGNED', label: 'جارية' },
    { value: 'COMPLETED', label: 'مكتملة' },
    { value: 'OVERDUE', label: 'متأخرة' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-gray-900">المهام اليومية</Text>
          <Text className="text-sm text-gray-500 mt-1">تابع مهام الحفظ والمراجعة</Text>
        </View>
        {user?.role === 'TEACHER' && (
          <TouchableOpacity onPress={() => router.push('/(modals)/manage-task')} className="bg-primary-700 px-4 py-2.5 rounded-xl flex-row items-center gap-2">
            <Text className="text-white font-bold text-sm">+ إنشاء مهمة</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-2" contentContainerStyle={{ gap: 8 }}>
        {filters.map((f) => (
          <TouchableOpacity key={f.value} onPress={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl border ${filter === f.value ? 'border-primary-600 bg-primary-50' : 'border-gray-200 bg-white'}`}>
            <Text className={`text-sm font-bold ${filter === f.value ? 'text-primary-700' : 'text-gray-500'}`}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tasks */}
      {isLoading ? (
        <View className="p-8 items-center"><ActivityIndicator size="large" color="#047857" /></View>
      ) : tasks.length === 0 ? (
        <View className="p-12 items-center">
          <Text className="text-4xl mb-3">📖</Text>
          <Text className="text-lg font-bold text-gray-400">لا توجد مهام حالياً</Text>
        </View>
      ) : (
        <View className="px-4 pb-6 gap-3">
          {tasks.map((task) => {
            const cfg = statusConfig[task.status] || statusConfig.ASSIGNED;
            const surahName = quranSurahs[task.surahNumber - 1]?.name || task.surahNumber;
            const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

            return (
              <View key={task.id} className={`bg-white rounded-2xl p-4 border ${isOverdue ? 'border-red-200' : 'border-gray-100'} shadow-sm`}>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs font-bold bg-primary-50 text-primary-700 px-3 py-1 rounded-full">{taskTypeLabel[task.taskType]}</Text>
                  <Text className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.color}`}>{cfg.label}</Text>
                </View>

                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-14 h-14 rounded-xl bg-primary-50 items-center justify-center">
                    <Text className="text-2xl">📖</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">سورة {surahName}</Text>
                    <Text className="text-sm text-gray-500">الآيات {task.ayahStart} – {task.ayahEnd}</Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 mb-3">
                  <Text className="text-sm text-gray-500">📅 موعد التسليم: {new Date(task.dueDate).toLocaleDateString('ar-MA')}</Text>
                </View>

                {task.notes && <Text className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl mb-3">{task.notes}</Text>}

                {/* Actions */}
                {user?.role === 'STUDENT' && task.status === 'ASSIGNED' && (
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={() => completeMutation.mutate(task.id)} disabled={completeMutation.isPending}
                      className="flex-1 bg-primary-700 py-3 rounded-xl items-center">
                      <Text className="text-white font-bold">{completeMutation.isPending ? 'جاري...' : 'إتمام المهمة'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/(modals)/submit-task', params: { taskId: task.id } })}
                      className="bg-gray-100 px-4 py-3 rounded-xl items-center">
                      <Text className="text-gray-700 font-bold">تسليم</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {user?.role !== 'STUDENT' && (
                  <View className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <Text className="text-sm font-bold text-gray-700">{task.student.fullName}</Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={() => router.push({ pathname: '/(modals)/manage-task', params: { editTask: JSON.stringify(task) } })}
                        className="bg-primary-50 px-3 py-1.5 rounded-lg">
                        <Text className="text-primary-700 text-xs font-bold">تعديل</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { deleteMutation.mutate(task.id); }}
                        className="bg-red-50 px-3 py-1.5 rounded-lg">
                        <Text className="text-red-600 text-xs font-bold">حذف</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
