import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { G } from '../constants/Gradients';
import Svg, { Circle } from 'react-native-svg';
import { AskGiaChat } from './AskGiaChat';
import { getProductRecommendations } from './TreatmentProducts';

export interface RoutineExecutionProps {
  onComplete: () => void;
  onSwitchToGentler: () => void;
  onBack?: () => void;
  planId?: string;
  dermatologistProducts?: Array<{
    id: string;
    name: string;
    brand: string;
    instructions?: string;
    timeOfDay: 'am' | 'pm' | 'both';
    step: string;
  }>;
  /** User-saved customizations. Takes priority over derm products and OTC plan. */
  customRoutine?: { amRoutine: Array<{ step: string; products: Array<{ brand: string; name: string; keyIngredient: string; amazonUrl?: string; note?: string }> }>; pmRoutine: Array<{ step: string; products: Array<{ brand: string; name: string; keyIngredient: string; amazonUrl?: string; note?: string }> }> } | null;
  /** Override time-of-day detection. Pass 'morning' or 'evening' based on the user's preference. */
  forceRoutineType?: 'morning' | 'evening';
}

const RING_SIZE = 120;
const RING_RADIUS = 50;
const RING_STROKE = 9;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Returns recommended duration in seconds based on step name. */
function getStepDuration(stepName: string): number {
  const name = stepName.toLowerCase();
  if (name.includes('mask')) return 300;
  if (name.includes('cleanser') || name.includes('cleanse')) return 90;
  if (name.includes('exfoliant') || name.includes('exfoliat') || name.includes('scrub')) return 60;
  if (name.includes('serum') || name.includes('treatment') || name.includes('spot')) return 60;
  if (name.includes('moisturizer') || name.includes('moisturiz') || name.includes('cream')) return 45;
  if (name.includes('toner') || name.includes('tone')) return 30;
  if (name.includes('sunscreen') || name.includes('spf')) return 30;
  if (name.includes('eye')) return 30;
  if (name.includes('oil')) return 30;
  if (name.includes('mist') || name.includes('spray')) return 20;
  return 60;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getProductUrl(product: { brand: string; name: string; amazonUrl?: string }): string {
  if (product.amazonUrl) return product.amazonUrl;
  const searchQuery = encodeURIComponent(`${product.brand} ${product.name}`);
  return `https://www.amazon.com/s?k=${searchQuery}`;
}

export function RoutineExecution({
  onComplete,
  onSwitchToGentler,
  onBack,
  planId = 'acne-basic',
  dermatologistProducts,
  customRoutine,
  forceRoutineType,
}: RoutineExecutionProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showProducts, setShowProducts] = useState(false);
  const [showGiaChat, setShowGiaChat] = useState(false);
  const [stepDuration, setStepDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const timeOfDay = new Date().getHours();
  const isEvening = forceRoutineType
    ? forceRoutineType === 'evening'
    : timeOfDay >= 18 || timeOfDay < 6;

  const { amRoutine, pmRoutine } = useMemo(
    () => getProductRecommendations(planId || 'acne-basic'),
    [planId]
  );

  let routine: any[] = [];

  if (customRoutine) {
    routine = isEvening ? customRoutine.pmRoutine : customRoutine.amRoutine;
  } else if (dermatologistProducts && dermatologistProducts.length > 0) {
    routine = dermatologistProducts
      .filter(
        (p: {
          timeOfDay: 'am' | 'pm' | 'both';
          step: string;
          name: string;
          brand: string;
          instructions?: string;
        }) =>
          p.timeOfDay === 'both' ||
          p.timeOfDay === (isEvening ? 'pm' : 'am')
      )
      .map((p) => ({
        step: p.step,
        description: p.instructions || `Apply ${p.name}`,
        products: [
          {
            brand: p.brand || '',
            name: p.name,
            category: p.step,
            keyIngredient: p.instructions || 'Prescribed by dermatologist',
          },
        ],
      }));
  } else {
    routine = isEvening ? pmRoutine : amRoutine;
  }

  const fallbackRoutine =
    routine.length === 0
      ? isEvening
        ? getProductRecommendations('acne-basic').pmRoutine
        : getProductRecommendations('acne-basic').amRoutine
      : routine;

  const currentStep = fallbackRoutine[currentStepIndex];
  const isLastStep = currentStepIndex === fallbackRoutine.length - 1;
  const progress = fallbackRoutine.length > 0 ? ((currentStepIndex + 1) / fallbackRoutine.length) * 100 : 0;

  // Keep a ref so auto-advance timeout can check current isLastStep value
  const isLastStepRef = useRef(isLastStep);
  useEffect(() => { isLastStepRef.current = isLastStep; }, [isLastStep]);

  // Initialize timer whenever the step changes
  useEffect(() => {
    if (!currentStep) return;
    const d = getStepDuration(currentStep.step);
    setStepDuration(d);
    setTimeLeft(d);
    setIsPaused(false);
  }, [currentStepIndex]);

  // Countdown — ticks every second when not paused and time remains
  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [isPaused, timeLeft]);

  // Auto-advance when timer hits zero, except on the last step
  useEffect(() => {
    if (timeLeft === 0 && stepDuration > 0 && !isLastStepRef.current) {
      const id = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
        setShowProducts(false);
      }, 800);
      return () => clearTimeout(id);
    }
  }, [timeLeft, stepDuration]);

  const handleNextStep = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
      setShowProducts(false);
    }
  };

  const handleSkipStep = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
      setShowProducts(false);
    }
  };

  const openProduct = (product: { brand?: string; name: string; amazonUrl?: string }) => {
    Linking.openURL(
      getProductUrl({
        brand: product.brand ?? '',
        name: product.name,
        amazonUrl: product.amazonUrl,
      })
    );
  };

  if (!currentStep) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading routine...</Text>
      </View>
    );
  }

  // Ring calculations
  const ringProgress = stepDuration > 0 ? timeLeft / stepDuration : 0;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - ringProgress);
  const ringColor = timeLeft === 0 ? '#5F8575' : isPaused ? '#B0BAB4' : '#7B9B8C';

  const productList =
    currentStep.products?.filter(
      (p: { brand?: string }) => p.brand !== 'N/A' && p.brand !== ''
    ) ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {onBack && currentStepIndex === 0 && (
            <TouchableOpacity onPress={onBack} style={styles.backRow} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#6B7370" />
              <Text style={styles.backText}>back</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.timeLabel}>
            {isEvening ? 'Evening' : 'Morning'} Routine
          </Text>

          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Step {currentStepIndex + 1} of {fallbackRoutine.length}
            </Text>
          </View>

          {/* Circular timer ring */}
          <TouchableOpacity
            style={styles.ringContainer}
            onPress={() => setIsPaused((p) => !p)}
            activeOpacity={0.85}
          >
            <Svg
              width={RING_SIZE}
              height={RING_SIZE}
              style={{ transform: [{ rotate: '-90deg' }] }}
            >
              {/* Background track */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="#E2DED8"
                strokeWidth={RING_STROKE}
                fill="none"
              />
              {/* Progress arc */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={ringColor}
                strokeWidth={RING_STROKE}
                fill="none"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </Svg>
            {/* Centered time label */}
            <View style={styles.ringCenter}>
              <Text style={[styles.ringTime, { color: ringColor }]}>
                {formatTime(timeLeft)}
              </Text>
              <Text style={styles.ringHint}>
                {isPaused ? 'tap to resume' : 'tap to pause'}
              </Text>
            </View>
          </TouchableOpacity>

          <LinearGradient colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={styles.card}>
            <Text style={styles.stepName}>{currentStep.step}</Text>
            <Text style={styles.instruction}>
              Apply gently and let absorb before moving to the next step.
            </Text>

            {productList.length > 0 && (
              <View style={styles.productsSection}>
                <TouchableOpacity
                  style={styles.productsToggle}
                  onPress={() => setShowProducts(!showProducts)}
                  activeOpacity={0.85}
                >
                  <View style={styles.productsToggleLeft}>
                    <Ionicons name="cart-outline" size={16} color="#7B9B8C" />
                    <Text style={styles.productsToggleText}>
                      Recommended products ({productList.length})
                    </Text>
                  </View>
                  <Ionicons
                    name={showProducts ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#7B9B8C"
                  />
                </TouchableOpacity>

                {showProducts && (
                  <View style={styles.productsList}>
                    {productList.map(
                      (
                        product: {
                          brand?: string;
                          name: string;
                          keyIngredient?: string;
                          explanation?: string;
                          amazonUrl?: string;
                          note?: string;
                        },
                        idx: number
                      ) => (
                        <View
                          key={idx}
                          style={[
                            styles.productItem,
                            idx === productList.length - 1 && styles.productItemLast,
                          ]}
                        >
                          <View style={styles.productMain}>
                            <View style={styles.productInfo}>
                              <Text style={styles.productBrand}>{product.brand}</Text>
                              <Text style={styles.productName}>{product.name}</Text>
                              <Text style={styles.productKey}>
                                <Text style={styles.productKeyLabel}>Key:</Text> {product.keyIngredient}
                              </Text>
                              {product.explanation && (
                                <Text style={styles.productExplanation}> {product.explanation}</Text>
                              )}
                            </View>
                            <TouchableOpacity
                              style={styles.buyButton}
                              onPress={() => openProduct(product)}
                              activeOpacity={0.9}
                            >
                              <Ionicons name="cart" size={12} color="#FFFFFF" />
                              <Text style={styles.buyButtonText}>Buy</Text>
                            </TouchableOpacity>
                          </View>
                          {product.note && (
                            <Text style={styles.productNote}> {product.note}</Text>
                          )}
                        </View>
                      ))}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep} activeOpacity={0.9}>
              <LinearGradient colors={G.btnGreenLight.colors} start={G.btnGreenLight.start} end={G.btnGreenLight.end} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 20 }} />
              <Text style={styles.primaryButtonText}>
                {isLastStep ? 'Complete routine' : 'Next step'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkipStep} activeOpacity={0.8}>
              <Text style={styles.skipButtonText}>Skip this step</Text>
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity
            style={styles.gentlerLink}
            onPress={onSwitchToGentler}
            activeOpacity={0.8}
          >
            <Text style={styles.gentlerLinkText}>
              Feeling irritation? Switch to gentler routine
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.askGiaButton}
            onPress={() => setShowGiaChat(true)}
            activeOpacity={0.9}
          >
            <LinearGradient colors={G.btnAskGia.colors} start={G.btnAskGia.start} end={G.btnAskGia.end} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 20 }} />
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
            <Text style={styles.askGiaButtonText}>ask gia</Text>
            <Text style={styles.askGiaOptional}>(optional)</Text>
          </TouchableOpacity>
          <Text style={styles.askGiaHint}>
            get guidance, check-in, or add photos during your routine
          </Text>
        </View>
      </ScrollView>

      <AskGiaChat
        isOpen={showGiaChat}
        onClose={() => setShowGiaChat(false)}
        currentStep={currentStep.step}
        routineType={isEvening ? 'evening' : 'morning'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 48 },
  inner: { maxWidth: 400, width: '100%', alignSelf: 'center' },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { fontSize: 16, color: '#6B7370' },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: { fontSize: 14, color: '#6B7370' },

  timeLabel: {
    fontSize: 14,
    color: '#6B7370',
    textAlign: 'center',
    marginBottom: 16,
  },

  progressSection: { marginBottom: 20 },
  progressTrack: {
    height: 6,
    backgroundColor: '#D8D5CF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7B9B8C',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7370',
    textAlign: 'center',
    marginTop: 8,
  },

  // Circular timer ring
  ringContainer: {
    alignSelf: 'center',
    width: RING_SIZE,
    height: RING_SIZE,
    marginBottom: 20,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringTime: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
  },
  ringHint: {
    fontSize: 9,
    color: '#9CA8A3',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#D8D5CF',
    marginBottom: 24,
    overflow: 'hidden',
  },
  stepName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#7B9B8C',
    textAlign: 'center',
    marginBottom: 16,
  },
  instruction: {
    fontSize: 14,
    color: '#6B7370',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  productsSection: { marginBottom: 24 },
  productsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: 'rgba(212,227,219,0.3)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(123,155,140,0.3)',
  },
  productsToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productsToggleText: { fontSize: 14, fontWeight: '600', color: '#7B9B8C' },
  productsList: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8D5CF',
    gap: 16,
  },
  productItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D5CF',
  },
  productItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  productMain: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  productInfo: { flex: 1, marginRight: 12 },
  productBrand: { fontSize: 14, fontWeight: '600', color: '#7B9B8C', marginBottom: 2 },
  productName: { fontSize: 12, color: '#6B7370', marginBottom: 4 },
  productKey: { fontSize: 12, color: '#7B9B8C' },
  productKeyLabel: { fontWeight: '600' },
  productExplanation: { fontSize: 12, color: '#6B7370', fontStyle: 'italic', marginTop: 8 },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7B9B8C',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  buyButtonText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  productNote: { fontSize: 12, color: '#6B7370', fontStyle: 'italic', marginTop: 8 },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  primaryButtonText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  skipButtonText: { fontSize: 14, color: '#6B7370' },

  gentlerLink: {
    alignSelf: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  gentlerLinkText: {
    fontSize: 14,
    color: '#6B7370',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },

  askGiaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 8,
    overflow: 'hidden',
  },
  askGiaButtonText: { fontSize: 16, color: '#FFFFFF', fontStyle: 'italic', fontWeight: '600' },
  askGiaOptional: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  askGiaHint: {
    fontSize: 12,
    color: '#6B8B7D',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
