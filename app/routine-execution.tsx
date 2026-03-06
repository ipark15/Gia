import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoutineExecution } from '../components/RoutineExecution';
import { useRoutineCompletion } from '../context/RoutineCompletionContext';

export default function RoutineExecutionScreen() {
  const params = useLocalSearchParams<{ planId?: string }>();
  const planId = params.planId ?? 'acne-basic';
  const { reportRoutineComplete } = useRoutineCompletion();

  const timeOfDay = new Date().getHours();
  const isEvening = timeOfDay >= 18 || timeOfDay < 6;
  const routineType = isEvening ? 'evening' : 'morning';

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
        onComplete={handleComplete}
        onSwitchToGentler={handleSwitchToGentler}
        onBack={handleBack}
      />
    </SafeAreaView>
  );
}
