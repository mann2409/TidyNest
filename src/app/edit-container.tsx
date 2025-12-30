import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Camera, Image as ImageIcon, Sparkles, ChevronDown, Check, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import useStorageStore, { Location } from '@/lib/state/storage-store';
import { ALL_CATEGORIES } from '@/lib/category-mapping';

interface SuggestedItem {
  name: string;
  selected: boolean;
}

export default function EditContainerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const containers = useStorageStore((s) => s.containers);
  const locations = useStorageStore((s) => s.locations);
  const updateContainer = useStorageStore((s) => s.updateContainer);
  const addItem = useStorageStore((s) => s.addItem);

  const container = containers.find((c) => c.id === id);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState<SuggestedItem[]>([]);

  // Initialize form with existing container data
  useEffect(() => {
    if (container) {
      const loc = locations.find((l) => l.id === container.locationId);
      setSelectedLocation(loc || null);
      setCategory(container.category);
      setDescription(container.description || '');
      setPhotoUri(container.photoUrl || null);
    }
  }, [container, locations]);

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
    setIsAnalyzing(true);
    setSuggestedItems([]);

    try {
      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;

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
                text: 'Look at this storage box or container photo. List ALL individual items you can see in the image. Be specific with item names (e.g., "Phillips screwdriver" instead of just "tool"). Also suggest ONE category from: TOOLS, ELEC, TAPE, PAINT, GARDEN, CAMPING, XMAS, KITCHEN, CLEAN, OFFICE, KIDS, SPORTS, AUTO, PLUMB, CRAFT, MISC. Respond ONLY in this JSON format: {"items": ["item1", "item2", "item3"], "category": "CATEGORY"}'
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
        const detectedItems = parsed.items || [];
        const detectedCategory = parsed.category || 'MISC';

        // Convert detected items to SuggestedItem format
        setSuggestedItems(detectedItems.map((item: string) => ({
          name: item,
          selected: false,
        })));

        // Only update category if it's different
        if (!category || category === 'MISC') {
          setCategory(detectedCategory);
        }
      }
    } catch (error) {
      console.log('Error analyzing photo:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeCurrentPhoto = () => {
    if (photoUri) {
      analyzePhoto(photoUri);
    }
  };

  const toggleItemSelection = (index: number) => {
    setSuggestedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const selectAllItems = () => {
    setSuggestedItems(prev => prev.map(item => ({ ...item, selected: true })));
  };

  const handleAddSelectedItems = () => {
    if (!container) return;

    const selectedItemNames = suggestedItems
      .filter(item => item.selected)
      .map(item => item.name);

    for (const itemName of selectedItemNames) {
      addItem({
        containerId: container.id,
        name: itemName,
        tags: [],
        quantity: 1,
      });
    }

    // Remove added items from suggestions
    setSuggestedItems(prev => prev.filter(item => !item.selected));
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setShowCategoryPicker(false);
  };

  const handleSave = () => {
    if (!container || !selectedLocation || !category) return;

    updateContainer(container.id, {
      locationId: selectedLocation.id,
      category,
      description: description || undefined,
      photoUrl: photoUri || undefined,
    });

    router.back();
  };

  const canSave = selectedLocation && category;
  const selectedCount = suggestedItems.filter(i => i.selected).length;

  if (!container) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center">
        <Text className="text-white">Box not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <X size={24} color="#fff" />
          </Pressable>
          <Text className="text-white font-semibold text-lg">Edit Box</Text>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className={`px-4 py-2 rounded-full ${canSave ? 'bg-amber-500' : 'bg-zinc-800'}`}
          >
            <Text className={canSave ? 'text-black font-semibold' : 'text-zinc-500'}>Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Box Code (Read Only) */}
          <View className="mt-6">
            <Text className="text-zinc-400 text-sm mb-2">Box Code</Text>
            <View className="bg-amber-500/20 rounded-xl p-4 items-center">
              <Text className="text-amber-500 text-2xl font-bold">{container.code}</Text>
            </View>
          </View>

          {/* Location */}
          <View className="mt-6">
            <Text className="text-zinc-400 text-sm mb-2">Location</Text>
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

          {/* Category */}
          <View className="mt-6">
            <Text className="text-zinc-400 text-sm mb-2">Category</Text>
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
                {ALL_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    className="p-4 flex-row items-center justify-between border-b border-zinc-800 active:bg-zinc-800"
                    onPress={() => handleCategorySelect(cat)}
                  >
                    <Text className="text-white">{cat}</Text>
                    {category === cat && <Check size={20} color="#f59e0b" />}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Photo */}
          <View className="mt-6">
            <Text className="text-zinc-400 text-sm mb-2">Photo</Text>

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
                    setSuggestedItems([]);
                  }}
                >
                  <X size={16} color="#fff" />
                </Pressable>
                {!isAnalyzing && (
                  <Pressable
                    className="absolute bottom-2 right-2 flex-row items-center bg-amber-500 px-3 py-2 rounded-full"
                    onPress={handleAnalyzeCurrentPhoto}
                  >
                    <Sparkles size={16} color="#000" />
                    <Text className="text-black font-medium ml-1">Detect Items</Text>
                  </Pressable>
                )}
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
          </View>

          {/* AI Suggested Items */}
          {suggestedItems.length > 0 && (
            <View className="mt-6 bg-zinc-900 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Sparkles size={18} color="#f59e0b" />
                  <Text className="text-amber-500 ml-2 font-semibold">Detected Items</Text>
                </View>
                <Pressable onPress={selectAllItems}>
                  <Text className="text-amber-500 text-sm">Select All</Text>
                </Pressable>
              </View>
              <Text className="text-zinc-400 text-sm mb-3">
                Tap items to select, then add them to this box
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {suggestedItems.map((item, index) => (
                  <Pressable
                    key={index}
                    className={`px-3 py-2 rounded-full border ${
                      item.selected
                        ? 'bg-amber-500 border-amber-500'
                        : 'bg-zinc-800 border-zinc-700'
                    }`}
                    onPress={() => toggleItemSelection(index)}
                  >
                    <Text className={item.selected ? 'text-black font-medium' : 'text-zinc-300'}>
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {selectedCount > 0 && (
                <Pressable
                  className="mt-4 bg-amber-500 rounded-xl p-3 flex-row items-center justify-center active:opacity-80"
                  onPress={handleAddSelectedItems}
                >
                  <Plus size={18} color="#000" />
                  <Text className="text-black font-semibold ml-2">
                    Add {selectedCount} Item{selectedCount > 1 ? 's' : ''} to Box
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Description */}
          <View className="mt-6 mb-8">
            <Text className="text-zinc-400 text-sm mb-2">Description</Text>
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
