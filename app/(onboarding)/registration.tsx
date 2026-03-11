import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DermatologistPlanUpload } from '../../components/DermatologistPlanUpload';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { G } from '../../constants/Gradients';

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
}

interface FormData {
  name: string;
  email: string;
  password: string;
  termsAccepted: boolean;
  conditions: string[];
  otherCondition: string;
  hasDermatologistPlan: boolean | null;
  dermatologistProducts: DermatologistProduct[];
  selectedTreatmentPlans: { [condition: string]: string };
  conditionSeverity: string | null;
  skinSatisfaction: number | null;
  daysPerWeek: number;
  timesOfDay: string[];
}

export default function Registration() {
  const params = useLocalSearchParams<{ step?: string }>();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const initialStep = params.step != null ? Math.min(6, Math.max(1, parseInt(params.step, 10) || 1)) : 1;
  const [step, setStep] = useState<number | 3.4 | 3.5>(initialStep as number);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    termsAccepted: false,
    conditions: [],
    otherCondition: '',
    hasDermatologistPlan: null,
    dermatologistProducts: [],
    selectedTreatmentPlans: {},
    conditionSeverity: null,
    skinSatisfaction: null,
    daysPerWeek: 3,
    timesOfDay: [],
  });

  // Require signed-in user; redirect to sign-in if not
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(onboarding)/sign-in');
    }
  }, [user, authLoading]);

  // Pre-fill form from profile and auth user when they exist
  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      email: user.email ?? prev.email,
      name: prev.name || profile?.name || (user.user_metadata?.name as string) || '',
    }));
  }, [user?.id, user?.email, user?.user_metadata?.name, profile?.name]);

  useEffect(() => {
    if (!user || !profile) return;
    setFormData((prev) => ({
      ...prev,
      conditions: (profile.conditions as string[]) ?? prev.conditions,
      otherCondition: profile.other_condition ?? prev.otherCondition,
      conditionSeverity: profile.severity ?? prev.conditionSeverity,
      skinSatisfaction: profile.skin_satisfaction_baseline ?? prev.skinSatisfaction,
      daysPerWeek: profile.days_per_week ?? prev.daysPerWeek,
      timesOfDay: (profile.times_of_day as string[]) ?? prev.timesOfDay,
      hasDermatologistPlan: profile.has_dermatologist_plan ?? prev.hasDermatologistPlan,
      dermatologistProducts: (profile.dermatologist_products as unknown as FormData['dermatologistProducts']) ?? prev.dermatologistProducts,
      selectedTreatmentPlans: (profile.selected_treatment_plans as FormData['selectedTreatmentPlans']) ?? prev.selectedTreatmentPlans,
    }));
  }, [user?.id, profile?.id]);

  const treatmentPlansByCondition = (): { [condition: string]: TreatmentPlan[] } => {
    const plans: { [key: string]: TreatmentPlan[] } = {
      acne: [
        {
          id: 'acne-basic',
          name: 'Basic Acne Care',
          description: 'Gentle cleansing routine',
          amSteps: ['Gentle cleanser', 'Oil-free moisturizer', 'Non-comedogenic sunscreen'],
          pmSteps: ['Gentle cleanser', 'Oil-free moisturizer'],
          frequency: 'Twice daily',
        },
        {
          id: 'acne-moderate',
          name: 'Moderate Acne Care',
          description: 'More comprehensive acne management',
          amSteps: [
            'Gentle cleanser',
            'Niacinamide serum',
            'Lightweight moisturizer',
            'Broad-spectrum SPF 30+',
          ],
          pmSteps: ['Gentle cleanser', 'Niacinamide serum', 'Lightweight moisturizer'],
          frequency: 'Twice daily',
        },
      ],
      rosacea: [
        {
          id: 'rosacea-basic',
          name: 'Basic Rosacea Care',
          description: 'Soothing, anti-inflammatory routine',
          amSteps: [
            'Fragrance-free gentle cleanser or water rinse',
            'Niacinamide serum',
            'Calming moisturizer with ceramides',
            'Mineral sunscreen SPF 30+',
          ],
          pmSteps: [
            'Fragrance-free gentle cleanser',
            'Calming moisturizer with ceramides',
          ],
          frequency: 'Twice daily',
        },
        {
          id: 'rosacea-sensitive',
          name: 'Moderate Rosacea Care',
          description: 'Ultra-gentle barrier support',
          amSteps: ['Water rinse or micellar water', 'Rich barrier repair cream', 'Tinted mineral sunscreen'],
          pmSteps: ['Micellar water or cream cleanser', 'Centella or green tea serum', 'Rich barrier repair cream'],
          frequency: 'Twice daily',
        },
      ],
      eczema: [
        {
          id: 'eczema-basic',
          name: 'Basic Eczema Care',
          description: 'Barrier protection and hydration',
          amSteps: ['Water rinse or gentle splash', 'Thick barrier cream with ceramides', 'Mineral sunscreen'],
          pmSteps: [
            'Fragrance-free cream cleanser',
            'Hydrating serum (hyaluronic acid)',
            'Thick barrier cream with ceramides',
          ],
          frequency: 'Twice daily',
        },
        {
          id: 'eczema-intensive',
          name: 'Moderate Eczema',
          description: 'Enhanced moisture barrier support',
          amSteps: ['Water rinse', 'Ceramide-rich moisturizer', 'Mineral sunscreen'],
          pmSteps: [
            'Gentle cleansing oil or cream',
            'Colloidal oatmeal serum',
            'Ceramide-rich moisturizer',
            'Occlusive balm',
          ],
          frequency: 'Twice daily',
        },
      ],
      'other inflammatory skin conditions': [
        {
          id: 'inflammatory-basic',
          name: 'Basic Gentle Care',
          description: 'Soothing and protecting',
          amSteps: ['Water rinse or gentle cleanser', 'Calming serum', 'Moisturizer', 'Mineral sunscreen'],
          pmSteps: ['Gentle cleanser', 'Calming serum', 'Moisturizer'],
          frequency: 'Twice daily',
        },
        {
          id: 'inflammatory-moderate',
          name: 'Moderate Barrier Support',
          description: 'Enhanced barrier repair focus',
          amSteps: [
            'Gentle cleanser or water rinse',
            'Niacinamide or centella serum',
            'Barrier repair cream',
            'Mineral sunscreen SPF 30+',
          ],
          pmSteps: ['Gentle cream cleanser', 'Soothing serum', 'Rich barrier repair cream'],
          frequency: 'Twice daily',
        },
      ],
    };

    const result: { [condition: string]: TreatmentPlan[] } = {};
    formData.conditions.forEach((condition) => {
      const key = condition.toLowerCase();
      if (plans[key]) {
        result[condition] = plans[key];
      }
    });
    return result;
  };

  const handleConditionToggle = (condition: string) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  };

  const handleTimeToggle = (time: string) => {
    setFormData((prev) => ({
      ...prev,
      timesOfDay: prev.timesOfDay.includes(time)
        ? prev.timesOfDay.filter((t) => t !== time)
        : [...prev.timesOfDay, time],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim() !== '';
      case 2:
        return formData.conditions.length > 0;
      case 3:
        return formData.hasDermatologistPlan !== null;
      case 3.4:
        return formData.dermatologistProducts.length > 0;
      case 3.5:
        return Object.values(formData.selectedTreatmentPlans).some((planId) => planId !== '');
      case 4:
        return formData.skinSatisfaction !== null;
      case 5:
        return formData.daysPerWeek > 0;
      case 6:
        return formData.timesOfDay.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) {
      if (formData.hasDermatologistPlan === true) setStep(3.4);
      else if (formData.hasDermatologistPlan === false) setStep(3.5);
    } else if (step === 3.4 || step === 3.5) setStep(4);
    else if (step === 4) setStep(5);
    else if (step === 5) setStep(6);
    else if (step === 6) {
      if (!user) return;
      setSaveError(null);
      setSaving(true);
      (async () => {
        try {
          const primaryCondition = formData.conditions[0] ?? null;
          const planIds = Object.values(formData.selectedTreatmentPlans).filter(Boolean);
          const updatePayload = {
            name: formData.name.trim(),
            primary_condition: primaryCondition,
            conditions: formData.conditions,
            other_condition: formData.otherCondition || null,
            severity: formData.conditionSeverity || null,
            skin_satisfaction_baseline: formData.skinSatisfaction ?? null,
            days_per_week: formData.daysPerWeek,
            times_of_day: formData.timesOfDay,
            has_dermatologist_plan: formData.hasDermatologistPlan,
            dermatologist_products: formData.dermatologistProducts,
            selected_treatment_plans: formData.selectedTreatmentPlans,
            selected_treatment_plan_id: planIds[0] ?? null,
            updated_at: new Date().toISOString(),
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updateError } = await (supabase.from('profiles') as any).update(updatePayload).eq('id', user.id);
          if (updateError) {
            setSaveError(updateError.message);
            setSaving(false);
            return;
          }
          // Immediately refresh profile in AuthContext so all screens see the new settings.
          await refreshProfile();
          router.replace('/(tabs)');
        } catch (e) {
          setSaveError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
          setSaving(false);
        }
      })();
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    if (step === 3.5 || step === 3.4) setStep(3);
    else if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else if (step === 4) {
      if (formData.hasDermatologistPlan === true) setStep(3.4);
      else if (formData.hasDermatologistPlan === false) setStep(3.5);
      else setStep(3);
    } else if (step === 5) setStep(4);
    else if (step === 6) setStep(5);
    else if (step === 1) router.back();
  };

  const getCurrentStep = () => {
    if (step === 3 || step === 3.4 || step === 3.5) return 3;
    return step;
  };

  const timeOptions = [
    { value: 'morning', label: 'Morning', icon: 'sunny-outline' as const },
    { value: 'night', label: 'Night', icon: 'moon-outline' as const },
  ];

  return (
    <LinearGradient colors={G.pageDerm.colors} start={G.pageDerm.start} end={G.pageDerm.end} style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back Button — only show on first step to exit registration */}
      {step === 1 && (
        <TouchableOpacity style={styles.backArrow} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#7B9B8C" />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBars}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressBar,
                  i <= getCurrentStep() ? styles.progressBarActive : styles.progressBarInactive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.progressText}>Step {getCurrentStep()} of 6</Text>
        </View>

        <View style={styles.content}>
          {/* Step 1: Your profile (user is already signed in) */}
          {step === 1 && (
            <View>
              <Text style={styles.title}>Your profile</Text>
              <Text style={styles.subtitle}>Update your name. Email is from your account.</Text>

              <View style={styles.card}>
                <View style={styles.field}>
                  <Text style={styles.label}>Your name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Enter your name"
                    placeholderTextColor="#8A9088"
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Email address</Text>
                  <TextInput
                    style={[styles.input, styles.inputReadOnly]}
                    value={formData.email}
                    editable={false}
                    placeholder="your@email.com"
                    placeholderTextColor="#8A9088"
                  />
                  <Text style={styles.helperText}>Change email in account settings</Text>
                </View>
              </View>
            </View>
          )}

          {/* Step 2: Conditions */}
          {step === 2 && (
            <View>
              <Text style={styles.title}>What brings you here?</Text>
              <Text style={styles.subtitle}>
                Select the skin condition(s) you're managing
              </Text>
              <View style={styles.optionsContainer}>
                {['Acne', 'Rosacea', 'Eczema', 'Other inflammatory skin conditions'].map(
                  (condition) => (
                    <TouchableOpacity
                      key={condition}
                      onPress={() => handleConditionToggle(condition)}
                      style={[
                        styles.optionButton,
                        formData.conditions.includes(condition) && styles.optionButtonSelected,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.optionText}>{condition}</Text>
                      {formData.conditions.includes(condition) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          )}

          {/* Step 3: Dermatologist plan */}
          {step === 3 && (
            <View>
              <Text style={styles.title}>Do you have a dermatologist plan?</Text>
              <Text style={styles.subtitle}>This helps us customize your routine</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, hasDermatologistPlan: true }))
                  }
                  style={[
                    styles.optionButton,
                    formData.hasDermatologistPlan === true && styles.optionButtonSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionText}>Yes, I have a plan</Text>
                  {formData.hasDermatologistPlan === true && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, hasDermatologistPlan: false }))
                  }
                  style={[
                    styles.optionButton,
                    formData.hasDermatologistPlan === false && styles.optionButtonSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionText}>No, not yet</Text>
                  {formData.hasDermatologistPlan === false && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3.4: Dermatologist plan upload */}
          {step === 3.4 && (
            <DermatologistPlanUpload
              onBack={() => setStep(3)}
              onContinue={() => setStep(4)}
              onUpload={(products) =>
                setFormData((prev) => ({ ...prev, dermatologistProducts: products }))
              }
            />
          )}

          {/* Step 3.5: Treatment plan selection */}
          {step === 3.5 && (
            <View>
              <Text style={styles.title}>Choose a starter routine</Text>
              <Text style={styles.subtitle}>
                Select at least one plan
                {formData.conditions.length > 1 ? ' for your conditions' : ''}
              </Text>
              <View style={styles.plansContainer}>
                {Object.entries(treatmentPlansByCondition()).map(([condition, plans]) => (
                  <View key={condition} style={styles.planGroup}>
                    <Text style={styles.planGroupTitle}>{condition}</Text>
                    {plans.map((plan) => {
                      const getProductTypes = (steps: string[]) => {
                        const types = steps.map((stepText) => {
                          const lower = stepText.toLowerCase();
                          if (lower.includes('cleanser') || lower.includes('cleansing')) return 'cleanser';
                          if (lower.includes('toner') || lower.includes('micellar')) return 'toner';
                          if (
                            lower.includes('serum') ||
                            lower.includes('niacinamide') ||
                            lower.includes('hyaluronic') ||
                            lower.includes('centella') ||
                            lower.includes('vitamin') ||
                            lower.includes('arbutin')
                          )
                            return 'serum';
                          if (
                            lower.includes('moisturizer') ||
                            lower.includes('cream') ||
                            lower.includes('barrier')
                          )
                            return 'moisturizer';
                          if (lower.includes('sunscreen') || lower.includes('spf')) return 'sunscreen';
                          if (
                            lower.includes('occlusive') ||
                            lower.includes('balm') ||
                            lower.includes('ointment')
                          )
                            return 'occlusive';
                          return 'other';
                        });
                        return Array.from(new Set(types)).filter((t) => t !== 'other');
                      };

                      const amTypes = getProductTypes(plan.amSteps);
                      const pmTypes = getProductTypes(plan.pmSteps);
                      const allTypes = Array.from(new Set([...amTypes, ...pmTypes]));

                      const selectedPlanId = formData.selectedTreatmentPlans[condition] || '';

                      return (
                        <TouchableOpacity
                          key={plan.id}
                          onPress={() =>
                            setFormData((prev) => ({
                              ...prev,
                              selectedTreatmentPlans: {
                                ...prev.selectedTreatmentPlans,
                                [condition]: selectedPlanId === plan.id ? '' : plan.id,
                              },
                            }))
                          }
                          style={[
                            styles.planCard,
                            selectedPlanId === plan.id && styles.planCardSelected,
                          ]}
                          activeOpacity={0.9}
                        >
                          <View style={styles.planHeader}>
                            <View style={styles.planHeaderText}>
                              <Text style={styles.planName}>{plan.name}</Text>
                              <Text style={styles.planDescription}>{plan.description}</Text>
                              <Text style={styles.planStepsMeta}>
                                AM: {plan.amSteps.length} steps • PM: {plan.pmSteps.length} steps
                              </Text>
                              <View style={styles.planTagsRow}>
                                {allTypes.map((type) => (
                                  <View key={type} style={styles.planTag}>
                                    <Text style={styles.planTagText}>{type}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                            {selectedPlanId === plan.id && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Step 4: Skin satisfaction */}
          {step === 4 && (
            <View>
              <Text style={styles.title}>How satisfied are you with your skin?</Text>
              <Text style={styles.subtitle}>
                Rate from 1 (not satisfied) to 5 (very satisfied)
              </Text>

              <View style={styles.satisfactionCard}>
                <View style={styles.satisfactionDisplay}>
                  <Text style={styles.satisfactionNumber}>
                    {formData.skinSatisfaction || '-'}
                  </Text>
                  <Text style={styles.satisfactionLabel}>
                    {formData.skinSatisfaction === 1 && 'Not satisfied'}
                    {formData.skinSatisfaction === 2 && 'Somewhat dissatisfied'}
                    {formData.skinSatisfaction === 3 && 'Neutral'}
                    {formData.skinSatisfaction === 4 && 'Satisfied'}
                    {formData.skinSatisfaction === 5 && 'Very satisfied'}
                    {!formData.skinSatisfaction && 'Select a rating'}
                  </Text>
                </View>

                <View style={styles.satisfactionSliderWrap}>
                  <View style={styles.satisfactionTrackBackground} />
                  <View
                    style={[
                      styles.satisfactionTrackActive,
                      {
                        width: `${((formData.skinSatisfaction || 1) - 1) * 25}%`,
                      },
                    ]}
                  />
                  <View style={styles.satisfactionButtonsRow}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <TouchableOpacity
                        key={value}
                        onPress={() =>
                          setFormData((prev) => ({ ...prev, skinSatisfaction: value }))
                        }
                        style={[
                          styles.satisfactionButton,
                          formData.skinSatisfaction === value &&
                          styles.satisfactionButtonActive,
                        ]}
                        activeOpacity={0.9}
                      >
                        <Text
                          style={[
                            styles.satisfactionButtonText,
                            formData.skinSatisfaction === value &&
                            styles.satisfactionButtonTextActive,
                          ]}
                        >
                          {value}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.satisfactionLabelsRow}>
                  <Text style={styles.satisfactionEdgeLabel}>not satisfied</Text>
                  <Text style={styles.satisfactionEdgeLabel}>very satisfied</Text>
                </View>
              </View>
            </View>
          )}

          {/* Step 5: Days per week */}
          {step === 5 && (
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
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, daysPerWeek: value }))
                  }
                  minimumTrackTintColor="#7B9B8C"
                  maximumTrackTintColor="#D8D5CF"
                  thumbTintColor="#7B9B8C"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>1</Text>
                  <Text style={styles.sliderLabel}>7</Text>
                </View>
              </View>
              <Text style={styles.helperText}>You can always adjust this later</Text>
            </View>
          )}

          {/* Step 6: Times of day */}
          {step === 6 && (
            <View>
              <Text style={styles.title}>Which routines do you want?</Text>
              <Text style={styles.subtitle}>
                Choose morning, night, or both. You'll only be asked to complete the routines you select.
              </Text>
              <View style={styles.optionsContainer}>
                {timeOptions.map((time) => (
                  <TouchableOpacity
                    key={time.value}
                    onPress={() => handleTimeToggle(time.value)}
                    style={[
                      styles.optionButton,
                      formData.timesOfDay.includes(time.value) &&
                      styles.optionButtonSelected,
                    ]}
                    activeOpacity={0.9}
                  >
                    <View style={styles.timeOptionContent}>
                      <View style={styles.timeIconContainer}>
                        <Ionicons name={time.icon} size={20} color="#5F8575" />
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
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={20} color="#7B9B8C" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          {step === 6 && saveError ? (
            <Text style={styles.errorText}>{saveError}</Text>
          ) : null}
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed() || saving}
            style={[
              styles.nextButton,
              step === 1 && styles.nextButtonFull,
              (!canProceed() || saving) && styles.nextButtonDisabled,
            ]}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text
                  style={[
                    styles.nextButtonText,
                    !canProceed() && styles.nextButtonTextDisabled,
                  ]}
                >
                  {step === 6 ? 'Complete' : 'Next'}
                </Text>
                {step < 6 && (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={canProceed() ? '#FFFFFF' : '#6B7370'}
                  />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Terms of Service Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms of Service</Text>
              <Text style={styles.modalSubtitle}>Last updated: March 2, 2026</Text>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator>
              <Text style={styles.modalSectionTitle}>1. Acceptance of Terms</Text>
              <Text style={styles.modalText}>
                By creating an account and using Gia, you agree to these Terms of Service.
                If you do not agree to these terms, please do not use the app.
              </Text>
              <Text style={styles.modalSectionTitle}>2. Medical Disclaimer</Text>
              <Text style={styles.modalText}>
                Gia is a skincare tracking and routine management tool. It is not a
                substitute for professional medical advice, diagnosis, or treatment.
                Always seek the advice of your physician or dermatologist with any
                questions you may have regarding a medical condition.
              </Text>
              <Text style={styles.modalSectionTitle}>3. User Responsibilities</Text>
              <Text style={styles.modalText}>
                You agree to provide accurate and complete information, keep your account
                credentials secure, and use the app in accordance with applicable laws.
              </Text>
              <Text style={styles.modalSectionTitle}>4. Privacy & Data</Text>
              <Text style={styles.modalText}>
                We collect and use your personal information as described in our Privacy
                Policy. We prioritize your privacy and will never sell your personal
                health data to third parties.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTermsModal(false)}
              activeOpacity={0.9}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 8,
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
  inputReadOnly: {
    backgroundColor: '#F5F1ED',
    color: '#6B7370',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#EF4444',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#95C98E',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#95C98E',
  },
  termsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2D4A3E',
  },
  termsLink: {
    color: '#5F8575',
    textDecorationLine: 'underline',
  },
  footerNote: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: '#6B8B7D',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  signInRowText: {
    fontSize: 14,
    color: '#6B8B7D',
  },
  signInRowLink: {
    fontSize: 14,
    color: '#5F8575',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    borderColor: '#95C98E',
    backgroundColor: 'rgba(212, 227, 219, 0.3)',
  },
  optionText: {
    fontSize: 16,
    color: '#2D4A3E',
  },
  checkmark: {
    fontSize: 18,
    color: '#7B9B8C',
    fontWeight: '600',
  },
  plansContainer: {
    gap: 16,
  },
  planGroup: {
    marginBottom: 16,
  },
  planGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5F8575',
    marginBottom: 8,
  },
  planCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  planCardSelected: {
    borderColor: '#95C98E',
    backgroundColor: 'rgba(232, 240, 220, 0.7)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planHeaderText: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D4A3E',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7370',
    marginBottom: 4,
  },
  planStepsMeta: {
    fontSize: 12,
    color: '#5F8575',
    marginBottom: 4,
  },
  planTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  planTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(149, 201, 142, 0.4)',
  },
  planTagText: {
    fontSize: 12,
    color: '#5F8575',
  },
  satisfactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(149, 201, 142, 0.3)',
  },
  satisfactionDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  satisfactionNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#5F8575',
    marginBottom: 4,
  },
  satisfactionLabel: {
    fontSize: 14,
    color: '#6B8B7D',
  },
  satisfactionSliderWrap: {
    marginBottom: 16,
  },
  satisfactionTrackBackground: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 20,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(212, 227, 219, 0.5)',
  },
  satisfactionTrackActive: {
    position: 'absolute',
    left: 4,
    top: 20,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7B9B8C',
  },
  satisfactionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  satisfactionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#C9CBD5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  satisfactionButtonActive: {
    backgroundColor: '#7B9B8C',
    borderColor: '#FFFFFF',
  },
  satisfactionButtonText: {
    fontSize: 18,
    color: '#5F8575',
    fontWeight: '600',
  },
  satisfactionButtonTextActive: {
    color: '#FFFFFF',
  },
  satisfactionLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  satisfactionEdgeLabel: {
    fontSize: 12,
    color: '#6B8B7D',
  },
  sliderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
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
    fontSize: 40,
    fontWeight: '600',
    color: '#5F8575',
  },
  sliderUnit: {
    fontSize: 16,
    color: '#6B7370',
    marginLeft: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 14,
    color: '#6B7370',
  },
  helperText: {
    fontSize: 14,
    color: '#6B8B7D',
    textAlign: 'center',
    marginTop: 12,
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
  modalCard: {
    width: '90%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#E8F0DC',
    borderBottomWidth: 1,
    borderBottomColor: '#D8D5CF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D4A3E',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B8B7D',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 320,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D4A3E',
    marginBottom: 4,
    marginTop: 8,
  },
  modalText: {
    fontSize: 13,
    color: '#6B7370',
    marginBottom: 8,
  },
  modalCloseButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#7B9B8C',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});

