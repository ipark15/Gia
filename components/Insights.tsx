import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { G } from '../constants/Gradients';
import { HEADER_PADDING_HORIZONTAL } from '../constants/HeaderStyles';
import {
  BODY_SIZE,
  BODY_SMALL_SIZE,
  BUTTON_TEXT_SIZE,
  BUTTON_TEXT_WEIGHT,
  CARD_TITLE_SIZE,
  CARD_TITLE_WEIGHT,
  LABEL_SIZE,
  LABEL_SMALL_SIZE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TITLE_SECTION_SIZE,
  TITLE_SECTION_WEIGHT,
} from '../constants/Typography';
import { formatTimestamp } from '../lib/dateUtils';
import { EmergencyHelp } from './EmergencyHelp';
import { TabTopNavbar } from './TabTopNavbar';
import WeeklyOverviewChart from './WeeklyOverviewChart';

export interface TimelineEntry {
  id: string;
  date: string;
  /** When the check-in was created (ISO string). */
  createdAt?: string;
  routineCompleted: boolean;
  flareTags?: string[];
  mood?: 'happy' | 'neutral' | 'sad';
  skinFeeling?: number;
  contextTags?: string[];
  photo?: string;
  note?: string;
  sleepHours?: number;
  stressLevel?: number;
  onPeriod?: boolean;
}

export interface InsightsProps {
  entries: TimelineEntry[];
  onCustomizeRoutine?: () => void;
  hasDermatologistPlan?: boolean;
  nextDermAppointment?: string;
  onUpdateDermAppointment?: (date: string) => void;
  userCondition?: string;
  onOpenSettings?: () => void;
  onViewTreatmentPlan?: () => void;
  onManageRules?: () => void;
  /** Optional: delete a timeline entry by id. */
  onDeleteEntry?: (id: string) => void;
  completedDays?: Array<{ date: string; stepsCompleted: number; totalSteps: number }>;
  /** Raw completion data for monthly summary (routines completed count for displayed month). */
  completedDaysRaw?: Array<{ date: string; morning_done: boolean; evening_done: boolean }>;
  onboardingSatisfaction?: number;
}

const SYMPTOM_FILTERS = ['itch', 'redness', 'dryness', 'breakout', 'pain'];
const CONTEXT_FILTERS = ['sleep', 'stress', 'product change', 'weather', 'period'];

