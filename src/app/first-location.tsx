import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Plus, Sparkles, ArrowRight } from 'lucide-react-native';
import useStorageStore from '@/lib/state/storage-store';
import { useAuthStore } from '@/lib/state/auth-store';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInDown,
  BounceIn,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

const LOCATION_SUGGESTIONS = [
  { name: 'Garage', code: 'G', emoji: '🏠' },
  { name: 'Attic', code: 'AT', emoji: '⬆️' },
  { name: 'Bedroom', code: 'BR', emoji: '🛏️' },
  { name: 'Storage Unit', code: 'SU', emoji: '📦' },
  { name: 'Basement', code: 'BS', emoji: '⬇️' },
  { name: 'Closet', code: 'CL', emoji: '🚪' },
];

export default function FirstLocationScreen() {
  const router = useRouter();
  const locations = useStorageStore((s) => s.locations);
  const addLocation = useStorageStore((s) => s.addLocation);
  
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isGuest = useAuthStore((s) => s.isGuest);
  const userKey = userId || (isGuest ? 'guest' : null);
  const markOnboardingCompleted = useOnboardingStore((s) => s.markCompleted);
  
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [addedLocationName, setAddedLocationName] = useState('');

  const handleSkip = () => {
    // Mark onboarding as completed and go to main app
    if (userKey) markOnboardingCompleted(userKey);
    router.replace('/(tabs)');
  };

  const handleQuickAdd = (suggestion: typeof LOCATION_SUGGESTIONS[0]) => {
    // Check if already exists
    const exists = locations.some((l) => l.code === suggestion.code);
    if (exists) return;

    addLocation({
      name: suggestion.name,
      code: suggestion.code,
    });

    // Show celebration
    setAddedLocationName(suggestion.name);
    setShowCelebration(true);
    
    // Navigate after celebration
    setTimeout(() => {
      router.replace('/first-box');
    }, 2000);
  };

  const handleCustomAdd = () => {
    if (!customName.trim() || !customCode.trim()) return;

    // Check if code already exists
    const exists = locations.some(
      (l) => l.code.toLowerCase() === customCode.trim().toUpperCase().toLowerCase()
    );
    if (exists) return;

    addLocation({
      name: customName.trim(),
      code: customCode.trim().toUpperCase(),
    });

    // Show celebration
    setAddedLocationName(customName.trim());
    setShowCelebration(true);
    
    // Navigate after celebration
    setTimeout(() => {
      router.replace('/first-box');
    }, 2000);
  };

  if (showCelebration) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950">
        <Animated.View 
          entering={BounceIn.duration(800)}
          className="flex-1 items-center justify-center px-8"
        >
          <View className="items-center">
            <Text className="text-8xl mb-6">✨</Text>
            <Text className="text-white text-4xl font-black text-center mb-4">
              Great!
            </Text>
            <Text className="text-brand-orange text-2xl font-bold text-center">
              {addedLocationName} added
            </Text>
            <Text className="text-zinc-400 text-lg text-center mt-4">
              Now let's add your first box...
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView 
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 32, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-brand-orange/15 rounded-2xl items-center justify-center mr-3 border border-brand-orange/20">
                <MapPin size={24} color="#FF9500" />
              </View>
              <View className="flex-1">
                <Text className="text-brand-orange text-xs font-bold uppercase tracking-widest">Step 1 of 2</Text>
                <Text className="text-white text-lg font-bold">First Location</Text>
              </View>
            </View>
            <Pressable
              onPress={handleSkip}
              className="px-3 py-2 rounded-full bg-zinc-900 border border-zinc-800 active:bg-zinc-800"
            >
              <Text className="text-zinc-400 font-medium text-sm">Skip</Text>
            </Pressable>
          </View>
          
          <Text className="text-white text-3xl font-black tracking-tight mb-3">
            Where do you store your stuff?
          </Text>
          <Text className="text-zinc-400 text-base leading-6">
            Let's add your first location. This helps you organize boxes by room or area.
          </Text>
        </View>

        {/* Quick Add Chips */}
        <View className="mb-6">
          <Text className="text-zinc-500 text-sm mb-3 font-medium">
            Tap to add a location:
          </Text>
          
          <View className="flex-row flex-wrap gap-3">
            {LOCATION_SUGGESTIONS.map((suggestion) => {
              const alreadyAdded = locations.some((l) => l.code === suggestion.code);
              
              return (
                <Pressable
                  key={suggestion.code}
                  onPress={() => !alreadyAdded && handleQuickAdd(suggestion)}
                  disabled={alreadyAdded}
                  className={`flex-row items-center px-5 py-4 rounded-2xl border-2 ${
                    alreadyAdded
                      ? 'bg-zinc-900/30 border-zinc-800'
                      : 'bg-zinc-900 border-brand-orange/30 active:bg-brand-orange/10'
                  }`}
                >
                  <Text className="text-2xl mr-2">{suggestion.emoji}</Text>
                  <Text className={`font-semibold text-base ${
                    alreadyAdded ? 'text-zinc-600' : 'text-white'
                  }`}>
                    {suggestion.name}
                  </Text>
                  {alreadyAdded && (
                    <Text className="text-zinc-600 text-xs ml-2">✓</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-px bg-zinc-800" />
          <Text className="text-zinc-600 text-sm mx-4">or</Text>
          <View className="flex-1 h-px bg-zinc-800" />
        </View>

        {/* Custom Location Form */}
        {!showCustomForm ? (
          <Pressable
            onPress={() => setShowCustomForm(true)}
            className="flex-row items-center justify-center bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 active:bg-zinc-900"
          >
            <Plus size={20} color="#71717a" />
            <Text className="text-zinc-400 font-semibold ml-2">Add Custom Location</Text>
          </Pressable>
        ) : (
          <Animated.View 
            entering={SlideInDown.springify()}
            className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800"
          >
            <View className="flex-row items-center mb-4">
              <Sparkles size={18} color="#FF9500" />
              <Text className="text-white font-bold ml-2">Create Custom Location</Text>
            </View>

            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2">Location Name</Text>
              <TextInput
                className="bg-zinc-800 rounded-xl p-4 text-white text-base border border-zinc-700"
                placeholder="e.g., Guest Room, Office..."
                placeholderTextColor="#3f3f46"
                value={customName}
                onChangeText={setCustomName}
                autoFocus
              />
            </View>

            <View className="mb-5">
              <Text className="text-zinc-400 text-sm mb-2">Short Code (2-3 letters)</Text>
              <TextInput
                className="bg-zinc-800 rounded-xl p-4 text-white text-base font-bold border border-zinc-700"
                placeholder="e.g., GR, OFF..."
                placeholderTextColor="#3f3f46"
                value={customCode}
                onChangeText={(text) => setCustomCode(text.toUpperCase())}
                maxLength={3}
                autoCapitalize="characters"
              />
              <Text className="text-zinc-600 text-xs mt-1.5">
                This code will appear in your box labels (e.g., GR-TOOLS-01)
              </Text>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                className="flex-1 bg-zinc-800 rounded-xl py-3.5 items-center border border-zinc-700 active:bg-zinc-700"
                onPress={() => {
                  setShowCustomForm(false);
                  setCustomName('');
                  setCustomCode('');
                }}
              >
                <Text className="text-zinc-400 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                className={`flex-1 rounded-xl py-3.5 items-center flex-row justify-center ${
                  customName.trim() && customCode.trim()
                    ? 'bg-brand-orange'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
                onPress={handleCustomAdd}
                disabled={!customName.trim() || !customCode.trim()}
              >
                <Text
                  className={`font-bold ${
                    customName.trim() && customCode.trim()
                      ? 'text-black'
                      : 'text-zinc-600'
                  }`}
                >
                  Add Location
                </Text>
                {customName.trim() && customCode.trim() && (
                  <ArrowRight size={18} color="#000" className="ml-1" />
                )}
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Help Text */}
        {locations.length > 0 && (
          <Animated.View 
            entering={FadeIn.delay(300)}
            className="mt-6 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl p-4"
          >
            <Text className="text-brand-orange text-sm font-medium text-center">
              ✓ You've added {locations.length} location{locations.length !== 1 ? 's' : ''}. 
              {'\n'}Tap any chip above to add another, or continue to add your first box!
            </Text>
            
            <Pressable
              onPress={() => router.replace('/first-box')}
              className="bg-brand-orange rounded-xl py-3 items-center mt-3 flex-row justify-center"
            >
              <Text className="text-black font-bold">Continue to First Box</Text>
              <ArrowRight size={18} color="#000" className="ml-2" />
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
