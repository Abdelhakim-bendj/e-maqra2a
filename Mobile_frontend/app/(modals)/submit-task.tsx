import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../../lib/api';

export default function SubmitTaskScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUri, setAudioUri] = useState('');
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => apiClient.get(`/tasks/${id}`).then((r: any) => r.data.task),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { taskId: string; audioUrl: string }) => apiClient.post('/submissions', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      Alert.alert('تم إرسال التسميع بنجاح');
      router.back();
    },
    onError: (err: any) => setError(err.message),
  });

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('يرجى منح إذن الوصول للميكروفون');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      setError('تعذر بدء التسجيل. تأكد من منح الصلاحيات.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      if (uri) setAudioUri(uri);
    } catch (err) {
      setError('حدث خطأ أثناء إيقاف التسجيل');
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    recordingRef.current = null;
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        setAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      setError('حدث خطأ أثناء اختيار الملف');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmit = () => {
    if (!audioUri || !id) return;
    // In a real app, you'd upload the audio file first, then send the URL
    // For now we send the URI directly (works with base64 or uploaded URL)
    submitMutation.mutate({ taskId: id, audioUrl: audioUri });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500 font-bold">المهمة غير موجودة</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Task details */}
      <View className="bg-emerald-50 rounded-2xl p-5 mb-6">
        <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
          <Ionicons name="book" size={22} color="#047857" />
          <Text className="text-lg font-black text-emerald-900">سورة {data.surahNumber}</Text>
        </View>
        <Text className="text-sm font-bold text-emerald-700">الآيات: {data.ayahStart} - {data.ayahEnd}</Text>
        {data.notes && <Text className="mt-3 text-sm text-emerald-800">{data.notes}</Text>}
      </View>

      {error ? (
        <View className="bg-red-50 border border-red-200 p-3 rounded-xl mb-4 flex-row items-center" style={{ gap: 8 }}>
          <Ionicons name="alert-circle" size={18} color="#dc2626" />
          <Text className="text-sm font-bold text-red-700 flex-1">{error}</Text>
        </View>
      ) : null}

      {/* Recording area */}
      <View className="bg-white rounded-3xl border border-gray-200 p-8 items-center shadow-sm mb-6">
        {/* Record button */}
        <View className={`h-28 w-28 rounded-full items-center justify-center mb-6 ${isRecording ? 'bg-red-50' : 'bg-gray-50'}`}>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            className={`h-20 w-20 rounded-full items-center justify-center ${isRecording ? 'bg-red-500' : 'bg-emerald-600'}`}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={isRecording ? 30 : 36}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {isRecording ? (
          <Text className="text-2xl font-black text-red-500 font-mono">{formatTime(recordingTime)}</Text>
        ) : audioUri ? (
          <View className="items-center" style={{ gap: 12 }}>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text className="text-sm font-bold text-emerald-600">تم تجهيز الملف الصوتي بنجاح</Text>
            </View>
            <TouchableOpacity onPress={() => setAudioUri('')}>
              <Text className="text-xs font-bold text-red-500 underline">إلغاء وإعادة التسجيل</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center" style={{ gap: 16 }}>
            <Text className="text-sm font-bold text-gray-500">اضغط للبدء في تسجيل تسميعك</Text>
            <View className="flex-row items-center w-full my-2" style={{ gap: 12 }}>
              <View className="flex-1 border-t border-gray-200" />
              <Text className="text-xs font-bold text-gray-400">أو</Text>
              <View className="flex-1 border-t border-gray-200" />
            </View>
            <TouchableOpacity
              onPress={pickAudioFile}
              className="flex-row items-center border-2 border-dashed border-emerald-200 bg-emerald-50 px-5 py-3 rounded-xl"
              style={{ gap: 8 }}
            >
              <Ionicons name="cloud-upload" size={20} color="#047857" />
              <Text className="text-sm font-bold text-emerald-700">رفع ملف صوتي</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!audioUri || submitMutation.isPending}
        className="bg-gray-900 py-4 rounded-2xl flex-row items-center justify-center disabled:opacity-50"
        style={{ gap: 8 }}
      >
        {submitMutation.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="cloud-upload" size={20} color="#fff" />
        )}
        <Text className="text-white font-black text-base">
          {submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال التسميع'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
