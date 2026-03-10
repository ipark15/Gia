import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

function isProfileComplete(profile: { primary_condition?: string | null; conditions?: unknown[]; selected_treatment_plan_id?: string | null } | null): boolean {
  if (!profile) return false;
  if (profile.primary_condition) return true;
  if (Array.isArray(profile.conditions) && profile.conditions.length > 0) return true;
  if (profile.selected_treatment_plan_id) return true;
  return false;
}

export interface GardenDecoration {
  id: string;
  name: string;
  emoji: string;
}

interface FrontPageProps {
  onGetStarted?: () => void;
  onNavigateHome?: () => void;
  purchasedItems?: GardenDecoration[];
  flowerCount?: number;
}

export default function FrontPage(_props: FrontPageProps) {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (isProfileComplete(profile)) {
      router.replace('/(tabs)');
    }
  }, [user, profile, loading]);

  const handleGetStarted = () => {
    router.push('/(onboarding)/sign-in');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor="#D4F1F9" />
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Headline */}
          <View style={styles.headlineContainer}>
            <Text style={styles.headline}>
              Care for your skin, one day at a time
            </Text>
            <Text style={styles.subheadline}>
              Build skincare habits that last, even on hard days
            </Text>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaButtonText}>Begin my routine</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D4F1F9',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 56,
  },
  logo: {
    width: 320,
    height: 320,
  },
  headlineContainer: {
    alignItems: 'center',
    maxWidth: 320,
    marginBottom: 32,
  },
  headline: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D4A3E',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  subheadline: {
    fontSize: 16,
    color: '#6B8B7D',
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: '#6B9B6E',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
