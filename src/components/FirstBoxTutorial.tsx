import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Package, Sparkles, ArrowRight } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';

interface FirstBoxTutorialProps {
  onDismiss: () => void;
}

export default function FirstBoxTutorial({ onDismiss }: FirstBoxTutorialProps) {
  const router = useRouter();

  const handleStartScanning = () => {
    onDismiss();
    router.push('/add-container');
  };

  return (
    <Animated.View 
      entering={FadeIn}
      className="absolute inset-0 z-50 bg-black/90"
    >
      <View className="flex-1 items-center justify-center px-6">
        {/* Main Content */}
        <Animated.View 
          entering={SlideInDown.delay(200).springify()}
          className="w-full max-w-md"
        >
          {/* Icon */}
          <View className="items-center mb-8">
            <View className="w-24 h-24 bg-brand-orange/20 rounded-3xl items-center justify-center border-4 border-brand-orange/40 mb-4">
              <Package size={48} color="#FF9500" />
            </View>
            <Text className="text-white text-3xl font-black text-center mb-2">
              Let's add your first box! 📦
            </Text>
            <Text className="text-zinc-400 text-center text-base">
              Follow these simple steps to get started
            </Text>
          </View>

          {/* Steps */}
          <View className="space-y-4 mb-8">
            {/* Step 1 */}
            <Animated.View 
              entering={FadeInDown.delay(400)}
              className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800"
            >
              <View className="flex-row items-start">
                <View className="w-10 h-10 bg-brand-orange/20 rounded-xl items-center justify-center mr-4">
                  <Text className="text-brand-orange font-black text-lg">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg mb-1">Tap "Scan & Add"</Text>
                  <Text className="text-zinc-400 leading-5">
                    Use your camera to scan the items in a box
                  </Text>
                </View>
                <Camera size={24} color="#FF9500" />
              </View>
            </Animated.View>

            {/* Step 2 */}
            <Animated.View 
              entering={FadeInDown.delay(500)}
              className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800"
            >
              <View className="flex-row items-start">
                <View className="w-10 h-10 bg-brand-orange/20 rounded-xl items-center justify-center mr-4">
                  <Text className="text-brand-orange font-black text-lg">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg mb-1">AI identifies items</Text>
                  <Text className="text-zinc-400 leading-5">
                    We'll automatically detect what's in the box
                  </Text>
                </View>
                <Sparkles size={24} color="#FF9500" />
              </View>
            </Animated.View>

            {/* Step 3 */}
            <Animated.View 
              entering={FadeInDown.delay(600)}
              className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800"
            >
              <View className="flex-row items-start">
                <View className="w-10 h-10 bg-brand-orange/20 rounded-xl items-center justify-center mr-4">
                  <Text className="text-brand-orange font-black text-lg">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg mb-1">Save & search</Text>
                  <Text className="text-zinc-400 leading-5">
                    That's it! Now search for any item anytime
                  </Text>
                </View>
                <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                  <Text className="text-white font-bold text-xs">✓</Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(700)} className="space-y-3">
            <Pressable
              onPress={handleStartScanning}
              className="bg-brand-orange rounded-2xl py-5 flex-row items-center justify-center active:opacity-90 shadow-xl shadow-brand-orange/30"
            >
              <Camera size={22} color="#000" />
              <Text className="text-black font-black text-lg ml-2">Start Scanning</Text>
              <ArrowRight size={20} color="#000" className="ml-2" />
            </Pressable>

            <Pressable
              onPress={onDismiss}
              className="py-4 items-center active:opacity-60"
            >
              <Text className="text-zinc-500 font-medium">I'll do this later</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
