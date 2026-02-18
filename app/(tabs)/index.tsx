import { useRoutineCompletion } from '../../context/RoutineCompletionContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeDashboard } from '../../components/HomeDashboard';

export default function HomeScreen() {
  const userCondition = 'acne';
  const currentStreak = 3;
  const weekCount = 2;
  const [morningRoutinesDone, setMorningRoutinesDone] = useState(2);
  const [eveningRoutinesDone, setEveningRoutinesDone] = useState(1);
  const [morningRoutineCompleted, setMorningRoutineCompleted] = useState(false);
  const [eveningRoutineCompleted, setEveningRoutineCompleted] = useState(false);
  const [showRoutineCelebration, setShowRoutineCelebration] = useState(false);
  const { setOnComplete } = useRoutineCompletion();

  useEffect(() => {
    const handler = (type: 'morning' | 'evening') => {
      if (type === 'morning') {
        setMorningRoutineCompleted(true);
        setMorningRoutinesDone((n) => n + 1);
      } else {
        setEveningRoutineCompleted(true);
        setEveningRoutinesDone((n) => n + 1);
      }
      setShowRoutineCelebration(true);
    };
    setOnComplete(handler);
    return () => setOnComplete(null);
  }, [setOnComplete]);

  const handleStartRoutine = () => {
    router.push({
      pathname: '/routine-execution',
      params: { planId: 'acne-basic' },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <HomeDashboard
        onStartRoutine={handleStartRoutine}
        onActivateGreenhouse={() => {}}
        onFreshStart={() => {}}
        onCustomizeRoutine={() => {}}
        onOpenInventory={() => {}}
        onOpenGarden={() => {}}
        userCondition={userCondition}
        currentStreak={currentStreak}
        weekCount={weekCount}
        morningRoutinesDone={morningRoutinesDone}
        eveningRoutinesDone={eveningRoutinesDone}
        morningRoutineCompleted={morningRoutineCompleted}
        eveningRoutineCompleted={eveningRoutineCompleted}
        onMorningRoutineComplete={() => setMorningRoutineCompleted(true)}
        onEveningRoutineComplete={() => setEveningRoutineCompleted(true)}
        showRoutineCelebration={showRoutineCelebration}
        onRoutineCelebrationDismiss={() => setShowRoutineCelebration(false)}
      />
    </SafeAreaView>
  );
}
