import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Inventory, OwnedProduct } from '../components/Inventory';
import { RoutineStep, TreatmentPlanPage } from '../components/TreatmentPlanPage';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const PLAN_BG = '#E8F0DC';

type Tab = 'routine' | 'shopping';

export default function TreatmentPlanScreen() {
  const params = useLocalSearchParams<{ planId?: string; tab?: string }>();
  const planId = params.planId ?? 'acne-basic';
  const initialTab = (params.tab === 'shopping' ? 'shopping' : 'routine') as Tab;
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [ownedProducts, setOwnedProducts] = useState<OwnedProduct[]>([]);

  const { profile, refreshProfile } = useAuth();

  const dermProducts =
    profile?.has_dermatologist_plan &&
    Array.isArray(profile?.dermatologist_products) &&
    (profile.dermatologist_products as unknown[]).length > 0
      ? (profile.dermatologist_products as unknown as Array<{
          id: string;
          name: string;
          brand: string;
          instructions?: string;
          timeOfDay: 'am' | 'pm' | 'both';
          step: string;
        }>)
      : undefined;

  const customRoutine = profile?.custom_routine as { amRoutine: RoutineStep[]; pmRoutine: RoutineStep[] } | null | undefined;

  const handleSaveRoutine = async (amRoutine: RoutineStep[], pmRoutine: RoutineStep[]) => {
    if (!profile) return;
    await (supabase.from('profiles') as any).update({
      custom_routine: { amRoutine, pmRoutine },
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);
    await refreshProfile();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" backgroundColor={PLAN_BG} />

      {/* Single header for both tabs */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color="#7B9B8C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My routine & products</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'routine' && styles.tabActive]}
          onPress={() => setActiveTab('routine')}
          activeOpacity={0.85}
        >
          <Ionicons name="document-text" size={18} color={activeTab === 'routine' ? '#FFFFFF' : '#2D4A3E'} />
          <Text style={[styles.tabText, activeTab === 'routine' && styles.tabTextActive]}>Routine</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shopping' && styles.tabActive]}
          onPress={() => setActiveTab('shopping')}
          activeOpacity={0.85}
        >
          <Ionicons name="cart-outline" size={18} color={activeTab === 'shopping' ? '#FFFFFF' : '#2D4A3E'} />
          <Text style={[styles.tabText, activeTab === 'shopping' && styles.tabTextActive]}>Shopping</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'routine' && (
          <TreatmentPlanPage
            planId={String(planId)}
            onBack={() => router.back()}
            onManageRules={() => { }}
            hideHeader
            hasDermatologistPlan={profile?.has_dermatologist_plan ?? false}
            dermatologistProducts={dermProducts}
            customRoutine={customRoutine}
            onSaveRoutine={handleSaveRoutine}
          />
        )}
        {activeTab === 'shopping' && (
          <Inventory
            planId={String(planId)}
            onBack={() => router.back()}
            ownedProducts={ownedProducts}
            onUpdateOwnedProducts={setOwnedProducts}
            mode="shopping-only"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PLAN_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(123,155,140,0.2)',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    color: '#2D4A3E',
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(123,155,140,0.2)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#7B9B8C',
    borderColor: '#5F8575',
  },
  tabText: {
    fontSize: 15,
    color: '#2D4A3E',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});
