import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TreatmentPlanPage } from '../components/TreatmentPlanPage';

const PLAN_BG = '#E8F0DC';

export default function TreatmentPlanScreen() {
  const params = useLocalSearchParams<{ planId?: string }>();
  const planId = params.planId ?? 'acne-basic';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PLAN_BG }} edges={['top']}>
      <StatusBar style="dark" backgroundColor={PLAN_BG} />
      <TreatmentPlanPage
        planId={String(planId)}
        onBack={() => router.back()}
        onManageRules={() => {
          // Could navigate to routine rules / settings later
        }}
      />
    </SafeAreaView>
  );
}

