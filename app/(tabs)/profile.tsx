import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfilePage } from '../../components/ProfilePage';
import { getProductRecommendations } from '../../components/TreatmentProducts';
import { useAuth } from '../../context/AuthContext';
import { useRoutineStats } from '../../hooks/useRoutineStats';

const PROFILE_BG = '#E8EDE8';

export default function ProfileScreen() {
  const { user, profile } = useAuth();
  const { completedDays, currentStreak, loading: statsLoading } = useRoutineStats();
  const planId = profile?.selected_treatment_plan_id ?? 'acne-basic';
  const { morningSteps, eveningSteps } = useMemo(() => {
    const { amRoutine, pmRoutine } = getProductRecommendations(planId);
    return { morningSteps: amRoutine.length, eveningSteps: pmRoutine.length };
  }, [planId]);

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
      password: '••••••••',
    }),
    [profile?.name, user?.email]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PROFILE_BG }} edges={['top']}>
      <StatusBar style="dark" backgroundColor={PROFILE_BG} />
      <ProfilePage
        completedDays={statsLoading ? [] : completedDays}
        registrationData={registrationData}
        onEdit={() => router.push({ pathname: '/(onboarding)/registration', params: { step: '2' } })}
        currentStreak={statsLoading ? 0 : currentStreak}
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
        onUpdateAccount={() => { }}
      />
    </SafeAreaView>
  );
}
