import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Plus, Tag, Camera, Image as ImageIcon, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import useStorageStore from '@/lib/state/storage-store';

export default function AddItemScreen() {
  const router = useRouter();
  const { containerId } = useLocalSearchParams<{ containerId: string }>();

  const addItem = useStorageStore((s) => s.addItem);
  const containers = useStorageStore((s) => s.containers);
  const remoteConfig = useStorageStore((s) => s.remoteConfig);

  const container = containers.find((c) => c.id === containerId);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedLabel, setSuggestedLabel] = useState<string>('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  const analyzePhoto = async (uri: string) => {
    // Check if AI analysis is disabled remotely
    if (remoteConfig.enable_openai_vision === 'false') {
      console.log('AI Analysis is disabled via remote config');
      return;
    }

    console.log('Starting AI analysis for item photo:', uri);
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
                text: `Look at this item photo. Identify what it is and suggest:
1. A short, clear item name (2-4 words max)
2. 3-5 relevant tags that would help someone find this item later

Respond ONLY in this JSON format: {"name": "Item Name", "tags": ["tag1", "tag2", "tag3"]}`
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
      
      const detectedName = parsed.name || '';
      const detectedTags = parsed.tags || [];

      setSuggestedLabel(detectedName);
      setSuggestedTags(detectedTags);
      
      // Auto-fill the name if empty
      if (!name && detectedName) {
        setName(detectedName);
      }
      
      // Auto-add tags
      if (detectedTags.length > 0) {
        const newTags = detectedTags.filter((tag: string) => !tags.includes(tag.toLowerCase()));
        setTags([...tags, ...newTags.map((t: string) => t.toLowerCase())]);
      }
      
    } catch (error: any) {
      console.error('Error analyzing photo:', error);
      Alert.alert('Connection Error', 'Check your internet connection or API key.');
    } finally {
      setIsAnalyzing(false);
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

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (!name.trim() || !containerId) return;

    addItem({
      containerId,
      name: name.trim(),
      tags,
      quantity: quantity ? parseInt(quantity, 10) : undefined,
      notes: notes.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      photoUrl: photoUri || undefined,
    });

    router.back();
  };

  const canSave = name.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2">
              <X size={24} color="#fff" />
            </Pressable>
            <Text className="text-white font-semibold text-lg">Add Item</Text>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              className={`px-4 py-2 rounded-full ${canSave ? 'bg-amber-500' : 'bg-[#94a3b8]/10 border border-[#94a3b8]/10'}`}
            >
              <Text className={canSave ? 'text-black font-semibold' : 'text-[#94a3b8]/40 font-medium'}>Save</Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
            {/* Container Info */}
            {container && (
              <View className="bg-amber-500/20 rounded-xl p-3 mt-4 flex-row items-center">
                <Text className="text-amber-500 font-bold">{container.code}</Text>
                <Text className="text-zinc-400 ml-2">Adding item to this box</Text>
              </View>
            )}

            {/* Photo Section */}
            <View className="mt-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-zinc-400 text-sm">Item Photo (optional)</Text>
                {photoUri && !isAnalyzing && suggestedLabel && (
                  <View className="flex-row items-center">
                    <Sparkles size={14} color="#f59e0b" />
                    <Text className="text-amber-500 text-xs font-semibold ml-1">AI Detected</Text>
                  </View>
                )}
              </View>
              {photoUri ? (
                <View className="relative">
                  <Image
                    source={{ uri: photoUri }}
                    className="w-full h-48 rounded-xl"
                    resizeMode="cover"
                  />
                  {isAnalyzing && (
                    <View className="absolute inset-0 bg-black/70 rounded-xl items-center justify-center">
                      <ActivityIndicator size="large" color="#f59e0b" />
                      <Text className="text-white font-bold mt-3 text-base">🔍 Identifying Item...</Text>
                      <Text className="text-zinc-400 text-sm mt-1">AI is analyzing the photo</Text>
                    </View>
                  )}
                  <Pressable
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full items-center justify-center"
                    onPress={() => {
                      setPhotoUri(null);
                      setSuggestedLabel('');
                      setSuggestedTags([]);
                    }}
                  >
                    <X size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row gap-3">
                  <Pressable
                    className="flex-1 bg-amber-500/10 rounded-xl p-4 items-center border-2 border-amber-500/30 active:bg-amber-500/20"
                    onPress={takePhoto}
                  >
                    <Camera size={28} color="#f59e0b" />
                    <Text className="text-amber-500 mt-2 font-semibold">Take Photo</Text>
                    <Text className="text-amber-500/60 text-xs mt-1">AI will label it</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 bg-zinc-900 rounded-xl p-4 items-center border border-zinc-800 active:bg-zinc-800"
                    onPress={pickImage}
                  >
                    <ImageIcon size={28} color="#71717a" />
                    <Text className="text-zinc-400 mt-2 font-medium">Upload</Text>
                    <Text className="text-zinc-600 text-xs mt-1">AI will label it</Text>
                  </Pressable>
                </View>
              )}
              
              {/* AI Suggestion Display */}
              {!isAnalyzing && suggestedLabel && (
                <View className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <View className="flex-row items-center mb-2">
                    <Sparkles size={16} color="#f59e0b" />
                    <Text className="text-amber-500 font-bold text-xs uppercase tracking-wider ml-2">
                      AI Suggestion
                    </Text>
                  </View>
                  <Text className="text-white font-semibold text-base mb-1">{suggestedLabel}</Text>
                  {suggestedTags.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 mt-2">
                      {suggestedTags.map((tag, i) => (
                        <View key={i} className="bg-amber-500/20 px-3 py-1 rounded-full">
                          <Text className="text-amber-500 text-xs font-medium">#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text className="text-zinc-500 text-xs mt-2">
                    ✓ Auto-filled below. You can edit if needed.
                  </Text>
                </View>
              )}
            </View>

            {/* Item Name */}
            <View className="mt-6">
              <Text className="text-zinc-400 text-sm mb-2">Item Name *</Text>
              <TextInput
                className="bg-zinc-900 rounded-xl p-4 text-white text-base"
                placeholder="e.g., Hammer, Extension cord, Ornaments..."
                placeholderTextColor="#71717a"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            {/* Quantity */}
            <View className="mt-6">
              <Text className="text-zinc-400 text-sm mb-2">Quantity (optional)</Text>
              <TextInput
                className="bg-zinc-900 rounded-xl p-4 text-white text-base"
                placeholder="1"
                placeholderTextColor="#71717a"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
              />
            </View>

            {/* Expiry Date */}
            <View className="mt-6">
              <Text className="text-zinc-400 text-sm mb-2">Expiry Date (optional)</Text>
              <TextInput
                className="bg-zinc-900 rounded-xl p-4 text-white text-base"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#71717a"
                value={expiryDate}
                onChangeText={setExpiryDate}
              />
              <Text className="text-zinc-600 text-xs mt-1 ml-1">Items expiring within 7 days will be highlighted.</Text>
            </View>

            {/* Tags */}
            <View className="mt-6">
              <Text className="text-zinc-400 text-sm mb-2">Tags (optional)</Text>
              <View className="flex-row items-center bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                <Tag size={20} color="#94a3b8" className="ml-4" />
                <TextInput
                  className="flex-1 p-4 text-white text-base"
                  placeholder="Add tags for easy search..."
                  placeholderTextColor="#94a3b8"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                  returnKeyType="done"
                />
                {tagInput.trim() && (
                  <Pressable
                    className="px-4 py-2 mr-2 bg-amber-500 rounded-lg"
                    onPress={handleAddTag}
                  >
                    <Plus size={20} color="#000" />
                  </Pressable>
                )}
              </View>

              {tags.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {tags.map((tag) => (
                    <Pressable
                      key={tag}
                      className="flex-row items-center bg-zinc-800 px-3 py-2 rounded-full"
                      onPress={() => handleRemoveTag(tag)}
                    >
                      <Text className="text-zinc-300">{tag}</Text>
                      <X size={14} color="#71717a" className="ml-1" />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Notes */}
            <View className="mt-6 mb-8">
              <Text className="text-zinc-400 text-sm mb-2">Notes (optional)</Text>
              <TextInput
                className="bg-zinc-900 rounded-xl p-4 text-white text-base"
                placeholder="Any additional details..."
                placeholderTextColor="#71717a"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
