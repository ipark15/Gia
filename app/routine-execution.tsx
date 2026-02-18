import { RoutineExecution } from '../components/RoutineExecution';
import { useRoutineCompletion } from '../context/RoutineCompletionContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <RoutineExecution
        planId={planId}
        onComplete={handleComplete}
        onSwitchToGentler={handleSwitchToGentler}
        onBack={handleBack}
      />
    </SafeAreaView>
  );
}
