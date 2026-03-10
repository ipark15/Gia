import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfilePage } from '../../components/ProfilePage';
import { getProductRecommendations } from '../../components/TreatmentProducts';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useRoutineStats } from '../../hooks/useRoutineStats';

const PROFILE_BG = '#E8EDE8';

export default function ProfileScreen() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { completedDays, currentStreak, daysTracked, loading: statsLoading } = useRoutineStats();
  const planId = profile?.selected_treatment_plan_id ?? 'acne-basic';
  const { morningSteps, eveningSteps } = useMemo(() => {
    // User-saved customizations take priority
    if (profile?.custom_routine) {
      const cr = profile.custom_routine as { amRoutine: unknown[]; pmRoutine: unknown[] };
      return { morningSteps: cr.amRoutine.length, eveningSteps: cr.pmRoutine.length };
    }
    // Derm users: count products by timeOfDay
    if (
      profile?.has_dermatologist_plan &&
      Array.isArray(profile?.dermatologist_products) &&
      (profile.dermatologist_products as unknown[]).length > 0
    ) {
      const dp = profile.dermatologist_products as Array<{ timeOfDay: 'am' | 'pm' | 'both' }>;
      return {
        morningSteps: dp.filter(p => p.timeOfDay === 'am' || p.timeOfDay === 'both').length,
        eveningSteps: dp.filter(p => p.timeOfDay === 'pm' || p.timeOfDay === 'both').length,
      };
    }
    // OTC plan
    const { amRoutine, pmRoutine } = getProductRecommendations(planId);
    return { morningSteps: amRoutine.length, eveningSteps: pmRoutine.length };
  }, [planId, profile]);

  const registrationData = useMemo(
    () => ({
      conditions: profile?.conditions ?? [],
      hasDermatologist: profile?.has_dermatologist_plan ?? false,
      severity: profile?.severity ?? 'moderate',
      satisfaction: profile?.skin_satisfaction_baseline ?? 4,
      commitment: profile?.days_per_week ? `${profile.days_per_week}-7` : '5-7',
      preferredTimes: profile?.times_of_day ?? ['morning', 'evening'],
    }),
    [profile]
  );

  const accountData = useMemo(
    () => ({
      name: profile?.name ?? 'User',
      email: user?.email ?? '',
    }),
    [profile?.name, user?.email]
  );

  const handleUpdateAccount = async (data: { name: string; email: string; password: string }) => {
    if (!profile) return;
    // Update name in profiles table
    await (supabase.from('profiles') as any).update({
      name: data.name,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);
    // Update email and/or password in Supabase Auth
    const authUpdate: { email?: string; password?: string } = {};
    if (data.email && data.email !== user?.email) authUpdate.email = data.email;
    if (data.password) authUpdate.password = data.password;
    if (Object.keys(authUpdate).length > 0) {
      await supabase.auth.updateUser(authUpdate);
    }
    await refreshProfile();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PROFILE_BG }} edges={['top']}>
      <StatusBar style="dark" backgroundColor={PROFILE_BG} />
      <ProfilePage
        completedDays={completedDays}
        registrationData={registrationData}
        onEdit={() => router.push({ pathname: '/(onboarding)/registration', params: { step: '2' } })}
        currentStreak={currentStreak}
        daysTracked={daysTracked}
        onManageRules={() => router.push({ pathname: '/(onboarding)/registration', params: { step: '2' } })}
        treatmentPlanId={planId}
        routineMorningSteps={morningSteps}
        routineEveningSteps={eveningSteps}
        onViewTreatmentPlan={() =>
          router.push({ pathname: '/treatment-plan', params: { planId } })
        }
        nextDermAppointment={profile?.next_derm_appointment ?? undefined}
        ownedProducts={[]}
        onOpenInventory={() =>
          router.push({ pathname: '/inventory', params: { planId } })
        }
        accountData={accountData}
        onUpdateAccount={handleUpdateAccount}
        onSignOut={signOut}
      />
    </SafeAreaView>
  );
}
