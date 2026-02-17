import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface GardenDecoration {
  id: string;
  name: string;
  emoji: string;
}

interface FrontPageProps {
  purchasedItems?: GardenDecoration[];
  flowerCount?: number;
}

export default function FrontPage({ purchasedItems, flowerCount }: FrontPageProps) {
  const handleGetStarted = () => {
    router.push('/(onboarding)/registration');
  };

  const showGarden = (flowerCount && flowerCount > 0) || (purchasedItems && purchasedItems.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            resizeMode="contain"
          />
        </View>

        {/* Headline */}
        <View style={styles.headlineContainer}>
          <Text style={styles.headline}>
            Care for your skin, one easy day at a time
          </Text>
          <Text style={styles.subheadline}>
            Build consistent skincare habits — even on hard days.
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>Begin my routine</Text>
        </TouchableOpacity>

        {/* Small Garden Preview - shown if user has progress */}
        {showGarden && (
          <View style={styles.gardenPreview}>
            <View style={styles.gardenCard}>
              <Text style={styles.gardenLabel}>Your garden is growing</Text>

              {/* Mini Garden Display */}
              <View style={styles.gardenItems}>
                {/* Flowers from routine completions */}
                {flowerCount && Array.from({ length: Math.min(flowerCount, 12) }).map((_, i) => (
                  <View key={`flower-${i}`} style={styles.gardenItem}>
                    <Text style={styles.gardenEmoji}>🌸</Text>
                  </View>
                ))}

                {/* Purchased decorations */}
                {purchasedItems && purchasedItems.slice(0, 8).map((item) => (
                  <View key={item.id} style={styles.gardenItem}>
                    <Text style={styles.gardenEmoji}>{item.emoji}</Text>
                  </View>
                ))}
              </View>

              {/* Simple count */}
              <Text style={styles.gardenCount}>
                {flowerCount || 0} {(flowerCount || 0) === 1 ? 'flower' : 'flowers'} planted
                {purchasedItems && purchasedItems.length > 0 && ` · ${purchasedItems.length} decoration${purchasedItems.length === 1 ? '' : 's'}`}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Floating Navigation Icons - shown for returning users */}
      {showGarden && (
        <>
          <TouchableOpacity
            style={[styles.floatingButton, styles.floatingButtonLeft]}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={20} color="#7B9B8C" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.floatingButton, styles.floatingButtonRight]}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={20} color="#7B9B8C" />
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#D4E3DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '300',
    color: '#5A7A6B',
    fontStyle: 'italic',
  },
  headlineContainer: {
    alignItems: 'center',
    maxWidth: 320,
    marginBottom: 48,
  },
  headline: {
    fontSize: 24,
    fontWeight: '600',
    color: '#5A7A6B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  subheadline: {
    fontSize: 16,
    color: '#6B7370',
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: '#5A7A6B',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gardenPreview: {
    marginTop: 48,
    width: '100%',
    maxWidth: 320,
  },
  gardenCard: {
    backgroundColor: '#FFF9F5',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8DED0',
  },
  gardenLabel: {
    fontSize: 12,
    color: '#8A9088',
    textAlign: 'center',
    marginBottom: 16,
  },
  gardenItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  gardenItem: {
    alignItems: 'center',
  },
  gardenEmoji: {
    fontSize: 24,
  },
  gardenCount: {
    fontSize: 12,
    color: '#8A9088',
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#D8D5CF',
  },
  floatingButtonLeft: {
    left: 24,
  },
  floatingButtonRight: {
    right: 24,
  },
});
