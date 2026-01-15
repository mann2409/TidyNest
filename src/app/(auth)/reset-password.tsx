import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/state/auth-store';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If there's no session, they shouldn't be here
  // But Supabase should have established a recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // setError('Invalid or expired reset link. Please request a new one.');
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async () => {
    if (!password) {
      setError('Please enter a new password');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;
      
      setSuccess(true);
      
      // Clear session to force re-login or just let them stay logged in
      // Usually after password reset we might want them to log in again for security
      // but Supabase keeps them logged in. Let's just redirect to login after a delay
      setTimeout(() => {
        router.replace('/login');
      }, 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
          <View className="flex-1 justify-center py-12">
            {!success ? (
              <>
                <View className="mb-12">
                  <Text className="text-white text-4xl font-bold">New Password</Text>
                  <Text className="text-zinc-500 text-lg mt-2">Create a secure password for your account</Text>
                </View>

                <View className="space-y-4">
                  <View>
                    <Text className="text-zinc-400 text-sm mb-2 ml-1">New Password</Text>
                    <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 border border-zinc-800">
                      <Lock size={20} color="#71717a" />
                      <TextInput
                        className="flex-1 py-4 ml-3 text-white"
                        placeholder="••••••••"
                        placeholderTextColor="#3f3f46"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View className="mt-4">
                    <Text className="text-zinc-400 text-sm mb-2 ml-1">Confirm Password</Text>
                    <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 border border-zinc-800">
                      <Lock size={20} color="#71717a" />
                      <TextInput
                        className="flex-1 py-4 ml-3 text-white"
                        placeholder="••••••••"
                        placeholderTextColor="#3f3f46"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  {error && (
                    <View className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 mt-6">
                      <Text className="text-red-500 text-sm text-center">{error}</Text>
                    </View>
                  )}

                  <Pressable
                    onPress={handleUpdatePassword}
                    disabled={loading || !password || !confirmPassword}
                    className={`mt-10 py-4 rounded-2xl flex-row items-center justify-center ${
                      loading || !password || !confirmPassword ? 'bg-zinc-800' : 'bg-amber-500'
                    }`}
                  >
                    {loading ? (
                      <Loader2 size={24} color="#000" className="animate-spin" />
                    ) : (
                      <>
                        <Text className="text-black font-bold text-lg mr-2">Update Password</Text>
                        <ArrowRight size={20} color="#000" />
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <View className="items-center">
                <View className="w-20 h-20 bg-green-500/20 rounded-full items-center justify-center mb-6">
                  <CheckCircle2 size={40} color="#22c55e" />
                </View>
                <Text className="text-white text-3xl font-bold text-center">Password Updated</Text>
                <Text className="text-zinc-500 text-lg text-center mt-4">
                  Your password has been changed successfully. Redirecting you to login...
                </Text>
                <Pressable
                  onPress={() => router.replace('/login')}
                  className="mt-12 bg-zinc-800 px-8 py-4 rounded-2xl"
                >
                  <Text className="text-white font-bold text-lg">Back to Login</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
