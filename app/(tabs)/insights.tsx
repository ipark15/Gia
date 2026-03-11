import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Insights as InsightsComponent } from '../../components/Insights';
import { G } from '../../constants/Gradients';
import { useAuth } from '../../context/AuthContext';
import { useCheckIns } from '../../hooks/useCheckIns';
import { useRoutineStats } from '../../hooks/useRoutineStats';
import { supabase } from '../../lib/supabaseClient';

export default function InsightsScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { entries, loading: checkInsLoading, refresh: refreshCheckIns } = useCheckIns();
  const {
    completedDays,
    completedDaysRaw,
    loading: statsLoading,
    refresh: refreshStats,
  } = useRoutineStats();

  // Refresh when the tab gains focus (covers cases where realtime isn't connected).
  useFocusEffect(
    useCallback(() => {
      void refreshCheckIns();
      void refreshStats();
    }, [refreshCheckIns, refreshStats])
  );

  const handleDeleteEntry = useCallback(
    async (id: string) => {
      if (!user) return;
      await (supabase.from('check_ins') as any).delete().eq('id', id).eq('user_id', user.id);
      // Realtime subscription in useCheckIns will trigger a refresh; no need to force another one.
    },
    [user?.id]
  );

  const onUpdateDermAppointment = useCallback(
    async (date: string) => {
      if (!user) return;
      await (supabase.from('profiles') as any)
        .update({ next_derm_appointment: date, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      await refreshProfile();
    },
    [user?.id, refreshProfile]
  );

  return (
    <LinearGradient colors={G.pageInsights.colors} start={G.pageInsights.start} end={G.pageInsights.end} style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <InsightsComponent
        entries={entries}
        hasDermatologistPlan={profile?.has_dermatologist_plan ?? false}
        nextDermAppointment={profile?.next_derm_appointment ?? ''}
        onUpdateDermAppointment={onUpdateDermAppointment}
        userCondition={profile?.primary_condition ?? 'acne'}
        onManageRules={() => router.push({ pathname: '/(onboarding)/registration', params: { step: '2' } })}
        onDeleteEntry={handleDeleteEntry}
        completedDays={completedDays}
        completedDaysRaw={completedDaysRaw}
        onboardingSatisfaction={profile?.skin_satisfaction_baseline ?? 3}
      />
      </SafeAreaView>
    </LinearGradient>
  );
}
