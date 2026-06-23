import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ModalsLayout() {
  const router = useRouter();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerTitleAlign: 'center',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 15 }}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="manage-task" options={{ title: 'إدارة المهمة', presentation: 'modal' }} />
      <Stack.Screen name="manage-session" options={{ title: 'جدولة جلسة', presentation: 'modal' }} />
      <Stack.Screen name="manage-exam" options={{ title: 'إدارة الاختبار', presentation: 'modal' }} />
      <Stack.Screen name="submit-task" options={{ title: 'تسليم التسميع', presentation: 'modal' }} />
      <Stack.Screen name="take-exam" options={{ title: 'بدء الاختبار', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="exam-results" options={{ title: 'نتائج الاختبار', presentation: 'modal' }} />
    </Stack>
  );
}
