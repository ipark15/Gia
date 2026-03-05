import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfilePage } from '../../components/ProfilePage';

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

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ProfilePage
        completedDays={DEMO_COMPLETED_DAYS}
        registrationData={DEMO_REGISTRATION}
        onEdit={() => router.push('/(onboarding)/registration')}
        currentStreak={7}
        onManageRules={() => {}}
        treatmentPlanId="demo-plan"
        onViewTreatmentPlan={() => {}}
        nextDermAppointment="2026-03-15"
        ownedProducts={[]}
        onOpenInventory={() => {}}
        accountData={{ name: 'User', email: 'user@example.com', password: '••••••••' }}
        onUpdateAccount={() => {}}
      />
    </SafeAreaView>
  );
}
