import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Camera, Image as ImageIcon, Sparkles, ChevronDown, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import useStorageStore, { Location } from '@/lib/state/storage-store';

export default function AddContainerScreen() {
  const router = useRouter();
  const locations = useStorageStore((s) => s.locations);
  const categories = useStorageStore((s) => s.categories);
  const addContainer = useStorageStore((s) => s.addContainer);
  const getNextContainerCode = useStorageStore((s) => s.getNextContainerCode);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [suggestedCode, setSuggestedCode] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      if (selectedLocation) {
        analyzePhoto(result.assets[0].uri);
      }
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
      if (selectedLocation) {
        analyzePhoto(result.assets[0].uri);
      }
    }
  };

  const analyzePhoto = async (uri: string) => {
    if (!selectedLocation) return;

    setIsAnalyzing(true);
    try {
      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      // Build dynamic category list from store
      const categoryList = categories.map((c) => c.code).join(', ');

      // Call OpenAI Vision API
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-5.2',
          input: [{
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Look at this storage box contents. List 5-10 keywords describing the items you see (e.g., hammer, screwdriver, tape, cables). Then suggest ONE category from this list: ${categoryList}. Respond ONLY in this JSON format: {"keywords": ["item1", "item2"], "category": "CATEGORY"}`
              },
              { type: 'input_image', image_url: dataUrl },
            ],
          }],
        }),
      });

      const data = await response.json();
      const outputText = data.output?.[0]?.content?.[0]?.text || '';

      // Parse JSON response
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const detectedKeywords = parsed.keywords || [];
        const detectedCategory = parsed.category || 'MISC';

        setKeywords(detectedKeywords);
        setCategory(detectedCategory);
        setSuggestedCode(getNextContainerCode(selectedLocation.id, detectedCategory));
      }
    } catch (error) {
      console.log('Error analyzing photo:', error);
      // Fallback to MISC category
      setCategory('MISC');
      setSuggestedCode(getNextContainerCode(selectedLocation.id, 'MISC'));
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

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setShowCategoryPicker(false);
    if (selectedLocation) {
      setSuggestedCode(getNextContainerCode(selectedLocation.id, cat));
    }
  };

  const handleSave = () => {
    if (!selectedLocation || !category || !suggestedCode) return;

    addContainer({
      code: suggestedCode,
      locationId: selectedLocation.id,
      category,
      description: description || undefined,
      photoUrl: photoUri || undefined,
    });

    router.back();
  };

  const canSave = selectedLocation && category && suggestedCode;

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <X size={24} color="#fff" />
          </Pressable>
          <Text className="text-white font-semibold text-lg">Add Box</Text>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className={`px-4 py-2 rounded-full ${canSave ? 'bg-amber-500' : 'bg-zinc-800'}`}
          >
            <Text className={canSave ? 'text-black font-semibold' : 'text-zinc-500'}>Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Step 1: Select Location */}
          <View className="mt-6">
            <Text className="text-zinc-400 text-sm mb-2">1. Select Location</Text>
            <Pressable
              className="bg-zinc-900 rounded-xl p-4 flex-row items-center justify-between"
              onPress={() => setShowLocationPicker(!showLocationPicker)}
            >
              <Text className={selectedLocation ? 'text-white' : 'text-zinc-500'}>
                {selectedLocation ? `${selectedLocation.name} (${selectedLocation.code})` : 'Choose a location...'}
              </Text>
              <ChevronDown size={20} color="#71717a" />
            </Pressable>

            {showLocationPicker && (
              <View className="bg-zinc-900 rounded-xl mt-2 overflow-hidden">
                {locations.map((loc) => (
                  <Pressable
                    key={loc.id}
                    className="p-4 flex-row items-center justify-between border-b border-zinc-800 active:bg-zinc-800"
                    onPress={() => handleLocationSelect(loc)}
                  >
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 bg-amber-500/20 rounded-lg items-center justify-center mr-3">
                        <Text className="text-amber-500 font-bold text-sm">{loc.code}</Text>
                      </View>
                      <Text className="text-white">{loc.name}</Text>
                    </View>
                    {selectedLocation?.id === loc.id && <Check size={20} color="#f59e0b" />}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Step 2: Take Photo */}
          <View className="mt-6">
            <Text className="text-zinc-400 text-sm mb-2">2. Take a Photo (optional)</Text>

            {photoUri ? (
              <View className="relative">
                <Image
                  source={{ uri: photoUri }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
                {isAnalyzing && (
                  <View className="absolute inset-0 bg-black/60 rounded-xl items-center justify-center">
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text className="text-white mt-2">Analyzing contents...</Text>
                  </View>
                )}
                <Pressable
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full items-center justify-center"
                  onPress={() => {
                    setPhotoUri(null);
                    setKeywords([]);
                  }}
                >
                  <X size={16} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <Pressable
                  className="flex-1 bg-zinc-900 rounded-xl p-6 items-center active:opacity-80"
                  onPress={takePhoto}
                >
                  <Camera size={32} color="#f59e0b" />
                  <Text className="text-white mt-2">Camera</Text>
                </Pressable>
                <Pressable
                  className="flex-1 bg-zinc-900 rounded-xl p-6 items-center active:opacity-80"
                  onPress={pickImage}
                >
                  <ImageIcon size={32} color="#f59e0b" />
                  <Text className="text-white mt-2">Gallery</Text>
                </Pressable>
              </View>
            )}

            {/* AI Keywords */}
            {keywords.length > 0 && (
              <View className="mt-4 bg-zinc-900 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Sparkles size={16} color="#f59e0b" />
                  <Text className="text-amber-500 ml-2 font-medium">AI Detected Items</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {keywords.map((kw, i) => (
                    <View key={i} className="bg-zinc-800 px-3 py-1 rounded-full">
                      <Text className="text-zinc-300 text-sm">{kw}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Step 3: Category */}
          <View className="mt-6">
            <Text className="text-zinc-400 text-sm mb-2">3. Category</Text>
            <Pressable
              className="bg-zinc-900 rounded-xl p-4 flex-row items-center justify-between"
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text className={category ? 'text-white font-medium' : 'text-zinc-500'}>
                {category || 'Select category...'}
              </Text>
              <ChevronDown size={20} color="#71717a" />
            </Pressable>

            {showCategoryPicker && (
              <ScrollView className="bg-zinc-900 rounded-xl mt-2 max-h-48">
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    className="p-4 flex-row items-center justify-between border-b border-zinc-800 active:bg-zinc-800"
                    onPress={() => handleCategorySelect(cat.code)}
                  >
                    <View className="flex-row items-center">
                      <Text className="text-white font-medium">{cat.code}</Text>
                      <Text className="text-zinc-500 ml-2">{cat.name}</Text>
                    </View>
                    {category === cat.code && <Check size={20} color="#f59e0b" />}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Step 4: Suggested Code */}
          {suggestedCode && (
            <View className="mt-6">
              <Text className="text-zinc-400 text-sm mb-2">4. Box Code</Text>
              <View className="bg-amber-500/20 rounded-xl p-4 items-center">
                <Text className="text-amber-500 text-3xl font-bold">{suggestedCode}</Text>
                <Text className="text-zinc-400 text-sm mt-1">Print this on your label</Text>
              </View>
            </View>
          )}

          {/* Description */}
          <View className="mt-6 mb-8">
            <Text className="text-zinc-400 text-sm mb-2">Description (optional)</Text>
            <TextInput
              className="bg-zinc-900 rounded-xl p-4 text-white"
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
