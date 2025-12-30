import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Plus, MapPin, Trash2, Edit3 } from 'lucide-react-native';
import useStorageStore from '@/lib/state/storage-store';

export default function LocationsScreen() {
  const router = useRouter();
  const locations = useStorageStore((s) => s.locations);
  const containers = useStorageStore((s) => s.containers);
  const addLocation = useStorageStore((s) => s.addLocation);
  const deleteLocation = useStorageStore((s) => s.deleteLocation);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');

  const handleAdd = () => {
    if (!newName.trim() || !newCode.trim()) return;

    // Check if code already exists
    const codeExists = locations.some(
      (l) => l.code.toLowerCase() === newCode.trim().toUpperCase()
    );
    if (codeExists) {
      return;
    }

    addLocation({
      name: newName.trim(),
      code: newCode.trim().toUpperCase(),
    });

    setNewName('');
    setNewCode('');
    setShowAddForm(false);
  };

  const handleDelete = (locationId: string) => {
    const containersInLocation = containers.filter((c) => c.locationId === locationId);
    if (containersInLocation.length > 0) {
      // Can't delete - has containers
      return;
    }
    deleteLocation(locationId);
  };

  const getContainerCount = (locationId: string) => {
    return containers.filter((c) => c.locationId === locationId).length;
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <X size={24} color="#fff" />
          </Pressable>
          <Text className="text-white font-semibold text-lg">Locations</Text>
          <Pressable
            className="w-10 h-10 bg-amber-500 rounded-full items-center justify-center"
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={20} color="#000" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Add Form */}
          {showAddForm && (
            <View className="bg-zinc-900 rounded-xl p-4 mt-4">
              <Text className="text-white font-medium mb-4">Add New Location</Text>

              <View className="mb-3">
                <Text className="text-zinc-400 text-sm mb-1">Name</Text>
                <TextInput
                  className="bg-zinc-800 rounded-lg p-3 text-white"
                  placeholder="e.g., Garage, Attic, Basement..."
                  placeholderTextColor="#71717a"
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />
              </View>

              <View className="mb-4">
                <Text className="text-zinc-400 text-sm mb-1">Code (2-3 letters)</Text>
                <TextInput
                  className="bg-zinc-800 rounded-lg p-3 text-white"
                  placeholder="e.g., G, AT, BS..."
                  placeholderTextColor="#71717a"
                  value={newCode}
                  onChangeText={(text) => setNewCode(text.toUpperCase())}
                  maxLength={3}
                  autoCapitalize="characters"
                />
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  className="flex-1 bg-zinc-800 rounded-lg p-3 items-center"
                  onPress={() => {
                    setShowAddForm(false);
                    setNewName('');
                    setNewCode('');
                  }}
                >
                  <Text className="text-zinc-400 font-medium">Cancel</Text>
                </Pressable>
                <Pressable
                  className={`flex-1 rounded-lg p-3 items-center ${
                    newName.trim() && newCode.trim() ? 'bg-amber-500' : 'bg-zinc-800'
                  }`}
                  onPress={handleAdd}
                  disabled={!newName.trim() || !newCode.trim()}
                >
                  <Text
                    className={
                      newName.trim() && newCode.trim()
                        ? 'text-black font-medium'
                        : 'text-zinc-500'
                    }
                  >
                    Add
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Locations List */}
          <View className="mt-4">
            <Text className="text-zinc-400 text-sm mb-2">
              {locations.length} location{locations.length !== 1 ? 's' : ''}
            </Text>

            {locations.map((location) => {
              const containerCount = getContainerCount(location.id);
              const canDelete = containerCount === 0;

              return (
                <View
                  key={location.id}
                  className="bg-zinc-900 rounded-xl p-4 mb-2 flex-row items-center"
                >
                  <View className="w-12 h-12 bg-amber-500/20 rounded-xl items-center justify-center mr-3">
                    <Text className="text-amber-500 font-bold text-lg">{location.code}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">{location.name}</Text>
                    <Text className="text-zinc-500 text-sm">
                      {containerCount} box{containerCount !== 1 ? 'es' : ''}
                    </Text>
                  </View>
                  {canDelete && (
                    <Pressable
                      className="p-2"
                      onPress={() => handleDelete(location.id)}
                    >
                      <Trash2 size={18} color="#71717a" />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>

          {/* Help Text */}
          <View className="mt-6 mb-8">
            <Text className="text-zinc-600 text-sm text-center">
              Location codes appear in box codes (e.g., G-TOOLS-01).
              {'\n'}Locations with boxes cannot be deleted.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
