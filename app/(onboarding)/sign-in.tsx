import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabaseClient';

function isProfileComplete(profile: { primary_condition?: string | null; conditions?: unknown[]; selected_treatment_plan_id?: string | null } | null): boolean {
  if (!profile) return false;
  if (profile.primary_condition) return true;
  if (Array.isArray(profile.conditions) && profile.conditions.length > 0) return true;
  if (profile.selected_treatment_plan_id) return true;
  return false;
}

export default function SignIn() {
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      if (!data.user) {
        setError('Sign in failed');
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('primary_condition, conditions, selected_treatment_plan_id')
        .eq('id', data.user.id)
        .single();
      if (isProfileComplete(profile)) {
        router.replace('/(tabs)');
      } else {
        router.replace({ pathname: '/(onboarding)/registration', params: { step: '2' } });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setError(null);
    setLoading(true);
    try {
      const emailClean = email.trim().toLowerCase().replace(/\s+/g, '');
      if (!emailClean || !emailClean.includes('@')) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailClean,
        password,
        options: { data: { name: name.trim() || undefined } },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      if (!data.user) {
        setError('Sign up failed');
        setLoading(false);
        return;
      }
      router.replace({ pathname: '/(onboarding)/registration', params: { step: '2' } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const isSignInValid = email.trim().length > 0 && password.length >= 6 && !loading;
  const isCreateValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    email.includes('@') &&
    password.length >= 6 &&
    termsAccepted &&
    !loading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor="#FAF8F5" />
      <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#7B9B8C" />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'signin'
              ? 'Welcome back. Sign in to continue on this device.'
              : 'Enter your details to get started. You’ll set up your routine next.'}
          </Text>

          <View style={styles.card}>
            {mode === 'create' && (
              <View style={styles.field}>
                <Text style={styles.label}>Your name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#8A9088"
                />
              </View>
            )}
            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="your@email.com"
                placeholderTextColor="#8A9088"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder={mode === 'create' ? 'At least 6 characters' : 'Enter your password'}
                placeholderTextColor="#8A9088"
              />
              {password.length > 0 && password.length < 6 && (
                <Text style={styles.errorText}>Password must be at least 6 characters</Text>
              )}
            </View>
            {mode === 'create' && (
              <View style={styles.field}>
                <View style={styles.termsRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
                    onPress={() => setTermsAccepted((v) => !v)}
                  >
                    {termsAccepted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </TouchableOpacity>
                  <Text style={styles.termsText}>
                    I agree to the terms of service
                  </Text>
                </View>
              </View>
            )}
          </View>

          {error ? <Text style={[styles.errorText, { marginBottom: 8 }]}>{error}</Text> : null}
          <TouchableOpacity
            onPress={mode === 'signin' ? handleSignIn : handleCreateAccount}
            disabled={mode === 'signin' ? !isSignInValid : !isCreateValid}
            style={[
              styles.signInButton,
              (mode === 'signin' ? !isSignInValid : !isCreateValid) && styles.signInButtonDisabled,
            ]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text
                  style={[
                    styles.signInButtonText,
                    (mode === 'signin' ? !isSignInValid : !isCreateValid) &&
                    styles.signInButtonTextDisabled,
                  ]}
                >
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={mode === 'signin' ? (isSignInValid ? '#FFFFFF' : '#6B7370') : isCreateValid ? '#FFFFFF' : '#6B7370'}
                />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <Text
              style={styles.footerLink}
              onPress={() => {
                setError(null);
                setMode(mode === 'signin' ? 'create' : 'signin');
              }}
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  backArrow: {
    padding: 16,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D4A3E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B8B7D',
    marginBottom: 24,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(149, 201, 142, 0.3)',
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#5F8575',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(149, 201, 142, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2D4A3E',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#EF4444',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(149, 201, 142, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#5F8575',
    borderColor: '#5F8575',
  },
  termsText: {
    fontSize: 14,
    color: '#2D4A3E',
    flex: 1,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5F8575',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  signInButtonDisabled: {
    backgroundColor: '#D8D5CF',
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signInButtonTextDisabled: {
    color: '#6B7370',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
    color: '#6B8B7D',
  },
  footerLink: {
    fontSize: 14,
    color: '#5F8575',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