const MOOD_EMOJI: Record<number, string> = { 1: '😢', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function Insights({
  entries = [],
  onCustomizeRoutine,
  hasDermatologistPlan,
  nextDermAppointment = '',
  onUpdateDermAppointment,
  userCondition = 'acne',
  onOpenSettings,
  onViewTreatmentPlan,
  onManageRules,
  onDeleteEntry,
  completedDays = [],
  completedDaysRaw = [],
  onboardingSatisfaction = 3,
}: InsightsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedContext, setSelectedContext] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(nextDermAppointment || '');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [askExpanded, setAskExpanded] = useState(false);
  const [askQuestion, setAskQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ question: string; answer: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayEntries = entries;

  const filteredEntries = useMemo(() => {
    return [...displayEntries]
      // Newest first in the list (top of timeline)
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((entry) => {
        if (selectedSymptoms.length > 0) {
          const has = selectedSymptoms.some((s) =>
            entry.flareTags?.some((t) => t.toLowerCase() === s.toLowerCase())
          );
          if (!has) return false;
        }
        if (selectedContext.length > 0) {
          const has = selectedContext.some((c) =>
            entry.contextTags?.some((t) => t.toLowerCase() === c.toLowerCase())
          );
          if (!has) return false;
        }
        if (selectedMood != null && entry.skinFeeling !== selectedMood) return false;
        return true;
      });
  }, [displayEntries, selectedSymptoms, selectedContext, selectedMood]);

  const toggleFilter = (filter: string, type: 'symptom' | 'context') => {
    if (type === 'symptom') {
      setSelectedSymptoms((p) => (p.includes(filter) ? p.filter((f) => f !== filter) : [...p, filter]));
    } else {
      setSelectedContext((p) => (p.includes(filter) ? p.filter((f) => f !== filter) : [...p, filter]));
    }
  };

  const clearAllFilters = () => {
    setSelectedSymptoms([]);
    setSelectedContext([]);
    setSelectedMood(null);
  };

  const activeFilterCount = selectedSymptoms.length + selectedContext.length + (selectedMood != null ? 1 : 0);

  const getWeeklyData = () => {
    const today = new Date();
    const weekData: Array<{
      day: string;
      date: string;
      consistency: number | null;
      satisfaction: number | null;
      routineCompleted: boolean;
      flareReported: boolean;
    }> = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hasAnyCompleted = completedDays.some((d) => d.stepsCompleted > 0);
    const hasAnyRealCheckIns = entries.length > 0;
    const isNewUser = !hasAnyCompleted && !hasAnyRealCheckIns;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const entriesForDay = displayEntries.filter((e) => e.date === dateStr);

      let completedCount = 0;
      for (let j = 0; j < 7; j++) {
        const look = new Date(date);
        look.setDate(look.getDate() - j);
        const lookStr = `${look.getFullYear()}-${String(look.getMonth() + 1).padStart(2, '0')}-${String(look.getDate()).padStart(2, '0')}`;
        const d = completedDays.find((x) => x.date === lookStr);
        if (d && d.stepsCompleted === d.totalSteps) completedCount++;
      }
      const consistency = isNewUser && completedCount === 0 ? 75 : Math.round((completedCount / 7) * 100);

      const skinFeelings = entriesForDay
        .map((e) => e.skinFeeling)
        .filter((sf): sf is number => sf != null);
      let satisfaction: number | null = skinFeelings.length > 0 ? skinFeelings[skinFeelings.length - 1] : null;
      if (satisfaction == null && isNewUser && onboardingSatisfaction) satisfaction = onboardingSatisfaction;

      weekData.push({
        day: dayNames[date.getDay()],
        date: dateStr,
        consistency,
        satisfaction,
        routineCompleted: !!completedDays.find((d) => d.date === dateStr && d.stepsCompleted === d.totalSteps),
        flareReported: entriesForDay.some((e) => e.flareTags && e.flareTags.length > 0),
      });
    }
    return weekData;
  };

  const weeklyData = useMemo(() => getWeeklyData(), [completedDays, displayEntries, entries.length, onboardingSatisfaction]);
  const hasRealData = weeklyData.some((d) => (d.consistency != null && d.consistency > 0) || d.satisfaction != null);

  const generateProgressAnswer = (question: string): string => {
    const q = question.toLowerCase();
    if (!hasAnyData) {
      return "Once you've logged a few routines and check-ins, I'll use your own data to highlight patterns in your skin and habits.";
    }

    if (q.includes('progress') || q.includes('doing') || q.includes('going')) {
      if (totalRoutinesThisMonth > 0) {
        return `So far this month you've completed around ${totalRoutinesThisMonth} routines and logged ${flareDaysThisMonth} flare days. Your skin tends to stay calmer when you're consistent—keep going.`;
      }
      return "Your routine data is just getting started. A few more days of check-ins will make your progress much clearer.";
    }

    if (q.includes('pattern') || q.includes('notice') || q.includes('trend')) {
      if (mostCommonContext && mostCommonFlare) {
        return `Your check-ins suggest that ${mostCommonContext} often shows up on days with ${mostCommonFlare} flares. When you notice that context, it's a good time to lean into your routine and gentle care.`;
      }
      if (mostCommonContext) {
        return `A lot of your flare or low-satisfaction days mention ${mostCommonContext}. Watching that pattern can help you anticipate when your skin might need extra support.`;
      }
      return "Right now your data doesn't show a strong single trigger, but as you keep logging check-ins, patterns between flares, mood, and context will become clearer.";
    }

    if (q.includes('month') || q.includes('february') || q.includes('week')) {
      if (totalRoutinesThisMonth > 0) {
        return `This month you’ve logged about ${totalRoutinesThisMonth} routines and ${flareDaysThisMonth} flare days. You're showing up for your skin much more often than not—that consistency really matters.`;
      }
      return "There isn't much data yet for this month. Once you've logged a week or two of routines, I'll summarize how often you're showing up and how flares are changing.";
    }

    if (q.includes('improve') || q.includes('better') || q.includes('help')) {
      if (avgWeeklyConsistency != null) {
        if (avgWeeklyConsistency >= 75) {
          return `You're already quite consistent (about ${avgWeeklyConsistency}% of prescribed routines over the last week). The biggest next lever is gentle, steady care and keeping an eye on your main triggers.`;
        }
        return `Right now you're completing your full routine roughly ${avgWeeklyConsistency}% of the time over the last week. The best way to improve your skin from here is to make it easier to hit your routine on most days.`;
      }
      return "The clearest way to help your skin is to log routines and check-ins regularly. Once there's a bit more data, I can point out where small habit changes would have the biggest impact.";
    }

    if (q.includes('flare') || q.includes('breakout')) {
      if (flareDaysThisMonth > 0 && mostCommonContext) {
        return `You've logged about ${flareDaysThisMonth} flare days this month, often on days when ${mostCommonContext} shows up. When you see that context coming, it's a good signal to be extra gentle with your skin and stick to your plan.`;
      }
      if (flareDaysThisMonth > 0) {
        return `You've logged about ${flareDaysThisMonth} flare days this month. Over time, your check-ins will help connect those flares to sleep, stress, products, or other triggers.`;
      }
      return "You haven't logged many flare days yet. As you track more, I'll help you see when and why breakouts tend to show up.";
    }

    if (q.includes('sleep') || q.includes('stress')) {
      if (recentEntry && (recentEntry.sleepHours != null || recentEntry.stressLevel != null)) {
        const parts: string[] = [];
        if (recentEntry.sleepHours != null) parts.push(`around ${recentEntry.sleepHours} hours of sleep`);
        if (recentEntry.stressLevel != null) parts.push(`a stress level of ${recentEntry.stressLevel} out of 5`);
        return `Your recent check-ins include ${parts.join(' and ')}. Keeping sleep steady and stress lower on most days usually lines up with calmer skin in your data.`;
      }
      return "As you log more sleep and stress data with your check-ins, I'll be able to show you more clearly how they relate to your flare days and satisfaction.";
    }

    return "You're building a useful dataset about your skin. Keep logging routines and how things feel—I'll keep using that information to surface patterns and simple takeaways.";
  };

  const handleAskQuestion = (q: string) => {
    if (!q.trim()) return;
    const answer = generateProgressAnswer(q);
    setChatMessages([{ question: q, answer }]);
    setAskQuestion('');
  };

  const handleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordingTimer(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      const questions = ['how is my progress going?', 'what patterns do you notice?', 'how has my skin been this month?', 'what helps my skin most?', 'when do my flares happen?'];
      handleAskQuestion(questions[Math.floor(Math.random() * questions.length)]);
    } else {
      setIsRecording(true);
      setRecordingTimer(0);
      let t = 0;
      recordingTimerRef.current = setInterval(() => {
        t += 1;
        if (t > 5) {
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
          setIsRecording(false);
          setRecordingTimer(0);
          const questions = ['how is my progress going?', 'what patterns do you notice?'];
          handleAskQuestion(questions[Math.floor(Math.random() * questions.length)]);
          return;
        }
        setRecordingTimer(t);
      }, 1000);
    }
  };

  const handleSaveAppointment = () => {
    if (onUpdateDermAppointment && appointmentDate) {
      onUpdateDermAppointment(appointmentDate);
      setIsEditingAppointment(false);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const monthlySummary = useMemo(() => {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0);
    const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    const routinesCompleted = completedDaysRaw
      .filter((r) => r.date >= start && r.date <= end)
      .reduce((sum, r) => sum + (r.morning_done ? 1 : 0) + (r.evening_done ? 1 : 0), 0);
    const flareDays = displayEntries.filter(
      (e) => e.date >= start && e.date <= end && e.flareTags && e.flareTags.length > 0
    ).length;
    return { routinesCompleted, flareDays };
  }, [year, month, completedDaysRaw, displayEntries]);

  // Simple aggregates for the Ask Gia helper, derived from real data.
  const totalRoutinesThisMonth = monthlySummary.routinesCompleted;
  const flareDaysThisMonth = monthlySummary.flareDays;
  const avgWeeklyConsistency =
    hasRealData && weeklyData.length > 0
      ? Math.round(
        weeklyData.reduce((sum, d) => sum + (d.consistency ?? 0), 0) /
        weeklyData.filter((d) => d.consistency != null).length
      )
      : null;
  const recentEntry = entries.length > 0 ? [...entries].sort((a, b) => b.date.localeCompare(a.date))[0] : null;
  const hasAnyData = entries.length > 0 || completedDays.length > 0;

  const allContexts = entries.flatMap((e) => e.contextTags ?? []);
  const mostCommonContext =
    allContexts.length > 0
      ? allContexts.reduce<{ tag: string; count: number }>((acc, tag) => {
        const count = allContexts.filter((t) => t === tag).length;
        return count > acc.count ? { tag, count } : acc;
      }, { tag: allContexts[0], count: 0 }).tag
      : null;

  const allFlareTags = entries.flatMap((e) => e.flareTags ?? []);
  const mostCommonFlare =
    allFlareTags.length > 0
      ? allFlareTags.reduce<{ tag: string; count: number }>((acc, tag) => {
        const count = allFlareTags.filter((t) => t === tag).length;
        return count > acc.count ? { tag, count } : acc;
      }, { tag: allFlareTags[0], count: 0 }).tag
      : null;

  const displayWeeklyData = hasRealData
    ? weeklyData
    : [
      { day: 'Mon', date: '2026-03-03', consistency: 85, satisfaction: 4, routineCompleted: true, flareReported: false },
      { day: 'Tue', date: '2026-03-04', consistency: 95, satisfaction: 5, routineCompleted: true, flareReported: false },
      { day: 'Wed', date: '2026-03-05', consistency: 78, satisfaction: 3, routineCompleted: false, flareReported: true },
      { day: 'Thu', date: '2026-03-06', consistency: 88, satisfaction: 4, routineCompleted: true, flareReported: false },
      { day: 'Fri', date: '2026-03-07', consistency: 96, satisfaction: 5, routineCompleted: true, flareReported: false },
      { day: 'Sat', date: '2026-03-08', consistency: 70, satisfaction: 3, routineCompleted: false, flareReported: false },
      { day: 'Sun', date: '2026-03-09', consistency: 82, satisfaction: 4, routineCompleted: true, flareReported: false },
    ];

  const getCompletionForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return completedDays.find((d) => d.date === dateStr);
  };

  let apptDay: number | null = null;
  let apptMonth: number | null = null;
  let apptYear: number | null = null;
  if (appointmentDate) {
    const [y, m, d] = appointmentDate.split('-').map(Number);
    apptYear = y;
    apptMonth = m - 1;
    apptDay = d;
  }

  const displayedTimelineEntries = timelineExpanded ? filteredEntries : filteredEntries.slice(0, 4);
  const moodLabel = (m: 'happy' | 'neutral' | 'sad') => (m === 'happy' ? 'feeling good about skin' : m === 'neutral' ? 'feeling okay' : 'feeling discouraged');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerWrap}>
          <TabTopNavbar
            icon="document-text"
            title="Insights"
            subtitle="Monitor your journey and gain insights"
            onHelpPress={() => setShowHelpModal(true)}
            onSettingsPress={onManageRules ?? undefined}
          />
        </View>

        {showHelpModal && <EmergencyHelp onClose={() => setShowHelpModal(false)} />}

        <View style={styles.contentWrap}>
          {/* Ask Gia */}
          <TouchableOpacity style={styles.askGiaBtn} onPress={() => setAskExpanded(true)} activeOpacity={0.9}>
            <LinearGradient colors={G.btnAskGia.colors} start={G.btnAskGia.start} end={G.btnAskGia.end} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 20 }} />
            <View style={styles.askGiaIconWrap}>
              <Ionicons name="mic" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.askGiaTextWrap}>
              <Text style={styles.askGiaTitle}>Ask Gia</Text>
              <Text style={styles.askGiaSubtitle}>Get AI insights about your skin journey</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          {/* Ask Gia Modal */}
          {askExpanded && (
            <Modal visible transparent animationType="slide">
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setAskExpanded(false); setAskQuestion(''); setChatMessages([]); }}>
                <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.modalContentWrap}>
                  <LinearGradient colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={styles.askModalCard}>
                    <View style={styles.askModalHeader}>
                      <View style={styles.askModalHeaderLeft}>
                        <View style={styles.askModalHeaderIcon}>
                          <Ionicons name="help-circle-outline" size={20} color="#5F8575" />
                        </View>
                        <View>
                          <Text style={styles.askModalTitle}>Ask Gia</Text>
                          <Text style={styles.askModalSubtitle}>AI-powered progress insights</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => { setAskExpanded(false); setAskQuestion(''); setChatMessages([]); }} style={styles.askModalClose}>
                        <Ionicons name="close" size={20} color="#6B8B7D" />
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.askModalBody} showsVerticalScrollIndicator={false}>
                      <Text style={styles.commonQuestionsLabel}>common questions</Text>
                      <TouchableOpacity style={styles.commonQuestionBtn} onPress={() => handleAskQuestion('how is my progress going?')}>
                        <Text style={styles.commonQuestionText}>how is my progress going?</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.commonQuestionBtn} onPress={() => handleAskQuestion('what patterns do you notice?')}>
                        <Text style={styles.commonQuestionText}>what patterns do you notice?</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.commonQuestionBtn} onPress={() => handleAskQuestion('how has my skin been this month?')}>
                        <Text style={styles.commonQuestionText}>how has my skin been this month?</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.askInput}
                        value={askQuestion}
                        onChangeText={setAskQuestion}
                        placeholder="or ask your own question..."
                        placeholderTextColor="#8A9088"
                      />
                      <TouchableOpacity style={styles.askSubmitBtn} onPress={() => handleAskQuestion(askQuestion)} activeOpacity={0.9}>
                        <LinearGradient colors={G.btnAskGia.colors} start={G.btnAskGia.start} end={G.btnAskGia.end} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 16 }} />
                        <Text style={styles.askSubmitText}>Ask Gia</Text>
                      </TouchableOpacity>
                      <Text style={styles.askDisclaimer}>*American Academy of Dermatology sourced answers</Text>
                      {chatMessages.length > 0 && (
                        <View style={styles.chatBlock}>
                          <Text style={styles.chatBlockLabel}>insights:</Text>
                          {chatMessages.map((msg, i) => (
                            <View key={i} style={styles.chatBubble}>
                              <Text style={styles.chatQuestion}>Q: {msg.question}</Text>
                              <Text style={styles.chatAnswer}>A: {msg.answer}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </ScrollView>
                  </LinearGradient>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          )}

          {/* View monthly summary toggle */}
          <TouchableOpacity style={styles.summaryToggle} onPress={() => setShowSummary(!showSummary)} activeOpacity={0.85}>
            <LinearGradient colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 16 }} />
            <View style={styles.summaryToggleInner}>
              <View style={styles.summaryToggleIcon}>
                <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.summaryToggleText}>{showSummary ? 'Hide monthly summary' : 'View monthly summary'}</Text>
            </View>
          </TouchableOpacity>

          {showSummary && (
            <LinearGradient colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={styles.monthlySummary}>
              <Text style={styles.monthlySummaryTitle}>Summary</Text>
              <View style={styles.statsGrid}>
                <LinearGradient colors={G.cardSuccess.colors} start={G.cardSuccess.start} end={G.cardSuccess.end} style={styles.summaryStatBox}>
                  <Text style={styles.summaryStatValue}>{monthlySummary.routinesCompleted}</Text>
                  <Text style={styles.summaryStatLabel}>routines completed</Text>
                </LinearGradient>
                <LinearGradient colors={G.statusFlare.colors} start={G.statusFlare.start} end={G.statusFlare.end} style={[styles.summaryStatBox, styles.summaryStatBoxFlare]}>
                  <Text style={styles.summaryStatValueFlare}>{monthlySummary.flareDays}</Text>
                  <Text style={styles.summaryStatLabelFlare}>flare days logged</Text>
                </LinearGradient>
              </View>
              <LinearGradient colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={styles.calendarCard}>
                <View style={styles.calendarNav}>
                  <TouchableOpacity onPress={prevMonth} style={styles.calendarNavBtn}>
                    <Ionicons name="chevron-back" size={20} color="#7B9B8C" />
                  </TouchableOpacity>
                  <View style={styles.calendarNavCenter}>
                    <Text style={styles.calendarMonthTitle}>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase()}</Text>
                    <Text style={styles.calendarMonthSubtitle}>your routine calendar</Text>
                  </View>
                  <TouchableOpacity onPress={nextMonth} style={styles.calendarNavBtn}>
                    <Ionicons name="chevron-forward" size={20} color="#7B9B8C" />
                  </TouchableOpacity>
                </View>
                <View style={styles.calendarGrid}>
                  {DAY_LABELS.map((d, i) => (
                    <View key={i} style={styles.calendarDayLabel}>
                      <Text style={styles.calendarDayLabelText}>{d}</Text>
                    </View>
                  ))}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <View key={`e-${i}`} style={[styles.calendarCell, styles.calendarCellEmpty]} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const comp = getCompletionForDate(day);
                    const isToday = isCurrentMonth && day === today.getDate();
                    const hasAppointment = apptDay === day && apptMonth === month && apptYear === year;
                    let cellGradient = G.calDisabled;
                    let textStyle = styles.calendarCellTextMuted;
                    let cellStyle: object = styles.calendarCellEmpty;
                    if (comp) {
                      if (comp.stepsCompleted === comp.totalSteps) {
                        cellGradient = G.calCompleted;
                        textStyle = styles.calendarCellTextWhite;
                        cellStyle = styles.calendarCellComplete;
                      } else if (comp.stepsCompleted > 0) {
                        cellGradient = G.calPartial;
                        textStyle = styles.calendarCellTextWhite;
                        cellStyle = styles.calendarCellPartial;
                      } else {
                        cellGradient = G.statusMissed;
                        textStyle = styles.calendarCellTextBrown;
                        cellStyle = styles.calendarCellMissed;
                      }
                    }
                    const hasColor = comp != null;
                    return hasColor ? (
                      <LinearGradient key={day} colors={cellGradient.colors} start={cellGradient.start} end={cellGradient.end} style={[styles.calendarCell, cellStyle, isToday && styles.calendarCellToday]}>
                        <Text style={textStyle}>{day}</Text>
                        {hasAppointment && <View style={styles.calendarApptDot} />}
                      </LinearGradient>
                    ) : (
                      <View key={day} style={[styles.calendarCell, styles.calendarCellEmpty, isToday && styles.calendarCellToday]}>
                        <Text style={textStyle}>{day}</Text>
                        {hasAppointment && <View style={styles.calendarApptDot} />}
                      </View>
                    );
                  })}
                </View>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendDotComplete]} />
                    <Text style={styles.legendText}>completed</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendDotPartial]} />
                    <Text style={styles.legendText}>partial</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendDotMissed]} />
                    <Text style={styles.legendText}>missed</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.legendDotAppt} />
                    <Text style={styles.legendText}>appointment</Text>
                  </View>
                </View>
              </LinearGradient>
              <LinearGradient colors={G.infoGreen.colors} start={G.infoGreen.start} end={G.infoGreen.end} style={styles.encouragingBox}>
                <Text style={styles.encouragingText}>This month, you showed up more often than not. That matters.</Text>
              </LinearGradient>
            </LinearGradient>
          )}

          {/* Weekly Overview */}
          <LinearGradient colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={styles.weeklyCard}>
            <View style={styles.weeklyHeader}>
              <View>
                <Text style={styles.weeklyTitle}>Weekly Overview</Text>
                <Text style={styles.weeklySubtitle}>Track your consistency and skin satisfaction</Text>
              </View>
              <TouchableOpacity style={styles.weeklyInfoBtn}>
                <Ionicons name="help-circle-outline" size={18} color="#7B9B8C" />
              </TouchableOpacity>
            </View>
            <WeeklyOverviewChart data={displayWeeklyData} />
            <View style={styles.chartLegend}>
              <LinearGradient colors={G.cardSuccess.colors} start={G.cardSuccess.start} end={G.cardSuccess.end} style={styles.chartLegendItem}>
                <View style={styles.chartLegendDotConsistency} />
                <View style={styles.chartLegendTextWrap}>
                  <Text style={styles.chartLegendTitle}>Routine Consistency</Text>
                  <Text style={styles.chartLegendDesc}>% of prescribed skincare routine completed daily</Text>
                </View>
              </LinearGradient>
              <LinearGradient colors={G.cardPink.colors} start={G.cardPink.start} end={G.cardPink.end} style={[styles.chartLegendItem, styles.chartLegendItemSatisfaction]}>
                <View style={styles.chartLegendDotSatisfaction} />
                <View style={styles.chartLegendTextWrap}>
                  <Text style={styles.chartLegendTitle}>Skin Satisfaction</Text>
                  <Text style={styles.chartLegendDesc}>Self-reported satisfaction score (1-5 scale)</Text>
                </View>
              </LinearGradient>
            </View>
          </LinearGradient>

          {/* Filters (applies to timeline below) */}
          <TouchableOpacity style={styles.filtersToggle} onPress={() => setShowFilters(!showFilters)} activeOpacity={0.85}>
            <LinearGradient colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 20 }} />
            <View style={styles.filtersToggleLeft}>
              <Ionicons name="filter-outline" size={18} color="#7B9B8C" />
              <Text style={styles.filtersToggleText}>Filters</Text>
            </View>
            <Ionicons name={showFilters ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7370" />
          </TouchableOpacity>

          {showFilters && (
            <LinearGradient colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={styles.filtersPanel}>
              <Text style={styles.filterSectionLabel}>Symptoms</Text>
              <View style={styles.tagRow}>
                {SYMPTOM_FILTERS.map((s) => (
                  <TouchableOpacity key={s} style={[styles.filterTag, selectedSymptoms.includes(s) && styles.filterTagActive]} onPress={() => toggleFilter(s, 'symptom')}>
                    <Text style={[styles.filterTagText, selectedSymptoms.includes(s) && styles.filterTagTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.filterSectionLabel}>Context</Text>
              <View style={styles.tagRow}>
                {CONTEXT_FILTERS.map((c) => (
                  <TouchableOpacity key={c} style={[styles.filterTag, selectedContext.includes(c) && styles.filterTagActive]} onPress={() => toggleFilter(c, 'context')}>
                    <Text style={[styles.filterTagText, selectedContext.includes(c) && styles.filterTagTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.filterSectionLabel}>Mood</Text>
              <View style={styles.moodRow}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.moodCircleBtn, selectedMood === v && styles.moodCircleBtnActive]}
                    onPress={() => setSelectedMood(selectedMood === v ? null : v)}
                  >
                    <Text style={styles.moodCircleEmoji}>{MOOD_EMOJI[v]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.moodScaleLabel}>not satisfied</Text>
              <Text style={[styles.moodScaleLabel, styles.moodScaleLabelRight]}>very satisfied</Text>
              {(selectedSymptoms.length > 0 || selectedContext.length > 0 || selectedMood != null) && (
                <TouchableOpacity onPress={clearAllFilters} style={styles.clearFiltersBtn}>
                  <Text style={styles.clearFiltersText}>Clear all filters</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          )}

          {/* Timeline */}
          <Text style={styles.timelineTitle}>Timeline</Text>
          {filteredEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{displayEntries.length === 0 ? 'No entries yet' : 'No entries match your filters'}</Text>
              <Text style={styles.emptySubtitle}>
                {displayEntries.length === 0 ? 'Your check-ins will appear here as a searchable timeline' : 'Try adjusting your search or filters'}
              </Text>
              {displayEntries.length > 0 && (
                <TouchableOpacity onPress={clearAllFilters} style={styles.emptyClearBtn}>
                  <Text style={styles.emptyClearText}>Clear all filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {displayedTimelineEntries.map((entry, index) => (
                <View key={entry.id} style={styles.timelineItem}>
                  {index < displayedTimelineEntries.length - 1 && <View style={styles.timelineConnector} />}
                  <View style={[styles.timelineDot, entry.routineCompleted && styles.timelineDotComplete]}>
                    {entry.routineCompleted && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                  </View>
                  <LinearGradient colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={styles.timelineCard}>
                    <View style={styles.timelineCardHeader}>
                      <View>
                        <Text style={styles.timelineDate}>
                          {entry.createdAt
                            ? formatTimestamp(entry.createdAt)
                            : parseLocalDate(entry.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                        </Text>
                        {entry.routineCompleted && (
                          <View style={styles.timelineRoutineBadge}>
                            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                            <Text style={styles.timelineRoutineBadgeText}>routine complete</Text>
                          </View>
                        )}
                      </View>
                      {onDeleteEntry && (
                        <TouchableOpacity
                          onPress={() => onDeleteEntry(entry.id)}
                          hitSlop={12}
                          style={styles.timelineDeleteButton}
                        >
                          <Ionicons name="trash-outline" size={16} color="#8B4545" />
                        </TouchableOpacity>
                      )}
                    </View>
                    {entry.mood && (
                      <View style={styles.timelineMoodRow}>
                        <View style={styles.timelineMoodIcon}>
                          <Text style={styles.timelineMoodEmoji}>{entry.mood === 'happy' ? '😄' : entry.mood === 'neutral' ? '😐' : '😢'}</Text>
                        </View>
                        <Text style={styles.timelineMoodLabel}>{moodLabel(entry.mood)}</Text>
                      </View>
                    )}
                    {entry.flareTags && entry.flareTags.length > 0 && (
                      <View style={styles.timelineTagsSection}>
                        <Text style={styles.timelineTagsLabel}>Symptoms</Text>
                        <View style={styles.tagRow}>
                          {entry.flareTags.map((tag) => (
                            <View key={tag} style={styles.flareTag}>
                              <Text style={styles.flareTagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    {entry.contextTags && entry.contextTags.length > 0 && (
                      <View style={styles.timelineTagsSection}>
                        <Text style={styles.timelineTagsLabel}>Context</Text>
                        <View style={styles.tagRow}>
                          {entry.contextTags.map((tag) => (
                            <View key={tag} style={styles.contextTag}>
                              <Text style={styles.contextTagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    {(entry.sleepHours != null || entry.stressLevel != null || entry.onPeriod) && (
                      <View style={styles.wearablesRow}>
                        <Text style={styles.timelineTagsLabel}>Health data</Text>
                        <View style={styles.tagRow}>
                          {entry.sleepHours != null && (
                            <View style={styles.wearableChip}>
                              <Text style={styles.wearableEmoji}>💤</Text>
                              <Text style={styles.wearableText}>{entry.sleepHours}h sleep</Text>
                            </View>
                          )}
                          {entry.stressLevel != null && (
                            <View style={styles.wearableChip}>
                              <Text style={styles.wearableText}>stress {entry.stressLevel}/5</Text>
                            </View>
                          )}
                          {entry.onPeriod && (
                            <View style={styles.wearableChipFlare}>
                              <Text style={styles.wearableEmoji}>🩸</Text>
                              <Text style={styles.wearableTextFlare}>on period</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                    {entry.note && (
                      <View style={styles.noteRow}>
                        <Ionicons name="document-text-outline" size={14} color="#7B9B8C" />
                        <Text style={styles.noteText}>{entry.note}</Text>
                      </View>
                    )}
                    {entry.photo && (
                      <View style={styles.photoRow}>
                        <View style={styles.photoIconWrap}>
                          <Ionicons name="camera-outline" size={14} color="#7B9B8C" />
                        </View>
                        <Text style={styles.photoText}>photo attached</Text>
                      </View>
                    )}
                  </LinearGradient>
                </View>
              ))}
              {filteredEntries.length > 4 && (
                <TouchableOpacity style={styles.showMoreBtn} onPress={() => setTimelineExpanded(!timelineExpanded)} activeOpacity={0.85}>
                  <LinearGradient colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 20 }} />
                  <Text style={styles.showMoreText}>
                    {timelineExpanded ? 'Show Less' : `Show ${filteredEntries.length - 4} More Entries`}
                  </Text>
                  <Ionicons name={timelineExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#5F8575" />
                </TouchableOpacity>
              )}
            </>
          )}

        </View>
        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingBottom: 24 },
  headerWrap: { width: '100%', paddingHorizontal: HEADER_PADDING_HORIZONTAL },
  contentWrap: { width: '100%', maxWidth: 672, alignSelf: 'center', paddingHorizontal: HEADER_PADDING_HORIZONTAL },
  askGiaBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, marginBottom: 24, borderWidth: 2, borderColor: '#7B9B8C', overflow: 'hidden' },
  askGiaIconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  askGiaTextWrap: { flex: 1 },
  askGiaTitle: { fontSize: CARD_TITLE_SIZE, color: '#FFFFFF', fontWeight: CARD_TITLE_WEIGHT },
  askGiaSubtitle: { fontSize: LABEL_SIZE, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: 16 },
  modalContentWrap: { maxHeight: '80%' },
  askModalCard: { borderRadius: 24, borderWidth: 2, borderColor: 'rgba(123,155,140,0.3)', overflow: 'hidden' },
  askModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(123,155,140,0.2)' },
  askModalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  askModalHeaderIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  askModalTitle: { fontSize: CARD_TITLE_SIZE, color: TEXT_PRIMARY, fontWeight: CARD_TITLE_WEIGHT },
  askModalSubtitle: { fontSize: LABEL_SIZE, color: TEXT_SECONDARY, marginTop: 2 },
  askModalClose: { padding: 8, borderRadius: 999 },
  askModalBody: { padding: 24, maxHeight: 400 },
  commonQuestionsLabel: { fontSize: LABEL_SMALL_SIZE, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
  commonQuestionBtn: { backgroundColor: '#E8F5E9', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 16, marginBottom: 8 },
  commonQuestionText: { fontSize: BODY_SIZE, color: TEXT_PRIMARY },
  askInput: { height: 48, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(95,133,117,0.2)', marginTop: 12, fontSize: BODY_SIZE, color: TEXT_PRIMARY },
  askSubmitBtn: { paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 12, overflow: 'hidden' },
  askSubmitText: { fontSize: BUTTON_TEXT_SIZE, color: '#FFFFFF', fontWeight: BUTTON_TEXT_WEIGHT },
  askDisclaimer: { fontSize: LABEL_SMALL_SIZE, color: TEXT_SECONDARY, marginTop: 8 },
  chatBlock: { marginTop: 20 },
  chatBlockLabel: { fontSize: LABEL_SIZE, color: TEXT_SECONDARY, marginBottom: 8 },
  chatBubble: { backgroundColor: '#F5F1ED', padding: 12, borderRadius: 12, marginBottom: 8 },
  chatQuestion: { fontSize: BODY_SMALL_SIZE, color: TEXT_PRIMARY, marginBottom: 4 },
  chatAnswer: { fontSize: BODY_SMALL_SIZE, color: TEXT_SECONDARY },

  filtersToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(123,155,140,0.3)', marginBottom: 16, overflow: 'hidden' },
  filtersToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filtersToggleText: { color: '#5A7A6B', fontSize: BODY_SIZE, fontWeight: CARD_TITLE_WEIGHT },
  filtersPanel: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#D8D5CF', marginBottom: 16, overflow: 'hidden' },
  filterSectionLabel: { fontSize: LABEL_SIZE, color: TEXT_SECONDARY, marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  filterTag: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#F5F1ED' },
  filterTagActive: { backgroundColor: '#7B9B8C' },
  filterTagText: { fontSize: BODY_SIZE, color: TEXT_SECONDARY },
  filterTagTextActive: { color: '#FFFFFF' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  moodCircleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F1ED', alignItems: 'center', justifyContent: 'center' },
  moodCircleBtnActive: { backgroundColor: '#F49EC4' },
  moodCircleEmoji: { fontSize: 22 },
  moodScaleLabel: { fontSize: LABEL_SMALL_SIZE, color: TEXT_SECONDARY, marginTop: 4 },
  moodScaleLabelRight: { textAlign: 'right' },
  clearFiltersBtn: { marginTop: 12 },
  clearFiltersText: { fontSize: BODY_SIZE, color: '#7B9B8C' },

  summaryToggle: { padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#5F8575', marginBottom: 16, alignItems: 'center', overflow: 'hidden' },
  summaryToggleInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  summaryToggleIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#5F8575', alignItems: 'center', justifyContent: 'center' },
  summaryToggleText: { fontSize: BODY_SIZE, color: '#5F8575' },

  monthlySummary: { padding: 24, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(123,155,140,0.3)', marginBottom: 24, overflow: 'hidden' },
  monthlySummaryTitle: { fontSize: TITLE_SECTION_SIZE, color: TEXT_PRIMARY, fontWeight: TITLE_SECTION_WEIGHT, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  summaryStatBox: { flex: 1, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(123,155,140,0.2)', alignItems: 'center', overflow: 'hidden' },
  summaryStatValue: { fontSize: 28, fontWeight: '700', color: '#5F8575', marginBottom: 4 },
  summaryStatLabel: { fontSize: LABEL_SIZE, color: TEXT_SECONDARY },
  summaryStatBoxFlare: { borderColor: 'rgba(255,176,176,0.3)' },
  summaryStatValueFlare: { fontSize: 28, fontWeight: '700', color: '#8B4545', marginBottom: 4 },
  summaryStatLabelFlare: { fontSize: LABEL_SIZE, color: '#8B4545' },
  calendarCard: { borderRadius: 20, padding: 20, marginBottom: 16, overflow: 'hidden' },
  calendarNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calendarNavBtn: { padding: 8 },
  calendarNavCenter: { alignItems: 'center' },
  calendarMonthTitle: { fontSize: CARD_TITLE_SIZE, color: TEXT_PRIMARY, fontWeight: CARD_TITLE_WEIGHT },
  calendarMonthSubtitle: { fontSize: LABEL_SMALL_SIZE, color: TEXT_SECONDARY, marginTop: 2 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayLabel: { width: '14.28%', alignItems: 'center', paddingVertical: 6 },
  calendarDayLabelText: { fontSize: LABEL_SIZE, color: TEXT_SECONDARY, fontWeight: '600' },
  calendarCell: { width: '14.28%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  calendarCellEmpty: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8D5CF' },
  calendarCellComplete: { borderWidth: 1, borderColor: 'transparent', overflow: 'hidden' },
  calendarCellPartial: { borderWidth: 1, borderColor: 'transparent', overflow: 'hidden' },
  calendarCellMissed: { borderWidth: 1, borderColor: 'rgba(255,179,128,0.3)', overflow: 'hidden' },
  calendarCellToday: { borderWidth: 2, borderColor: '#5F8575' },
  calendarCellTextMuted: { fontSize: LABEL_SIZE, color: '#B8B5AD' },
  calendarCellTextWhite: { fontSize: LABEL_SIZE, color: '#FFFFFF', fontWeight: CARD_TITLE_WEIGHT },
  calendarCellTextBrown: { fontSize: LABEL_SIZE, color: '#8B4513', fontWeight: CARD_TITLE_WEIGHT },
  calendarApptDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFF4D4', borderWidth: 2, borderColor: '#FFE8A3' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#D8D5CF' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 16, height: 16, borderRadius: 4 },
  legendDotComplete: { backgroundColor: '#7B9B8C' },
  legendDotPartial: { backgroundColor: '#F49EC4' },
  legendDotMissed: { backgroundColor: '#FFBB8F', borderWidth: 1, borderColor: 'rgba(255,179,128,0.5)' },
  legendDotAppt: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFF4D4', borderWidth: 2, borderColor: '#FFE8A3' },
  legendText: { fontSize: 10, color: TEXT_SECONDARY },
  encouragingBox: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(123,155,140,0.2)', overflow: 'hidden' },
  encouragingText: { fontSize: BODY_SIZE, color: TEXT_PRIMARY, textAlign: 'center' },

  weeklyCard: { padding: 24, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(123,155,140,0.3)', marginBottom: 24, overflow: 'hidden' },
  weeklyHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  weeklyTitle: { fontSize: TITLE_SECTION_SIZE, color: TEXT_PRIMARY, fontWeight: TITLE_SECTION_WEIGHT },
  weeklySubtitle: { fontSize: LABEL_SMALL_SIZE, color: TEXT_SECONDARY, marginTop: 4 },
  weeklyInfoBtn: { padding: 8 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  chartCol: { flex: 1, alignItems: 'center' },
  chartBarWrap: { width: 24, height: 120, backgroundColor: '#F5F1ED', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  chartBarConsistency: { width: '100%', backgroundColor: '#95C98E', borderRadius: 6, minHeight: 4 },
  chartSatisfactionWrap: { marginTop: 6 },
  chartSatisfactionText: { fontSize: LABEL_SMALL_SIZE, color: '#F49EC4', fontWeight: CARD_TITLE_WEIGHT },
  chartDayLabel: { fontSize: LABEL_SMALL_SIZE, color: TEXT_SECONDARY, marginTop: 4 },
  chartLegend: { paddingTop: 16, borderTopWidth: 1, borderTopColor: '#D8D5CF', gap: 12 },
  chartLegendItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, overflow: 'hidden' },
  chartLegendItemSatisfaction: {},
  chartLegendDotConsistency: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#95C98E', marginTop: 2 },
  chartLegendDotSatisfaction: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F49EC4', marginTop: 2 },
  chartLegendTextWrap: { flex: 1 },
  chartLegendTitle: { fontSize: LABEL_SIZE, color: TEXT_PRIMARY, fontWeight: CARD_TITLE_WEIGHT },
  chartLegendDesc: { fontSize: 10, color: TEXT_SECONDARY, marginTop: 2 },

  timelineTitle: { fontSize: LABEL_SIZE, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 },
  timelineItem: { position: 'relative', paddingLeft: 28, marginBottom: 16 },
  timelineConnector: { position: 'absolute', left: 9, top: 24, bottom: -16, width: 2, backgroundColor: '#7B9B8C' },
  timelineDot: { position: 'absolute', left: 0, top: 20, width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D8D5CF', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  timelineDotComplete: { backgroundColor: '#7B9B8C', borderColor: '#FFFFFF' },
  timelineCard: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D8D5CF', overflow: 'hidden' },
  timelineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(216,213,207,0.5)' },
  timelineDate: { fontSize: BODY_SIZE, color: TEXT_PRIMARY, fontWeight: CARD_TITLE_WEIGHT },
  timelineRoutineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#7B9B8C' },
  timelineRoutineBadgeText: { fontSize: 10, color: '#FFFFFF' },
  timelineMoodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  timelineMoodIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F49EC4', alignItems: 'center', justifyContent: 'center' },
  timelineMoodEmoji: { fontSize: 18 },
  timelineMoodLabel: { fontSize: LABEL_SIZE, color: TEXT_SECONDARY },
  timelineDeleteButton: { padding: 4, marginLeft: 8 },
  timelineTagsSection: { marginBottom: 8 },
  timelineTagsLabel: { fontSize: 10, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  flareTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#FFE0E0', borderWidth: 1, borderColor: 'rgba(255,176,176,0.3)' },
  flareTagText: { fontSize: 10, color: '#8B4545', fontWeight: CARD_TITLE_WEIGHT },
  contextTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#E8F0DC', borderWidth: 1, borderColor: 'rgba(149,201,142,0.3)' },
  contextTagText: { fontSize: 10, color: '#5F8575', fontWeight: CARD_TITLE_WEIGHT },
  wearablesRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(216,213,207,0.5)' },
  wearableChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: 'rgba(123,155,140,0.2)' },
  wearableEmoji: { fontSize: 10 },
  wearableText: { fontSize: LABEL_SIZE, color: '#5F8575', fontWeight: CARD_TITLE_WEIGHT },
  wearableChipFlare: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFE0E0', borderWidth: 1, borderColor: 'rgba(255,176,176,0.3)' },
  wearableTextFlare: { fontSize: LABEL_SIZE, color: '#8B4545', fontWeight: CARD_TITLE_WEIGHT },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8, padding: 10, borderRadius: 8, backgroundColor: 'rgba(245,241,237,0.5)' },
  noteText: { flex: 1, fontSize: LABEL_SIZE, color: TEXT_PRIMARY },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  photoIconWrap: { padding: 6, borderRadius: 8, backgroundColor: '#E8F5E9' },
  photoText: { fontSize: LABEL_SIZE, color: '#7B9B8C' },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(123,155,140,0.3)', marginTop: 8, overflow: 'hidden' },
  showMoreText: { fontSize: BODY_SIZE, color: '#5F8575' },

  emptyState: { paddingVertical: 48, alignItems: 'center' },
  emptyTitle: { fontSize: CARD_TITLE_SIZE, color: TEXT_SECONDARY, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: BODY_SIZE, color: TEXT_SECONDARY, textAlign: 'center', marginBottom: 16 },
  emptyClearBtn: { paddingVertical: 8 },
  emptyClearText: { fontSize: BODY_SIZE, color: '#7B9B8C' },
});
