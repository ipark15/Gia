import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DermatologistProduct {
  id: string;
  name: string;
  brand: string;
  instructions: string;
  timeOfDay: 'am' | 'pm' | 'both';
  step: string;
}

interface TreatmentPlan {
  id: string;
  name: string;
  description: string;
  amSteps: string[];
  pmSteps: string[];
  frequency: string;
  note?: string;
}

interface FormData {
  conditions: string[];
  otherCondition: string;
  skinGoals: string;
  skinGoalsMethod: 'type' | 'video' | 'audio' | null;
  hasDermatologistPlan: boolean | null;
  dermatologistProducts: DermatologistProduct[];
  selectedTreatmentPlan: string | null;
  conditionSeverity: string | null;
  skinSatisfaction: number | null;
  daysPerWeek: number;
  timesOfDay: string[];
}

export default function Registration() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    conditions: [],
    otherCondition: '',
    skinGoals: '',
    skinGoalsMethod: null,
    hasDermatologistPlan: null,
    dermatologistProducts: [],
    selectedTreatmentPlan: null,
    conditionSeverity: null,
    skinSatisfaction: null,
    daysPerWeek: 3,
    timesOfDay: [],
  });

  // Treatment plan recommendations based on condition
  const getTreatmentPlans = (): TreatmentPlan[] => {
    const conditions = formData.conditions.map(c => c.toLowerCase()).sort();
    
    // Multi-condition plans
    if (conditions.length > 1) {
      const conditionKey = conditions.join('+');
      
      const multiPlans: { [key: string]: TreatmentPlan[] } = {
        'acne+rosacea': [
          {
            id: 'acne-rosacea-gentle',
            name: 'Gentle Dual-Action Care',
            description: 'Balanced routine for acne-prone, sensitive skin',
            amSteps: ['Gentle, fragrance-free cleanser', 'Niacinamide serum', 'Lightweight, non-comedogenic moisturizer', 'Mineral sunscreen SPF 30+'],
            pmSteps: ['Gentle, fragrance-free cleanser', 'Azelaic acid 10% (treats both conditions)', 'Lightweight, non-comedogenic moisturizer'],
            frequency: 'Twice daily',
            note: 'Azelaic acid is ideal for both acne and rosacea'
          },
          {
            id: 'acne-rosacea-barrier',
            name: 'Barrier-Focused Protocol',
            description: 'Prioritizes skin barrier while managing breakouts',
            amSteps: ['Micellar water or splash with water', 'Niacinamide serum', 'Ceramide moisturizer', 'Mineral sunscreen'],
            pmSteps: ['Cream cleanser', 'Azelaic acid treatment', 'Spot treat active acne with salicylic acid (avoid rosacea zones)', 'Ceramide moisturizer'],
            frequency: 'Twice daily',
            note: 'Gentle approach that minimizes irritation'
          }
        ],
        'acne+eczema': [
          {
            id: 'acne-eczema-balanced',
            name: 'Hydrating Acne Care',
            description: 'Manages breakouts without drying eczema',
            amSteps: ['Gentle cream cleanser or water rinse', 'Niacinamide serum', 'Rich ceramide moisturizer', 'Mineral sunscreen'],
            pmSteps: ['Gentle cream cleanser', 'Lightweight salicylic acid (acne zones only)', 'Rich ceramide moisturizer'],
            frequency: 'Twice daily',
            note: 'Zone-based treatment to protect eczema areas'
          }
        ],
        'eczema+rosacea': [
          {
            id: 'eczema-rosacea-ultra-gentle',
            name: 'Ultra-Gentle Soothing Care',
            description: 'Maximum sensitivity support',
            amSteps: ['Micellar water or water rinse', 'Rich ceramide cream', 'Tinted mineral sunscreen'],
            pmSteps: ['Micellar water or cleansing milk', 'Centella asiatica or colloidal oatmeal serum', 'Rich ceramide cream', 'Occlusive balm on dry patches'],
            frequency: 'Twice daily',
            note: 'Focus on calming and barrier repair'
          }
        ],
        'acne+eczema+rosacea': [
          {
            id: 'triple-minimal',
            name: 'Minimalist Multi-Condition Care',
            description: 'Streamlined routine for complex skin',
            amSteps: ['Water rinse or gentle cleanser', 'Niacinamide serum', 'Ceramide moisturizer', 'Mineral sunscreen SPF 30+'],
            pmSteps: ['Ultra-gentle cream cleanser', 'Azelaic acid 10% (treats acne + rosacea)', 'Ceramide moisturizer'],
            frequency: 'Twice daily',
            note: 'Simple, multi-tasking ingredients'
          }
        ]
      };
      
      return multiPlans[conditionKey] || [];
    }
    
    // Single condition plans
    const primaryCondition = conditions[0];
    
    const plans: { [key: string]: TreatmentPlan[] } = {
      acne: [
        {
          id: 'acne-basic',
          name: 'Basic Acne Care',
          description: 'Gentle cleansing and targeted treatment',
          amSteps: ['Gentle cleanser', 'Oil-free moisturizer', 'Non-comedogenic sunscreen'],
          pmSteps: ['Gentle cleanser', 'Salicylic acid or benzoyl peroxide treatment', 'Oil-free moisturizer'],
          frequency: 'Twice daily'
        },
        {
          id: 'acne-moderate',
          name: 'Moderate Acne Protocol',
          description: 'More comprehensive acne management',
          amSteps: ['Gentle cleanser', 'Niacinamide serum', 'Lightweight moisturizer', 'Broad-spectrum SPF 30+'],
          pmSteps: ['Gentle cleanser', 'Adapalene 0.1% (Differin)', 'Benzoyl peroxide 2.5% (if tolerated)', 'Lightweight moisturizer'],
          frequency: 'Twice daily'
        }
      ],
      rosacea: [
        {
          id: 'rosacea-basic',
          name: 'Gentle Rosacea Care',
          description: 'Soothing, anti-inflammatory routine',
          amSteps: ['Fragrance-free gentle cleanser or water rinse', 'Niacinamide serum', 'Calming moisturizer with ceramides', 'Mineral sunscreen SPF 30+'],
          pmSteps: ['Fragrance-free gentle cleanser', 'Azelaic acid', 'Calming moisturizer with ceramides'],
          frequency: 'Twice daily'
        },
        {
          id: 'rosacea-sensitive',
          name: 'Sensitive Rosacea Protocol',
          description: 'Ultra-gentle barrier support',
          amSteps: ['Water rinse or micellar water', 'Rich barrier repair cream', 'Tinted mineral sunscreen'],
          pmSteps: ['Micellar water or cream cleanser', 'Centella or green tea serum', 'Rich barrier repair cream'],
          frequency: 'Twice daily'
        }
      ],
      eczema: [
        {
          id: 'eczema-basic',
          name: 'Basic Eczema Care',
          description: 'Barrier protection and hydration',
          amSteps: ['Water rinse or gentle splash', 'Thick barrier cream with ceramides', 'Mineral sunscreen'],
          pmSteps: ['Fragrance-free cream cleanser', 'Hydrating serum (hyaluronic acid)', 'Thick barrier cream with ceramides'],
          frequency: 'Twice daily'
        },
        {
          id: 'eczema-intensive',
          name: 'Intensive Eczema Protocol',
          description: 'Enhanced moisture barrier support',
          amSteps: ['Water rinse', 'Ceramide-rich moisturizer', 'Mineral sunscreen'],
          pmSteps: ['Gentle cleansing oil or cream', 'Colloidal oatmeal treatment', 'Ceramide-rich moisturizer', 'Occlusive balm'],
          frequency: 'Twice daily'
        }
      ]
    };

    return plans[primaryCondition] || plans.acne;
  };

  const handleConditionToggle = (condition: string) => {
    setFormData((prev) => {
      if (condition === 'Other') {
        if (prev.conditions.includes('Other')) {
          return { ...prev, conditions: prev.conditions.filter(c => c !== 'Other'), otherCondition: '' };
        }
      }
      return {
        ...prev,
        conditions: prev.conditions.includes(condition)
          ? prev.conditions.filter((c) => c !== condition)
          : [...prev.conditions, condition],
      };
    });
  };

  const handleTimeToggle = (time: string) => {
    setFormData((prev) => ({
      ...prev,
      timesOfDay: prev.timesOfDay.includes(time)
        ? prev.timesOfDay.filter((t) => t !== time)
        : [...prev.timesOfDay, time],
    }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return formData.conditions.length > 0;
      case 2: return formData.conditionSeverity !== null;
      case 3: return formData.hasDermatologistPlan !== null;
      case 3.4: return formData.dermatologistProducts.length > 0;
      case 3.5: return formData.selectedTreatmentPlan !== null;
      case 3.6: return true;
      case 4: return formData.skinSatisfaction !== null;
      case 5: return true;
      case 6: return formData.daysPerWeek > 0;
      case 7: return formData.timesOfDay.length > 0;
      default: return false;
    }
  };

  const handleComplete = () => {
    console.log('Registration complete:', formData);
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3 && formData.hasDermatologistPlan === true) setStep(3.4);
    else if (step === 3 && formData.hasDermatologistPlan === false) setStep(3.5);
    else if (step === 3.4) setStep(4);
    else if (step === 3.5) setStep(3.6);
    else if (step === 3.6) setStep(4);
    else if (step === 4) setStep(5);
    else if (step === 5) setStep(6);
    else if (step === 6) setStep(7);
    else if (step === 7) handleComplete();
    else setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 3.6) setStep(3.5);
    else if (step === 3.5) setStep(3);
    else if (step === 3.4) setStep(3);
    else if (step === 4 && formData.hasDermatologistPlan === true) setStep(3.4);
    else if (step === 4 && formData.hasDermatologistPlan === false) setStep(3.6);
    else if (step === 4) setStep(3);
    else if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else if (step === 1) router.back();
    else if (step > 3) setStep(step - 1);
  };

  const getCurrentStep = () => {
    if (step === 3.4 || step === 3.5 || step === 3.6) return 3;
    return step;
  };

  const timeOptions = [
    { value: 'morning', label: 'Morning', icon: 'sunny-outline' as const },
    { value: 'midday', label: 'Midday', icon: 'sunny' as const },
    { value: 'evening', label: 'Evening', icon: 'partly-sunny-outline' as const },
    { value: 'night', label: 'Night', icon: 'moon-outline' as const },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backArrow} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="#7B9B8C" />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBars}>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressBar,
                  i <= getCurrentStep() ? styles.progressBarActive : styles.progressBarInactive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.progressText}>Step {getCurrentStep()} of 7</Text>
        </View>

        {/* Step Content */}
        <View style={styles.content}>
          {/* Step 1: Skin Condition */}
          {step === 1 && (
            <View>
              <Text style={styles.title}>What brings you here?</Text>
              <Text style={styles.subtitle}>
                Select the skin condition(s) you're managing
              </Text>
              <View style={styles.optionsContainer}>
                {['Acne', 'Rosacea', 'Eczema', 'Other'].map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    onPress={() => handleConditionToggle(condition)}
                    style={[
                      styles.optionButton,
                      formData.conditions.includes(condition) && styles.optionButtonSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionText}>{condition}</Text>
                    {formData.conditions.includes(condition) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {formData.conditions.includes('Other') && (
                <View style={styles.otherInputContainer}>
                  <Text style={styles.inputLabel}>Please specify your condition:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.otherCondition}
                    onChangeText={(text) => setFormData({ ...formData, otherCondition: text })}
                    placeholder="e.g., Psoriasis, Melasma..."
                    placeholderTextColor="#8A9088"
                  />
                </View>
              )}
            </View>
          )}

          {/* Step 2: Condition Severity */}
          {step === 2 && (
            <View>
              <Text style={styles.title}>How would you rate your condition?</Text>
              <Text style={styles.subtitle}>
                This helps us personalize your experience
              </Text>
              <View style={styles.optionsContainer}>
                {['Light', 'Moderate', 'Severe'].map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    onPress={() => setFormData({ ...formData, conditionSeverity: severity })}
                    style={[
                      styles.optionButton,
                      formData.conditionSeverity === severity && styles.optionButtonSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionText}>{severity}</Text>
                    {formData.conditionSeverity === severity && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 3: Dermatologist Plan */}
          {step === 3 && (
            <View>
              <Text style={styles.title}>Do you have a dermatologist plan?</Text>
              <Text style={styles.subtitle}>
                We can help you follow your prescribed routine
              </Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, hasDermatologistPlan: true })}
                  style={[
                    styles.optionButton,
                    formData.hasDermatologistPlan === true && styles.optionButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionText}>Yes, I have a plan</Text>
                  {formData.hasDermatologistPlan === true && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, hasDermatologistPlan: false })}
                  style={[
                    styles.optionButton,
                    formData.hasDermatologistPlan === false && styles.optionButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionText}>No, not yet</Text>
                  {formData.hasDermatologistPlan === false && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3.4: Dermatologist Plan Upload */}
          {step === 3.4 && (
            <View>
              <Text style={styles.title}>Upload your dermatologist plan</Text>
              <Text style={styles.subtitle}>
                Add the products from your prescribed routine
              </Text>
              
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="document-text-outline" size={48} color="#7B9B8C" />
                <Text style={styles.uploadPlaceholderText}>
                  Upload feature coming soon
                </Text>
                <Text style={styles.uploadPlaceholderSubtext}>
                  For now, tap Next to continue
                </Text>
              </View>

              {/* Temporary: Allow proceeding without upload */}
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  setFormData({ 
                    ...formData, 
                    dermatologistProducts: [{ id: '1', name: 'Placeholder', brand: '', instructions: '', timeOfDay: 'both', step: '1' }] 
                  });
                }}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3.5: Treatment Plan Selection */}
          {step === 3.5 && (
            <View>
              <Text style={styles.title}>Choose a starter routine</Text>
              <Text style={styles.subtitle}>
                {formData.conditions.length > 1 
                  ? `Recommended routines for ${formData.conditions.join(' + ')}`
                  : `Recommended routines for ${formData.conditions[0]}`
                }
              </Text>
              
              {/* Info banner */}
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={20} color="#7B9B8C" />
                <Text style={styles.infoBannerText}>
                  {formData.conditions.length > 1 
                    ? "These routines address multiple conditions. For personalized treatment, consult a dermatologist."
                    : "These are general recommendations. For personalized treatment, consult a dermatologist."
                  }
                </Text>
              </View>

              <View style={styles.plansContainer}>
                {getTreatmentPlans().map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => setFormData({ ...formData, selectedTreatmentPlan: plan.id })}
                    style={[
                      styles.planCard,
                      formData.selectedTreatmentPlan === plan.id && styles.planCardSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.planHeader}>
                      <View style={styles.planHeaderText}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planDescription}>{plan.description}</Text>
                        {plan.note && (
                          <Text style={styles.planNote}>💡 {plan.note}</Text>
                        )}
                      </View>
                      {formData.selectedTreatmentPlan === plan.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    
                    <Text style={styles.planFrequency}>{plan.frequency}</Text>
                    
                    <View style={styles.planSteps}>
                      <Text style={styles.planStepsTitle}>☀️ MORNING (AM)</Text>
                      {plan.amSteps.map((stepItem, idx) => (
                        <View key={idx} style={styles.planStepRow}>
                          <Text style={styles.planStepNumber}>{idx + 1}.</Text>
                          <Text style={styles.planStepText}>{stepItem}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.planSteps}>
                      <Text style={styles.planStepsTitle}>🌙 EVENING (PM)</Text>
                      {plan.pmSteps.map((stepItem, idx) => (
                        <View key={idx} style={styles.planStepRow}>
                          <Text style={styles.planStepNumber}>{idx + 1}.</Text>
                          <Text style={styles.planStepText}>{stepItem}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 3.6: Product Recommendations */}
          {step === 3.6 && (
            <View>
              <Text style={styles.title}>Product Recommendations</Text>
              <Text style={styles.subtitle}>
                Based on your selected routine
              </Text>
              
              <View style={styles.productPlaceholder}>
                <Ionicons name="cart-outline" size={48} color="#7B9B8C" />
                <Text style={styles.uploadPlaceholderText}>
                  Product recommendations coming soon
                </Text>
                <Text style={styles.uploadPlaceholderSubtext}>
                  We'll suggest specific products for your routine
                </Text>
              </View>
            </View>
          )}

          {/* Step 4: Skin Satisfaction */}
          {step === 4 && (
            <View>
              <Text style={styles.title}>How satisfied are you with your skin?</Text>
              <Text style={styles.subtitle}>
                Rate from 1 (not satisfied) to 5 (very satisfied)
              </Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => setFormData({ ...formData, skinSatisfaction: rating })}
                    style={[
                      styles.ratingButton,
                      formData.skinSatisfaction === rating && styles.ratingButtonSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.ratingText}>{rating}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.ratingLabels}>
                <Text style={styles.ratingLabel}>Not satisfied</Text>
                <Text style={styles.ratingLabel}>Very satisfied</Text>
              </View>
            </View>
          )}

          {/* Step 5: Skin Goals */}
          {step === 5 && (
            <View>
              <Text style={styles.title}>What are your skin goals?</Text>
              <Text style={styles.subtitle}>
                Share what you'd like to achieve
              </Text>
              
              <View style={styles.methodOptions}>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, skinGoalsMethod: 'type' })}
                  style={[
                    styles.methodButton,
                    formData.skinGoalsMethod === 'type' && styles.methodButtonSelected,
                  ]}
                >
                  <Ionicons name="create-outline" size={24} color="#7B9B8C" />
                  <Text style={styles.methodButtonText}>Type</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, skinGoalsMethod: 'video' })}
                  style={[
                    styles.methodButton,
                    formData.skinGoalsMethod === 'video' && styles.methodButtonSelected,
                  ]}
                >
                  <Ionicons name="videocam-outline" size={24} color="#7B9B8C" />
                  <Text style={styles.methodButtonText}>Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, skinGoalsMethod: 'audio' })}
                  style={[
                    styles.methodButton,
                    formData.skinGoalsMethod === 'audio' && styles.methodButtonSelected,
                  ]}
                >
                  <Ionicons name="mic-outline" size={24} color="#7B9B8C" />
                  <Text style={styles.methodButtonText}>Audio</Text>
                </TouchableOpacity>
              </View>

              {formData.skinGoalsMethod === 'type' && (
                <TextInput
                  style={styles.goalsTextArea}
                  value={formData.skinGoals}
                  onChangeText={(text) => setFormData({ ...formData, skinGoals: text })}
                  placeholder="Share your skin goals... (e.g., I want to reduce acne scars, achieve even skin tone, and minimize breakouts)"
                  placeholderTextColor="#8A9088"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              )}

              {(formData.skinGoalsMethod === 'video' || formData.skinGoalsMethod === 'audio') && (
                <View style={styles.recordingPlaceholder}>
                  <Ionicons 
                    name={formData.skinGoalsMethod === 'audio' ? 'mic' : 'videocam'} 
                    size={32} 
                    color="#7B9B8C" 
                  />
                  <Text style={styles.uploadPlaceholderText}>
                    {formData.skinGoalsMethod === 'audio' ? 'Audio' : 'Video'} recording coming soon
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Step 6: Days per Week */}
          {step === 6 && (
            <View>
              <Text style={styles.title}>How many days per week?</Text>
              <Text style={styles.subtitle}>
                Set a realistic goal for implementing your routine
              </Text>
              <View style={styles.sliderCard}>
                <View style={styles.sliderValue}>
                  <Text style={styles.sliderNumber}>{formData.daysPerWeek}</Text>
                  <Text style={styles.sliderUnit}>days/week</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={7}
                  step={1}
                  value={formData.daysPerWeek}
                  onValueChange={(value) => setFormData({ ...formData, daysPerWeek: value })}
                  minimumTrackTintColor="#7B9B8C"
                  maximumTrackTintColor="#D8D5CF"
                  thumbTintColor="#7B9B8C"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>1</Text>
                  <Text style={styles.sliderLabel}>7</Text>
                </View>
              </View>
              <Text style={styles.helperText}>
                You can always adjust this later
              </Text>
            </View>
          )}

          {/* Step 7: Times of Day */}
          {step === 7 && (
            <View>
              <Text style={styles.title}>When do you want reminders?</Text>
              <Text style={styles.subtitle}>
                Select the times you'd like to implement your routine
              </Text>
              <View style={styles.optionsContainer}>
                {timeOptions.map((time) => (
                  <TouchableOpacity
                    key={time.value}
                    onPress={() => handleTimeToggle(time.value)}
                    style={[
                      styles.optionButton,
                      formData.timesOfDay.includes(time.value) && styles.optionButtonSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.timeOptionContent}>
                      <View style={styles.timeIconContainer}>
                        <Ionicons name={time.icon} size={20} color="#7B9B8C" />
                      </View>
                      <Text style={styles.optionText}>{time.label}</Text>
                    </View>
                    {formData.timesOfDay.includes(time.value) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <View style={styles.navigationButtons}>
          {step > 1 && (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="#7B9B8C" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed()}
            style={[
              styles.nextButton,
              step === 1 && styles.nextButtonFull,
              !canProceed() && styles.nextButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.nextButtonText,
              !canProceed() && styles.nextButtonTextDisabled,
            ]}>
              {step === 7 ? 'Complete' : 'Next'}
            </Text>
            {step < 7 && (
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={canProceed() ? '#FFFFFF' : '#6B7370'} 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  backArrow: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 140,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    marginHorizontal: 2,
    borderRadius: 4,
  },
  progressBarActive: {
    backgroundColor: '#7B9B8C',
  },
  progressBarInactive: {
    backgroundColor: '#D8D5CF',
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7370',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#7B9B8C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7370',
    marginBottom: 24,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    borderColor: '#7B9B8C',
    backgroundColor: 'rgba(212, 227, 219, 0.2)',
  },
  optionText: {
    fontSize: 16,
    color: '#7B9B8C',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: '#7B9B8C',
    fontWeight: '600',
  },
  otherInputContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#D8D5CF',
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7370',
    marginBottom: 8,
  },
  textInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#7B9B8C',
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(212, 227, 219, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(123, 155, 140, 0.3)',
    marginBottom: 24,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7370',
    lineHeight: 20,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
  },
  planCardSelected: {
    borderColor: '#7B9B8C',
    backgroundColor: 'rgba(212, 227, 219, 0.2)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planHeaderText: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B9B8C',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7370',
    marginBottom: 8,
  },
  planNote: {
    fontSize: 12,
    color: '#7B9B8C',
    fontStyle: 'italic',
  },
  planFrequency: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7B9B8C',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  planSteps: {
    marginTop: 12,
  },
  planStepsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7B9B8C',
    marginBottom: 8,
  },
  planStepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  planStepNumber: {
    fontSize: 14,
    color: '#6B7370',
  },
  planStepText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7370',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
  },
  productPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
  },
  uploadPlaceholderText: {
    fontSize: 16,
    color: '#7B9B8C',
    marginTop: 16,
    textAlign: 'center',
  },
  uploadPlaceholderSubtext: {
    fontSize: 14,
    color: '#8A9088',
    marginTop: 8,
    textAlign: 'center',
  },
  skipButton: {
    marginTop: 24,
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#7B9B8C',
    textDecorationLine: 'underline',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  ratingButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonSelected: {
    borderColor: '#7B9B8C',
    backgroundColor: 'rgba(212, 227, 219, 0.2)',
  },
  ratingText: {
    fontSize: 24,
    color: '#7B9B8C',
    fontWeight: '600',
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratingLabel: {
    fontSize: 12,
    color: '#6B7370',
  },
  methodOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
  },
  methodButtonSelected: {
    borderColor: '#7B9B8C',
    backgroundColor: 'rgba(212, 227, 219, 0.2)',
  },
  methodButtonText: {
    fontSize: 14,
    color: '#7B9B8C',
    marginTop: 8,
  },
  goalsTextArea: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#7B9B8C',
    minHeight: 150,
  },
  recordingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
  },
  sliderCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8D5CF',
  },
  sliderValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sliderNumber: {
    fontSize: 48,
    fontWeight: '600',
    color: '#7B9B8C',
  },
  sliderUnit: {
    fontSize: 16,
    color: '#6B7370',
    marginLeft: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#6B7370',
  },
  helperText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7370',
    marginTop: 16,
  },
  timeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F5F1ED',
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#D8D5CF',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#7B9B8C',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B9B8C',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 50,
    backgroundColor: '#7B9B8C',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: '#D8D5CF',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: '#6B7370',
  },
});
