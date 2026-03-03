import { SafeAreaView } from 'react-native-safe-area-context';
import { Insights as InsightsComponent } from '../../components/Insights';

export default function InsightsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <InsightsComponent
        entries={[]}
        hasDermatologistPlan={true}
        nextDermAppointment="2026-03-15"
        onUpdateDermAppointment={() => { }}
        userCondition="acne"
      />
    </SafeAreaView>
  );
}
