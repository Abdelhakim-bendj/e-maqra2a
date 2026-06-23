import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import DateTimePickerModal from '../components/ui/DateTimePickerModal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../lib/api';
import { quranSurahs } from '../../lib/utils';

export default function ManageTaskScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { editTaskId } = useLocalSearchParams<{ editTaskId?: string }>();

  const [assignMode, setAssignMode] = useState<'student' | 'class'>(editTaskId ? 'student' : 'student');
  const [form, setForm] = useState({
    studentId: '',
    classId: '',
    taskType: 'NEW' as 'NEW' | 'REVISION',
    surahNumber: 1,
    ayahStart: 1,
    ayahEnd: 7,
    dueDate: new Date(Date.now() + 86400000),
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');

  const { data: classData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiClient.get('/classes').then((r: any) => r.data.classes),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users').then((r: any) => r.data.users),
  });

  const classes = classData ?? [];
  const students = (studentsData ?? []).filter((u: any) => u.role === 'STUDENT');

  const createMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editTaskId) {
        return apiClient.put(`/tasks/${editTaskId}`, payload);
      }
      return assignMode === 'student'
        ? apiClient.post('/tasks', payload)
        : apiClient.post('/tasks/bulk', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      router.back();
    },
    onError: (err: any) => {
      if (err.errors?.length > 0) {
        setError(err.errors.map((e: any) => e.message).join('، '));
      } else {
        setError(err.message);
      }
    },
  });

  const handleSave = () => {
    setError('');
    const payload = {
      ...(assignMode === 'student' ? { studentId: form.studentId } : { classId: form.classId }),
      taskType: form.taskType,
      surahNumber: form.surahNumber,
      ayahStart: form.ayahStart,
      ayahEnd: form.ayahEnd,
      dueDate: form.dueDate.toISOString(),
      notes: form.notes || undefined,
    };
    if (assignMode === 'student' && !form.studentId) {
      Alert.alert('يرجى اختيار الطالب');
      return;
    }
    if (assignMode === 'class' && !form.classId) {
      Alert.alert('يرجى اختيار الفصل');
      return;
    }
    createMutation.mutate(payload);
  };

  const currentSurah = quranSurahs[form.surahNumber - 1];

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {error ? (
        <View className="bg-red-50 border border-red-200 p-3 rounded-xl mb-4">
          <Text className="text-sm font-bold text-red-700">{error}</Text>
        </View>
      ) : null}

      {/* Assign mode toggle */}
      {!editTaskId && (
        <View className="flex-row bg-gray-100 rounded-2xl p-1.5 mb-6">
          {(['student', 'class'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setAssignMode(mode)}
              className={`flex-1 py-3 rounded-xl items-center ${assignMode === mode ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`font-black text-sm ${assignMode === mode ? 'text-emerald-700' : 'text-gray-500'}`}>
                {mode === 'student' ? 'طالب محدد' : 'فصل كامل'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Target selector */}
      {assignMode === 'class' ? (
        <View className="mb-4">
          <Text className="mb-2 text-sm font-black text-gray-900">الفصل الدراسي</Text>
          <View style={{ gap: 8 }}>
            {classes.map((cls: any) => (
              <TouchableOpacity
                key={cls.id}
                onPress={() => setForm({ ...form, classId: cls.id })}
                className={`p-3 rounded-xl border-2 ${form.classId === cls.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`font-bold ${form.classId === cls.id ? 'text-emerald-700' : 'text-gray-700'}`}>
                  {cls.name} ({cls._count?.students || 0} طالب)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View className="mb-4">
          <Text className="mb-2 text-sm font-black text-gray-900">اختر الطالب</Text>
          <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
            <View style={{ gap: 8 }}>
              {students.map((s: any) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setForm({ ...form, studentId: s.id })}
                  className={`p-3 rounded-xl border-2 ${form.studentId === s.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}
                >
                  <Text className={`font-bold ${form.studentId === s.id ? 'text-emerald-700' : 'text-gray-700'}`}>{s.fullName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Task type */}
      <View className="mb-4">
        <Text className="mb-2 text-sm font-black text-gray-900">نوع الورد</Text>
        <View className="flex-row" style={{ gap: 12 }}>
          {(['NEW', 'REVISION'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setForm({ ...form, taskType: t })}
              className={`flex-1 py-4 rounded-2xl border-2 items-center ${
                form.taskType === t ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'
              }`}
            >
              <Text className={`font-black ${form.taskType === t ? 'text-emerald-700' : 'text-gray-500'}`}>
                {t === 'NEW' ? 'حفظ جديد' : 'مراجعة'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Surah selection */}
      <View className="mb-4">
        <Text className="mb-2 text-sm font-black text-gray-900">السورة</Text>
        <ScrollView style={{ maxHeight: 120 }} nestedScrollEnabled>
          <View style={{ gap: 4 }}>
            {quranSurahs.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setForm({ ...form, surahNumber: s.id, ayahStart: 1, ayahEnd: s.ayahs })}
                className={`p-2 rounded-lg ${form.surahNumber === s.id ? 'bg-emerald-100' : 'bg-white'}`}
              >
                <Text className={`text-sm font-bold ${form.surahNumber === s.id ? 'text-emerald-700' : 'text-gray-700'}`}>
                  {s.id}. {s.name} ({s.ayahs} آية)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Ayah range */}
      <View className="flex-row mb-4" style={{ gap: 12 }}>
        <View className="flex-1">
          <Text className="mb-2 text-sm font-black text-gray-900">آية البداية</Text>
          <TextInput
            value={String(form.ayahStart)}
            onChangeText={(t) => setForm({ ...form, ayahStart: parseInt(t) || 1 })}
            keyboardType="numeric"
            className="bg-white border border-gray-200 rounded-xl p-3 text-center font-black text-lg"
          />
        </View>
        <View className="flex-1">
          <Text className="mb-2 text-sm font-black text-gray-900">آية النهاية</Text>
          <TextInput
            value={String(form.ayahEnd)}
            onChangeText={(t) => setForm({ ...form, ayahEnd: parseInt(t) || 1 })}
            keyboardType="numeric"
            className="bg-white border border-gray-200 rounded-xl p-3 text-center font-black text-lg"
          />
        </View>
      </View>

      {/* Due date */}
      <View className="mb-4">
        <Text className="mb-2 text-sm font-black text-gray-900">تاريخ الاستحقاق</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="bg-white border border-gray-200 rounded-xl p-3 flex-row items-center justify-between"
        >
          <Text className="font-bold text-gray-700">{form.dueDate.toISOString().slice(0, 10)}</Text>
          <Ionicons name="calendar-outline" size={20} color="#059669" />
        </TouchableOpacity>
        <DateTimePickerModal
          visible={showDatePicker}
          mode="date"
          value={form.dueDate}
          minimumDate={new Date()}
          onChange={(d) => setForm({ ...form, dueDate: d })}
          onClose={() => setShowDatePicker(false)}
        />
      </View>

      {/* Notes */}
      <View className="mb-6">
        <Text className="mb-2 text-sm font-black text-gray-900">ملاحظات</Text>
        <TextInput
          value={form.notes}
          onChangeText={(t) => setForm({ ...form, notes: t })}
          multiline
          numberOfLines={3}
          placeholder="توجيهات للطالب (اختياري)"
          className="bg-white border border-gray-200 rounded-xl p-3 text-base"
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={createMutation.isPending}
        className="bg-emerald-600 py-4 rounded-2xl flex-row items-center justify-center"
        style={{ gap: 8 }}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="save" size={20} color="#fff" />
        )}
        <Text className="text-white font-black text-base">
          {createMutation.isPending ? 'جاري الاعتماد...' : 'تأكيد الورد وإرساله'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
