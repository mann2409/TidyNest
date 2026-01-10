import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, Sparkles, ChevronDown, Check, Package, ArrowRight, MapPin } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import useStorageStore, { Location } from '@/lib/state/storage-store';
import { useAuthStore } from '@/lib/state/auth-store';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import Animated, { 
  FadeIn, 
  SlideInDown,
  BounceIn,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export default function FirstBoxScreen() {
  const router = useRouter();
  const locations = useStorageStore((s) => s.locations);
  const categories = useStorageStore((s) => s.categories);
  const addContainer = useStorageStore((s) => s.addContainer);
  const getNextContainerCode = useStorageStore((s) => s.getNextContainerCode);
  const addItem = useStorageStore((s) => s.addItem);
  const remoteConfig = useStorageStore((s) => s.remoteConfig);
  
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isGuest = useAuthStore((s) => s.isGuest);
  const userKey = userId || (isGuest ? 'guest' : null);
  const markOnboardingCompleted = useOnboardingStore((s) => s.markCompleted);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState<{ name: string; tags: string[] }[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const handleSkip = () => {
    // Mark onboarding as completed and go to main app
    if (userKey) markOnboardingCompleted(userKey);
    router.replace('/(tabs)');
  };

  // Camera button pulse animation
  const pulseScale = useSharedValue(1);
  
  useEffect(() => {
    if (currentStep === 3 && !photoUri) {
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.1, { damping: 2 }),
          withSpring(1, { damping: 2 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [currentStep, photoUri]);

  const cameraButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
    setCurrentStep(2);
  };

  const handleCategorySelect = (catCode: string) => {
    setSelectedCategory(catCode);
    setShowCategoryPicker(false);
    setCurrentStep(3);
    
    // Generate code preview
    if (selectedLocation) {
      const code = getNextContainerCode(selectedLocation.id, catCode);
      setGeneratedCode(code);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      analyzePhoto(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      analyzePhoto(result.assets[0].uri);
    }
  };

  const analyzePhoto = async (uri: string) => {
    if (remoteConfig.enable_openai_vision === 'false') {
      console.log('AI Analysis disabled');
      return;
    }

    setIsAnalyzing(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
      if (!apiKey || apiKey.includes('n0tr3al')) {
        setIsAnalyzing(false);
        return;
      }

      const categoryList = categories.map((c) => c.code).join(', ');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Look at this storage box contents. Identify specific items inside. List them with a name and 2-3 tags. Also suggest 5-10 keywords for the box. Respond ONLY in JSON: {"items": [{"name": "Item Name", "tags": ["tag1", "tag2"]}], "keywords": ["keyword1", "keyword2"]}`
              },
              { 
                type: 'image_url', 
                image_url: { url: dataUrl }
              },
            ],
          }],
          response_format: { type: "json_object" }
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const outputText = data.choices?.[0]?.message?.content || '';
        const parsed = JSON.parse(outputText);
        
        setKeywords(parsed.keywords || []);
        setSuggestedItems(parsed.items || []);
      }
    } catch (error) {
      console.error('Error analyzing photo:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveBox = () => {
    if (!selectedLocation || !selectedCategory || !generatedCode) return;

    const newContainer = addContainer({
      code: generatedCode,
      locationId: selectedLocation.id,
      category: selectedCategory,
      photoUrl: photoUri || undefined,
    });

    if (suggestedItems.length > 0) {
      suggestedItems.forEach(item => {
        addItem({
          containerId: newContainer.id,
          name: item.name,
          tags: item.tags,
          quantity: 1,
        });
      });
    }

    // Mark onboarding as completed
    if (userKey) markOnboardingCompleted(userKey);

    // Show celebration
    setShowCelebration(true);
    
    // Navigate to victory screen after celebration
    setTimeout(() => {
      router.replace(`/victory?boxCode=${generatedCode}&itemCount=${suggestedItems.length}`);
    }, 2500);
  };

  if (showCelebration) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950">
        <Animated.View 
          entering={BounceIn.duration(800)}
          className="flex-1 items-center justify-center px-8"
        >
          <View className="items-center">
            <Text className="text-8xl mb-6">📦</Text>
            <Text className="text-white text-4xl font-black text-center mb-4">
              You're all set!
            </Text>
            <View className="bg-brand-orange rounded-2xl px-8 py-4 mb-6">
              <Text className="text-black text-3xl font-black tracking-tight">
                {generatedCode}
              </Text>
            </View>
            <Text className="text-zinc-400 text-lg text-center">
              Your first box is saved.{'\n'}You can now search for items anytime!
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-zinc-900">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-brand-orange text-xs font-bold uppercase tracking-widest">Step 2 of 2</Text>
              <Text className="text-white text-2xl font-black">Add Your First Box</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="bg-zinc-900 rounded-full px-4 py-2">
                <Text className="text-zinc-400 text-sm font-bold">Step {currentStep}/3</Text>
              </View>
              <Pressable
                onPress={handleSkip}
                className="px-3 py-2 rounded-full bg-zinc-900 border border-zinc-800 active:bg-zinc-800"
              >
                <Text className="text-zinc-400 font-medium text-sm">Skip</Text>
              </Pressable>
            </View>
          </View>
          <Text className="text-zinc-400 text-sm">
            Walkthrough to scan and save your first storage box
          </Text>
        </View>

        <ScrollView 
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: Location Selection */}
          <Animated.View 
            entering={FadeIn}
            className={`mb-6 ${currentStep >= 1 ? '' : 'opacity-40'}`}
          >
            <View className="flex-row items-center mb-3">
              <View className={`w-8 h-8 rounded-full items-center justify-center ${
                selectedLocation ? 'bg-brand-orange' : currentStep === 1 ? 'bg-brand-orange/20' : 'bg-zinc-800'
              }`}>
                <Text className={`font-bold ${selectedLocation ? 'text-black' : 'text-brand-orange'}`}>1</Text>
              </View>
              <Text className="text-white text-lg font-bold ml-3">Location</Text>
            </View>
            
            <Text className="text-zinc-500 text-sm mb-3 ml-11">
              Choose where this box is located
            </Text>

            <Pressable
              className={`ml-11 bg-zinc-900 rounded-xl p-4 flex-row items-center justify-between border ${
                currentStep === 1 ? 'border-brand-orange/30' : 'border-zinc-800'
              }`}
              onPress={() => currentStep === 1 && setShowLocationPicker(!showLocationPicker)}
              disabled={currentStep !== 1}
            >
              <View className="flex-row items-center flex-1">
                <MapPin size={20} color={selectedLocation ? '#FF9500' : '#71717a'} />
                <Text className={`ml-3 ${selectedLocation ? 'text-white font-semibold' : 'text-zinc-500'}`}>
                  {selectedLocation ? `${selectedLocation.name} (${selectedLocation.code})` : 'Select location...'}
                </Text>
              </View>
              {selectedLocation && <Check size={20} color="#FF9500" />}
            </Pressable>

            {showLocationPicker && (
              <Animated.View 
                entering={SlideInDown.springify()}
                className="ml-11 bg-zinc-900 rounded-xl mt-2 overflow-hidden border border-zinc-800"
              >
                {locations.map((loc) => (
                  <Pressable
                    key={loc.id}
                    className="p-4 flex-row items-center justify-between border-b border-zinc-800 active:bg-zinc-800"
                    onPress={() => handleLocationSelect(loc)}
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-brand-orange/20 rounded-lg items-center justify-center mr-3">
                        <Text className="text-brand-orange font-bold">{loc.code}</Text>
                      </View>
                      <Text className="text-white font-medium">{loc.name}</Text>
                    </View>
                  </Pressable>
                ))}
              </Animated.View>
            )}
          </Animated.View>

          {/* Step 2: Category */}
          <Animated.View 
            entering={FadeIn.delay(200)}
            className={`mb-6 ${currentStep >= 2 ? '' : 'opacity-40'}`}
          >
            <View className="flex-row items-center mb-3">
              <View className={`w-8 h-8 rounded-full items-center justify-center ${
                selectedCategory ? 'bg-brand-orange' : currentStep === 2 ? 'bg-brand-orange/20' : 'bg-zinc-800'
              }`}>
                <Text className={`font-bold ${selectedCategory ? 'text-black' : currentStep === 2 ? 'text-brand-orange' : 'text-zinc-600'}`}>2</Text>
              </View>
              <Text className={`text-lg font-bold ml-3 ${currentStep >= 2 ? 'text-white' : 'text-zinc-600'}`}>
                Category
              </Text>
            </View>
            
            <Text className="text-zinc-500 text-sm mb-3 ml-11">
              What type of items? This helps you find things faster
            </Text>

            <Pressable
              className={`ml-11 bg-zinc-900 rounded-xl p-4 flex-row items-center justify-between border ${
                currentStep === 2 ? 'border-brand-orange/30' : 'border-zinc-800'
              }`}
              onPress={() => currentStep === 2 && setShowCategoryPicker(!showCategoryPicker)}
              disabled={currentStep !== 2}
            >
              <Text className={selectedCategory ? 'text-white font-semibold' : 'text-zinc-500'}>
                {selectedCategory || 'Select category...'}
              </Text>
              {selectedCategory && <Check size={20} color="#FF9500" />}
            </Pressable>

            {showCategoryPicker && (
              <Animated.View 
                entering={SlideInDown.springify()}
                className="ml-11 bg-zinc-900 rounded-xl mt-2 max-h-56 border border-zinc-800"
              >
                <ScrollView showsVerticalScrollIndicator={false}>
                  {categories.slice(0, 8).map((cat) => (
                    <Pressable
                      key={cat.id}
                      className="p-4 flex-row items-center justify-between border-b border-zinc-800 active:bg-zinc-800"
                      onPress={() => handleCategorySelect(cat.code)}
                    >
                      <View>
                        <Text className="text-white font-semibold">{cat.code}</Text>
                        <Text className="text-zinc-500 text-xs">{cat.name}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            {generatedCode && (
              <Animated.View 
                entering={BounceIn.delay(200)}
                className="ml-11 mt-4 bg-brand-orange/10 border border-brand-orange/20 rounded-xl p-4"
              >
                <Text className="text-brand-orange text-xs font-bold mb-2">YOUR BOX CODE</Text>
                <Text className="text-brand-orange text-2xl font-black tracking-tight">
                  {generatedCode}
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Step 3: Scan Items */}
          <Animated.View 
            entering={FadeIn.delay(400)}
            className={`mb-6 ${currentStep >= 3 ? '' : 'opacity-40'}`}
          >
            <View className="flex-row items-center mb-3">
              <View className={`w-8 h-8 rounded-full items-center justify-center ${
                photoUri ? 'bg-brand-orange' : currentStep === 3 ? 'bg-brand-orange/20' : 'bg-zinc-800'
              }`}>
                <Text className={`font-bold ${photoUri ? 'text-black' : currentStep === 3 ? 'text-brand-orange' : 'text-zinc-600'}`}>3</Text>
              </View>
              <View className="flex-row items-center ml-3">
                <Text className={`text-lg font-bold ${currentStep >= 3 ? 'text-white' : 'text-zinc-600'}`}>
                  Scan Items
                </Text>
                <View className="ml-2 bg-brand-orange/15 px-2 py-1 rounded-full">
                  <Text className="text-brand-orange text-[10px] font-bold uppercase">✨ The Magic!</Text>
                </View>
              </View>
            </View>
            
            <Text className="text-zinc-500 text-sm mb-3 ml-11">
              Take a photo of what's in your box{'\n'}Our AI will identify items automatically
            </Text>

            {photoUri ? (
              <View className="ml-11">
                <Image
                  source={{ uri: photoUri }}
                  className="w-full h-56 rounded-xl"
                  resizeMode="cover"
                />
                
                {isAnalyzing && (
                  <View className="absolute inset-0 bg-black/70 rounded-xl items-center justify-center">
                    <View className="items-center">
                      <ActivityIndicator size="large" color="#FF9500" />
                      <Text className="text-white font-bold mt-4 text-lg">🔍 Identifying Items...</Text>
                      <Text className="text-zinc-400 text-sm mt-1">This usually takes 3-5 seconds</Text>
                    </View>
                  </View>
                )}

                {suggestedItems.length > 0 && !isAnalyzing && (
                  <Animated.View 
                    entering={FadeIn.delay(300)}
                    className="mt-4 bg-brand-orange/10 rounded-xl p-4 border border-brand-orange/20"
                  >
                    <View className="flex-row items-center mb-3">
                      <Sparkles size={18} color="#FF9500" />
                      <Text className="text-brand-orange font-bold ml-2">AI Found {suggestedItems.length} Items</Text>
                    </View>
                    {suggestedItems.slice(0, 5).map((item, i) => (
                      <View key={i} className="flex-row items-start mb-2">
                        <Text className="text-zinc-500 mr-2">•</Text>
                        <Text className="text-white flex-1">{item.name}</Text>
                      </View>
                    ))}
                    {suggestedItems.length > 5 && (
                      <Text className="text-zinc-500 text-sm mt-1">
                        +{suggestedItems.length - 5} more items
                      </Text>
                    )}
                  </Animated.View>
                )}
              </View>
            ) : (
              <View className="ml-11 flex-row gap-3">
                <Animated.View style={[{ flex: 1 }, cameraButtonStyle]}>
                  <Pressable
                    className="bg-brand-orange/10 rounded-2xl p-8 items-center border-2 border-brand-orange/30 active:bg-brand-orange/20"
                    onPress={takePhoto}
                    disabled={currentStep !== 3}
                  >
                    <Camera size={40} color="#FF9500" />
                    <Text className="text-brand-orange mt-3 font-bold text-base">📸 Scan Now</Text>
                  </Pressable>
                </Animated.View>
                <Pressable
                  className="flex-1 bg-zinc-900 rounded-2xl p-8 items-center border border-zinc-800 active:bg-zinc-800"
                  onPress={pickImage}
                  disabled={currentStep !== 3}
                >
                  <ImageIcon size={40} color="#71717a" />
                  <Text className="text-zinc-400 mt-3 font-medium">Upload</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="px-6 py-4 border-t border-zinc-900">
          <Pressable
            onPress={handleSaveBox}
            disabled={!selectedLocation || !selectedCategory}
            className={`flex-row items-center justify-center rounded-2xl py-4 ${
              selectedLocation && selectedCategory
                ? 'bg-brand-orange'
                : 'bg-zinc-800'
            }`}
          >
            <Package size={20} color={selectedLocation && selectedCategory ? '#000' : '#3f3f46'} />
            <Text
              className={`font-bold text-lg ml-2 ${
                selectedLocation && selectedCategory ? 'text-black' : 'text-zinc-600'
              }`}
            >
              Save Box
            </Text>
            {selectedLocation && selectedCategory && <ArrowRight size={20} color="#000" className="ml-1" />}
          </Pressable>
          <Text className="text-zinc-600 text-xs text-center mt-3">
            You can add more items later from the app
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
