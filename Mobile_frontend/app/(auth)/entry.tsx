import React from 'react';
import { View, Image, TouchableOpacity, Text, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function EntryScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-gray-900 justify-center items-center">
      <StatusBar style="auto" />
      <View style={styles.bgCircle1} className="dark:opacity-20" />
      <View style={styles.bgCircle2} className="dark:opacity-20" />

      <View className="flex-1 justify-center items-center px-6">
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={{ width: width * 0.7, height: width * 0.7 }}
          resizeMode="contain"
        />
      </View>

      <View className="w-full px-8 pb-16 pt-8">
        <TouchableOpacity 
          className="w-full bg-emerald-600 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-emerald-500/30"
          onPress={() => router.push('/(auth)/landing')}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-black ml-2">متابعة</Text>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bgCircle1: {
    position: 'absolute',
    top: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -height * 0.1,
    right: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
});
