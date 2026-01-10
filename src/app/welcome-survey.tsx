import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Home, Package, Sparkles, Wrench, Baby, Building2, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '@/lib/state/auth-store';
import { useSurveyStore } from '@/lib/state/survey-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UseCase = {
  id: string;
  icon: 'home' | 'package' | 'sparkles' | 'wrench' | 'baby' | 'building';
  emoji: string;
  label: string;
};

type BoxCount = {
  id: string;
  label: string;
};

const USE_CASES: UseCase[] = [
  { id: 'moving', icon: 'home', emoji: '🏠', label: 'Moving to a new home' },
  { id: 'storage', icon: 'package', emoji: '📦', label: 'Organizing storage' },
  { id: 'seasonal', icon: 'sparkles', emoji: '🎄', label: 'Seasonal items (decorations, etc.)' },
  { id: 'tools', icon: 'wrench', emoji: '🔧', label: 'Tools & equipment' },
  { id: 'kids', icon: 'baby', emoji: '🧸', label: 'Kids toys and stuff' },
  { id: 'business', icon: 'building', emoji: '📋', label: 'Small business inventory' },
];

const BOX_COUNTS: BoxCount[] = [
  { id: 'starting', label: 'Just getting started' },
  { id: '5-10', label: '5-10 boxes' },
  { id: '10-25', label: '10-25 boxes' },
  { id: '25+', label: '25+ boxes' },
];

function IconComponent({ icon }: { icon: UseCase['icon'] }) {
  const props = { size: 20, color: '#f59e0b' };
  if (icon === 'home') return <Home {...props} />;
  if (icon === 'package') return <Package {...props} />;
  if (icon === 'sparkles') return <Sparkles {...props} />;
  if (icon === 'wrench') return <Wrench {...props} />;
  if (icon === 'baby') return <Baby {...props} />;
  return <Building2 {...props} />;
}

export default function WelcomeSurveyScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isGuest = useAuthStore((s) => s.isGuest);
  const markSurveyCompleted = useSurveyStore((s) => s.markCompleted);
  
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [selectedBoxCount, setSelectedBoxCount] = useState<string | null>(null);

  const handleContinue = async () => {
    // Save survey data to AsyncStorage
    const userKey = userId || 'guest';
    const surveyData = {
      useCase: selectedUseCase,
      boxCount: selectedBoxCount,
      completedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(
      `survey_${userKey}`,
      JSON.stringify(surveyData)
    );

    // Mark survey as completed
    markSurveyCompleted(userKey);
    
    // Navigate to onboarding
    router.replace('/onboarding');
  };

  const canContinue = selectedUseCase !== null;

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView 
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 32, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8">
          <Text className="text-white text-4xl font-black tracking-tight">
            Welcome to TidyNest! 👋
          </Text>
          <Text className="text-zinc-400 text-lg mt-3 leading-6">
            Let's personalize your experience so we can help you better
          </Text>
        </View>

        {/* Question 1: Use Case */}
        <View className="mb-10">
          <View className="mb-4">
            <Text className="text-white text-xl font-bold mb-1">
              What brings you to TidyNest today?
            </Text>
            <Text className="text-zinc-500 text-sm">
              This helps us show relevant examples
            </Text>
          </View>

          <View className="space-y-3">
            {USE_CASES.map((useCase) => (
              <Pressable
                key={useCase.id}
                onPress={() => setSelectedUseCase(useCase.id)}
                className={`flex-row items-center p-4 rounded-2xl border-2 ${
                  selectedUseCase === useCase.id
                    ? 'bg-amber-500/10 border-amber-500'
                    : 'bg-zinc-900/50 border-zinc-800'
                }`}
              >
                <View className="w-12 h-12 rounded-xl bg-zinc-900 items-center justify-center mr-4 border border-zinc-800">
                  <Text className="text-2xl">{useCase.emoji}</Text>
                </View>
                <Text
                  className={`flex-1 font-semibold text-base ${
                    selectedUseCase === useCase.id ? 'text-amber-500' : 'text-white'
                  }`}
                >
                  {useCase.label}
                </Text>
                {selectedUseCase === useCase.id && (
                  <View className="w-6 h-6 rounded-full bg-amber-500 items-center justify-center">
                    <Text className="text-black text-xs font-bold">✓</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Question 2: Box Count (Optional) */}
        <View className="mb-8">
          <View className="mb-4">
            <Text className="text-white text-xl font-bold mb-1">
              How many storage boxes do you have?
            </Text>
            <Text className="text-zinc-500 text-sm">Optional - helps us understand your needs</Text>
          </View>

          <View className="space-y-3">
            {BOX_COUNTS.map((count) => (
              <Pressable
                key={count.id}
                onPress={() => setSelectedBoxCount(count.id)}
                className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                  selectedBoxCount === count.id
                    ? 'bg-amber-500/5 border-amber-500/50'
                    : 'bg-zinc-900/30 border-zinc-800'
                }`}
              >
                <Text
                  className={`font-medium text-base ${
                    selectedBoxCount === count.id ? 'text-amber-500' : 'text-zinc-300'
                  }`}
                >
                  {count.label}
                </Text>
                {selectedBoxCount === count.id && (
                  <View className="w-5 h-5 rounded-full bg-amber-500 items-center justify-center">
                    <Text className="text-black text-xs font-bold">✓</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View className="px-6 pb-6 pt-4 border-t border-zinc-900">
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          className={`flex-row items-center justify-center rounded-2xl py-4 ${
            canContinue ? 'bg-amber-500' : 'bg-zinc-800'
          }`}
        >
          <Text
            className={`font-bold text-lg mr-2 ${
              canContinue ? 'text-black' : 'text-zinc-600'
            }`}
          >
            Continue
          </Text>
          {canContinue && <ArrowRight size={20} color="#000" />}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
