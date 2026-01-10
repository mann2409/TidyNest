import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Mail, Lock, Loader2, ArrowRight, ChevronLeft, Users, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/state/auth-store';

export default function SignupScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const setGuestMode = useAuthStore((s) => s.setGuestMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      
      if (data.user) {
        // Most Supabase setups require email confirmation, but some don't.
        // We'll redirect to login and show a message.
        setError('Check your email to confirm your account!');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    // Continue as guest - skip to main app without authentication
    setGuestMode(true);
    router.replace('/welcome-survey');
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
          <View className="py-6">
            <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-zinc-900 rounded-full">
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
          </View>

          <View className="flex-1 justify-center pb-12">
            <View className="mb-8">
              <Text className="text-white text-4xl font-bold">Create Account</Text>
              <Text className="text-zinc-500 text-lg mt-2">Start tracking your storage boxes</Text>
              
              {/* Value Prop with Social Proof */}
              <View className="flex-row items-center mt-4 bg-brand-orange/10 border border-brand-orange/20 rounded-full px-4 py-2.5 self-start">
                <Users size={16} color="#FF9500" />
                <Text className="text-brand-orange text-sm font-semibold ml-2">Join 10,000+ organized homes</Text>
                <Sparkles size={16} color="#FF9500" className="ml-1" />
              </View>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-zinc-400 text-sm mb-2 ml-1">Email Address</Text>
                <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 border border-zinc-800">
                  <Mail size={20} color="#71717a" />
                  <TextInput
                    className="flex-1 py-4 ml-3 text-white"
                    placeholder="email@example.com"
                    placeholderTextColor="#3f3f46"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View className="mt-4">
                <Text className="text-zinc-400 text-sm mb-2 ml-1">Password</Text>
                <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 border border-zinc-800">
                  <Lock size={20} color="#71717a" />
                  <TextInput
                    className="flex-1 py-4 ml-3 text-white"
                    placeholder="••••••••"
                    placeholderTextColor="#3f3f46"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
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
                  />
                </View>
              </View>

              {error && (
                <View className={`rounded-xl p-3 mt-4 border ${
                  error.includes('Check your email') ? 'bg-brand-orange/10 border-brand-orange/50' : 'bg-red-500/10 border-red-500/50'
                }`}>
                  <Text className={`text-sm text-center ${
                    error.includes('Check your email') ? 'text-brand-orange' : 'text-red-500'
                  }`}>{error}</Text>
                </View>
              )}

              <Pressable
                onPress={handleSignup}
                disabled={loading || !email || !password || !confirmPassword}
                className={`mt-6 py-4 rounded-2xl flex-row items-center justify-center ${
                  loading || !email || !password || !confirmPassword ? 'bg-zinc-800' : 'bg-brand-orange'
                }`}
              >
                {loading ? (
                  <Loader2 size={24} color="#000" className="animate-spin" />
                ) : (
                  <>
                    <Text className="text-black font-bold text-lg mr-2">Create Account</Text>
                    <ArrowRight size={20} color="#000" />
                  </>
                )}
              </Pressable>

              {/* Continue as Guest Button */}
              <Pressable
                onPress={handleGuestMode}
                className="mt-3 py-4 rounded-2xl flex-row items-center justify-center bg-zinc-900/50 border border-zinc-800"
              >
                <Text className="text-zinc-400 font-semibold text-base">Continue as Guest</Text>
              </Pressable>
            </View>

            <View className="mt-8 flex-row justify-center">
              <Text className="text-zinc-500">Already have an account? </Text>
              <Link href="/login" asChild>
                <Pressable>
                  <Text className="text-brand-orange font-bold">Sign In</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

