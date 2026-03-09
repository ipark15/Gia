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

const TODAY = new Date().toISOString().slice(0, 10);

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const {
    completedDays: _cd,
    currentStreak,
    weekCount,
    morningRoutinesDone,
    eveningRoutinesDone,
    loading: statsLoading,
    refresh: refreshStats,
  } = useRoutineStats();
  const [morningRoutineCompleted, setMorningRoutineCompleted] = useState(false);
  const [eveningRoutineCompleted, setEveningRoutineCompleted] = useState(false);
  const [showRoutineCelebration, setShowRoutineCelebration] = useState(false);
  const { setOnComplete } = useRoutineCompletion();

  const persistRoutineCompletion = useCallback(
    async (type: 'morning' | 'evening') => {
      if (!user) return;
      const { data: existing } = await supabase
        .from('completed_days')
        .select('id, steps_completed, total_steps, morning_done, evening_done')
        .eq('user_id', user.id)
        .eq('date', TODAY)
        .maybeSingle();
      const totalSteps = 5;
      const prev = existing as { morning_done: boolean; evening_done: boolean; steps_completed: number } | null;
      const morning = type === 'morning' || prev?.morning_done;
      const evening = type === 'evening' || prev?.evening_done;
      const stepsCompleted = (morning ? 3 : 0) + (evening ? 2 : 0);
      if (existing) {
        // Type assertion: Supabase client infers 'never' for update/insert with our Database type
        await (supabase.from('completed_days') as any)
          .update({
            morning_done: morning,
            evening_done: evening,
            steps_completed: stepsCompleted,
            total_steps: totalSteps,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('date', TODAY);
      } else {
        await (supabase.from('completed_days') as any).insert({
          user_id: user.id,
          date: TODAY,
          morning_done: morning,
          evening_done: evening,
          steps_completed: stepsCompleted,
          total_steps: totalSteps,
        });
      }
      await refreshStats();
    },
    [user?.id, refreshStats]
  );

  useEffect(() => {
    const handler = (type: 'morning' | 'evening') => {
      if (type === 'morning') setMorningRoutineCompleted(true);
      else setEveningRoutineCompleted(true);
      setShowRoutineCelebration(true);
      persistRoutineCompletion(type);
    };
    setOnComplete(handler);
    return () => setOnComplete(null);
  }, [setOnComplete, persistRoutineCompletion]);

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
