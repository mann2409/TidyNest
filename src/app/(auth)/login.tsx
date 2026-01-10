import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Mail, Lock, Loader2, ArrowRight, Users, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/state/auth-store';

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const setGuestMode = useAuthStore((s) => s.setGuestMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      
      if (data.session) {
        setSession(data.session);
        router.replace('/welcome-survey');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to sign in');
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
          <View className="flex-1 justify-center py-12">
            <View className="mb-8 items-center">
              <View className="w-24 h-24 bg-[#5a8d8d] rounded-3xl items-center justify-center mb-6 overflow-hidden shadow-xl shadow-[#5a8d8d]/40">
                <Image 
                  source={require('../../../assets/logo.png')} 
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              <Text className="text-white text-4xl font-black tracking-tighter">TidyNest</Text>
              <Text className="text-zinc-500 text-lg mt-1 text-center">Smart Home Storage Solutions</Text>
              
              {/* Value Prop with Social Proof */}
              <View className="flex-row items-center mt-6 bg-brand-orange/10 border border-brand-orange/20 rounded-full px-4 py-2.5">
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
                <View className="flex-row justify-between mb-2 px-1">
                  <Text className="text-zinc-400 text-sm">Password</Text>
                  <Link href="/forgot-password" asChild>
                    <Pressable>
                      <Text className="text-brand-orange text-sm">Forgot Password?</Text>
                    </Pressable>
                  </Link>
                </View>
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

              {error && (
                <View className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 mt-4">
                  <Text className="text-red-500 text-sm text-center">{error}</Text>
                </View>
              )}

              <Pressable
                onPress={handleLogin}
                disabled={loading || !email || !password}
                className={`mt-6 py-4 rounded-2xl flex-row items-center justify-center ${
                  loading || !email || !password ? 'bg-zinc-800' : 'bg-brand-orange'
                }`}
              >
                {loading ? (
                  <Loader2 size={24} color="#000" className="animate-spin" />
                ) : (
                  <>
                    <Text className="text-black font-bold text-lg mr-2">Sign In</Text>
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
              <Text className="text-zinc-500">Don't have an account? </Text>
              <Link href="/signup" asChild>
                <Pressable>
                  <Text className="text-brand-orange font-bold">Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

