import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Insights as InsightsComponent } from '../../components/Insights';

const INSIGHTS_BG = '#E8EDE8';

export default function InsightsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: INSIGHTS_BG }} edges={['top']}>
      <StatusBar style="dark" backgroundColor={INSIGHTS_BG} />
      <InsightsComponent
        entries={[]}
        hasDermatologistPlan={true}
        nextDermAppointment="2026-03-15"
        onUpdateDermAppointment={() => { }}
        userCondition="acne"
        onManageRules={() => router.push({ pathname: '/(onboarding)/registration', params: { step: '2' } })}
        completedDays={[]}
        onboardingSatisfaction={3}
      />
    </SafeAreaView>
  );
}
