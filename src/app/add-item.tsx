import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Plus, Tag } from 'lucide-react-native';
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
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

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
              className={`px-4 py-2 rounded-full ${canSave ? 'bg-amber-500' : 'bg-zinc-800'}`}
            >
              <Text className={canSave ? 'text-black font-semibold' : 'text-zinc-500'}>Save</Text>
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

            {/* Tags */}
            <View className="mt-6">
              <Text className="text-zinc-400 text-sm mb-2">Tags (optional)</Text>
              <View className="flex-row items-center bg-zinc-900 rounded-xl overflow-hidden">
                <Tag size={20} color="#71717a" className="ml-4" />
                <TextInput
                  className="flex-1 p-4 text-white text-base"
                  placeholder="Add tags for easy search..."
                  placeholderTextColor="#71717a"
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
