import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { HEADER_PADDING_HORIZONTAL } from '../constants/HeaderStyles';
import {
  BODY_SIZE,
  BUTTON_TEXT_SIZE,
  BUTTON_TEXT_WEIGHT,
  CARD_TITLE_SIZE,
  CARD_TITLE_WEIGHT,
  LABEL_SIZE,
  LABEL_SMALL_SIZE,
  STAT_VALUE_SIZE,
  STAT_VALUE_WEIGHT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '../constants/Typography';
import { AccountManagementSection } from './AccountManagementSection';
import { EmergencyHelp } from './EmergencyHelp';
import { TabTopNavbar } from './TabTopNavbar';

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
  /** Total days (all time) with at least one routine completed. */
  daysTracked?: number;
  onManageRules?: () => void;
  treatmentPlanId?: string;
  /** Morning and evening step counts from the treatment plan (for display on the card). */
  routineMorningSteps?: number;
  routineEveningSteps?: number;
  onViewTreatmentPlan?: () => void;
  nextDermAppointment?: string;
  ownedProducts?: OwnedProduct[];
  onOpenInventory?: () => void;
  accountData?: {
    name: string;
    email: string;
  };
  onUpdateAccount?: (data: { name: string; email: string; password: string }) => Promise<void>;
  onSignOut?: () => void;
}

