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

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const PHOTO_BUCKET = 'progress-photos';

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
      try {
        const moodText = data.skinFeeling >= 4 ? 'happy' : data.skinFeeling >= 3 ? 'neutral' : 'sad';
        const flareTags = data.symptomsToday?.filter((s) => s !== 'None' && s.length > 0) ?? [];
        // If there is already a check-in for this user+date, update it instead of creating a new row
        const { data: existing, error: existingError } = await supabase
          .from('check_ins')
          .select('id, photo_path')
          .eq('user_id', user.id)
          .eq('date', data.date)
          .maybeSingle();
        if (existingError) throw existingError;

        const existingRow = existing as { id: string; photo_path: string | null } | null;

        let photoPath: string | null = existingRow?.photo_path ?? null;
        if (data.photoBase64) {
          // Upload/replace attached photo
          photoPath = `${user.id}/checkins/${data.date}-${Date.now()}.jpg`;
          const arrayBuffer = base64ToArrayBuffer(data.photoBase64);
          const { error: uploadError } = await supabase.storage
            .from(PHOTO_BUCKET)
            .upload(photoPath, arrayBuffer, {
              contentType: 'image/jpeg',
              upsert: false,
            });
          if (uploadError) throw uploadError;
        }

        const payload = {
          user_id: user.id,
          date: data.date,
          routine_completed: true,
          mood: moodText,
          skin_feeling: data.skinFeeling,
          flare_tags: flareTags,
          context_tags: data.contextTags ?? [],
          note: data.notes ?? null,
          photo_path: photoPath,
          sleep_hours: data.sleepHours ?? null,
          stress_level: data.stressLevel ?? null,
          on_period: data.onPeriod ?? null,
        };

        if (existingRow) {
          const { error: updateError } = await (supabase.from('check_ins') as any)
            .update(payload)
            .eq('id', existingRow.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await (supabase.from('check_ins') as any).insert(payload);
          if (insertError) throw insertError;
        }

        // If there's an attached photo, also register it in progress_photos so it appears in the Progress gallery.
        if (photoPath) {
          await (supabase.from('progress_photos') as any).insert({
            user_id: user.id,
            date: data.date,
            storage_path: photoPath,
            notes: data.notes ?? null,
          });
        }
      } catch (e) {
        // Surface errors to caller so UI can show an alert.
        throw e;
      }
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
        currentStreak={currentStreak}
        weekCount={weekCount}
        flowersPlanted={flowersPlanted}
        morningRoutinesDone={morningRoutinesDone}
        eveningRoutinesDone={eveningRoutinesDone}
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
