import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface CommunityProps {
  userCondition: string;
}

interface InsightCard {
  id: string;
  title: string;
  content: string;
  type: 'observation' | 'pattern';
}

interface SupportMessage {
  id: string;
  message: string;
  timestamp: string;
}

const CONDITIONS = [
  { id: 'acne', label: 'Acne' },
  { id: 'rosacea', label: 'Rosacea' },
  { id: 'eczema', label: 'Eczema' },
];

const SEVERITY_LEVELS = [
  { id: 'all', label: 'All experiences' },
  { id: 'mild', label: 'Mild' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'severe', label: 'Severe' },
];

const PRE_WRITTEN_MESSAGES = [
  "Be gentle with yourself today.",
  "Progress isn't linear — you're still doing enough.",
  "Hard days don't erase consistency.",
  "You're not alone in this journey.",
  "Taking care of yourself is never wasted effort.",
];

const SUPPORT_MESSAGES: SupportMessage[] = [
  { id: 'msg-1', message: "Be gentle with yourself today.", timestamp: 'Just now' },
  { id: 'msg-2', message: "You're doing better than you think. Keep going.", timestamp: '2 hours ago' },
];

const SENTIMENT_MAP: Record<string, Record<string, { feelingGood: number; feelingOkay: number; feelingDiscouraged: number }>> = {
  acne: {
    all: { feelingGood: 42, feelingOkay: 38, feelingDiscouraged: 20 },
    mild: { feelingGood: 55, feelingOkay: 32, feelingDiscouraged: 13 },
    moderate: { feelingGood: 38, feelingOkay: 41, feelingDiscouraged: 21 },
    severe: { feelingGood: 28, feelingOkay: 42, feelingDiscouraged: 30 },
  },
  rosacea: {
    all: { feelingGood: 38, feelingOkay: 41, feelingDiscouraged: 21 },
    mild: { feelingGood: 51, feelingOkay: 35, feelingDiscouraged: 14 },
    moderate: { feelingGood: 35, feelingOkay: 43, feelingDiscouraged: 22 },
    severe: { feelingGood: 25, feelingOkay: 44, feelingDiscouraged: 31 },
  },
  eczema: {
    all: { feelingGood: 40, feelingOkay: 39, feelingDiscouraged: 21 },
    mild: { feelingGood: 53, feelingOkay: 33, feelingDiscouraged: 14 },
    moderate: { feelingGood: 37, feelingOkay: 42, feelingDiscouraged: 21 },
    severe: { feelingGood: 27, feelingOkay: 43, feelingDiscouraged: 30 },
  },
};

const INSIGHT_CARDS: InsightCard[] = [
  { id: 'insight-1', title: 'Common experience', content: 'Most people experience emotional dips during routine adjustments.', type: 'observation' },
  { id: 'insight-2', title: "You're not alone", content: 'Flare-ups during seasonal changes are common.', type: 'pattern' },
  { id: 'insight-3', title: "What others experience", content: 'Most people miss 1-2 days per week and return to their routine.', type: 'observation' },
];

const PROGRESS_WAVE_DATA = [
  { week: 1, sentiment: 65, emoji: '😊' },
  { week: 2, sentiment: 45, emoji: '😕' },
  { week: 3, sentiment: 55, emoji: '🙂' },
  { week: 4, sentiment: 40, emoji: '😕' },
  { week: 5, sentiment: 60, emoji: '🙂' },
  { week: 6, sentiment: 50, emoji: '😐' },
  { week: 7, sentiment: 70, emoji: '😊' },
  { week: 8, sentiment: 55, emoji: '🙂' },
];

function ConditionIcon({ conditionId }: { conditionId: string }) {
  switch (conditionId) {
    case 'acne':
      return <Ionicons name="ellipse" size={14} color="#7B9B8C" />;
    case 'rosacea':
      return <Ionicons name="flame-outline" size={14} color="#7B9B8C" />;
    case 'eczema':
      return <Ionicons name="water-outline" size={14} color="#7B9B8C" />;
    default:
      return null;
  }
}