export function ProfilePage({
  completedDays,
  registrationData,
  onEdit,
  currentStreak,
  daysTracked,
  onManageRules,
  treatmentPlanId = '',
  routineMorningSteps,
  routineEveningSteps,
  onViewTreatmentPlan,
  nextDermAppointment,
  ownedProducts = [],
  onOpenInventory,
  accountData,
  onUpdateAccount,
  onSignOut,
}: ProfilePageProps) {
  const [showHelpModal, setShowHelpModal] = useState(false);

  const totalCompletedDays = daysTracked ?? completedDays.length;
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
        <View style={styles.headerWrap}>
          <TabTopNavbar
            icon="person"
            title="Your profile"
            subtitle="Track your journey, celebrate progress"
            onHelpPress={() => setShowHelpModal(true)}
            onSettingsPress={onEdit}
            helpAccessibilityLabel="Emergency & medical help"
          />
        </View>

        {showHelpModal && <EmergencyHelp onClose={() => setShowHelpModal(false)} />}

        {/* Quick Stats */}
        <View style={styles.contentWrap}>
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

            {/* Routine & products — one screen with Routine + Shopping tabs */}
            {treatmentPlanId ? (
              <View style={styles.card}>
                <View style={styles.planHeader}>
                  <View style={styles.planIconWrap}>
                    <Ionicons name="document-text" size={26} color="#FFFFFF" />
                  </View>
                  <View style={styles.planTitleBlock}>
                    <Text style={styles.cardTitle}>My routine & products</Text>
                    <Text style={styles.cardSubtitle}>Your routine and shopping list</Text>
                  </View>
                </View>
                <View style={styles.planStatsRow}>
                  <View style={[styles.planStatBox, styles.planStatBoxMorning]}>
                    <View style={[styles.planStatIconWrap, styles.planStatIconMorning]}>
                      <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.uppercaseLabel}>Morning</Text>
                    <Text style={styles.planStatValue}>{routineMorningSteps ?? 0} steps</Text>
                  </View>
                  <View style={[styles.planStatBox, styles.planStatBoxEvening]}>
                    <View style={[styles.planStatIconWrap, styles.planStatIconEvening]}>
                      <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.uppercaseLabel}>Evening</Text>
                    <Text style={styles.planStatValue}>{routineEveningSteps ?? 0} steps</Text>
                  </View>
                </View>
                {onViewTreatmentPlan ? (
                  <TouchableOpacity style={styles.primaryButton} onPress={onViewTreatmentPlan} activeOpacity={0.9}>
                    <Text style={styles.primaryButtonText}>Open routine & shopping</Text>
                    <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {/* Account Management */}
            <AccountManagementSection
              accountData={accountData ?? { name: 'User', email: 'user@example.com' }}
              onUpdateAccount={onUpdateAccount}
            />

            {/* Manage routine rules */}
            {onManageRules ? (
              <TouchableOpacity style={styles.manageRulesBtn} onPress={onManageRules} activeOpacity={0.9}>
                <Ionicons name="flag" size={20} color="#FFFFFF" />
                <Text style={styles.manageRulesBtnText}>Manage routine rules</Text>
              </TouchableOpacity>
            ) : null}

            {/* Sign out */}
            {onSignOut ? (
              <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut} activeOpacity={0.9}>
                <Ionicons name="log-out-outline" size={20} color="#E11D48" />
                <Text style={styles.signOutBtnText}>Sign out</Text>
              </TouchableOpacity>
            ) : null}
          </View>

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
    paddingTop: 24,
    paddingBottom: 24,
  },
  headerWrap: {
    width: '100%',
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
  },
  contentWrap: {
    width: '100%',
    maxWidth: 672,
    alignSelf: 'center',
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
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
    fontSize: STAT_VALUE_SIZE,
    fontWeight: STAT_VALUE_WEIGHT,
    color: TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: LABEL_SIZE,
    color: TEXT_SECONDARY,
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
    fontSize: CARD_TITLE_SIZE,
    color: TEXT_PRIMARY,
    fontWeight: CARD_TITLE_WEIGHT,
  },
  cardSubtitle: {
    fontSize: LABEL_SIZE,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  planTitleBlock: { flex: 1 },
  inventoryTitleBlock: { flex: 1 },
  editIconBtn: { padding: 8, borderRadius: 999 },
  skinProfileContent: { gap: 4 },
  uppercaseLabel: {
    fontSize: LABEL_SMALL_SIZE,
    color: TEXT_SECONDARY,
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
  conditionTagText: { fontSize: BODY_SIZE, color: TEXT_PRIMARY },
  careRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  careText: { fontSize: BODY_SIZE, color: TEXT_PRIMARY },
  careTextMuted: { fontSize: BODY_SIZE, color: TEXT_SECONDARY },
  bodyText: { fontSize: BODY_SIZE, color: TEXT_PRIMARY, marginTop: 2 },
  timeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F0DC',
    borderWidth: 1,
    borderColor: 'rgba(123, 155, 140, 0.2)',
  },
  timeTagText: { fontSize: LABEL_SIZE, color: TEXT_PRIMARY },
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
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  planStatBoxMorning: {
    backgroundColor: '#E8F5E9',
    borderColor: 'rgba(149, 201, 142, 0.4)',
  },
  planStatBoxEvening: {
    backgroundColor: '#F5E6F0',
    borderColor: 'rgba(244, 158, 196, 0.4)',
  },
  planStatIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  planStatIconMorning: { backgroundColor: '#95C98E' },
  planStatIconEvening: { backgroundColor: '#F49EC4' },
  planStatValue: { fontSize: STAT_VALUE_SIZE, fontWeight: STAT_VALUE_WEIGHT, color: TEXT_PRIMARY, marginTop: 4 },
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
  primaryButtonText: { fontSize: BUTTON_TEXT_SIZE, color: '#FFFFFF', fontWeight: BUTTON_TEXT_WEIGHT },
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
  viewAllLink: { fontSize: LABEL_SIZE, color: '#7B9B8C' },
  emptyInventory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyInventoryText: { fontSize: BODY_SIZE, color: TEXT_SECONDARY, marginBottom: 12 },
  addProductsBtn: {
    backgroundColor: '#5F8575',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addProductsBtnText: { fontSize: BUTTON_TEXT_SIZE, color: '#FFFFFF', fontWeight: BUTTON_TEXT_WEIGHT },
  productList: { gap: 8, marginBottom: 16 },
  productCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: 'rgba(123, 155, 140, 0.2)',
  },
  productBrand: { fontSize: BODY_SIZE, fontWeight: CARD_TITLE_WEIGHT, color: TEXT_PRIMARY },
  productName: { fontSize: LABEL_SIZE, color: TEXT_SECONDARY, marginTop: 2 },
  productCategory: { fontSize: LABEL_SMALL_SIZE, color: TEXT_SECONDARY, marginTop: 4 },
  moreProductsText: {
    fontSize: LABEL_SIZE,
    color: TEXT_SECONDARY,
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
  manageInventoryBtnText: { fontSize: BUTTON_TEXT_SIZE, color: '#FFFFFF', fontWeight: BUTTON_TEXT_WEIGHT },
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
  manageRulesBtnText: { fontSize: BUTTON_TEXT_SIZE, color: '#FFFFFF', fontWeight: BUTTON_TEXT_WEIGHT },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(225,29,72,0.3)',
    backgroundColor: 'rgba(225,29,72,0.06)',
  },
  signOutBtnText: { fontSize: BUTTON_TEXT_SIZE, color: '#E11D48', fontWeight: BUTTON_TEXT_WEIGHT },
});
