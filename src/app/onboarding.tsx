import { useMemo, useRef, useState, useEffect } from 'react';
import { Dimensions, Image, Pressable, ScrollView, Text, View, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Sparkles, Package, Printer } from 'lucide-react-native';
import { useAuthStore } from '@/lib/state/auth-store';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import useStorageStore from '@/lib/state/storage-store';
import { supabase } from '@/lib/supabase';

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  imageSource?: any;
  icon: 'package' | 'sparkles' | 'search' | 'printer';
  isOptional?: boolean;
  printerLink?: string;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

function SlideIcon({ icon }: { icon: Slide['icon'] }) {
  const common = { size: 18, color: '#FF9500' as const };
  if (icon === 'package') return <Package {...common} />;
  if (icon === 'sparkles') return <Sparkles {...common} />;
  if (icon === 'printer') return <Printer {...common} />;
  return <Search {...common} />;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isGuest = useAuthStore((s) => s.isGuest);
  const userKey = userId || (isGuest ? 'guest' : null);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);
  
  // Get printer link from remote config
  const remoteConfig = useStorageStore((s) => s.remoteConfig);
  const [printerLink, setPrinterLink] = useState(
    remoteConfig.affiliate_printer_link || 'https://www.amazon.com/s?k=label+printer'
  );

  // Fetch remote config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data: config } = await supabase
          .from('app_config')
          .select('key, value')
          .eq('key', 'affiliate_printer_link')
          .single();
        
        if (config?.value) {
          setPrinterLink(config.value);
        }
      } catch (error) {
        console.log('Could not fetch printer link from config:', error);
      }
    };

    fetchConfig();
  }, []);

  const slides: Slide[] = useMemo(() => [
    {
      key: 'never-lose',
      title: 'Never lose your stuff again',
      subtitle: "Track what's in every box and find anything in seconds.",
      icon: 'package' as const,
      imageSource: require('../../assets/items.png'),
    },
    {
      key: 'ai-scan',
      title: 'Scan a box. We identify items.',
      subtitle: 'Snap a photo and get suggested items automatically.',
      icon: 'sparkles' as const,
      imageSource: require('../../assets/scanbox.png'),
    },
    {
      key: 'search',
      title: 'Search and find instantly',
      subtitle: 'Type any item name and we\'ll tell you which box it\'s in.',
      icon: 'search' as const,
      imageSource: require('../../assets/Search.png'),
    },
    {
      key: 'printer',
      title: 'Print labels (Optional)',
      subtitle: 'Get a label printer to easily print box codes.',
      icon: 'printer' as const,
      imageSource: require('../../assets/Label_Printer.png'),
      isOptional: true,
      printerLink: printerLink,
    },
  ], [printerLink]);

  const [index, setIndex] = useState<number>(0);
  const isLast = index === slides.length - 1;

  const completeAndStart = () => {
    if (userKey) markCompleted(userKey);
    router.replace('/(tabs)');
  };

  const goNext = () => {
    if (isLast) {
      completeAndStart();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * SCREEN_WIDTH, animated: true });
    setIndex((prev) => Math.min(prev + 1, slides.length - 1));
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1">
        <View className="px-5 pt-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-xl bg-brand-orange/15 items-center justify-center border border-brand-orange/10">
              <Package size={18} color="#FF9500" />
            </View>
            <Text className="text-white font-semibold text-base">TidyNest</Text>
          </View>

          <Pressable
            onPress={completeAndStart}
            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 active:opacity-80"
          >
            <Text className="text-white/80 font-medium">Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={(r) => {
            scrollRef.current = r;
          }}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const next = Math.round(x / SCREEN_WIDTH);
            setIndex(Math.max(0, Math.min(next, slides.length - 1)));
          }}
          style={{ flex: 1 }}
        >
          {slides.map((s) => (
            <View key={s.key} style={{ width: SCREEN_WIDTH }} className="px-5 pt-4 pb-6">
              <View className="rounded-3xl overflow-hidden border border-white/10 bg-zinc-900">
                <Image
                  source={s.imageSource || { uri: s.imageUrl }}
                  style={{ width: '100%', height: 360 }}
                  resizeMode="cover"
                />
              </View>

              <View className="mt-5">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-xl bg-brand-orange/15 items-center justify-center border border-brand-orange/10">
                    <SlideIcon icon={s.icon} />
                  </View>
                  <Text className="text-brand-orange font-semibold text-xs uppercase tracking-widest">
                    {s.isOptional ? 'Optional' : 'Quick start'}
                  </Text>
                </View>

                <Text className="text-white text-3xl font-black tracking-tight mt-3">
                  {s.title}
                </Text>
                <Text className="text-zinc-400 mt-2 text-base leading-6">{s.subtitle}</Text>

                {/* Optional: Show printer link button */}
                {s.printerLink && (
                  <Pressable
                    onPress={() => Linking.openURL(s.printerLink!)}
                    className="mt-4 bg-zinc-900 border border-brand-orange/30 rounded-xl py-3 px-4 flex-row items-center justify-between active:bg-zinc-800"
                  >
                    <View className="flex-row items-center">
                      <Printer size={18} color="#FF9500" />
                      <Text className="text-brand-orange font-semibold ml-2">View Recommended Printers</Text>
                    </View>
                    <Text className="text-zinc-600">→</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        <View className="px-5 pb-4">
          <View className="flex-row items-center justify-center gap-2 mb-4">
            {slides.map((_, i) => (
              <View
                key={i}
                className={
                  i === index
                    ? 'w-6 h-2 rounded-full bg-brand-orange'
                    : 'w-2 h-2 rounded-full bg-white/20'
                }
              />
            ))}
          </View>

          <Pressable
            onPress={goNext}
            className="bg-brand-orange rounded-2xl py-4 items-center active:opacity-90"
          >
            <Text className="text-black font-extrabold text-base">
              {isLast ? "Let's Go!" : 'Continue'}
            </Text>
          </Pressable>

          <Text className="text-center text-zinc-600 text-xs mt-3">
            Tip: your first win is scanning one box.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
