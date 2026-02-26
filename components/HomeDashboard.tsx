import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ConfettiProps {
  onComplete?: () => void;
}

function Confetti({ onComplete }: ConfettiProps) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  const handleDismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => onComplete?.());
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={handleDismiss}>
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.confettiCard,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <Text style={styles.confettiEmoji}>🪷</Text>
          <Text style={styles.confettiTitle}>you did it!</Text>
          <Text style={styles.confettiText}>a new flower has bloomed in your garden</Text>
          <Text style={styles.confettiSubtext}>streak maintained</Text>
          <TouchableOpacity style={styles.confettiButton} onPress={handleDismiss} activeOpacity={0.85}>
            <Text style={styles.confettiButtonText}>continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function HelpButton() {
  return (
    <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={() => { }}>
      <Ionicons name="help-circle-outline" size={22} color="#5F8575" />
    </TouchableOpacity>
  );
}

export interface HomeDashboardProps {
  onStartRoutine: () => void;
  onActivateGreenhouse: () => void;
  onFreshStart: () => void;
  onCustomizeRoutine: () => void;
  onOpenInventory?: () => void;
  onOpenGarden?: () => void;
  userCondition: string;
  currentStreak: number;
  weekCount: number;
  morningRoutinesDone: number;
  eveningRoutinesDone: number;
  morningRoutineCompleted: boolean;
  eveningRoutineCompleted: boolean;
  onMorningRoutineComplete: () => void;
  onEveningRoutineComplete: () => void;
  showRoutineCelebration?: boolean;
  onRoutineCelebrationDismiss?: () => void;
}

