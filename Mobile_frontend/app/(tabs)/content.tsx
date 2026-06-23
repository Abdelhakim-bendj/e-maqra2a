import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../lib/api';

type ContentItem = {
  id: string;
  title: string;
  content: string;
  category: 'SUPPLICATION' | 'SEERAH' | 'COMPANION';
  subcategory?: string;
};

const categoryConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  SUPPLICATION: { label: 'الأدعية المأثورة', icon: 'heart', color: '#e11d48', bg: '#fff1f2' },
  SEERAH: { label: 'السيرة النبوية', icon: 'moon', color: '#2563eb', bg: '#eff6ff' },
  COMPANION: { label: 'قصص الصحابة', icon: 'book', color: '#d97706', bg: '#fffbeb' },
};

export default function ContentScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['content'],
    queryFn: () => apiClient.get('/content/islamic').then((r: any) => (r.data.items as ContentItem[]) ?? []),
  });

  const items = data ?? [];

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Header */}
      <View className="items-center mb-6">
        <Text className="text-2xl font-black text-gray-950">المحتوى الإسلامي</Text>
        <Text className="mt-2 text-base text-gray-600 text-center">زاد الطالب من السيرة والأدعية وقصص الصحابة الكرام</Text>
      </View>

      {items.length === 0 ? (
        <View className="py-16 items-center">
          <Ionicons name="library-outline" size={48} color="#d1d5db" />
          <Text className="mt-4 text-gray-400 font-bold text-base">لا يوجد محتوى حالياً</Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {items.map((item) => {
            const config = categoryConfig[item.category] || categoryConfig.SUPPLICATION;
            return (
              <View key={item.id} className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Header section */}
                <View className="p-5 border-b border-gray-100" style={{ backgroundColor: config.bg }}>
                  <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                    <View className="h-10 w-10 rounded-2xl bg-white items-center justify-center shadow-sm">
                      <Ionicons name={config.icon as any} size={22} color={config.color} />
                    </View>
                  </View>
                  <Text className="text-lg font-black text-gray-900" numberOfLines={2}>{item.title}</Text>
                  <Text className="mt-1 text-xs font-bold" style={{ color: config.color }}>
                    {config.label} {item.subcategory ? `• ${item.subcategory}` : ''}
                  </Text>
                </View>
                {/* Body */}
                <View className="p-5">
                  <Text className="text-sm text-gray-600 leading-relaxed" numberOfLines={4}>{item.content}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
