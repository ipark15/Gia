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
import { getLocalDateString } from '../../lib/dateUtils';
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
  const { user, profile, refreshProfile } = useAuth();
  const {
    completedDays: _cd,
    currentStreak,
    weekCount,
    flowersPlanted,
    morningRoutinesDone,
    eveningRoutinesDone,
    todayMorningCompleted,
    todayEveningCompleted,
    loading: statsLoading,
    refresh: refreshStats,
  } = useRoutineStats();

  // Optimistic local flags set immediately on completion in the current session.
  // OR'd with DB-derived values so the UI stays correct on reload / cross-device.
  const [morningCompletedLocal, setMorningCompletedLocal] = useState(false);
  const [eveningCompletedLocal, setEveningCompletedLocal] = useState(false);
  const morningRoutineCompleted = todayMorningCompleted || morningCompletedLocal;
  const eveningRoutineCompleted = todayEveningCompleted || eveningCompletedLocal;

  const [showRoutineCelebration, setShowRoutineCelebration] = useState(false);

  // Track whether today's check-in is already saved (from DB).
  const [checkInCompletedToday, setCheckInCompletedToday] = useState(false);

  const { setOnComplete } = useRoutineCompletion();

  const fetchCheckInToday = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', getLocalDateString())
      .maybeSingle();
    setCheckInCompletedToday(!!data);
  }, [user?.id]);

  // Refetch everything when Home is focused so state is accurate after returning
  // from registration, another device, or any profile-mutating screen.
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      refreshStats();
      fetchCheckInToday();
    }, [refreshProfile, refreshStats, fetchCheckInToday])
  );

  useEffect(() => {
    const handler = (type: 'morning' | 'evening') => {
      if (type === 'morning') setMorningCompletedLocal(true);
      else setEveningCompletedLocal(true);
      setShowRoutineCelebration(true);
    };
    setOnComplete(handler);
    return () => setOnComplete(null);
  }, [setOnComplete]);

  // Derive which routines the user wants from their profile preference.
  // 'night' (new) and 'evening' (legacy) both map to the PM routine.
  const times = (profile?.times_of_day as string[]) ?? [];
  const wantsMorning = times.includes('morning');
  const wantsEvening = times.includes('night') || times.includes('evening');
  // Fall back to both if preference not set (e.g. brand-new profile).
  const preferredRoutines: ('morning' | 'evening')[] =
    !wantsMorning && !wantsEvening
      ? ['morning', 'evening']
      : [
          ...(wantsMorning ? (['morning'] as const) : []),
          ...(wantsEvening ? (['evening'] as const) : []),
        ];

  const handleStartRoutine = (routineType: 'morning' | 'evening') => {
    const planId = profile?.selected_treatment_plan_id ?? 'acne-basic';
    router.push({
      pathname: '/routine-execution',
      params: { planId, routineType },
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

        // Mark check-in as done for today so the card updates immediately.
        setCheckInCompletedToday(true);
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
        preferredRoutines={preferredRoutines}
        onActivateGreenhouse={() => { }}
        onFreshStart={() => { }}
        onCustomizeRoutine={() => { }}
        onOpenGarden={() => { }}
        onOpenSettings={() => router.push({ pathname: '/(onboarding)/registration', params: { step: '2' } })}
        onCheckInComplete={handleCheckInComplete}
        checkInCompletedToday={checkInCompletedToday}
        userCondition={userCondition}
        currentStreak={currentStreak}
        weekCount={weekCount}
        flowersPlanted={flowersPlanted}
        morningRoutinesDone={morningRoutinesDone}
        eveningRoutinesDone={eveningRoutinesDone}
        morningRoutineCompleted={morningRoutineCompleted}
        eveningRoutineCompleted={eveningRoutineCompleted}
        onMorningRoutineComplete={() => setMorningCompletedLocal(true)}
        onEveningRoutineComplete={() => setEveningCompletedLocal(true)}
        showRoutineCelebration={showRoutineCelebration}
        onRoutineCelebrationDismiss={() => setShowRoutineCelebration(false)}
        nextAppointment={nextAppointment}
      />
    </SafeAreaView>
  );
}