export function HomeDashboard({
  onStartRoutine,
  onOpenInventory,
  onOpenGarden,
  currentStreak,
  weekCount,
  morningRoutinesDone,
  eveningRoutinesDone,
  morningRoutineCompleted,
  eveningRoutineCompleted,
  onMorningRoutineComplete,
  onEveningRoutineComplete,
  showRoutineCelebration = false,
  onRoutineCelebrationDismiss,
}: HomeDashboardProps) {
  const [checkInExpanded, setCheckInExpanded] = useState(false);
  const [askExpanded, setAskExpanded] = useState(false);
  const [askQuestion, setAskQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<{ question: string; answer: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);

  const [hasFlare, setHasFlare] = useState<boolean | null>(null);
  const [selectedFlareTags, setSelectedFlareTags] = useState<string[]>([]);
  const [moodSelection, setMoodSelection] = useState<string | null>(null);
  const [contextTags, setContextTags] = useState<string[]>([]);
  const [optionalFieldsExpanded, setOptionalFieldsExpanded] = useState(false);
  const [checkInNote, setCheckInNote] = useState('');
  const [checkInCompleted, setCheckInCompleted] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const seasons = [
    { name: 'Winter', icon: 'snow-outline' as const, tip: 'Extra moisturizer needed' },
    { name: 'Spring', icon: 'leaf-outline' as const, tip: 'Fresh start with gentle care' },
    { name: 'Summer', icon: 'sunny-outline' as const, tip: 'More SPF protection' },
    { name: 'Fall', icon: 'water-outline' as const, tip: 'Transition to richer products' },
    { name: 'Traveling', icon: 'airplane-outline' as const, tip: 'Adjust routine for new environment' },
  ];

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
  }, []);

  const timeOfDay = new Date().getHours();
  const isEvening = timeOfDay >= 18 || timeOfDay < 6;
  const isMorning = timeOfDay >= 6 && timeOfDay < 12;

  const currentRoutineType = isEvening ? 'evening' : 'morning';
  const isCurrentRoutineCompleted =
    currentRoutineType === 'evening' ? eveningRoutineCompleted : morningRoutineCompleted;

  const toggleFlareTag = (tag: string) => {
    setSelectedFlareTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const toggleContextTag = (tag: string) => {
    setContextTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const generateAnswer = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes('irritation') || q.includes('normal')) {
      return "some irritation can be normal when starting new products, especially actives. if it persists beyond 2 weeks, becomes painful, or worsens, consider pausing the product and consulting your dermatologist.";
    }
    if (q.includes('redness') || q.includes('red')) {
      return "redness can be managed with gentle, fragrance-free products. look for ingredients like centella asiatica, niacinamide, or azelaic acid. avoid hot water and harsh exfoliants.";
    }
    if (q.includes('stop') || q.includes('discontinue')) {
      return "stop a product if you experience severe burning, blistering, significant swelling, or an allergic reaction. mild tingling from actives like retinol is normal, but pain isn't.";
    }
    if (q.includes('retinol') || q.includes('tretinoin')) {
      return "start retinoids slowly - 2-3 times per week, gradually increasing. use a pea-sized amount for whole face. buffer with moisturizer if needed. irritation in first 2-4 weeks is common.";
    }
    if (q.includes('purge') || q.includes('purging')) {
      return "purging typically happens with actives like retinoids or acids. it should only occur in areas where you normally break out and resolve within 4-6 weeks. new breakouts in unusual areas may indicate irritation.";
    }
    return "that's a great question. based on aad guidelines, i'd recommend discussing this with your dermatologist for personalized advice. in the meantime, stick to gentle, fragrance-free products and avoid over-exfoliating.";
  };

  const handleAskQuestion = (question: string) => {
    if (!question.trim()) return;
    const answer = generateAnswer(question);
    setChatMessages([{ question, answer }]);
    setAskQuestion('');
  };

  const handleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordingTimer(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      const voiceQuestions = [
        'is this irritation normal?',
        'what helps with redness?',
        'when should I stop using a product?',
        'how do I know if my skin is purging?',
        'can I use retinol every day?',
      ];
      const randomQuestion = voiceQuestions[Math.floor(Math.random() * voiceQuestions.length)];
      handleAskQuestion(randomQuestion);
      return;
    }

    setIsRecording(true);
    setRecordingTimer(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTimer((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          // auto-stop
          setTimeout(() => handleVoiceRecording(), 0);
        }
        return next;
      });
    }, 1000);
  };

  const getGreeting = () => {
    if (isMorning) return 'Good morning';
    if (isEvening) return 'Good evening';
    return 'Welcome back';
  };

  const getNextRoutineInfo = () => {
    if (morningRoutineCompleted && !eveningRoutineCompleted) {
      return { message: 'Next up: Evening routine', time: '6:00 PM' };
    }
    if (eveningRoutineCompleted && !morningRoutineCompleted) {
      return { message: 'Next up: Morning routine', time: 'tomorrow' };
    }
    if (morningRoutineCompleted && eveningRoutineCompleted) {
      return { message: 'Both routines completed!', time: '✨' };
    }
    return null;
  };

  const nextRoutineInfo = getNextRoutineInfo();

  return (
    <View style={styles.container}>
      {showRoutineCelebration && (
        <Confetti onComplete={onRoutineCelebrationDismiss ?? (() => { })} />
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.maxWidth}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.headerSubtext}>ready for your routine today</Text>
            </View>

            <View style={styles.headerActions}>
              <HelpButton />
              {onOpenInventory && (
                <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={onOpenInventory}>
                  <Ionicons name="cube-outline" size={22} color="#5F8575" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Completion Status Banner */}
          {nextRoutineInfo && (
            <View style={styles.completionBanner}>
              <View style={styles.completionBannerLeft}>
                <Text style={styles.completionTitle}>
                  {morningRoutineCompleted && eveningRoutineCompleted
                    ? 'both routines complete'
                    : morningRoutineCompleted
                      ? 'morning routine complete'
                      : 'evening routine complete'}
                </Text>
                <Text style={styles.completionSubtitle}>
                  {nextRoutineInfo.message.toLowerCase()}{' '}
                  {nextRoutineInfo.time !== '✨' ? `at ${nextRoutineInfo.time}` : 'check your garden'}
                </Text>
              </View>
              <Text style={styles.completionIcon}>
                {morningRoutineCompleted && eveningRoutineCompleted ? '✨' : '○'}
              </Text>
            </View>
          )}

          {/* Start routine CTA */}
          {!isCurrentRoutineCompleted && (
            <TouchableOpacity style={styles.primaryCta} activeOpacity={0.9} onPress={onStartRoutine}>
              <View style={styles.primaryCtaRow}>
                <Text style={styles.primaryCtaText}>start routine</Text>
                <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}

          {/* Quick check-in */}
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => setCheckInExpanded((v) => !v)}
              style={styles.expandHeader}
              activeOpacity={0.85}
            >
              <View style={styles.expandHeaderLeft}>
                <View style={[styles.statusDot, checkInCompleted ? styles.statusDotDone : styles.statusDotIdle]}>
                  <Text style={[styles.statusDotText, checkInCompleted && styles.statusDotTextDone]}>
                    {checkInCompleted ? '✓' : '○'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.expandTitle}>{checkInCompleted ? 'check-in complete' : 'quick check-in'}</Text>
                  <Text style={styles.expandSubtitle}>20 seconds</Text>
                </View>
              </View>
              <Ionicons
                name={checkInExpanded ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color="#6B8B7D"
              />
            </TouchableOpacity>

            {checkInExpanded && (
              <View style={styles.expandBody}>
                <Text style={styles.question}>any flare today?</Text>
                <View style={styles.twoColRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setHasFlare(false);
                      setSelectedFlareTags([]);
                    }}
                    style={[styles.pillButton, hasFlare === false && styles.pillButtonSelected]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillButtonText, hasFlare === false && styles.pillButtonTextSelected]}>
                      no
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setHasFlare(true)}
                    style={[styles.pillButton, hasFlare === true && styles.pillButtonSelected]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillButtonText, hasFlare === true && styles.pillButtonTextSelected]}>
                      yes
                    </Text>
                  </TouchableOpacity>
                </View>

                {hasFlare && (
                  <View style={styles.tagWrap}>
                    {['itch', 'redness', 'dryness', 'breakout', 'pain'].map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => toggleFlareTag(tag)}
                        style={[styles.tag, selectedFlareTags.includes(tag) && styles.tagSelected]}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.tagText, selectedFlareTags.includes(tag) && styles.tagTextSelected]}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={styles.question}>how are you feeling about your skin today?</Text>
                <View style={styles.moodRow}>
                  {[
                    { emoji: '😌', value: 'good' },
                    { emoji: '😐', value: 'okay' },
                    { emoji: '😟', value: 'discouraged' },
                  ].map((mood) => (
                    <TouchableOpacity
                      key={mood.value}
                      onPress={() => setMoodSelection(mood.value)}
                      style={[styles.moodButton, moodSelection === mood.value ? styles.moodSelected : styles.moodUnselected]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.question}>anything affecting your skin?</Text>
                <View style={styles.tagWrap}>
                  {['sleep', 'stress', 'product change', 'period', 'weather'].map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleContextTag(tag)}
                      style={[styles.tag, contextTags.includes(tag) && styles.tagSelected]}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.tagText, contextTags.includes(tag) && styles.tagTextSelected]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => setOptionalFieldsExpanded((v) => !v)}
                  style={styles.secondaryButton}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryButtonText}>add a note</Text>
                </TouchableOpacity>

                {optionalFieldsExpanded && (
                  <TextInput
                    value={checkInNote}
                    onChangeText={setCheckInNote}
                    placeholder="add any additional notes..."
                    placeholderTextColor="#8A9088"
                    style={styles.noteInput}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                )}

                <TouchableOpacity
                  onPress={() => {
                    setCheckInCompleted(true);
                    setCheckInExpanded(false);
                  }}
                  style={styles.saveButton}
                  activeOpacity={0.9}
                >
                  <Text style={styles.saveButtonText}>save check-in</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Ask a question */}
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => {
                const newExpanded = !askExpanded;
                setAskExpanded(newExpanded);
                if (!newExpanded) {
                  setAskQuestion('');
                  setChatMessages([]);
                  setIsRecording(false);
                  setRecordingTimer(0);
                  if (recordingIntervalRef.current) {
                    clearInterval(recordingIntervalRef.current);
                    recordingIntervalRef.current = null;
                  }
                }
              }}
              style={styles.expandHeader}
              activeOpacity={0.85}
            >
              <View style={styles.expandHeaderLeft}>
                <View style={styles.helpIconCircle}>
                  <Ionicons name="help-circle-outline" size={20} color="#5F8575" />
                </View>
                <View>
                  <Text style={styles.expandTitle}>ask a question</Text>
                  <Text style={styles.expandSubtitle}>aad-sourced answers</Text>
                </View>
              </View>
              <Ionicons name={askExpanded ? 'chevron-down' : 'chevron-forward'} size={20} color="#6B8B7D" />
            </TouchableOpacity>

            {askExpanded && (
              <View style={styles.expandBody}>
                <Text style={styles.commonLabel}>common questions</Text>
                {[
                  'is this irritation normal?',
                  'what helps redness?',
                  'when should i stop a product?',
                ].map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => handleAskQuestion(q)}
                    style={styles.commonButton}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.commonButtonText}>{q}</Text>
                  </TouchableOpacity>
                ))}

                <View style={styles.askBox}>
                  <TextInput
                    value={askQuestion}
                    onChangeText={setAskQuestion}
                    placeholder="or ask your own question..."
                    placeholderTextColor="#8A9088"
                    style={styles.askInput}
                    returnKeyType="send"
                    onSubmitEditing={() => handleAskQuestion(askQuestion)}
                  />
                  <TouchableOpacity style={styles.askSubmit} onPress={() => handleAskQuestion(askQuestion)} activeOpacity={0.9}>
                    <Text style={styles.askSubmitText}>ask</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleVoiceRecording}
                  style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
                  activeOpacity={0.9}
                >
                  <Ionicons name="mic-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.voiceButtonText}>
                    {isRecording ? `recording... ${recordingTimer}s` : 'ask by voice'}
                  </Text>
                </TouchableOpacity>

                {isRecording && <Text style={styles.voiceHint}>speak your question now...</Text>}

                {chatMessages.length > 0 && (
                  <View style={styles.answersBox}>
                    <Text style={styles.answersTitle}>answers:</Text>
                    {chatMessages.map((msg, idx) => (
                      <View key={idx} style={styles.answerCard}>
                        <Text style={styles.answerQ}>Q: {msg.question}</Text>
                        <Text style={styles.answerA}>A: {msg.answer}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Garden */}
          <View style={styles.gardenCard}>
            <View style={styles.gardenHeaderRow}>
              <View>
                <Text style={styles.gardenTitle}>your garden</Text>
                <Text style={styles.gardenSubtitle}>
                  {morningRoutinesDone + eveningRoutinesDone} routines completed this week
                </Text>
              </View>
            </View>

            <View style={styles.pond}>
              <View style={styles.flowerGrid}>
                {Array.from({ length: Math.min(morningRoutinesDone + eveningRoutinesDone, 10) }).map((_, i) => (
                  <View key={i} style={styles.flowerCell}>
                    <Text style={styles.flowerEmoji}>🪷</Text>
                  </View>
                ))}
              </View>

              {(morningRoutinesDone + eveningRoutinesDone) === 0 && (
                <View style={styles.noFlowers}>
                  <Text style={styles.noFlowersText}>
                    complete your first routine to plant a victoria regia 🪷
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{morningRoutinesDone + eveningRoutinesDone}</Text>
                <Text style={styles.statLabel}>flowers</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{currentStreak}</Text>
                <Text style={styles.statLabel}>day streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{weekCount}</Text>
                <Text style={styles.statLabel}>weeks</Text>
              </View>
            </View>
          </View>

          {/* Reinforcement */}
          <View style={styles.reinforcement}>
            <Text style={styles.reinforcementTitle}>You've shown up {currentStreak} days in a row</Text>
            <Text style={styles.reinforcementSubtitle}>Even small routines protect your skin barrier</Text>
          </View>

          {/* Fresh Starts & Tips */}
          <Text style={styles.sectionTitle}>Fresh Starts & Tips</Text>
          <View style={styles.seasonGrid}>
            {seasons.map((season) => (
              <TouchableOpacity
                key={season.name}
                onPress={() => setSelectedSeason(selectedSeason === season.name ? null : season.name)}
                style={[styles.seasonButton, selectedSeason === season.name && styles.seasonButtonSelected]}
                activeOpacity={0.85}
              >
                <Ionicons name={season.icon} size={24} color="#7B9B8C" />
                <Text style={styles.seasonButtonText}>{season.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedSeason && (
            <View style={styles.seasonTipBox}>
              <Text style={styles.seasonTipText}>
                <Text style={styles.seasonTipLabel}>Seasonal Tip: </Text>
                {seasons.find((s) => s.name === selectedSeason)?.tip}
              </Text>
            </View>
          )}

          {/* Remember */}
          <View style={styles.rememberCard}>
            <Text style={styles.rememberTitle}>Remember</Text>
            <Text style={styles.rememberText}>
              Flare days aren't failures — they're opportunities to tend to your garden with extra care.
              Every season has its challenges, and every day is a chance to begin again.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1ED' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 120 },
  maxWidth: { width: '100%', maxWidth: 680, alignSelf: 'center' },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  headerText: { flex: 1, paddingRight: 12 },
  greeting: { fontSize: 26, fontWeight: '600', color: '#2D4A3E', marginBottom: 4 },
  headerSubtext: { fontSize: 13, color: '#6B8B7D' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: { padding: 10, borderRadius: 999, backgroundColor: 'transparent' },

  completionBanner: { backgroundColor: '#5F8575', borderRadius: 20, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completionBannerLeft: { flex: 1, paddingRight: 12 },
  completionTitle: { color: '#FFFFFF', fontWeight: '700', fontStyle: 'italic', fontSize: 15, marginBottom: 4 },
  completionSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  completionIcon: { color: '#FFFFFF', fontSize: 22 },

  primaryCta: { backgroundColor: '#5F8575', borderRadius: 20, paddingVertical: 18, paddingHorizontal: 18, marginBottom: 16 },
  askGiaCta: { borderRadius: 20, paddingVertical: 18, paddingHorizontal: 18, marginBottom: 16, backgroundColor: '#7B9B8C' },
  primaryCtaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  askGiaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryCtaText: { color: '#FFFFFF', fontSize: 16, fontStyle: 'italic', fontWeight: '600' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(95,133,117,0.1)' },
  expandHeader: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expandHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statusDotIdle: { backgroundColor: '#E8F5E9' },
  statusDotDone: { backgroundColor: '#5F8575' },
  statusDotText: { fontSize: 18, color: '#2D4A3E' },
  statusDotTextDone: { color: '#FFFFFF' },
  expandTitle: { color: '#2D4A3E', fontStyle: 'italic', fontSize: 16 },
  expandSubtitle: { color: '#6B8B7D', fontSize: 13, marginTop: 2 },
  expandBody: { borderTopWidth: 1, borderTopColor: 'rgba(95,133,117,0.1)', padding: 16, gap: 16 },
  question: { color: '#2D4A3E', fontStyle: 'italic', fontSize: 15 },
  twoColRow: { flexDirection: 'row', gap: 12 },
  pillButton: { flex: 1, paddingVertical: 12, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(95,133,117,0.2)', alignItems: 'center', backgroundColor: '#FFFFFF' },
  pillButtonSelected: { backgroundColor: '#5F8575', borderColor: '#5F8575' },
  pillButtonText: { color: '#6B8B7D', fontWeight: '700' },
  pillButtonTextSelected: { color: '#FFFFFF' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#E8F5E9' },
  tagSelected: { backgroundColor: '#5F8575' },
  tagText: { color: '#6B8B7D', fontWeight: '700' },
  tagTextSelected: { color: '#FFFFFF' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-around' },
  moodButton: { padding: 6 },
  moodSelected: { opacity: 1 },
  moodUnselected: { opacity: 0.45 },
  moodEmoji: { fontSize: 44 },
  secondaryButton: { backgroundColor: '#E8F5E9', paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#2D4A3E', fontStyle: 'italic', fontWeight: '600' },
  noteInput: { borderWidth: 1, borderColor: 'rgba(95,133,117,0.2)', borderRadius: 16, padding: 14, color: '#2D4A3E', backgroundColor: '#FFFFFF' },
  saveButton: { backgroundColor: '#5F8575', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontStyle: 'italic', fontWeight: '700' },

  helpIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  commonLabel: { fontSize: 11, color: '#6B8B7D', letterSpacing: 1, textTransform: 'uppercase' },
  commonButton: { backgroundColor: '#E8F5E9', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16 },
  commonButtonText: { color: '#2D4A3E', fontStyle: 'italic', fontWeight: '600' },
  askBox: { gap: 10 },
  askInput: { borderWidth: 1, borderColor: 'rgba(95,133,117,0.2)', borderRadius: 16, padding: 14, color: '#2D4A3E', backgroundColor: '#FFFFFF' },
  askSubmit: { backgroundColor: '#5F8575', paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  askSubmitText: { color: '#FFFFFF', fontStyle: 'italic', fontWeight: '700' },
  voiceButton: { backgroundColor: '#5F8575', paddingVertical: 12, borderRadius: 16, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  voiceButtonRecording: { backgroundColor: '#EF4444' },
  voiceButtonText: { color: '#FFFFFF', fontStyle: 'italic', fontWeight: '700' },
  voiceHint: { color: '#6B8B7D', fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  answersBox: { marginTop: 6 },
  answersTitle: { color: '#6B8B7D', marginBottom: 8 },
  answerCard: { backgroundColor: '#F5F1ED', padding: 12, borderRadius: 14, marginBottom: 8 },
  answerQ: { color: '#2D4A3E', fontStyle: 'italic', marginBottom: 4 },
  answerA: { color: '#6B8B7D' },

  gardenCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, borderWidth: 2, borderColor: '#D8D5CF', marginBottom: 16 },
  gardenHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  gardenTitle: { color: '#7B9B8C', fontSize: 18, fontWeight: '600' },
  gardenSubtitle: { color: '#6B7370', fontSize: 13, marginTop: 2 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { color: '#7B9B8C', fontSize: 13, fontWeight: '600' },
  pond: { borderRadius: 18, padding: 16, minHeight: 180, backgroundColor: '#B8D8E8', overflow: 'hidden' },
  flowerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  flowerCell: { width: '18%', alignItems: 'center' },
  flowerEmoji: { fontSize: 28 },
  noFlowers: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  noFlowersText: { color: '#6B7370', fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: '#F5F1ED', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 20, color: '#7B9B8C', fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7370' },

  reinforcement: { backgroundColor: '#D4E3DB', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#D8D5CF' },
  reinforcementTitle: { color: '#7B9B8C', fontSize: 16, textAlign: 'center', marginBottom: 4 },
  reinforcementSubtitle: { color: '#6B7370', fontSize: 13, textAlign: 'center' },

  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#7B9B8C', marginTop: 24, marginBottom: 12 },
  seasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  seasonButton: { width: '47%', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#D8D5CF', backgroundColor: '#FFFFFF', alignItems: 'center' },
  seasonButtonSelected: { borderColor: '#7B9B8C', backgroundColor: 'rgba(212,227,219,0.2)' },
  seasonButtonText: { fontSize: 14, color: '#7B9B8C', marginTop: 8, fontWeight: '600' },
  seasonTipBox: { padding: 16, backgroundColor: '#F5F1ED', borderRadius: 16, borderWidth: 2, borderColor: '#D4E3DB', marginBottom: 16 },
  seasonTipLabel: { fontWeight: '600', color: '#7B9B8C' },
  seasonTipText: { fontSize: 14, color: '#6B7370', lineHeight: 22 },
  rememberCard: { padding: 20, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: '#D8D5CF' },
  rememberTitle: { fontSize: 16, fontWeight: '600', color: '#7B9B8C', marginBottom: 8 },
  rememberText: { fontSize: 14, color: '#6B7370', lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  confettiCard: { width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, borderWidth: 2, borderColor: '#7B9B8C', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 },
  confettiEmoji: { fontSize: 56, marginBottom: 12 },
  confettiTitle: { fontSize: 22, color: '#5A7A6B', fontStyle: 'italic', marginBottom: 8 },
  confettiText: { fontSize: 14, color: '#6B7370', textAlign: 'center', marginBottom: 8 },
  confettiSubtext: { fontSize: 13, color: '#7B9B8C', marginBottom: 20 },
  confettiButton: { backgroundColor: '#5F8575', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 999 },
  confettiButtonText: { color: '#FFFFFF', fontWeight: '600', fontStyle: 'italic' },
});

