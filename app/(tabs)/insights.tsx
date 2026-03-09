import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Insights as InsightsComponent } from '../../components/Insights';
import { useAuth } from '../../context/AuthContext';
import { useCheckIns } from '../../hooks/useCheckIns';
import { useRoutineStats } from '../../hooks/useRoutineStats';
import { supabase } from '../../lib/supabaseClient';

const INSIGHTS_BG = '#E8EDE8';

export default function InsightsScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { entries, loading: checkInsLoading } = useCheckIns();
  const { completedDays, completedDaysRaw, loading: statsLoading } = useRoutineStats();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: INSIGHTS_BG }} edges={['top']}>
      <StatusBar style="dark" backgroundColor={INSIGHTS_BG} />
      <InsightsComponent
        entries={checkInsLoading ? [] : entries}
        hasDermatologistPlan={profile?.has_dermatologist_plan ?? false}
        nextDermAppointment={profile?.next_derm_appointment ?? ''}
        onUpdateDermAppointment={onUpdateDermAppointment}
        userCondition={profile?.primary_condition ?? 'acne'}
        onManageRules={() => router.push({ pathname: '/(onboarding)/registration', params: { step: '2' } })}
        completedDays={statsLoading ? [] : completedDays}
        completedDaysRaw={statsLoading ? [] : completedDaysRaw}
        onboardingSatisfaction={profile?.skin_satisfaction_baseline ?? 3}
      />
    </SafeAreaView>
  );
}
