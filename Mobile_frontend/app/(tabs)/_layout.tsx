import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useLangStore } from '../../store/langStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';

export default function TabsLayout() {
  const user = useAuthStore((s: any) => s.user);
  const { t } = useLangStore();
  const router = useRouter();
  const role = user?.role;
  const isStudentRestricted = role === 'STUDENT' && user?.studentProfile?.teacherStatus !== 'ACCEPTED';

  const { data: statsData } = useQuery({
    queryKey: ['navbar-stats'],
    queryFn: () => apiClient.get('/dashboard/navbar-stats').then((r: any) => r.data),
    enabled: !!user,
    refetchInterval: 15000,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#047857',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingBottom: 4, height: 60, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8 },
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800', fontSize: 18, color: '#111827' },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11, marginTop: -4 }
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t('nav.dashboard'), tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="tasks" options={{ href: isStudentRestricted ? null : undefined, title: t('nav.tasks'), tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />, tabBarBadge: statsData?.newTasks > 0 ? '' : undefined, tabBarBadgeStyle: { minWidth: 10, minHeight: 10, maxHeight: 10, maxWidth: 10, fontSize: 0 } }} />
      <Tabs.Screen name="exams" options={{ href: isStudentRestricted ? null : undefined, title: t('nav.exams'), tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />, tabBarBadge: statsData?.newExams > 0 ? '' : undefined, tabBarBadgeStyle: { minWidth: 10, minHeight: 10, maxHeight: 10, maxWidth: 10, fontSize: 0 } }} />
      <Tabs.Screen name="submissions" options={{ href: isStudentRestricted ? null : undefined, title: t('nav.submissions'), tabBarIcon: ({ color, size }) => <Ionicons name="mic" size={size} color={color} />, tabBarBadge: statsData?.pendingSubmissions > 0 ? '' : undefined, tabBarBadgeStyle: { minWidth: 10, minHeight: 10, maxHeight: 10, maxWidth: 10, fontSize: 0 } }} />
      <Tabs.Screen name="profile" options={{ title: t('nav.profile'), tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} /> }} />
      
      {/* Hidden from bottom navigation but accessible via routing */}
      <Tabs.Screen name="messages" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="notifications" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="sessions" options={{ href: null, title: t('nav.sessions'), headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 15 }}><Ionicons name="arrow-back" size={24} color="#374151" /></TouchableOpacity> }} />
      <Tabs.Screen name="content" options={{ href: null, title: t('nav.content'), headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 15 }}><Ionicons name="arrow-back" size={24} color="#374151" /></TouchableOpacity> }} />
      <Tabs.Screen name="students" options={{ href: null, title: t('nav.students'), headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 15 }}><Ionicons name="arrow-back" size={24} color="#374151" /></TouchableOpacity> }} />
      <Tabs.Screen name="reports" options={{ href: null, title: t('nav.reports'), headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 15 }}><Ionicons name="arrow-back" size={24} color="#374151" /></TouchableOpacity> }} />
    </Tabs>
  );
}
