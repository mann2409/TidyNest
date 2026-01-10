import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Plus, Trash2, Tag, Edit3, Check } from 'lucide-react-native';
import useStorageStore, { Category } from '@/lib/state/storage-store';

export default function CategoriesScreen() {
  const router = useRouter();
  const categories = useStorageStore((s) => s.categories);
  const addCategory = useStorageStore((s) => s.addCategory);
  const updateCategory = useStorageStore((s) => s.updateCategory);
  const deleteCategory = useStorageStore((s) => s.deleteCategory);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newKeywords, setNewKeywords] = useState('');

  const resetForm = () => {
    setNewCode('');
    setNewName('');
    setNewKeywords('');
    setEditingCategory(null);
  };

  const handleAdd = () => {
    if (!newCode.trim() || !newName.trim()) return;

    const keywords = newKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    addCategory({
      code: newCode.toUpperCase().trim(),
      name: newName.trim(),
      keywords,
      isDefault: false,
    });

    resetForm();
    setShowAddModal(false);
  };

  const handleUpdate = () => {
    if (!editingCategory || !newCode.trim() || !newName.trim()) return;

    const keywords = newKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    updateCategory(editingCategory.id, {
      code: newCode.toUpperCase().trim(),
      name: newName.trim(),
      keywords,
    });

    resetForm();
    setShowAddModal(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNewCode(category.code);
    setNewName(category.name);
    setNewKeywords(category.keywords.join(', '));
    setShowAddModal(true);
  };

  const handleDelete = (category: Category) => {
    if (category.isDefault) return;
    deleteCategory(category.id);
  };

  const customCategories = categories.filter((c) => !c.isDefault);
  const defaultCategories = categories.filter((c) => c.isDefault);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <X size={24} color="#fff" />
        </Pressable>
        <Text className="text-white font-semibold text-lg">Categories</Text>
        <Pressable
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="p-2 -mr-2"
        >
          <Plus size={24} color="#FF9500" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Empty State for Custom Categories */}
        {customCategories.length === 0 && (
          <View className="items-center justify-center px-8 py-12">
            <View className="w-20 h-20 bg-brand-orange/10 rounded-2xl items-center justify-center mb-4 border-2 border-brand-orange/20">
              <Tag size={40} color="#FF9500" />
            </View>
            <Text className="text-white text-xl font-bold text-center mb-2">
              Create custom categories
            </Text>
            <Text className="text-zinc-400 text-center leading-5 mb-6">
              Add your own categories to better organize specific items in your boxes.
            </Text>
            <Pressable
              className="bg-brand-orange rounded-xl px-6 py-3 active:opacity-90 flex-row items-center"
              onPress={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              <Plus size={18} color="#000" />
              <Text className="text-black font-bold ml-2">Add Category</Text>
            </Pressable>
          </View>
        )}

        {/* Custom Categories */}
        {customCategories.length > 0 && (
          <View className="mt-6">
            <Text className="text-zinc-400 text-sm mb-3 px-1">Your Categories</Text>
            {customCategories.map((category) => (
              <View
                key={category.id}
                className="bg-zinc-900 rounded-xl p-4 mb-2 flex-row items-center"
              >
                <View className="w-12 h-12 bg-brand-orange/20 rounded-xl items-center justify-center mr-3">
                  <Text className="text-brand-orange font-bold text-xs">{category.code}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">{category.name}</Text>
                  <Text className="text-zinc-500 text-xs mt-1" numberOfLines={1}>
                    {category.keywords.slice(0, 3).join(', ')}
                    {category.keywords.length > 3 ? '...' : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleEdit(category)}
                  className="p-2 mr-1"
                >
                  <Edit3 size={18} color="#71717a" />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(category)}
                  className="p-2"
                >
                  <Trash2 size={18} color="#ef4444" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Default Categories */}
        <View className="mt-6 mb-8">
          <Text className="text-zinc-400 text-sm mb-3 px-1">Default Categories</Text>
          {defaultCategories.map((category) => (
            <View
              key={category.id}
              className="bg-zinc-900/50 rounded-xl p-4 mb-2 flex-row items-center"
            >
              <View className="w-12 h-12 bg-zinc-800 rounded-xl items-center justify-center mr-3">
                <Text className="text-zinc-400 font-bold text-xs">{category.code}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-zinc-300 font-medium">{category.name}</Text>
                <Text className="text-zinc-600 text-xs mt-1" numberOfLines={1}>
                  {category.keywords.slice(0, 3).join(', ')}
                  {category.keywords.length > 3 ? '...' : ''}
                </Text>
              </View>
              <View className="bg-zinc-800 px-2 py-1 rounded">
                <Text className="text-zinc-500 text-xs">Default</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <View className="flex-1 bg-zinc-950">
          <SafeAreaView className="flex-1">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 -ml-2"
              >
                <X size={24} color="#fff" />
              </Pressable>
              <Text className="text-white font-semibold text-lg">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </Text>
              <Pressable
                onPress={editingCategory ? handleUpdate : handleAdd}
                disabled={!newCode.trim() || !newName.trim()}
                className={`px-4 py-2 rounded-full ${
                  newCode.trim() && newName.trim() ? 'bg-brand-orange' : 'bg-zinc-800'
                }`}
              >
                <Text
                  className={
                    newCode.trim() && newName.trim() ? 'text-black font-semibold' : 'text-zinc-500'
                  }
                >
                  {editingCategory ? 'Save' : 'Add'}
                </Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
              {/* Code Input */}
              <View className="mt-6">
                <Text className="text-zinc-400 text-sm mb-2">Code (short label)</Text>
                <TextInput
                  className="bg-zinc-900 rounded-xl p-4 text-white text-lg font-bold"
                  placeholder="e.g. BOOKS"
                  placeholderTextColor="#71717a"
                  value={newCode}
                  onChangeText={(text) => setNewCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <Text className="text-zinc-600 text-xs mt-2 px-1">
                  This appears on box labels (max 8 characters)
                </Text>
              </View>

              {/* Name Input */}
              <View className="mt-6">
                <Text className="text-zinc-400 text-sm mb-2">Name</Text>
                <TextInput
                  className="bg-zinc-900 rounded-xl p-4 text-white"
                  placeholder="e.g. Books & Magazines"
                  placeholderTextColor="#71717a"
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              {/* Keywords Input */}
              <View className="mt-6 mb-8">
                <Text className="text-zinc-400 text-sm mb-2">Keywords (for AI detection)</Text>
                <TextInput
                  className="bg-zinc-900 rounded-xl p-4 text-white"
                  placeholder="e.g. book, magazine, novel, textbook"
                  placeholderTextColor="#71717a"
                  value={newKeywords}
                  onChangeText={setNewKeywords}
                  multiline
                  numberOfLines={3}
                />
                <Text className="text-zinc-600 text-xs mt-2 px-1">
                  Separate keywords with commas. AI uses these to auto-suggest this category.
                </Text>
              </View>

              {/* Preview */}
              {newCode.trim() && newName.trim() && (
                <View className="bg-zinc-900 rounded-xl p-4 mb-8">
                  <Text className="text-zinc-400 text-sm mb-3">Preview</Text>
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-brand-orange/20 rounded-xl items-center justify-center mr-3">
                      <Text className="text-brand-orange font-bold text-xs">
                        {newCode.trim().substring(0, 8)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-white font-medium">{newName.trim()}</Text>
                      <Text className="text-zinc-500 text-xs">
                        {newKeywords
                          .split(',')
                          .filter((k) => k.trim())
                          .slice(0, 3)
                          .map((k) => k.trim())
                          .join(', ') || 'No keywords'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
