import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getProductRecommendations } from './TreatmentProducts';
import { AskGiaChat } from './AskGiaChat';

export interface RoutineExecutionProps {
  onComplete: () => void;
  onSwitchToGentler: () => void;
  onBack?: () => void;
  planId?: string;
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
}: RoutineExecutionProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showProducts, setShowProducts] = useState(false);
  const [showGiaChat, setShowGiaChat] = useState(false);

  const timeOfDay = new Date().getHours();
  const isEvening = timeOfDay >= 18 || timeOfDay < 6;

  const { amRoutine, pmRoutine } = useMemo(
    () => getProductRecommendations(planId || 'acne-basic'),
    [planId]
  );
  const routine = isEvening ? pmRoutine : amRoutine;

  const fallbackRoutine =
    routine.length === 0
      ? isEvening
        ? getProductRecommendations('acne-basic').pmRoutine
        : getProductRecommendations('acne-basic').amRoutine
      : routine;

  const currentStep = fallbackRoutine[currentStepIndex];
  const isLastStep = currentStepIndex === fallbackRoutine.length - 1;
  const progress = fallbackRoutine.length > 0 ? ((currentStepIndex + 1) / fallbackRoutine.length) * 100 : 0;

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

  const openProduct = (product: { brand: string; name: string; amazonUrl?: string }) => {
    Linking.openURL(getProductUrl(product));
  };

  if (!currentStep) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading routine...</Text>
      </View>
    );
  }

  const productList = currentStep.products?.filter((p) => p.brand !== 'N/A') ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {onBack && (
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

          <View style={styles.card}>
            <Text style={styles.stepName}>{currentStep.step}</Text>
            <Text style={styles.duration}>~2 minutes</Text>
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
                    {productList.map((product, idx) => (
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
              <Text style={styles.primaryButtonText}>
                {isLastStep ? 'Complete routine' : 'Next step'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkipStep} activeOpacity={0.8}>
              <Text style={styles.skipButtonText}>Skip this step</Text>
            </TouchableOpacity>
          </View>

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
    backgroundColor: '#F5F1ED',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 48 },
  inner: { maxWidth: 400, width: '100%', alignSelf: 'center' },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F1ED',
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

  progressSection: { marginBottom: 24 },
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

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#D8D5CF',
    marginBottom: 24,
  },
  stepName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#7B9B8C',
    textAlign: 'center',
    marginBottom: 8,
  },
  duration: {
    fontSize: 14,
    color: '#6B7370',
    textAlign: 'center',
    marginBottom: 24,
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#7B9B8C',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 12,
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
    backgroundColor: '#5F8575',
    marginBottom: 8,
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