export function Community({ userCondition }: CommunityProps) {
  const [acknowledgedInsights, setAcknowledgedInsights] = useState<Set<string>>(new Set());
  const [selectedCondition, setSelectedCondition] = useState(userCondition || 'acne');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [showSendSupport, setShowSendSupport] = useState(false);
  const [selectedSupportMessage, setSelectedSupportMessage] = useState('');
  const [acknowledgedMessages, setAcknowledgedMessages] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState('');
  const [showSentConfirmation, setShowSentConfirmation] = useState(false);
  const [showNewMessageNotification, setShowNewMessageNotification] = useState(false);

  const sentimentData = SENTIMENT_MAP[selectedCondition]?.[selectedSeverity] ?? SENTIMENT_MAP[selectedCondition]?.all ?? { feelingGood: 42, feelingOkay: 38, feelingDiscouraged: 20 };

  useEffect(() => {
    if (showSentConfirmation) {
      const t = setTimeout(() => setShowSentConfirmation(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showSentConfirmation]);

  useEffect(() => {
    if (showNewMessageNotification) {
      const t = setTimeout(() => setShowNewMessageNotification(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showNewMessageNotification]);

  const handleAcknowledgment = (insightId: string) => {
    setAcknowledgedInsights((prev) => new Set(prev).add(insightId));
  };

  const handleSendSupport = () => {
    if (selectedSupportMessage || customMessage.trim()) {
      setShowSendSupport(false);
      setSelectedSupportMessage('');
      setCustomMessage('');
      setShowSentConfirmation(true);
    }
  };

  const handleMessageAcknowledgment = (messageId: string) => {
    setAcknowledgedMessages((prev) => new Set(prev).add(messageId));
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
          <Text style={styles.title}>Community</Text>
          <Text style={styles.subtitle}>You're not alone on this journey</Text>
        </View>

        {/* Condition filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setSelectedCondition(c.id)}
              style={[styles.filterChip, selectedCondition === c.id && styles.filterChipActive]}
              activeOpacity={0.8}
            >
              <ConditionIcon conditionId={c.id} />
              <Text style={[styles.filterChipText, selectedCondition === c.id && styles.filterChipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Severity filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {SEVERITY_LEVELS.map((l) => (
            <TouchableOpacity
              key={l.id}
              onPress={() => setSelectedSeverity(l.id)}
              style={[styles.filterChip, selectedSeverity === l.id && styles.filterChipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, selectedSeverity === l.id && styles.filterChipTextActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Send support card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Send support</Text>
            <Text style={styles.cardMeta}>Many are sending support today</Text>
          </View>

          {!showSendSupport ? (
            <TouchableOpacity style={styles.sendSupportButton} onPress={() => setShowSendSupport(true)} activeOpacity={0.9}>
              <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
              <Text style={styles.sendSupportButtonText}>Send support</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.sendSupportForm}>
              <Text style={styles.sendSupportHint}>Choose a message to send anonymously</Text>
              {PRE_WRITTEN_MESSAGES.map((msg, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => { setSelectedSupportMessage(msg); setCustomMessage(''); }}
                  style={[styles.messageOption, selectedSupportMessage === msg && styles.messageOptionSelected]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.messageOptionText, selectedSupportMessage === msg && styles.messageOptionTextSelected]}>{msg}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.customLabel}>Or write your own (max 80 characters)</Text>
              <TextInput
                style={styles.customInput}
                value={customMessage}
                onChangeText={(t) => { setCustomMessage(t); setSelectedSupportMessage(''); }}
                maxLength={80}
                placeholder="Type a supportive message..."
                placeholderTextColor="#8A9088"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{customMessage.length}/80</Text>
              <View style={styles.moderationBox}>
                <Text style={styles.moderationTitle}>All messages are reviewed by AI moderation</Text>
                <Text style={styles.moderationText}>Messages containing advice, comparisons, or inappropriate content will not be posted. Keep it supportive and caring.</Text>
              </View>
              <View style={styles.formButtons}>
                <TouchableOpacity
                  onPress={handleSendSupport}
                  disabled={!selectedSupportMessage && !customMessage.trim()}
                  style={[styles.formPrimaryBtn, (!selectedSupportMessage && !customMessage.trim()) && styles.formPrimaryBtnDisabled]}
                  activeOpacity={0.9}
                >
                  <Text style={styles.formPrimaryBtnText}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setShowSendSupport(false); setSelectedSupportMessage(''); setCustomMessage(''); }}
                  style={styles.formSecondaryBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.formSecondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Sent confirmation */}
        {showSentConfirmation && (
          <View style={styles.confirmationBanner}>
            <View style={styles.confirmationIconWrap}>
              <Ionicons name="heart" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.confirmationText}>
              <Text style={styles.confirmationTitle}>Your message was sent!</Text>
              <Text style={styles.confirmationSubtitle}>It will reach someone who needs it today.</Text>
            </View>
          </View>
        )}

        {/* Support messages */}
        <View style={styles.supportList}>
          {SUPPORT_MESSAGES.map((msg) => (
            <View key={msg.id} style={styles.supportCard}>
              <View style={styles.supportCardInner}>
                <View style={styles.supportIconWrap}>
                  <Ionicons name="heart" size={14} color="#7B9B8C" />
                </View>
                <View style={styles.supportContent}>
                  <Text style={styles.supportMessageText}>{msg.message}</Text>
                  <Text style={styles.supportTimestamp}>{msg.timestamp}</Text>
                </View>
              </View>
              {!acknowledgedMessages.has(msg.id) && (
                <View style={styles.supportActions}>
                  <TouchableOpacity style={styles.supportActionBtn} onPress={() => handleMessageAcknowledgment(msg.id)} activeOpacity={0.8}>
                    <Text style={styles.supportActionBtnText}>Thank you</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.supportActionBtn} onPress={() => handleMessageAcknowledgment(msg.id)} activeOpacity={0.8}>
                    <Text style={styles.supportActionBtnText}>This helped</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Daily sentiment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How people felt today</Text>
          <Text style={styles.cardMeta}>{selectedCondition} {selectedSeverity !== 'all' && `• ${selectedSeverity}`}</Text>
          <View style={styles.barSection}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Feeling good</Text>
              <Text style={styles.barValue}>{sentimentData.feelingGood}%</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, styles.barFillGood, { width: `${sentimentData.feelingGood}%` }]} />
            </View>
          </View>
          <View style={styles.barSection}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Feeling okay</Text>
              <Text style={styles.barValue}>{sentimentData.feelingOkay}%</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, styles.barFillOkay, { width: `${sentimentData.feelingOkay}%` }]} />
            </View>
          </View>
          <View style={styles.barSection}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Feeling discouraged</Text>
              <Text style={styles.barValue}>{sentimentData.feelingDiscouraged}%</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, styles.barFillDiscouraged, { width: `${sentimentData.feelingDiscouraged}%` }]} />
            </View>
          </View>
        </View>

        {/* What others experience */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What others experience</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={styles.statIconWrap}>
                <Ionicons name="calendar-outline" size={20} color="#7B9B8C" />
              </View>
              <Text style={styles.statNumber}>2-3</Text>
              <Text style={styles.statLabel}>difficult days/week</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statIconWrap}>
                <Ionicons name="moon-outline" size={20} color="#7B9B8C" />
              </View>
              <Text style={styles.statNumber}>4-6</Text>
              <Text style={styles.statLabel}>missed days/month</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statIconWrap}>
                <Ionicons name="pulse-outline" size={20} color="#7B9B8C" />
              </View>
              <Text style={styles.statNumber}>Weeks 2-4</Text>
              <Text style={styles.statLabel}>emotional ups & downs</Text>
            </View>
          </View>
        </View>

        {/* Progress wave - bar chart */}
        <View style={styles.waveCard}>
          <Text style={styles.cardTitle}>Progress is not linear</Text>
          <Text style={styles.cardMeta}>Mood journey over 8 weeks</Text>
          <View style={styles.waveChart}>
            {PROGRESS_WAVE_DATA.map((point, i) => (
              <View key={i} style={styles.waveBarWrap}>
                <Text style={styles.waveEmoji}>{point.emoji}</Text>
                <View style={[styles.waveBar, { height: (140 * point.sentiment) / 100 }]} />
              </View>
            ))}
          </View>
          <View style={styles.waveLabels}>
            {PROGRESS_WAVE_DATA.map((point, i) => (
              <Text key={i} style={styles.waveLabel}>W{point.week}</Text>
            ))}
          </View>
          <View style={styles.waveFooter}>
            <Text style={styles.waveFooterText}>Ups and downs are completely normal — most journeys look like this</Text>
          </View>
        </View>

        {/* Insight cards */}
        <View style={styles.insightList}>
          {INSIGHT_CARDS.map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="bulb-outline" size={16} color="#7B9B8C" />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightText}>{insight.content}</Text>
                </View>
              </View>
              {!acknowledgedInsights.has(insight.id) && (
                <View style={styles.insightActions}>
                  <TouchableOpacity style={styles.insightActionBtn} onPress={() => handleAcknowledgment(insight.id)} activeOpacity={0.8}>
                    <Text style={styles.insightActionBtnText}>Feels familiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.insightActionBtn} onPress={() => handleAcknowledgment(insight.id)} activeOpacity={0.8}>
                    <Text style={styles.insightActionBtnText}>Helpful</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* About */}
        <View style={styles.aboutBox}>
          <Text style={styles.aboutText}>All data is anonymous and aggregated</Text>
          <Text style={styles.aboutText}>No individual identities or performance shown</Text>
        </View>

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
  title: { fontSize: 22, fontWeight: '600', color: '#7B9B8C', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7370' },

  filterScroll: { marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8D5CF' },
  filterChipActive: { backgroundColor: '#7B9B8C', borderColor: '#7B9B8C' },
  filterChipText: { fontSize: 14, color: '#6B7370' },
  filterChipTextActive: { color: '#FFFFFF' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#D8D5CF' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#7B9B8C', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#6B7370' },

  sendSupportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7B9B8C', paddingVertical: 14, borderRadius: 14 },
  sendSupportButtonText: { fontSize: 15, color: '#FFFFFF', fontWeight: '600' },
  sendSupportForm: { gap: 12 },
  sendSupportHint: { fontSize: 12, color: '#6B7370' },
  messageOption: { padding: 14, borderRadius: 14, backgroundColor: '#F5F1ED', borderWidth: 1, borderColor: '#D8D5CF' },
  messageOptionSelected: { backgroundColor: '#D4E3DB', borderWidth: 2, borderColor: '#7B9B8C' },
  messageOptionText: { fontSize: 14, color: '#6B7370' },
  messageOptionTextSelected: { color: '#7B9B8C', fontWeight: '600' },
  customLabel: { fontSize: 12, color: '#6B7370', marginTop: 4 },
  customInput: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#D8D5CF', fontSize: 14, color: '#2D4A3E', backgroundColor: '#FFFFFF', minHeight: 56 },
  charCount: { fontSize: 12, color: '#6B7370' },
  moderationBox: { padding: 12, borderRadius: 14, backgroundColor: '#FFF8F0', borderWidth: 1, borderColor: '#F5D6C6' },
  moderationTitle: { fontSize: 12, fontWeight: '600', color: '#6B7370', marginBottom: 4 },
  moderationText: { fontSize: 12, color: '#6B7370' },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  formPrimaryBtn: { flex: 1, backgroundColor: '#7B9B8C', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  formPrimaryBtnDisabled: { opacity: 0.5 },
  formPrimaryBtnText: { fontSize: 15, color: '#FFFFFF', fontWeight: '600' },
  formSecondaryBtn: { flex: 1, borderWidth: 1, borderColor: '#D8D5CF', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  formSecondaryBtnText: { fontSize: 15, color: '#6B7370' },

  confirmationBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, marginBottom: 16, backgroundColor: '#7B9B8C' },
  confirmationIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  confirmationText: { flex: 1 },
  confirmationTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  confirmationSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },

  supportList: { gap: 12, marginBottom: 24 },
  supportCard: { backgroundColor: '#D4E3DB', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(123,155,140,0.2)' },
  supportCardInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  supportIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  supportContent: { flex: 1 },
  supportMessageText: { fontSize: 14, color: '#3A3A3A', lineHeight: 22, marginBottom: 4 },
  supportTimestamp: { fontSize: 12, color: '#6B7370' },
  supportActions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.4)' },
  supportActionBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 10, alignItems: 'center' },
  supportActionBtnText: { fontSize: 12, color: '#6B7370' },

  barSection: { marginBottom: 16 },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  barLabel: { fontSize: 14, color: '#6B7370' },
  barValue: { fontSize: 14, color: '#7B9B8C' },
  barTrack: { height: 8, backgroundColor: '#F5F1ED', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barFillGood: { backgroundColor: '#7B9B8C' },
  barFillOkay: { backgroundColor: '#B8B5AD' },
  barFillDiscouraged: { backgroundColor: '#B8B5AD' },

  statsGrid: { flexDirection: 'row', gap: 12, marginTop: 8 },
  statBox: { flex: 1, backgroundColor: '#F5F1ED', borderRadius: 14, padding: 16, alignItems: 'center' },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#7B9B8C', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7370', textAlign: 'center' },

  waveCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: '#D8D5CF' },
  waveChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, marginTop: 16, marginBottom: 8 },
  waveBarWrap: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
  waveEmoji: { fontSize: 18, marginBottom: 6 },
  waveBar: { width: '70%', minHeight: 8, maxHeight: 140, backgroundColor: '#7B9B8C', borderRadius: 6 },
  waveLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  waveLabel: { fontSize: 11, color: '#6B7370' },
  waveFooter: { marginTop: 16, padding: 12, borderRadius: 14, backgroundColor: 'rgba(212,227,219,0.4)' },
  waveFooterText: { fontSize: 12, color: '#6B7370', textAlign: 'center' },

  insightList: { gap: 12, marginBottom: 24 },
  insightCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#D8D5CF' },
  insightHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '600', color: '#7B9B8C', marginBottom: 4 },
  insightText: { fontSize: 14, color: '#6B7370', lineHeight: 20 },
  insightActions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F1ED' },
  insightActionBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#F5F1ED', borderRadius: 10, alignItems: 'center' },
  insightActionBtnText: { fontSize: 12, color: '#6B7370' },

  aboutBox: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#D8D5CF' },
  aboutText: { fontSize: 12, color: '#6B7370', textAlign: 'center', marginBottom: 4 },
});
