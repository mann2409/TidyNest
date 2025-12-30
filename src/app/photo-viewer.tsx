import { View, Image, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function PhotoViewerScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();

  if (!uri) {
    return null;
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {/* Close button */}
      <Animated.View
        entering={FadeIn.delay(200)}
        className="absolute top-14 right-4 z-10"
      >
        <Pressable
          className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          onPress={() => router.back()}
        >
          <X size={24} color="#fff" />
        </Pressable>
      </Animated.View>

      {/* Full screen image */}
      <View className="flex-1 items-center justify-center">
        <Image
          source={{ uri: decodeURIComponent(uri) }}
          style={{ width, height: height * 0.8 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}
