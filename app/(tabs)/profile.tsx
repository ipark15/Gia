import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfilePage } from '../../components/ProfilePage';
import { getProductRecommendations } from '../../components/TreatmentProducts';

const PROFILE_BG = '#E8EDE8';

// Demo data — replace with real app state / storage
const DEMO_COMPLETED_DAYS = [
  { date: '2026-01-20', stepsCompleted: 5, totalSteps: 5 },
  { date: '2026-01-21', stepsCompleted: 3, totalSteps: 5 },
  { date: '2026-01-22', stepsCompleted: 5, totalSteps: 5 },
  { date: '2026-01-25', stepsCompleted: 5, totalSteps: 5 },
  { date: '2026-01-26', stepsCompleted: 4, totalSteps: 5 },
];

const DEMO_REGISTRATION = {
  conditions: ['Acne'],
  hasDermatologist: false,
  severity: 'moderate',
  satisfaction: 4,
  commitment: '5-7',
  preferredTimes: ['morning', 'evening'],
};

const PLAN_ID = 'acne-basic';

export default function ProfileScreen() {
  const { morningSteps, eveningSteps } = useMemo(() => {
    const { amRoutine, pmRoutine } = getProductRecommendations(PLAN_ID);
    return { morningSteps: amRoutine.length, eveningSteps: pmRoutine.length };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PROFILE_BG }} edges={['top']}>
      <StatusBar style="dark" backgroundColor={PROFILE_BG} />
      <ProfilePage
        completedDays={DEMO_COMPLETED_DAYS}
        registrationData={DEMO_REGISTRATION}
        onEdit={() => router.push('/(onboarding)/registration')}
        currentStreak={7}
        onManageRules={() => { }}
        treatmentPlanId={PLAN_ID}
        routineMorningSteps={morningSteps}
        routineEveningSteps={eveningSteps}
        onViewTreatmentPlan={() =>
          router.push({ pathname: '/treatment-plan', params: { planId: PLAN_ID } })
        }
        nextDermAppointment="2026-03-15"
        ownedProducts={[]}
        onOpenInventory={() =>
          router.push({ pathname: '/inventory', params: { planId: PLAN_ID } })
        }
        accountData={{ name: 'User', email: 'user@example.com', password: '••••••••' }}
        onUpdateAccount={() => { }}
      />
    </SafeAreaView>
  );
}
