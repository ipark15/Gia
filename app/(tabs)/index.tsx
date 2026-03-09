import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CheckInData } from '../../components/HomeDashboard';
import { HomeDashboard } from '../../components/HomeDashboard';
import { useAuth } from '../../context/AuthContext';
import { useRoutineCompletion } from '../../context/RoutineCompletionContext';
import { useRoutineStats } from '../../hooks/useRoutineStats';
import { supabase } from '../../lib/supabaseClient';

const HOME_BG = '#E8F0DC';

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const {
    completedDays: _cd,
    currentStreak,
    weekCount,
    flowersPlanted,
    morningRoutinesDone,
    eveningRoutinesDone,
    loading: statsLoading,
    refresh: refreshStats,
  } = useRoutineStats();
  const [morningRoutineCompleted, setMorningRoutineCompleted] = useState(false);
  const [eveningRoutineCompleted, setEveningRoutineCompleted] = useState(false);
  const [showRoutineCelebration, setShowRoutineCelebration] = useState(false);
  const { setOnComplete } = useRoutineCompletion();

  // Refetch stats when Home is focused so flowers/streak are up to date after completing a routine on another screen
  useFocusEffect(
    useCallback(() => {
      refreshStats();
    }, [refreshStats])
  );

  useEffect(() => {
    const handler = (type: 'morning' | 'evening') => {
      if (type === 'morning') setMorningRoutineCompleted(true);
      else setEveningRoutineCompleted(true);
      setShowRoutineCelebration(true);
    };
    setOnComplete(handler);
    return () => setOnComplete(null);
  }, [setOnComplete]);

  const handleStartRoutine = () => {
    const planId = profile?.selected_treatment_plan_id ?? 'acne-basic';
    router.push({
      pathname: '/routine-execution',
      params: { planId },
    });
  };

  const handleCheckInComplete = useCallback(
    async (data: CheckInData) => {
      if (!user) return;
      const moodText = data.skinFeeling >= 4 ? 'happy' : data.skinFeeling >= 3 ? 'neutral' : 'sad';
      const flareTags = data.symptomsToday?.filter((s) => s !== 'None' && s.length > 0) ?? [];
      await (supabase.from('check_ins') as any).insert({
        user_id: user.id,
        date: data.date,
        routine_completed: true,
        mood: moodText,
        skin_feeling: data.skinFeeling,
        flare_tags: flareTags,
        context_tags: [],
        note: data.notes ?? null,
        stress_level: data.energyLevel ?? null,
      });
    },
    [user?.id]
  );

  const userCondition = profile?.primary_condition ?? 'acne';
  const nextAppointment = profile?.next_derm_appointment ?? undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: HOME_BG }} edges={['top']}>
      <StatusBar style="dark" backgroundColor={HOME_BG} />
      <HomeDashboard
        onStartRoutine={handleStartRoutine}
        onActivateGreenhouse={() => { }}
        onFreshStart={() => { }}
        onCustomizeRoutine={() => { }}
        onOpenGarden={() => { }}
        onOpenSettings={() => router.push({ pathname: '/(onboarding)/registration', params: { step: '2' } })}
        onCheckInComplete={handleCheckInComplete}
        userCondition={userCondition}
        currentStreak={statsLoading ? 0 : currentStreak}
        weekCount={statsLoading ? 0 : weekCount}
        flowersPlanted={statsLoading ? 0 : flowersPlanted}
        morningRoutinesDone={statsLoading ? 0 : morningRoutinesDone}
        eveningRoutinesDone={statsLoading ? 0 : eveningRoutinesDone}
        morningRoutineCompleted={morningRoutineCompleted}
        eveningRoutineCompleted={eveningRoutineCompleted}
        onMorningRoutineComplete={() => setMorningRoutineCompleted(true)}
        onEveningRoutineComplete={() => setEveningRoutineCompleted(true)}
        showRoutineCelebration={showRoutineCelebration}
        onRoutineCelebrationDismiss={() => setShowRoutineCelebration(false)}
        nextAppointment={nextAppointment}
      />
    </SafeAreaView>
  );
}
