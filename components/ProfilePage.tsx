import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AccountManagementSection } from './AccountManagementSection';
import { EmergencyHelp } from './EmergencyHelp';

export interface CompletedDay {
  date: string;
  stepsCompleted: number;
  totalSteps: number;
}

export interface OwnedProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  dateAdded: string;
}

export interface RegistrationData {
  conditions: string[];
  hasDermatologist: boolean;
  severity: string;
  satisfaction: number;
  commitment: string;
  preferredTimes: string[];
}

export interface ProfilePageProps {
  completedDays: Array<{ date: string; stepsCompleted: number; totalSteps: number }>;
  registrationData: RegistrationData;
  onEdit: () => void;
  currentStreak: number;
  onManageRules?: () => void;
  treatmentPlanId?: string;
  onViewTreatmentPlan?: () => void;
  nextDermAppointment?: string;
  ownedProducts?: OwnedProduct[];
  onOpenInventory?: () => void;
  accountData?: {
    name: string;
    email: string;
    password: string;
  };
  onUpdateAccount?: (data: { name: string; email: string; password: string }) => void;
}

export function ProfilePage({
  completedDays,
  registrationData,
  onEdit,
  currentStreak,
  onManageRules,
  treatmentPlanId = '',
  onViewTreatmentPlan,
  nextDermAppointment,
  ownedProducts = [],
  onOpenInventory,
  accountData,
  onUpdateAccount,
}: ProfilePageProps) {
  const [showHelpModal, setShowHelpModal] = useState(false);

  const totalCompletedDays = completedDays.length;
  const completionRate =
    completedDays.length > 0
      ? Math.round(
        (completedDays.filter((d) => d.stepsCompleted === d.totalSteps).length / completedDays.length) * 100
      )
      : 0;

  const satisfactionLabels: Record<number, string> = {
    1: 'Not satisfied',
    2: 'Slightly satisfied',
    3: 'Moderately satisfied',
    4: 'Satisfied',
    5: 'Very satisfied',
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={40} color="#FFFFFF" />
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowHelpModal(true)}
              accessibilityLabel="Emergency & medical help"
              activeOpacity={0.8}
            >
              <Ionicons name="help-circle-outline" size={20} color="#7B9B8C" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onEdit} accessibilityLabel="Settings" activeOpacity={0.8}>
              <Ionicons name="settings-outline" size={20} color="#7B9B8C" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.title}>Your profile</Text>
        <Text style={styles.subtitle}>Track your journey, celebrate progress</Text>

        {showHelpModal && <EmergencyHelp onClose={() => setShowHelpModal(false)} />}

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, styles.statIconFlame]}>
              <Ionicons name="flame" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, styles.statIconCheck]}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.statValue}>{totalCompletedDays}</Text>
            <Text style={styles.statLabel}>days tracked</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, styles.statIconTrend]}>
              <Ionicons name="trending-up" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>completion</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Skin Profile */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Skin profile</Text>
              <TouchableOpacity style={styles.editIconBtn} onPress={onEdit} activeOpacity={0.8}>
                <Ionicons name="pencil" size={18} color="#7B9B8C" />
              </TouchableOpacity>
            </View>

            <View style={styles.skinProfileContent}>
              <Text style={styles.uppercaseLabel}>Primary Concerns</Text>
              <View style={styles.tagRow}>
                {registrationData.conditions.map((condition, i) => (
                  <View key={i} style={styles.conditionTag}>
                    <Text style={styles.conditionTagText}>{condition}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.uppercaseLabel}>Care</Text>
              <View style={styles.careRow}>
                {registrationData.hasDermatologist ? (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#5F8575" />
                    <Text style={styles.careText}>Working with a dermatologist</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="alert-circle-outline" size={16} color="#6B8B7D" />
                    <Text style={styles.careTextMuted}>Self-managing care</Text>
                  </>
                )}
              </View>

              <Text style={styles.uppercaseLabel}>Routine Commitment</Text>
              <Text style={styles.bodyText}>{registrationData.commitment}</Text>

              <Text style={styles.uppercaseLabel}>Preferred Reminders Times</Text>
              <View style={styles.tagRow}>
                {registrationData.preferredTimes.map((time, i) => (
                  <View key={i} style={styles.timeTag}>
                    <Text style={styles.timeTagText}>{time}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.uppercaseLabel}>Skin Satisfaction</Text>
              <View style={styles.satisfactionRow}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <View
                      key={star}
                      style={[
                        styles.starCircle,
                        star <= registrationData.satisfaction ? styles.starCircleFilled : styles.starCircleEmpty,
                      ]}
                    >
                      <Text
                        style={[
                          styles.starEmoji,
                          star <= registrationData.satisfaction ? styles.starEmojiFilled : styles.starEmojiEmpty,
                        ]}
                      >
                        🪷
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.bodyText}>
                  {satisfactionLabels[registrationData.satisfaction] ?? '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Treatment Plan — your AM/PM routine */}
          {treatmentPlanId ? (
            <View style={styles.card}>
              <View style={styles.planHeader}>
                <View style={styles.planIconWrap}>
                  <Ionicons name="document-text" size={26} color="#FFFFFF" />
                </View>
                <View style={styles.planTitleBlock}>
                  <Text style={styles.cardTitle}>My treatment plan</Text>
                  <Text style={styles.cardSubtitle}>Your AM/PM routine — what to use and when</Text>
                </View>
              </View>
              <View style={styles.planStatsRow}>
                <View style={styles.planStatBox}>
                  <Text style={styles.uppercaseLabel}>Morning</Text>
                  <Text style={styles.planStatValue}>5 steps</Text>
                </View>
                <View style={styles.planStatBox}>
                  <Text style={styles.uppercaseLabel}>Evening</Text>
                  <Text style={styles.planStatValue}>6 steps</Text>
                </View>
              </View>
              {onViewTreatmentPlan ? (
                <TouchableOpacity style={styles.primaryButton} onPress={onViewTreatmentPlan} activeOpacity={0.9}>
                  <Text style={styles.primaryButtonText}>View full plan</Text>
                  <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Inventory — what you own and what to buy */}
          <View style={styles.card}>
            <View style={styles.inventoryHeader}>
              <View style={styles.inventoryTitleRow}>
                <View style={styles.inventoryIconWrap}>
                  <Ionicons name="cube-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.inventoryTitleBlock}>
                  <Text style={styles.cardTitle}>My inventory</Text>
                  <Text style={styles.cardSubtitle}>What you own and what to buy</Text>
                </View>
              </View>
              {onOpenInventory ? (
                <TouchableOpacity onPress={onOpenInventory} activeOpacity={0.8}>
                  <Text style={styles.viewAllLink}>View all</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {ownedProducts.length === 0 ? (
              <View style={styles.emptyInventory}>
                <Ionicons name="cube-outline" size={48} color="#C9CBD5" />
                <Text style={styles.emptyInventoryText}>No products yet</Text>
                {onOpenInventory ? (
                  <TouchableOpacity style={styles.addProductsBtn} onPress={onOpenInventory} activeOpacity={0.9}>
                    <Text style={styles.addProductsBtnText}>Add products</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <>
                <View style={styles.productList}>
                  {ownedProducts.slice(0, 3).map((product) => (
                    <View key={product.id} style={styles.productCard}>
                      <Text style={styles.productBrand}>{product.brand}</Text>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productCategory}>{product.category}</Text>
                    </View>
                  ))}
                </View>
                {ownedProducts.length > 3 ? (
                  <Text style={styles.moreProductsText}>
                    +{ownedProducts.length - 3} more product{ownedProducts.length - 3 !== 1 ? 's' : ''}
                  </Text>
                ) : null}
                {onOpenInventory ? (
                  <TouchableOpacity style={styles.manageInventoryBtn} onPress={onOpenInventory} activeOpacity={0.9}>
                    <Text style={styles.manageInventoryBtnText}>Manage inventory</Text>
                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>

          {/* Account Management */}
          <AccountManagementSection
            accountData={accountData ?? { name: 'User', email: 'user@example.com', password: 'password123' }}
            onUpdateAccount={onUpdateAccount}
          />

          {/* Manage routine rules */}
          {onManageRules ? (
            <TouchableOpacity style={styles.manageRulesBtn} onPress={onManageRules} activeOpacity={0.9}>
              <Ionicons name="flag" size={20} color="#FFFFFF" />
              <Text style={styles.manageRulesBtnText}>Manage routine rules</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EDE8',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    maxWidth: 672,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerSpacer: { flex: 1 },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7B9B8C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  headerActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  iconBtn: {
    padding: 10,
    borderRadius: 999,
  },
  title: {
    fontSize: 24,
    color: '#2D4A3E',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B8B7D',
    textAlign: 'center',
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(123, 155, 140, 0.2)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconFlame: { backgroundColor: '#F49EC4' },
  statIconCheck: { backgroundColor: '#7B9B8C' },
  statIconTrend: { backgroundColor: '#95C98E' },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D4A3E',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B8B7D',
    fontStyle: 'italic',
  },
  content: { gap: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(123, 155, 140, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    color: '#2D4A3E',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B8B7D',
    fontStyle: 'italic',
    marginTop: 2,
  },
  planTitleBlock: { flex: 1 },
  inventoryTitleBlock: { flex: 1 },
  editIconBtn: { padding: 8, borderRadius: 999 },
  skinProfileContent: { gap: 4 },
  uppercaseLabel: {
    fontSize: 11,
    color: '#6B8B7D',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 8,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conditionTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: 'rgba(123, 155, 140, 0.2)',
  },
  conditionTagText: { fontSize: 14, color: '#2D4A3E', fontStyle: 'italic' },
  careRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  careText: { fontSize: 14, color: '#2D4A3E', fontStyle: 'italic' },
  careTextMuted: { fontSize: 14, color: '#6B8B7D', fontStyle: 'italic' },
  bodyText: { fontSize: 14, color: '#2D4A3E', fontStyle: 'italic', marginTop: 2 },
  timeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F0DC',
    borderWidth: 1,
    borderColor: 'rgba(123, 155, 140, 0.2)',
  },
  timeTagText: { fontSize: 12, color: '#2D4A3E', fontStyle: 'italic' },
  satisfactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  starsRow: { flexDirection: 'row', gap: 6 },
  starCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starCircleFilled: { backgroundColor: '#F49EC4' },
  starCircleEmpty: { backgroundColor: '#E8E8E8' },
  starEmoji: { fontSize: 14 },
  starEmojiFilled: {},
  starEmojiEmpty: { opacity: 0.5 },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  planIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7B9B8C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  planStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  planStatBox: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(123, 155, 140, 0.2)',
  },
  planStatValue: { fontSize: 18, fontWeight: '600', color: '#2D4A3E', marginTop: 4 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5F8575',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  primaryButtonText: { fontSize: 16, color: '#FFFFFF', fontStyle: 'italic', fontWeight: '600' },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inventoryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inventoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#95C98E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllLink: { fontSize: 12, color: '#7B9B8C', fontStyle: 'italic' },
  emptyInventory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyInventoryText: { fontSize: 14, color: '#6B8B7D', fontStyle: 'italic', marginBottom: 12 },
  addProductsBtn: {
    backgroundColor: '#5F8575',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addProductsBtnText: { fontSize: 14, color: '#FFFFFF', fontStyle: 'italic', fontWeight: '600' },
  productList: { gap: 8, marginBottom: 16 },
  productCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: 'rgba(123, 155, 140, 0.2)',
  },
  productBrand: { fontSize: 14, fontWeight: '600', color: '#2D4A3E' },
  productName: { fontSize: 12, color: '#6B8B7D', fontStyle: 'italic', marginTop: 2 },
  productCategory: { fontSize: 10, color: '#6B8B7D', marginTop: 4 },
  moreProductsText: {
    fontSize: 12,
    color: '#6B8B7D',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  manageInventoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5F8575',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  manageInventoryBtnText: { fontSize: 14, color: '#FFFFFF', fontStyle: 'italic', fontWeight: '600' },
  manageRulesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#E879B9',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  manageRulesBtnText: { fontSize: 16, color: '#FFFFFF', fontStyle: 'italic', fontWeight: '600' },
});
