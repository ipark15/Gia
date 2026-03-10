import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoutineExecution } from '../components/RoutineExecution';
import { RoutineStep } from '../components/TreatmentPlanPage';
import { useAuth } from '../context/AuthContext';
import { useRoutineCompletion } from '../context/RoutineCompletionContext';

export default function RoutineExecutionScreen() {
  const params = useLocalSearchParams<{ planId?: string; routineType?: string }>();
  const planId = params.planId ?? 'acne-basic';
  const { reportRoutineComplete } = useRoutineCompletion();
  const { profile } = useAuth();

  const dermProducts =
    profile?.has_dermatologist_plan &&
    Array.isArray(profile?.dermatologist_products) &&
    (profile.dermatologist_products as unknown[]).length > 0
      ? (profile.dermatologist_products as unknown as Array<{
          id: string;
          name: string;
          brand: string;
          instructions?: string;
          timeOfDay: 'am' | 'pm' | 'both';
          step: string;
        }>)
      : undefined;

  const customRoutine = profile?.custom_routine as { amRoutine: RoutineStep[]; pmRoutine: RoutineStep[] } | null | undefined;

  // Use the forced routine type passed from the home screen, falling back to time-of-day detection.
  const forceRoutineType: 'morning' | 'evening' | undefined =
    params.routineType === 'morning' ? 'morning'
    : params.routineType === 'evening' ? 'evening'
    : undefined;

  const routineType: 'morning' | 'evening' = forceRoutineType ?? (
    new Date().getHours() >= 18 || new Date().getHours() < 6 ? 'evening' : 'morning'
  );

  const handleComplete = useCallback(() => {
    reportRoutineComplete(routineType);
    router.back();
  }, [reportRoutineComplete, routineType]);

  const handleSwitchToGentler = () => {
    // Could navigate to a gentler plan or show a modal
    router.back();
  };

  const handleBack = () => {
    router.back();
  };

  const ROUTINE_BG = '#F5F1ED';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: ROUTINE_BG }} edges={['top']}>
      <StatusBar style="dark" backgroundColor={ROUTINE_BG} />
      <RoutineExecution
        planId={planId}
        dermatologistProducts={dermProducts}
        customRoutine={customRoutine}
        forceRoutineType={forceRoutineType}
        onComplete={handleComplete}
        onSwitchToGentler={handleSwitchToGentler}
        onBack={handleBack}
      />
    </SafeAreaView>
  );
}
