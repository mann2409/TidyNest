import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Camera, Image as ImageIcon, Sparkles, ChevronDown, Check, Package, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import useStorageStore, { Location } from '@/lib/state/storage-store';
import Animated, { 
  FadeIn, 
  FadeOut,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

export default function AddContainerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = params.onboarding === '1';
  const locations = useStorageStore((s) => s.locations);
  const categories = useStorageStore((s) => s.categories);
  const containers = useStorageStore((s) => s.containers);
  const addContainer = useStorageStore((s) => s.addContainer);
  const getNextContainerCode = useStorageStore((s) => s.getNextContainerCode);
  const addItem = useStorageStore((s) => s.addItem);
  const remoteConfig = useStorageStore((s) => s.remoteConfig);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [suggestedCode, setSuggestedCode] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [suggestedItems, setSuggestedItems] = useState<{ name: string; tags: string[] }[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Confetti animation values
  const confetti1Scale = useSharedValue(0);
  const confetti2Scale = useSharedValue(0);
  const confetti3Scale = useSharedValue(0);
  const celebrationOpacity = useSharedValue(0);

  const confetti1Style = useAnimatedStyle(() => ({
    transform: [{ scale: confetti1Scale.value }, { rotate: '15deg' }],
    opacity: celebrationOpacity.value,
  }));

  const confetti2Style = useAnimatedStyle(() => ({
    transform: [{ scale: confetti2Scale.value }, { rotate: '-20deg' }],
    opacity: celebrationOpacity.value,
  }));

  const confetti3Style = useAnimatedStyle(() => ({
    transform: [{ scale: confetti3Scale.value }, { rotate: '10deg' }],
    opacity: celebrationOpacity.value,
  }));

  const triggerCelebration = () => {
    setShowCelebration(true);
    
    // Animate confetti
    celebrationOpacity.value = withSpring(1);
    confetti1Scale.value = withSequence(
      withSpring(1.2),
      withSpring(1),
    );
    confetti2Scale.value = withDelay(100, withSequence(
      withSpring(1.3),
      withSpring(1),
    ));
    confetti3Scale.value = withDelay(200, withSequence(
      withSpring(1.1),
      withSpring(1),
    ));

    // Hide after 3 seconds and navigate
    setTimeout(() => {
      celebrationOpacity.value = withSpring(0);
      setTimeout(() => {
        setShowCelebration(false);
        if (isOnboarding) {
          router.replace('/(tabs)');
        } else {
          router.back();
        }
      }, 500);
    }, 2500);
  };

  const handleManualAddItem = () => {
    if (!newItemName.trim()) return;
    setSuggestedItems([...suggestedItems, { name: newItemName.trim(), tags: [] }]);
    setNewItemName('');
  };

  const handleUpdateItemName = (index: number, newName: string) => {
    setSuggestedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, name: newName } : item
    ));
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

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      analyzePhoto(result.assets[0].uri);
    }
  };

  const analyzePhoto = async (uri: string) => {
    // Check if AI analysis is disabled remotely
    if (remoteConfig.enable_openai_vision === 'false') {
      console.log('AI Analysis is disabled via remote config');
      return;
    }

    console.log('Starting AI analysis for:', uri);
    setIsAnalyzing(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
      if (!apiKey || apiKey.includes('n0tr3al')) {
        Alert.alert('Configuration Error', 'OpenAI API Key is missing or invalid.');
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
                text: `Look at this storage box contents. Identify the specific items inside. List them with a name and 2-3 relevant tags. Also suggest 5-10 overall keywords for the box. Then suggest ONE category from this list: ${categoryList}. Respond ONLY in this JSON format: {"items": [{"name": "Item Name", "tags": ["tag1", "tag2"]}], "keywords": ["keyword1", "keyword2"], "category": "CATEGORY"}`
              },
              { 
                type: 'image_url', 
                image_url: {
                  url: dataUrl 
                }
              },
            ],
          }],
          response_format: { type: "json_object" }
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        Alert.alert('AI Error', data.error?.message || 'Failed to analyze photo');
        setIsAnalyzing(false);
        return;
      }

      const outputText = data.choices?.[0]?.message?.content || '';
      const parsed = JSON.parse(outputText);
      
      const detectedKeywords = parsed.keywords || [];
      const detectedCategory = parsed.category || 'MISC';
      const detectedItems = parsed.items || [];

      setKeywords(detectedKeywords);
      setCategory(detectedCategory);
      setSuggestedItems(detectedItems);
      
      if (selectedLocation) {
        setSuggestedCode(getNextContainerCode(selectedLocation.id, detectedCategory));
      }
    } catch (error: any) {
      console.error('Error analyzing photo:', error);
      Alert.alert('Connection Error', 'Check your internet or API key.');
      setCategory('MISC');
      if (selectedLocation) {
        setSuggestedCode(getNextContainerCode(selectedLocation.id, 'MISC'));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
    if (category) {
      setSuggestedCode(getNextContainerCode(location.id, category));
    }
  };

  const handleCategorySelect = (catCode: string) => {
    setCategory(catCode);
    setShowCategoryPicker(false);
    if (selectedLocation) {
      setSuggestedCode(getNextContainerCode(selectedLocation.id, catCode));
    }
  };

  const handleSave = () => {
    if (!selectedLocation || !category || !suggestedCode) return;

    const isFirstBox = containers.length === 0;

    const newContainer = addContainer({
      code: suggestedCode,
      locationId: selectedLocation.id,
      category,
      description: description || undefined,
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

    // Show celebration for first box only
    if (isFirstBox) {
      triggerCelebration();
    } else {
      if (isOnboarding) {
        router.replace('/(tabs)');
      } else {
        router.back();
      }
    }
  };

  const canSave = selectedLocation && category && suggestedCode;

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1">
        {/* Celebration Overlay */}
        {showCelebration && (
          <Animated.View 
            entering={FadeIn}
            exiting={FadeOut}
            className="absolute inset-0 z-50 bg-black/80 items-center justify-center"
          >
            <View className="items-center">
              {/* Confetti emojis */}
              <View className="absolute inset-0 items-center justify-center">
                <Animated.Text style={[confetti1Style, { position: 'absolute', top: '20%', left: '20%', fontSize: 60 }]}>
                  🎉
                </Animated.Text>
                <Animated.Text style={[confetti2Style, { position: 'absolute', top: '25%', right: '15%', fontSize: 50 }]}>
                  ✨
                </Animated.Text>
                <Animated.Text style={[confetti3Style, { position: 'absolute', bottom: '30%', left: '15%', fontSize: 55 }]}>
                  🎊
                </Animated.Text>
                <Animated.Text style={[confetti1Style, { position: 'absolute', bottom: '25%', right: '20%', fontSize: 45 }]}>
                  🎈
                </Animated.Text>
              </View>

              {/* Main message */}
              <View className="items-center z-10">
                <View className="w-24 h-24 bg-brand-orange rounded-full items-center justify-center mb-6 shadow-2xl shadow-brand-orange/50">
                  <Text className="text-6xl">📦</Text>
                </View>
                <Text className="text-white text-4xl font-black text-center mb-3">
                  Amazing!
                </Text>
                <Text className="text-brand-orange text-2xl font-bold text-center mb-2">
                  First Box Created! 🎉
                </Text>
                <Text className="text-zinc-400 text-center text-lg px-8">
                  You can now search for items anytime!
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
          <Pressable
            onPress={() => {
              if (isOnboarding) {
                router.replace('/(tabs)');
              } else {
                router.back();
              }
            }}
            className="p-2 -ml-2"
          >
            <X size={24} color="#fff" />
          </Pressable>
          <Text className="text-white font-semibold text-lg">
            {isOnboarding ? 'Scan your first box' : 'Scan & Add Items'}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className={`px-4 py-2 rounded-full ${canSave ? 'bg-brand-orange' : 'bg-[#94a3b8]/10 border border-[#94a3b8]/10'}`}
          >
            <Text className={canSave ? 'text-black font-semibold' : 'text-[#94a3b8]/40 font-medium'}>Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {isOnboarding && (
            <View className="mt-5 bg-brand-orange/10 border border-brand-orange/10 rounded-2xl p-4">
              <Text className="text-brand-orange font-bold text-xs uppercase tracking-widest">
                Quick win
              </Text>
              <Text className="text-white mt-1 font-semibold">
                Scan 1 box and tap Save.
              </Text>
              <Text className="text-zinc-400 text-sm mt-1">
                After this, you can search items anytime from the app.
              </Text>
            </View>
          )}

          {/* Step 1: Select Location */}
          <View className="mt-6">
            <Text className="text-zinc-400 text-sm mb-2 uppercase tracking-widest font-bold">1. Location</Text>
            <Pressable
              className="bg-zinc-900 rounded-xl p-4 flex-row items-center justify-between border border-zinc-800"
              onPress={() => setShowLocationPicker(!showLocationPicker)}
            >
              <Text className={selectedLocation ? 'text-white' : 'text-[#94a3b8]/60'}>
                {selectedLocation ? `${selectedLocation.name} (${selectedLocation.code})` : 'Choose where this box lives...'}
              </Text>
              <ChevronDown size={20} color="#94a3b8" />
            </Pressable>

            {showLocationPicker && (
              <View className="bg-zinc-900 rounded-xl mt-2 overflow-hidden border border-zinc-800">
                {locations.map((loc) => (
                  <Pressable
                    key={loc.id}
                    className="p-4 flex-row items-center justify-between border-b border-zinc-800 active:bg-zinc-800"
                    onPress={() => handleLocationSelect(loc)}
                  >
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 bg-brand-orange/20 rounded-lg items-center justify-center mr-3">
                        <Text className="text-brand-orange font-bold text-sm">{loc.code}</Text>
                      </View>
                      <Text className="text-white">{loc.name}</Text>
                    </View>
                    {selectedLocation?.id === loc.id && <Check size={20} color="#FF9500" />}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Step 2: Scan with AI */}
          <View className="mt-6">
            <Text className="text-zinc-400 text-sm mb-2 uppercase tracking-widest font-bold">2. Scan Items with Camera</Text>
            <Text className="text-zinc-600 text-xs mb-3">AI will identify contents and suggest keywords for easy searching.</Text>

            {photoUri ? (
              <View className="relative">
                <Image
                  source={{ uri: photoUri }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
                {isAnalyzing && (
                  <View className="absolute inset-0 bg-black/60 rounded-xl items-center justify-center">
                    <ActivityIndicator size="large" color="#14b8a6" />
                    <Text className="text-white mt-2 font-bold">AI Analyzing Contents...</Text>
                  </View>
                )}
                <Pressable
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full items-center justify-center"
                  onPress={() => {
                    setPhotoUri(null);
                    setKeywords([]);
                    setSuggestedItems([]);
                  }}
                >
                  <X size={16} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <Pressable
                  className="flex-1 bg-[#94a3b8]/5 rounded-xl p-6 items-center active:opacity-80 border border-[#94a3b8]/10"
                  onPress={takePhoto}
                >
                  <Camera size={32} color="#94a3b8" />
                  <Text className="text-[#94a3b8] mt-2 font-medium">Scan Now</Text>
                </Pressable>
                <Pressable
                  className="flex-1 bg-[#94a3b8]/5 rounded-xl p-6 items-center active:opacity-80 border border-[#94a3b8]/10"
                  onPress={pickImage}
                >
                  <ImageIcon size={32} color="#94a3b8" />
                  <Text className="text-[#94a3b8] mt-2 font-medium">Upload</Text>
                </Pressable>
              </View>
            )}

            {/* AI Keywords */}
            {keywords.length > 0 && (
              <View className="mt-4 bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <View className="flex-row items-center mb-2">
                  <Sparkles size={16} color="#FF9500" />
                  <Text className="text-[#94a3b8] ml-2 font-bold uppercase text-[10px] tracking-wider">Search Keywords</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {keywords.map((kw, i) => (
                    <View key={i} className="bg-brand-orange/10 px-3 py-1 rounded-full">
                      <Text className="text-brand-orange text-xs font-medium">{kw}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* AI Suggested Items */}
            {suggestedItems.length > 0 && (
              <View className="mt-4 bg-brand-orange/5 rounded-xl p-4 border border-brand-orange/10">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Package size={16} color="#FF9500" />
                    <Text className="text-brand-orange ml-2 font-bold uppercase text-[10px] tracking-wider">Suggested Items to Add</Text>
                  </View>
                  <Text className="text-[#94a3b8]/60 text-[10px]">{suggestedItems.length} found</Text>
                </View>
                <View className="gap-2">
                  {suggestedItems.map((item, i) => (
                    <View key={i} className="bg-zinc-900 p-3 rounded-lg flex-row items-center justify-between border border-zinc-800">
                      <View className="flex-1">
                        <TextInput
                          className="text-white font-medium p-0"
                          value={item.name}
                          onChangeText={(text) => handleUpdateItemName(i, text)}
                          placeholder="Item name..."
                          placeholderTextColor="#3f3f46"
                        />
                        <View className="flex-row flex-wrap gap-1 mt-1">
                          {item.tags.map((tag, j) => (
                            <Text key={j} className="text-zinc-500 text-[10px]">#{tag}</Text>
                          ))}
                        </View>
                      </View>
                      <Pressable 
                        onPress={() => setSuggestedItems(items => items.filter((_, idx) => idx !== i))}
                        className="p-1"
                      >
                        <X size={14} color="#3f3f46" />
                      </Pressable>
                    </View>
                  ))}
                  
                  {/* Manual Add Item */}
                  <View className="flex-row items-center gap-2 mt-2">
                    <Pressable 
                      onPress={handleManualAddItem}
                      className="bg-brand-orange/10 w-12 h-12 rounded-lg items-center justify-center border border-brand-orange/10 active:bg-brand-orange/20"
                    >
                      <Plus size={20} color="#FF9500" />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Step 3: Category */}
          <View className="mt-6">
            <Text className="text-zinc-400 text-sm mb-2 uppercase tracking-widest font-bold">3. Category</Text>
            <Pressable
              className="bg-zinc-900 rounded-xl p-4 flex-row items-center justify-between border border-zinc-800"
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text className={category ? 'text-white font-medium' : 'text-zinc-500'}>
                {category || 'Select category...'}
              </Text>
              <ChevronDown size={20} color="#71717a" />
            </Pressable>

            {showCategoryPicker && (
              <ScrollView className="bg-zinc-900 rounded-xl mt-2 max-h-48 border border-zinc-800">
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    className="p-4 flex-row items-center justify-between border-b border-zinc-800 active:bg-zinc-800"
                    onPress={() => handleCategorySelect(cat.code)}
                  >
                    <View className="flex-row items-center">
                      <Text className="text-white font-medium">{cat.code}</Text>
                      <Text className="text-zinc-500 ml-2 text-xs">{cat.name}</Text>
                    </View>
                    {category === cat.code && <Check size={20} color="#FF9500" />}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Step 4: Suggested Code */}
          {suggestedCode && (
            <View className="mt-6">
              <Text className="text-zinc-400 text-sm mb-2 uppercase tracking-widest font-bold">4. Auto-Suggested Box Code</Text>
              <View className="bg-brand-orange rounded-xl p-6 items-center shadow-lg shadow-brand-orange/20">
                <Text className="text-black text-4xl font-black tracking-tighter">{suggestedCode}</Text>
                <Text className="text-black/60 text-xs mt-1 font-bold">SMART GENERATED FOR {category}</Text>
              </View>
            </View>
          )}

          {/* Description */}
          <View className="mt-6 mb-8">
            <Text className="text-zinc-400 text-sm mb-2">Description (optional)</Text>
            <TextInput
              className="bg-zinc-900 rounded-xl p-4 text-white border border-zinc-800"
              placeholder="What's in this box?"
              placeholderTextColor="#71717a"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
