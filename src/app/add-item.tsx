import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Plus, Tag, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import useStorageStore from '@/lib/state/storage-store';

export default function AddItemScreen() {
  const router = useRouter();
  const { containerId } = useLocalSearchParams<{ containerId: string }>();

  const addItem = useStorageStore((s) => s.addItem);
  const containers = useStorageStore((s) => s.containers);

  const container = containers.find((c) => c.id === containerId);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
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
              <Text className="text-zinc-400 text-sm mb-2">Item Photo (optional)</Text>
              {photoUri ? (
                <View className="relative">
                  <Image
                    source={{ uri: photoUri }}
                    className="w-full h-48 rounded-xl"
                    resizeMode="cover"
                  />
                  <Pressable
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full items-center justify-center"
                    onPress={() => setPhotoUri(null)}
                  >
                    <X size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row gap-3">
                  <Pressable
                    className="flex-1 bg-[#94a3b8]/5 rounded-xl p-4 items-center border border-[#94a3b8]/10 active:opacity-80"
                    onPress={takePhoto}
                  >
                    <Camera size={24} color="#94a3b8" />
                    <Text className="text-[#94a3b8] mt-2 font-medium">Take Photo</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 bg-[#94a3b8]/5 rounded-xl p-4 items-center border border-[#94a3b8]/10 active:opacity-80"
                    onPress={pickImage}
                  >
                    <ImageIcon size={24} color="#94a3b8" />
                    <Text className="text-[#94a3b8] mt-2 font-medium">Upload</Text>
                  </Pressable>
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
