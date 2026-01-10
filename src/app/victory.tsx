import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Package, Search, ArrowRight, Plus, Home } from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  BounceIn,
  FadeInUp,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import useStorageStore from '@/lib/state/storage-store';

export default function VictoryScreen() {
  const router = useRouter();
  const { boxCode, itemCount } = useLocalSearchParams<{ boxCode?: string; itemCount?: string }>();
  
  const containers = useStorageStore((s) => s.containers);
  const items = useStorageStore((s) => s.items);
  
  // Use params or calculate from store
  const displayBoxCode = boxCode || containers[0]?.code || 'BOX-01';
  const displayItemCount = itemCount || items.length.toString();
  
  const [showConfetti, setShowConfetti] = useState(true);

  // Confetti animation
  const confettiScale = useSharedValue(0);
  const confettiOpacity = useSharedValue(1);

  useEffect(() => {
    confettiScale.value = withSpring(1, { damping: 8 });
    
    setTimeout(() => {
      confettiOpacity.value = withTiming(0, { duration: 500 });
      runOnJS(setShowConfetti)(false);
    }, 2000);
  }, []);

  const confettiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confettiScale.value }],
    opacity: confettiOpacity.value,
  }));

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1 px-6 justify-center">
        {/* Confetti Animation */}
        {showConfetti && (
          <Animated.View style={[confettiStyle]} className="absolute inset-0 items-center justify-center">
            <Text className="text-9xl">🎉</Text>
          </Animated.View>
        )}

        {/* Main Content */}
        <Animated.View entering={FadeIn.delay(500)} className="items-center">
          {/* Checkmark Icon */}
          <Animated.View 
            entering={BounceIn.delay(800)}
            className="w-24 h-24 bg-brand-orange rounded-full items-center justify-center mb-8 shadow-xl shadow-brand-orange/40"
          >
            <Text className="text-5xl">✓</Text>
          </Animated.View>

          {/* Headline */}
          <Animated.Text 
            entering={FadeInUp.delay(1000)}
            className="text-white text-5xl font-black text-center mb-3"
          >
            You did it!
          </Animated.Text>

          {/* Box Info */}
          <Animated.View 
            entering={FadeInUp.delay(1200)}
            className="items-center mb-6"
          >
            <View className="flex-row items-center mb-2">
              <Package size={20} color="#FF9500" />
              <Text className="text-zinc-400 text-base ml-2">You've created your first box:</Text>
            </View>
            <View className="bg-brand-orange rounded-2xl px-8 py-4">
              <Text className="text-black text-3xl font-black tracking-tight">
                {displayBoxCode}
              </Text>
            </View>
          </Animated.View>

          {/* Item Count */}
          <Animated.View 
            entering={FadeInUp.delay(1400)}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 mb-8"
          >
            <Text className="text-brand-orange text-2xl font-bold text-center">
              {displayItemCount} items tracked
            </Text>
          </Animated.View>

          {/* Value Reminder */}
          <Animated.View 
            entering={FadeInUp.delay(1600)}
            className="bg-brand-orange/10 border border-brand-orange/20 rounded-2xl p-6 mb-8"
          >
            <View className="flex-row items-start">
              <Search size={24} color="#FF9500" className="mt-1" />
              <View className="flex-1 ml-3">
                <Text className="text-brand-orange font-bold text-sm uppercase tracking-wider mb-2">
                  Quick Value Reminder
                </Text>
                <Text className="text-white text-base leading-6">
                  Now try searching for any item to see how fast you can find it!
                </Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInUp.delay(1800)} className="mt-auto mb-8">
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            className="bg-brand-orange rounded-2xl py-5 flex-row items-center justify-center mb-3 shadow-lg shadow-brand-orange/30"
          >
            <Home size={22} color="#000" />
            <Text className="text-black font-extrabold text-lg ml-2">Explore Dashboard</Text>
            <ArrowRight size={20} color="#000" className="ml-2" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/add-container')}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 flex-row items-center justify-center active:bg-zinc-800"
          >
            <Plus size={20} color="#71717a" />
            <Text className="text-zinc-400 font-semibold text-base ml-2">Add Another Box</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
