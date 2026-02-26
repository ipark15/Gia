import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface CompletedDay {
  date: string;
  stepsCompleted: number;
  totalSteps: number;
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
  completedDays: CompletedDay[];
  registrationData: RegistrationData;
  onEdit: () => void;
  currentStreak?: number;
  onManageRules?: () => void;
}

const SEVERITY_LABELS: Record<string, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
  Light: 'Light',
  Moderate: 'Moderate',
  Severe: 'Severe',
};

const COMMITMENT_LABELS: Record<string, string> = {
  '1-2': '1-2 days per week',
  '3-4': '3-4 days per week',
  '5-7': '5-7 days per week',
  '1 days/week': '1 day per week',
  '2 days/week': '2 days per week',
  '3 days/week': '3 days per week',
  '4 days/week': '4 days per week',
  '5 days/week': '5 days per week',
  '6 days/week': '6 days per week',
  '7 days/week': '7 days per week',
};

const MOTIVATIONAL_PROMPTS = [
  "You've shown up more times than you think.",
  "Even partial days helped your skin settle.",
  "Consistency is protecting your skin barrier — even on quiet days.",
];

export function ProfilePage({
  completedDays,
  registrationData,
  onEdit,
  currentStreak = 7,
  onManageRules,
}: ProfilePageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'streaks'>('overview');
  const [feedback, setFeedback] = useState<'helpful' | 'neutral' | 'not-helpful' | null>(null);
  const [currentPrompt] = useState(() => MOTIVATIONAL_PROMPTS[Math.floor(Math.random() * MOTIVATIONAL_PROMPTS.length)]);

  const { daysInMonth, startingDayOfWeek } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay(),
    };
  }, [currentDate]);

  const getCompletionForDate = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return completedDays.find((d) => d.date === dateString);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  const daysShowedUp = completedDays.length;
  const weeklyRhythm = Math.floor(daysShowedUp / 7);

  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={40} color="#7B9B8C" />
          </View>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>Your journey and personalized settings</Text>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
          {(['overview', 'progress', 'streaks'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{daysShowedUp}</Text>
                <Text style={styles.statLabel}>Total Days</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="settings-outline" size={20} color="#7B9B8C" />
                <Text style={styles.cardTitle}>Routine rules</Text>
              </View>
              <Text style={styles.cardSubtitle}>How your routine adapts to real life</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={onManageRules} activeOpacity={0.9}>
                <Text style={styles.primaryButtonText}>Manage rules</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="trending-up-outline" size={20} color="#7B9B8C" />
                <Text style={styles.cardTitle}>Consistency tracking</Text>
              </View>
              <Text style={styles.cardSubtitle}>Your streaks are designed to support you — not pressure you.</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>Streaks reward showing up</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>Gentler days still count</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="alert-circle-outline" size={20} color="#7B9B8C" />
                <Text style={styles.cardTitle}>Skin Conditions</Text>
              </View>
              <Text style={styles.cardHint}>Used to tailor your routine and tips</Text>
              <View style={styles.tagRow}>
                {registrationData.conditions.map((c) => (
                  <View key={c} style={styles.tag}>
                    <Text style={styles.tagText}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="heart-outline" size={20} color="#7B9B8C" />
                <Text style={styles.cardTitle}>
                  {registrationData.hasDermatologist ? 'Dermatologist-guided routine' : 'Self-managing skincare'}
                </Text>
              </View>
              <Text style={styles.cardSubtitle}>
                {registrationData.hasDermatologist
                  ? 'Gia adapts without overriding medical care'
                  : 'Managing your routine independently'}
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="flag-outline" size={20} color="#7B9B8C" />
                <Text style={styles.cardTitle}>Condition Severity</Text>
              </View>
              <Text style={styles.cardValue}>{SEVERITY_LABELS[registrationData.severity] || registrationData.severity}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="heart-outline" size={20} color="#7B9B8C" />
                <Text style={styles.cardTitle}>Skin Satisfaction</Text>
              </View>
              <View style={styles.satisfactionRow}>
                <View style={styles.satisfactionTrack}>
                  <View style={[styles.satisfactionFill, { width: `${registrationData.satisfaction * 20}%` }]} />
                </View>
                <Text style={styles.satisfactionValue}>{registrationData.satisfaction}/5</Text>
              </View>
              <Text style={styles.cardHint}>
                This helps Gia adjust tone and expectations.{'\n'}No trend. No comparison. No judgment.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="calendar-outline" size={20} color="#7B9B8C" />
                <Text style={styles.cardTitle}>Routine frequency</Text>
              </View>
              <Text style={styles.cardHint}>Manage via routine rules</Text>
              <Text style={styles.cardValue}>{COMMITMENT_LABELS[registrationData.commitment] || registrationData.commitment}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="time-outline" size={20} color="#7B9B8C" />
                <Text style={styles.cardTitle}>Preferred Times</Text>
              </View>
              <Text style={styles.cardHint}>Manage via routine rules</Text>
              <View style={styles.tagRow}>
                {registrationData.preferredTimes.map((time) => (
                  <View key={time} style={styles.tag}>
                    <Text style={styles.tagText}>{time}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.editButton} onPress={onEdit} activeOpacity={0.85}>
              <Text style={styles.editButtonText}>Edit Profile Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'progress' && (
          <View style={styles.tabContent}>
            <View style={styles.promptCard}>
              <Text style={styles.promptText}>"{currentPrompt}"</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={previousMonth} style={styles.calendarNav} hitSlop={12}>
                  <Ionicons name="chevron-back" size={22} color="#7B9B8C" />
                </TouchableOpacity>
                <Text style={styles.calendarMonthTitle}>{monthName}</Text>
                <TouchableOpacity
                  onPress={nextMonth}
                  style={styles.calendarNav}
                  hitSlop={12}
                  disabled={isCurrentMonth}
                >
                  <Ionicons name="chevron-forward" size={22} color={isCurrentMonth ? '#D8D5CF' : '#7B9B8C'} />
                </TouchableOpacity>
              </View>

              <View style={styles.calendarGrid}>
                {DAY_LABELS.map((d, i) => (
                  <View key={`h-${i}`} style={styles.calendarDayHeader}>
                    <Text style={styles.calendarDayHeaderText}>{d}</Text>
                  </View>
                ))}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.calendarCell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const completion = getCompletionForDate(day);
                  const isToday = isCurrentMonth && day === today.getDate();
                  const isComplete = completion && completion.stepsCompleted === completion.totalSteps;
                  const isPartial = completion && completion.stepsCompleted < completion.totalSteps;
                  return (
                    <View
                      key={day}
                      style={[
                        styles.calendarCell,
                        styles.calendarCellDay,
                        isComplete && styles.calendarCellComplete,
                        isPartial && styles.calendarCellPartial,
                        isToday && styles.calendarCellToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarCellText,
                          isPartial && styles.calendarCellTextFilled,
                          isComplete && styles.calendarCellTextComplete,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.legendCard}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, styles.legendDotComplete]} />
                <Text style={styles.legendText}>Complete</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, styles.legendDotPartial]} />
                <Text style={styles.legendText}>Partial</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, styles.legendDotSkipped]} />
                <Text style={styles.legendText}>Skipped</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.feedbackQuestion}>Was this insight helpful?</Text>
              <View style={styles.feedbackRow}>
                <TouchableOpacity
                  onPress={() => setFeedback('helpful')}
                  style={[styles.feedbackBtn, feedback === 'helpful' && styles.feedbackBtnActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="thumbs-up-outline" size={22} color={feedback === 'helpful' ? '#FFFFFF' : '#7B9B8C'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFeedback('neutral')}
                  style={[styles.feedbackBtn, feedback === 'neutral' && styles.feedbackBtnActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="remove-outline" size={22} color={feedback === 'neutral' ? '#FFFFFF' : '#7B9B8C'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFeedback('not-helpful')}
                  style={[styles.feedbackBtn, feedback === 'not-helpful' && styles.feedbackBtnActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="thumbs-down-outline" size={22} color={feedback === 'not-helpful' ? '#FFFFFF' : '#7B9B8C'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'streaks' && (
          <View style={styles.tabContent}>
            <View style={styles.streakHero}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Current Streak</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{daysShowedUp}</Text>
                <Text style={styles.statLabel}>Days Showed Up</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{weeklyRhythm}</Text>
                <Text style={styles.statLabel}>Weekly Rhythm</Text>
              </View>
            </View>

            <View style={styles.philosophyCard}>
              <Text style={styles.philosophyTitle}>How streaks work in Gia</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>Partial routines keep your streak alive</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>Greenhouse mode days still count</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>Fresh starts don't reset your progress</Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>We celebrate showing up, not perfection</Text>
                </View>
              </View>
            </View>

            <View style={styles.encouragementCard}>
              <Text style={styles.encouragementText}>"Every day you show up for your skin is a day worth counting."</Text>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1ED' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatarWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D4E3DB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '600', color: '#7B9B8C', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7370' },

  tabScroll: { marginBottom: 24 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8D5CF' },
  tabActive: { backgroundColor: '#7B9B8C', borderColor: '#7B9B8C' },
  tabText: { fontSize: 14, color: '#7B9B8C' },
  tabTextActive: { color: '#FFFFFF' },

  tabContent: { gap: 16 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#D8D5CF', alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#7B9B8C', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#6B7370' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#D8D5CF' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#5A7A6B' },
  cardSubtitle: { fontSize: 14, color: '#6B7370', marginBottom: 12 },
  cardHint: { fontSize: 12, color: '#6B7370', marginBottom: 12 },
  cardValue: { fontSize: 15, color: '#3A3A3A' },
  primaryButton: { backgroundColor: '#7B9B8C', paddingVertical: 12, borderRadius: 999, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  bulletList: { gap: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: { fontSize: 14, color: '#7B9B8C' },
  bulletText: { fontSize: 14, color: '#3A3A3A' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#D4E3DB', borderRadius: 999 },
  tagText: { fontSize: 14, color: '#5A7A6B', textTransform: 'capitalize' },

  satisfactionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  satisfactionTrack: { flex: 1, height: 8, backgroundColor: '#D4E3DB', borderRadius: 4, overflow: 'hidden' },
  satisfactionFill: { height: '100%', backgroundColor: '#7B9B8C', borderRadius: 4 },
  satisfactionValue: { fontSize: 15, color: '#3A3A3A', minWidth: 28, textAlign: 'right' },

  editButton: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#7B9B8C', paddingVertical: 14, borderRadius: 999, alignItems: 'center', marginTop: 8 },
  editButtonText: { fontSize: 16, color: '#7B9B8C', fontWeight: '600' },

  promptCard: { backgroundColor: '#D4E3DB', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#7B9B8C' },
  promptText: { fontSize: 16, color: '#5A7A6B', fontStyle: 'italic', textAlign: 'center' },

  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calendarNav: { padding: 8 },
  calendarMonthTitle: { fontSize: 16, fontWeight: '600', color: '#5A7A6B' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayHeader: { width: '14.28%', alignItems: 'center', paddingVertical: 8 },
  calendarDayHeaderText: { fontSize: 12, color: '#6B7370', fontWeight: '600' },
  calendarCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginBottom: 4 },
  calendarCellDay: {},
  calendarCellComplete: { backgroundColor: '#7B9B8C' },
  calendarCellPartial: { backgroundColor: '#D4E3DB' },
  calendarCellToday: { borderWidth: 2, borderColor: '#7B9B8C' },
  calendarCellText: { fontSize: 13, color: '#6B7370' },
  calendarCellTextFilled: { color: '#5A7A6B', fontWeight: '600' },
  calendarCellTextComplete: { color: '#FFFFFF', fontWeight: '600' },

  legendCard: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#D8D5CF' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 16, height: 16, borderRadius: 4 },
  legendDotComplete: { backgroundColor: '#7B9B8C' },
  legendDotPartial: { backgroundColor: '#D4E3DB' },
  legendDotSkipped: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#D8D5CF' },
  legendText: { fontSize: 14, color: '#6B7370' },

  feedbackQuestion: { fontSize: 14, color: '#6B7370', textAlign: 'center', marginBottom: 12 },
  feedbackRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  feedbackBtn: { padding: 14, borderRadius: 12, backgroundColor: '#F5F1ED' },
  feedbackBtnActive: { backgroundColor: '#7B9B8C' },

  streakHero: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, borderWidth: 1, borderColor: '#D8D5CF', alignItems: 'center', marginBottom: 16 },
  streakEmoji: { fontSize: 48, marginBottom: 8 },
  streakNumber: { fontSize: 36, fontWeight: '700', color: '#7B9B8C', marginBottom: 4 },
  streakLabel: { fontSize: 14, color: '#6B7370' },

  philosophyCard: { backgroundColor: '#FFF9F5', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#D8D5CF' },
  philosophyTitle: { fontSize: 16, fontWeight: '600', color: '#5A7A6B', marginBottom: 12 },
  encouragementCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#D8D5CF', alignItems: 'center' },
  encouragementText: { fontSize: 14, color: '#6B7370', fontStyle: 'italic', textAlign: 'center' },
});
