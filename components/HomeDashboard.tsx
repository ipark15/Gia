import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  HEADER_ACTION_STRIP_WIDTH,
  HEADER_BUTTON_GAP,
  HEADER_ICON_COLOR,
  HEADER_PADDING_HORIZONTAL,
} from "../constants/HeaderStyles";
import {
  BODY_SIZE,
  BODY_SMALL_SIZE,
  BUTTON_TEXT_SIZE,
  BUTTON_TEXT_WEIGHT,
  CARD_TITLE_SIZE,
  CARD_TITLE_WEIGHT,
  LABEL_SIZE,
  LABEL_SMALL_SIZE,
  STAT_VALUE_WEIGHT,
  SUBTITLE_SIZE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TITLE_LARGE_SIZE,
  TITLE_LARGE_WEIGHT,
} from "../constants/Typography";
import { getLocalDateString } from "../lib/dateUtils";
import { EmergencyHelp } from "./EmergencyHelp";

export type CheckInData = {
  type: "morning" | "evening";
  date: string;
  mood: number;
  skinFeeling: number;
  notes?: string;
  symptomsToday: string[];
  contextTags: string[];
  sleepHours?: number;
  stressLevel?: number;
  onPeriod?: boolean;
  /** Optional photo attached to check-in (base64 jpeg from ImagePicker). */
  photoBase64?: string;
};

type ReminderType =
  | "streak"
  | "routine"
  | "affirmation"
  | "appointment"
  | "seasonal";

type ActiveReminder = {
  type: ReminderType;
  message: string;
  daysUntilAppointment?: number | null;
  streakCount?: number;
  seasonName?: string;
};

interface HomeDashboardProps {
  onStartRoutine: () => void;
  onActivateGreenhouse: () => void;
  onFreshStart: () => void;
  onCustomizeRoutine: () => void;
  onOpenGarden?: () => void;
  onOpenSettings?: () => void;
  onCheckInComplete?: (data: CheckInData) => Promise<void>;
  userCondition: string;
  currentStreak: number;
  weekCount: number;
  /** Total flowers planted (one per routine completion, all time). */
  flowersPlanted?: number;
  morningRoutinesDone: number;
  eveningRoutinesDone: number;
  morningRoutineCompleted: boolean;
  eveningRoutineCompleted: boolean;
  onMorningRoutineComplete: () => void;
  onEveningRoutineComplete: () => void;
  showRoutineCelebration?: boolean;
  onRoutineCelebrationDismiss?: () => void;
  nextAppointment?: string;
  /** Whether the user has already completed their check-in today (from DB). */
  checkInCompletedToday?: boolean;
}

type ReminderToastProps = {
  reminder: ActiveReminder;
  onDismiss: () => void;
};

function ReminderToast({ reminder, onDismiss }: ReminderToastProps) {
  return (
    <View style={styles.reminderToastContainer}>
      <View style={styles.reminderToast}>
        <View style={styles.reminderTextWrapper}>
          <Text style={styles.reminderTitle}>
            {reminder.type === "appointment" && "Dermatologist visit coming up"}
            {reminder.type === "streak" && "Streak reminder"}
            {reminder.type === "routine" && "Routine reminder"}
            {reminder.type === "affirmation" && "You are doing great"}
            {reminder.type === "seasonal" &&
              (reminder.seasonName ?? "Seasonal reminder")}
          </Text>
          <Text style={styles.reminderMessage}>{reminder.message}</Text>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.reminderClose}
          hitSlop={12}
        >
          <Ionicons name="close" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

type FaceVariant = "1" | "2" | "3" | "4" | "5";

function MoodFace({
  variant,
  active,
}: {
  variant: FaceVariant;
  active: boolean;
}) {
  const labelMap: Record<FaceVariant, string> = {
    "1": "😣",
    "2": "🙁",
    "3": "😐",
    "4": "🙂",
    "5": "😊",
  };
  return (
    <View
      style={[
        styles.moodFaceCircle,
        active ? styles.moodFaceCircleActive : styles.moodFaceCircleInactive,
      ]}
    >
      <Text style={styles.moodFaceEmoji}>{labelMap[variant]}</Text>
    </View>
  );
}

type RoutineType = "morning" | "evening";

export function HomeDashboard({
  onStartRoutine,
  onActivateGreenhouse,
  onFreshStart,
  onCustomizeRoutine,
  onOpenGarden,
  onOpenSettings,
  onCheckInComplete,
  userCondition,
  currentStreak,
  weekCount,
  flowersPlanted = 0,
  morningRoutinesDone,
  eveningRoutinesDone,
  morningRoutineCompleted,
  eveningRoutineCompleted,
  onMorningRoutineComplete,
  onEveningRoutineComplete,
  showRoutineCelebration = false,
  onRoutineCelebrationDismiss,
  nextAppointment,
  checkInCompletedToday = false,
}: HomeDashboardProps) {
  const [checkInExpanded, setCheckInExpanded] = useState(false);
  const [askExpanded, setAskExpanded] = useState(false);
  const [askQuestion, setAskQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { question: string; answer: string }[]
  >([]);

  const [showHelpModal, setShowHelpModal] = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);

  const [hasFlare, setHasFlare] = useState<boolean | null>(null);
  const [selectedFlareTags, setSelectedFlareTags] = useState<string[]>([]);
  const [moodSelection, setMoodSelection] = useState<FaceVariant | null>(null);
  const [contextTags, setContextTags] = useState<string[]>([]);
  const [optionalFieldsExpanded, setOptionalFieldsExpanded] = useState(false);
  const [checkInNote, setCheckInNote] = useState("");
  // Local optimistic flag (set immediately after user submits the form).
  // OR'd with checkInCompletedToday so the card shows "complete" on reload/cross-device.
  const [checkInCompletedLocal, setCheckInCompletedLocal] = useState(false);
  const checkInCompleted = checkInCompletedLocal || checkInCompletedToday;
  const [checkInPhotoUrl, setCheckInPhotoUrl] = useState<string | null>(null);
  const [checkInPhotoBase64, setCheckInPhotoBase64] = useState<string | null>(
    null,
  );

  const [wearablesExpanded, setWearablesExpanded] = useState(false);
  const [wearablesConnected, setWearablesConnected] = useState(false);
  const [sleepHours, setSleepHours] = useState<string>("");
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [onPeriod, setOnPeriod] = useState(false);

  const [dismissedReminders, setDismissedReminders] = useState<ReminderType[]>(
    [],
  );
  const [lastShownReminders, setLastShownReminders] = useState<
    Record<ReminderType, number>
  >({} as Record<ReminderType, number>);

  const timeOfDay = new Date().getHours();
  const isEvening = timeOfDay >= 18 || timeOfDay < 6;
  const isMorning = timeOfDay >= 6 && timeOfDay < 12;

  const currentRoutineType: RoutineType = isEvening ? "evening" : "morning";
  const isCurrentRoutineCompleted =
    currentRoutineType === "evening"
      ? eveningRoutineCompleted
      : morningRoutineCompleted;

  const daysUntilAppointment = useMemo(() => {
    if (!nextAppointment) return null;
    const today = new Date();
    const apptDate = new Date(nextAppointment);
    const diffTime = apptDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [nextAppointment]);

  const canShowReminder = (type: ReminderType, minHours: number): boolean => {
    const lastShown = lastShownReminders[type];
    if (!lastShown) return true;
    const now = Date.now();
    const hoursPassed = (now - lastShown) / (1000 * 60 * 60);
    return hoursPassed >= minHours;
  };

  const markReminderShown = (type: ReminderType) => {
    setLastShownReminders((prev) => ({
      ...prev,
      [type]: Date.now(),
    }));
  };

  const getCurrentSeason = (): { name: string; tip: string } | null => {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();

    if (
      (month === 11 && day >= 21) ||
      month === 0 ||
      month === 1 ||
      (month === 2 && day < 20)
    ) {
      return {
        name: "Winter",
        tip: "Focus on hydration + barrier care. Use gentler cleansers. Protect from cold + indoor dryness. Keep using SPF",
      };
    }
    if (
      (month === 2 && day >= 20) ||
      month === 3 ||
      month === 4 ||
      (month === 5 && day <= 20)
    ) {
      return {
        name: "Spring",
        tip: "Soothe sensitivity from weather shifts. Simplify if skin feels reactive. Transition textures gradually",
      };
    }
    if (
      (month === 5 && day >= 21) ||
      month === 6 ||
      month === 7 ||
      (month === 8 && day <= 22)
    ) {
      return {
        name: "Summer",
        tip: "Protect daily (SPF + reapply). Use lighter textures if needed. Cleanse gently after sweat. Stay hydrated",
      };
    }
    return {
      name: "Fall",
      tip: "Adjust slowly as weather cools. Support your skin barrier. Reintroduce stronger products gradually",
    };
  };

  const isSeasonStart = (): boolean => {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();

    const seasonStarts = [
      { month: 2, day: 20 },
      { month: 5, day: 21 },
      { month: 8, day: 23 },
      { month: 11, day: 21 },
    ];

    for (const start of seasonStarts) {
      if (month === start.month && day >= start.day && day <= start.day + 7) {
        return true;
      }
    }
    return false;
  };

  const activeReminder: ActiveReminder | null = useMemo(() => {
    if (
      daysUntilAppointment !== null &&
      daysUntilAppointment >= 0 &&
      daysUntilAppointment <= 3 &&
      !dismissedReminders.includes("appointment") &&
      canShowReminder("appointment", 24)
    ) {
      markReminderShown("appointment");
      return {
        type: "appointment",
        message:
          "Your dermatologist appointment is coming up. Prepare any questions or photos you want to discuss",
        daysUntilAppointment,
      };
    }

    if (
      currentStreak > 0 &&
      !morningRoutineCompleted &&
      !eveningRoutineCompleted &&
      !dismissedReminders.includes("streak") &&
      isMorning &&
      canShowReminder("streak", 24)
    ) {
      markReminderShown("streak");
      const messages = [
        `You're on a ${currentStreak}-day streak! Keep it going by completing your routine today`,
        `${currentStreak} days strong! Your skin is thanking you. Don't break the streak now`,
        `${currentStreak} days of consistency! That's real progress. Let's make it ${currentStreak + 1}`,
      ];
      return {
        type: "streak",
        message: messages[currentStreak % messages.length],
        streakCount: currentStreak,
      };
    }

    if (
      !isCurrentRoutineCompleted &&
      !dismissedReminders.includes("routine") &&
      canShowReminder("routine", 8)
    ) {
      markReminderShown("routine");
      const routineMessages = {
        morning: [
          "Morning! Starting your day with your routine sets the tone for healthy skin",
          "Rise and shine! Your skin is ready for some love this morning",
          "A few minutes now = happy skin all day. Ready for your morning routine?",
        ],
        evening: [
          "Evening routine time! Your skin repairs itself at night—give it what it needs",
          "Winding down? Perfect time to wind down with your evening routine",
          "Before bed, show your skin some love. Your evening routine is waiting",
        ],
      } as const;
      const messages = routineMessages[currentRoutineType];
      const randomIndex =
        Math.floor(Date.now() / (1000 * 60 * 60)) % messages.length;
      return {
        type: "routine",
        message: messages[randomIndex],
      };
    }

    if (
      (morningRoutineCompleted || eveningRoutineCompleted) &&
      !dismissedReminders.includes("affirmation") &&
      canShowReminder("affirmation", 12)
    ) {
      markReminderShown("affirmation");
      const affirmations = [
        "Healing takes time, and you're showing up for it every single day. That's powerful",
        "Your skin is adapting and getting stronger. Trust the process—you're doing great",
        "Consistency beats perfection. You're building habits that will transform your skin over time",
        "Small daily efforts compound into big results. Your future skin is thanking you today",
        "You're not just treating symptoms—you're learning your skin and becoming your own expert",
        "Progress isn't always visible day-to-day, but it's happening. Keep going, you've got this",
      ];
      const index =
        Math.floor((morningRoutinesDone + eveningRoutinesDone) / 2) %
        affirmations.length;
      return {
        type: "affirmation",
        message: affirmations[index],
      };
    }

    if (
      isSeasonStart() &&
      !dismissedReminders.includes("seasonal") &&
      canShowReminder("seasonal", 24)
    ) {
      const seasonInfo = getCurrentSeason();
      if (seasonInfo) {
        markReminderShown("seasonal");
        return {
          type: "seasonal",
          message: seasonInfo.tip,
          seasonName: seasonInfo.name,
        };
      }
    }

    return null;
  }, [
    daysUntilAppointment,
    dismissedReminders,
    currentStreak,
    morningRoutineCompleted,
    eveningRoutineCompleted,
    isMorning,
    isCurrentRoutineCompleted,
    morningRoutinesDone,
    eveningRoutinesDone,
    currentRoutineType,
    lastShownReminders,
  ]);

  const handleDismissReminder = (type: ReminderType) => {
    setDismissedReminders((prev) => [...prev, type]);
  };

  const toggleFlareTag = (tag: string) => {
    setSelectedFlareTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const toggleContextTag = (tag: string) => {
    setContextTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleAskQuestion = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    const answer = generateAnswer(trimmed);
    setChatMessages([{ question: trimmed, answer }]);
    setAskQuestion("");
  };

  const handleCommonQuestion = (q: string) => {
    handleAskQuestion(q);
  };

  const handleCompleteRoutine = () => {
    const nowHour = new Date().getHours();
    const currentlyEvening = nowHour >= 18 || nowHour < 6;
    if (currentlyEvening && !eveningRoutineCompleted) {
      onEveningRoutineComplete();
      setShowConfetti(true);
    } else if (!currentlyEvening && !morningRoutineCompleted) {
      onMorningRoutineComplete();
      setShowConfetti(true);
    }
  };

  const getGreeting = () => {
    if (isMorning) return "Good morning";
    if (isEvening) return "Good evening";
    return "Welcome back";
  };

  const getNextRoutineInfo = () => {
    if (morningRoutineCompleted && !eveningRoutineCompleted) {
      return {
        message: "Next up: evening routine",
        time: "6:00 PM",
      };
    }
    if (eveningRoutineCompleted && !morningRoutineCompleted) {
      return {
        message: "Next up: morning routine",
        time: "",
      };
    }
    if (morningRoutineCompleted && eveningRoutineCompleted) {
      return {
        message: "Both routines completed!",
        time: "✨",
      };
    }
    return null;
  };

  const nextRoutineInfo = getNextRoutineInfo();

  const handleSaveCheckIn = async () => {
    if (!onCheckInComplete) {
      setCheckInCompletedLocal(true);
      setCheckInExpanded(false);
      return;
    }
    try {
      const skinFeelingNumber = moodSelection ? parseInt(moodSelection, 10) : 3;
      const checkInData: CheckInData = {
        type: currentRoutineType,
        date: getLocalDateString(),
        mood: skinFeelingNumber,
        skinFeeling: skinFeelingNumber,
        notes: checkInNote || undefined,
        symptomsToday: hasFlare ? selectedFlareTags : ["None"],
        contextTags,
        sleepHours: sleepHours ? Number(sleepHours) : undefined,
        stressLevel: stressLevel ?? undefined,
        onPeriod: onPeriod || undefined,
        photoBase64: checkInPhotoBase64 || undefined,
      };
      await onCheckInComplete(checkInData);
      setCheckInCompletedLocal(true);
      setCheckInExpanded(false);
    } catch (e) {
      // Supabase errors aren't always instances of Error in RN.
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e != null && "message" in e
            ? String((e as any).message)
            : "Could not save your check-in";
      // eslint-disable-next-line no-console
      console.error("check-in save failed", e);
      Alert.alert("Check-in failed", msg);
    }
  };

  return (
    <View style={styles.root}>
      {showHelpModal && (
        <EmergencyHelp onClose={() => setShowHelpModal(false)} />
      )}
      {activeReminder && (
        <ReminderToast
          reminder={activeReminder}
          onDismiss={() => handleDismissReminder(activeReminder.type)}
        />
      )}

      {(showConfetti || showRoutineCelebration) && (
        <View style={styles.confettiOverlay} pointerEvents="box-none">
          <View style={styles.confettiInner}>
            <Image
              source={require("../assets/images/lotus.png")}
              style={styles.confettiLotusIcon}
              resizeMode="contain"
            />
            <Text style={styles.confettiTitle}>You did it!</Text>
            <Text style={styles.confettiSubtitle}>
              A new flower has bloomed in your garden
            </Text>
            <TouchableOpacity
              style={styles.confettiButton}
              onPress={() => {
                setShowConfetti(false);
                onRoutineCelebrationDismiss?.();
              }}
            >
              <Text style={styles.confettiButtonText}>close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.greetingSub}>Ready for your routine today</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowHelpModal(true)}
              activeOpacity={0.9}
              accessibilityLabel="Emergency & medical help"
            >
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={HEADER_ICON_COLOR}
              />
            </TouchableOpacity>
            {onOpenSettings && (
              <TouchableOpacity
                onPress={onOpenSettings}
                style={styles.iconButton}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={HEADER_ICON_COLOR}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.inner}>
          {nextRoutineInfo && (
            <View style={styles.completionBanner}>
              <View style={styles.completionBannerLeft}>
                <Text style={styles.completionBannerTitle}>
                  {morningRoutineCompleted && eveningRoutineCompleted
                    ? "Both routines complete"
                    : morningRoutineCompleted
                      ? "Morning routine complete"
                      : "Evening routine complete"}
                </Text>
                <Text style={styles.completionBannerSubtitle}>
                  {nextRoutineInfo.message.toLowerCase()}
                  {nextRoutineInfo.time === "✨" && " - check your garden"}
                </Text>
              </View>
              <Text style={styles.completionBannerIcon}>
                {morningRoutineCompleted && eveningRoutineCompleted
                  ? "✨"
                  : "○"}
              </Text>
            </View>
          )}

          {!isCurrentRoutineCompleted && (
            <View style={styles.primaryCtaWrapper}>
              <TouchableOpacity
                onPress={onStartRoutine}
                style={styles.primaryCta}
                activeOpacity={0.95}
              >
                <View style={styles.primaryCtaContent}>
                  <View style={styles.primaryCtaIconCircle}>
                    <Ionicons
                      name="sparkles-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <View>
                    <Text style={styles.primaryCtaTitle}>
                      Start {currentRoutineType} routine
                    </Text>
                    <Text style={styles.primaryCtaSubtitle}>
                      Let's grow your garden today
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.checkInCard}>
            <TouchableOpacity
              onPress={() => setCheckInExpanded((v) => !v)}
              style={styles.checkInHeader}
              activeOpacity={0.8}
            >
              <View style={styles.checkInHeaderLeft}>
                <View
                  style={[
                    styles.checkInStatusCircle,
                    checkInCompleted
                      ? styles.checkInStatusCircleComplete
                      : styles.checkInStatusCirclePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.checkInStatusIcon,
                      checkInCompleted && styles.checkInStatusIconComplete,
                    ]}
                  >
                    {checkInCompleted ? "✓" : "○"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.checkInTitle}>
                    {checkInCompleted ? "Check-in complete" : "Quick check-in"}
                  </Text>
                  <Text style={styles.checkInDuration}>20 seconds</Text>
                </View>
              </View>
              <Ionicons
                name={checkInExpanded ? "chevron-down" : "chevron-forward"}
                size={18}
                color="#6B8B7D"
              />
            </TouchableOpacity>

            {checkInExpanded && (
              <View style={styles.checkInBody}>
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Any flare today?</Text>
                  <View style={styles.rowGap}>
                    <TouchableOpacity
                      style={[
                        styles.flareToggle,
                        hasFlare === false && styles.flareToggleActive,
                      ]}
                      onPress={() => {
                        setHasFlare(false);
                        setSelectedFlareTags([]);
                      }}
                    >
                      <Text
                        style={[
                          styles.flareToggleText,
                          hasFlare === false && styles.flareToggleTextActive,
                        ]}
                      >
                        no
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.flareToggle,
                        hasFlare === true && styles.flareToggleActive,
                      ]}
                      onPress={() => setHasFlare(true)}
                    >
                      <Text
                        style={[
                          styles.flareToggleText,
                          hasFlare === true && styles.flareToggleTextActive,
                        ]}
                      >
                        yes
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {hasFlare && (
                    <View style={styles.chipRow}>
                      {["itch", "redness", "dryness", "breakout", "pain"].map(
                        (tag) => {
                          const active = selectedFlareTags.includes(tag);
                          return (
                            <TouchableOpacity
                              key={tag}
                              style={[styles.chip, active && styles.chipActive]}
                              onPress={() => toggleFlareTag(tag)}
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  active && styles.chipTextActive,
                                ]}
                              >
                                {tag}
                              </Text>
                            </TouchableOpacity>
                          );
                        },
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>
                    How are you feeling about your skin today?
                  </Text>
                  <View style={styles.moodRow}>
                    {(["1", "2", "3", "4", "5"] as FaceVariant[]).map(
                      (value) => (
                        <View key={value} style={styles.moodItem}>
                          <TouchableOpacity
                            onPress={() => setMoodSelection(value)}
                            activeOpacity={0.9}
                          >
                            <MoodFace
                              variant={value}
                              active={moodSelection === value}
                            />
                          </TouchableOpacity>
                          <Text style={styles.moodLabel}>{value}</Text>
                        </View>
                      ),
                    )}
                  </View>
                  <View style={styles.moodScaleLabels}>
                    <Text style={styles.moodScaleText}>not satisfied</Text>
                    <Text style={styles.moodScaleText}>very satisfied</Text>
                  </View>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>
                    Anything affecting your skin?
                  </Text>
                  <View style={styles.chipRow}>
                    {[
                      "sleep",
                      "stress",
                      "product change",
                      "period",
                      "weather",
                    ].map((tag) => {
                      const active = contextTags.includes(tag);
                      return (
                        <TouchableOpacity
                          key={tag}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => toggleContextTag(tag)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              active && styles.chipTextActive,
                            ]}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.sectionDivider} />
                <TouchableOpacity
                  onPress={() => setWearablesExpanded((v) => !v)}
                  style={styles.wearablesToggle}
                  activeOpacity={0.85}
                >
                  <View style={styles.rowCenter}>
                    <Ionicons name="watch-outline" size={18} color="#5F8575" />
                    <Text style={styles.wearablesToggleText}>
                      Add wearable wellness data
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      wearablesExpanded ? "chevron-down" : "chevron-forward"
                    }
                    size={18}
                    color="#5F8575"
                  />
                </TouchableOpacity>

                {wearablesExpanded && (
                  <View style={styles.wearablesBody}>
                    <Text style={styles.wearablesHint}>
                      Tracking sleep, stress, and cycles helps connect the dots
                    </Text>

                    {!wearablesConnected ? (
                      <View style={styles.wearablesConnectBlock}>
                        <TouchableOpacity
                          onPress={() => setWearablesConnected(true)}
                          style={styles.wearablesConnectButton}
                          activeOpacity={0.9}
                        >
                          <Ionicons
                            name="pulse-outline"
                            size={16}
                            color="#5F8575"
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.wearablesConnectText}>
                            sync with my wearable
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.wearablesOrText}>
                          or just enter manually below ↓
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.wearablesConnected}>
                        <Ionicons name="pulse" size={16} color="#5F8575" />
                        <Text style={styles.wearablesConnectedText}>
                          connected! pulling data automatically
                        </Text>
                      </View>
                    )}

                    <View style={styles.sectionBlock}>
                      <Text style={styles.inputLabel}>
                        How much sleep did you get last night?
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={sleepHours}
                        onChangeText={setSleepHours}
                        placeholder="e.g., 7.5 hours"
                        placeholderTextColor="#8A9088"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.sectionBlock}>
                      <Text style={styles.inputLabel}>
                        How&apos;s your stress level today?
                      </Text>
                      <View style={styles.stressRow}>
                        {[1, 2, 3, 4, 5].map((level) => {
                          const active = stressLevel === level;
                          return (
                            <TouchableOpacity
                              key={level}
                              style={[
                                styles.stressChip,
                                active && styles.stressChipActive,
                              ]}
                              onPress={() => setStressLevel(level)}
                            >
                              <Text
                                style={[
                                  styles.stressChipText,
                                  active && styles.stressChipTextActive,
                                ]}
                              >
                                {level}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={styles.moodScaleLabels}>
                        <Text style={styles.moodScaleText}>chill</Text>
                        <Text style={styles.moodScaleText}>stressed</Text>
                      </View>
                    </View>

                    <View style={styles.sectionBlock}>
                      <TouchableOpacity
                        style={styles.periodRow}
                        onPress={() => setOnPeriod((v) => !v)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={onPeriod ? "checkbox" : "square-outline"}
                          size={20}
                          color="#5F8575"
                        />
                        <Text style={styles.periodLabel}>
                          On my period today
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setOptionalFieldsExpanded((v) => !v)}
                  style={styles.optionalToggle}
                  activeOpacity={0.85}
                >
                  <Text style={styles.optionalToggleText}>Add a note</Text>
                  <Ionicons
                    name={
                      optionalFieldsExpanded ? "chevron-up" : "chevron-down"
                    }
                    size={18}
                    color="#2D4A3E"
                  />
                </TouchableOpacity>

                {optionalFieldsExpanded && (
                  <View style={styles.optionalBody}>
                    <TextInput
                      style={styles.noteInput}
                      value={checkInNote}
                      onChangeText={setCheckInNote}
                      placeholder="add any additional notes..."
                      placeholderTextColor="#8A9088"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                )}

                <View style={styles.sectionDivider} />
                <Text style={styles.photoLabel}>
                  Add a check-in photo (optional)
                </Text>
                {checkInPhotoUrl ? (
                  <View style={styles.photoPreviewWrapper}>
                    <Image
                      source={{ uri: checkInPhotoUrl }}
                      style={styles.photoPreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.photoRemove}
                      onPress={() => {
                        setCheckInPhotoUrl(null);
                        setCheckInPhotoBase64(null);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="close" size={18} color="#6B8B7D" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.photoPicker}
                    onPress={() => {
                      (async () => {
                        const permission =
                          await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (!permission.granted) return;
                        const result =
                          await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.8,
                            base64: true,
                          });
                        if (result.canceled || !result.assets[0]) return;
                        const b64 = result.assets[0].base64;
                        if (!b64) return;
                        setCheckInPhotoBase64(b64);
                        setCheckInPhotoUrl(`data:image/jpeg;base64,${b64}`);
                      })();
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-outline" size={32} color="#5F8575" />
                    <Text style={styles.photoPickerTitle}>
                      Click to add photo
                    </Text>
                    <Text style={styles.photoPickerSubtitle}>
                      Track your progress visually
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.saveCheckInButton}
                  onPress={handleSaveCheckIn}
                  activeOpacity={0.9}
                >
                  <Text style={styles.saveCheckInText}>save check-in</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.askGiaCard}>
            <TouchableOpacity
              onPress={() => {
                const expanded = !askExpanded;
                setAskExpanded(expanded);
                if (!expanded) {
                  setAskQuestion("");
                  setChatMessages([]);
                }
              }}
              style={styles.askGiaHeader}
              activeOpacity={0.9}
            >
              <View style={styles.askGiaHeaderInner}>
                <View style={styles.askGiaIcon}>
                  <Ionicons
                    name="help-circle-outline"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.askGiaTextBlock}>
                  <Text style={styles.askGiaTitle}>Ask Gia</Text>
                  <Text style={styles.askGiaSubtitle}>Have any doubts?</Text>
                </View>
                <Ionicons
                  name={askExpanded ? "chevron-down" : "chevron-forward"}
                  size={20}
                  color="#FFFFFF"
                  style={styles.askGiaChevron}
                />
              </View>
            </TouchableOpacity>

            {askExpanded && (
              <View style={styles.askGiaBody}>
                <Text style={styles.askGiaCommonLabel}>common questions</Text>
                <TouchableOpacity
                  style={styles.askGiaChip}
                  onPress={() =>
                    handleCommonQuestion("is this irritation normal?")
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.askGiaChipText}>
                    is this irritation normal?
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.askGiaChip}
                  onPress={() => handleCommonQuestion("what helps redness?")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.askGiaChipText}>what helps redness?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.askGiaChip}
                  onPress={() =>
                    handleCommonQuestion("when should i stop a product?")
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.askGiaChipText}>
                    when should i stop a product?
                  </Text>
                </TouchableOpacity>

                <View style={styles.askGiaInputBlock}>
                  <TextInput
                    style={styles.askGiaInput}
                    value={askQuestion}
                    onChangeText={setAskQuestion}
                    placeholder="or ask your own question..."
                    placeholderTextColor="#8A9088"
                    onSubmitEditing={() => handleAskQuestion(askQuestion)}
                    returnKeyType="send"
                  />
                  <TouchableOpacity
                    style={styles.askGiaButton}
                    onPress={() => handleAskQuestion(askQuestion)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.askGiaButtonText}>Ask Gia</Text>
                  </TouchableOpacity>
                  <Text style={styles.askGiaFootnote}>
                    *American Academy of Dermatology sourced answers
                  </Text>
                </View>

                {chatMessages.length > 0 && (
                  <View style={styles.askGiaAnswerBlock}>
                    <Text style={styles.askGiaAnswerLabel}>Answers:</Text>
                    {chatMessages.map((msg, idx) => (
                      <View key={idx} style={styles.askGiaAnswerBubble}>
                        <Text style={styles.askGiaAnswerQuestion}>
                          Q: {msg.question}
                        </Text>
                        <Text style={styles.askGiaAnswerText}>
                          A: {msg.answer}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.gardenCard}>
            <View style={styles.gardenHeader}>
              <View>
                <Text style={styles.gardenTitle}>Your garden</Text>
                <Text style={styles.gardenSubtitle}>
                  {morningRoutinesDone + eveningRoutinesDone} routines completed
                  this week
                </Text>
              </View>
            </View>

            <View style={styles.gardenPond}>
              {flowersPlanted === 0 ? (
                <View style={styles.gardenEmpty}>
                  <Text style={styles.gardenEmptyText}>
                    Complete your first routine to plant a Victoria regia 🪷
                  </Text>
                </View>
              ) : (
                <View style={styles.gardenFlowerGrid}>
                  {Array.from({
                    length: Math.min(flowersPlanted, 24),
                  }).map((_, i) => (
                    <View key={i} style={styles.gardenFlowerItem}>
                      <Image
                        source={require("../assets/images/lotus.png")}
                        style={styles.gardenFlowerIcon}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.gardenStatsRow}>
              <View style={styles.gardenStatCard}>
                <View style={styles.gardenStatIconCirclePink}>
                  <Image
                    source={require("../assets/images/lotus.png")}
                    style={styles.gardenStatLotusIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.gardenStatValue}>{flowersPlanted}</Text>
                <Text style={styles.gardenStatLabel}>{"flowers\nbloomed"}</Text>
              </View>
              <View style={styles.gardenStatCard}>
                <View style={styles.gardenStatIconCircleFlame}>
                  <Ionicons name="flame" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.gardenStatValue}>{currentStreak}</Text>
                <Text style={styles.gardenStatLabel}>{"day\nstreak"}</Text>
              </View>
              <View style={styles.gardenStatCard}>
                <View style={styles.gardenStatIconCircleCalendar}>
                  <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.gardenStatValue}>{weekCount}</Text>
                <Text style={styles.gardenStatLabel}>{"weeks\nactive"}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function generateAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("irritation") || q.includes("normal")) {
    return "Some irritation can be normal when starting new products, especially actives. If it persists beyond 2 weeks, becomes painful, or worsens, consider pausing the product and consulting your dermatologist.";
  }
  if (q.includes("redness") || q.includes("red")) {
    return "Redness can be managed with gentle, fragrance-free products. Look for ingredients like centella asiatica, niacinamide, or azelaic acid. Avoid hot water and harsh exfoliants.";
  }
  if (q.includes("stop") || q.includes("discontinue")) {
    return "Stop a product if you experience severe burning, blistering, significant swelling, or an allergic reaction. Mild tingling from actives like retinol is normal, but pain is not.";
  }
  if (q.includes("retinol") || q.includes("tretinoin")) {
    return "Start retinoids slowly — 2-3 times per week, gradually increasing. Use a pea-sized amount for whole face. Buffer with moisturizer if needed.";
  }
  if (q.includes("purge") || q.includes("purging")) {
    return "Purging typically happens with actives like retinoids or acids. It should only occur in areas where you normally break out and resolve within 4-6 weeks.";
  }
  return "That's a great question. Based on AAD guidelines, I'd recommend discussing this with your dermatologist for personalized advice. In the meantime, stick to gentle, fragrance-free products.";
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#E8F0DC",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
    paddingTop: 24,
    paddingBottom: 40,
  },
  inner: {
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 56,
    marginBottom: 24,
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: 8,
    justifyContent: "center",
  },
  greeting: {
    fontSize: TITLE_LARGE_SIZE,
    color: TEXT_PRIMARY,
    fontWeight: TITLE_LARGE_WEIGHT,
    marginBottom: 4,
    textAlign: "left",
  },
  greetingSub: {
    fontSize: SUBTITLE_SIZE,
    color: TEXT_SECONDARY,
    textAlign: "left",
  },
  headerActions: {
    width: HEADER_ACTION_STRIP_WIDTH,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: HEADER_BUTTON_GAP,
  },
  iconButton: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  completionBanner: {
    backgroundColor: "#5F8575",
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  completionBannerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  completionBannerTitle: {
    color: "#FFFFFF",
    fontSize: CARD_TITLE_SIZE,
    fontWeight: CARD_TITLE_WEIGHT,
    marginBottom: 4,
  },
  completionBannerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: BODY_SMALL_SIZE,
  },
  completionBannerIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  primaryCtaWrapper: {
    marginBottom: 16,
  },
  primaryCta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E879B9",
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryCtaContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryCtaIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  primaryCtaTitle: {
    color: "#FFFFFF",
    fontSize: BUTTON_TEXT_SIZE,
    fontWeight: BUTTON_TEXT_WEIGHT,
  },
  primaryCtaSubtitle: {
    color: "rgba(255,255,255,0.95)",
    fontSize: LABEL_SIZE,
  },
  checkInCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(123,155,140,0.3)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  checkInHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  checkInHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkInStatusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  checkInStatusCircleComplete: {
    backgroundColor: "#6B9B6E",
  },
  checkInStatusCirclePending: {
    backgroundColor: "#F4C8DE",
  },
  checkInStatusIcon: {
    fontSize: 20,
    color: "#2D4A3E",
  },
  checkInStatusIconComplete: {
    color: "#FFFFFF",
  },
  checkInTitle: {
    fontSize: CARD_TITLE_SIZE,
    color: TEXT_PRIMARY,
    fontWeight: CARD_TITLE_WEIGHT,
  },
  checkInDuration: {
    fontSize: BODY_SMALL_SIZE,
    color: TEXT_SECONDARY,
  },
  checkInBody: {
    borderTopWidth: 1,
    borderTopColor: "rgba(95,133,117,0.15)",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: CARD_TITLE_SIZE,
    color: TEXT_PRIMARY,
    fontWeight: CARD_TITLE_WEIGHT,
    marginBottom: 8,
  },
  rowGap: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  flareToggle: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(95,133,117,0.3)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    marginRight: 8,
  },
  flareToggleActive: {
    backgroundColor: "#5F8575",
    borderColor: "#5F8575",
  },
  flareToggleText: {
    fontSize: 15,
    color: "#6B8B7D",
    fontWeight: "600",
  },
  flareToggleTextActive: {
    color: "#FFFFFF",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: "#5F8575",
  },
  chipText: {
    color: "#6B8B7D",
    fontWeight: "600",
    fontSize: 13,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  moodItem: {
    alignItems: "center",
    flex: 1,
  },
  moodFaceCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  moodFaceCircleActive: {
    backgroundColor: "#F49EC4",
  },
  moodFaceCircleInactive: {
    backgroundColor: "#F4C8DE",
    opacity: 0.4,
  },
  moodFaceEmoji: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  moodLabel: {
    fontSize: 11,
    color: "#6B8B7D",
    marginTop: 4,
  },
  moodScaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  moodScaleText: {
    fontSize: 11,
    color: "#6B8B7D",
    fontStyle: "italic",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(95,133,117,0.12)",
    marginVertical: 12,
  },
  wearablesToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  wearablesToggleText: {
    fontSize: 14,
    color: "#2D4A3E",
    fontStyle: "italic",
    marginLeft: 6,
  },
  wearablesBody: {
    marginTop: 8,
  },
  wearablesHint: {
    fontSize: 13,
    color: "#6B8B7D",
    fontStyle: "italic",
    marginBottom: 10,
  },
  wearablesConnectBlock: {
    marginBottom: 10,
  },
  wearablesConnectButton: {
    borderWidth: 2,
    borderColor: "rgba(95,133,117,0.3)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  wearablesConnectText: {
    fontSize: 13,
    color: "#5F8575",
  },
  wearablesOrText: {
    textAlign: "center",
    fontSize: 11,
    color: "#6B8B7D",
    marginTop: 4,
    fontStyle: "italic",
  },
  wearablesConnected: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  wearablesConnectedText: {
    fontSize: 13,
    color: "#5F8575",
    marginLeft: 6,
  },
  inputLabel: {
    fontSize: 13,
    color: "#6B8B7D",
    marginBottom: 6,
    fontStyle: "italic",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "rgba(95,133,117,0.3)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2D4A3E",
    backgroundColor: "#FFFFFF",
  },
  stressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  stressChip: {
    flex: 1,
    marginHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#E8F5E9",
    paddingVertical: 6,
    alignItems: "center",
  },
  stressChipActive: {
    backgroundColor: "#5F8575",
  },
  stressChipText: {
    fontSize: 13,
    color: "#6B8B7D",
  },
  stressChipTextActive: {
    color: "#FFFFFF",
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  periodLabel: {
    marginLeft: 8,
    fontSize: 13,
    color: "#6B8B7D",
    fontStyle: "italic",
  },
  optionalToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5E6F0",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  optionalToggleText: {
    fontSize: 14,
    color: "#2D4A3E",
    fontStyle: "italic",
  },
  optionalBody: {
    marginTop: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "rgba(95,133,117,0.3)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 80,
    fontSize: 14,
    color: "#2D4A3E",
    backgroundColor: "#FFFFFF",
    textAlignVertical: "top",
  },
  photoLabel: {
    fontSize: 13,
    color: "#6B8B7D",
    fontStyle: "italic",
    marginBottom: 8,
  },
  photoPicker: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(149,201,142,0.6)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: "#E8F0DC",
    marginBottom: 12,
  },
  photoPickerTitle: {
    fontSize: 14,
    color: "#2D4A3E",
    marginTop: 4,
    fontStyle: "italic",
  },
  photoPickerSubtitle: {
    fontSize: 11,
    color: "#6B8B7D",
    marginTop: 2,
    fontStyle: "italic",
  },
  photoPreviewWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  photoPreview: {
    width: "100%",
    height: 180,
  },
  photoRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  saveCheckInButton: {
    backgroundColor: "#5F8575",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  saveCheckInText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontStyle: "italic",
    fontWeight: "600",
  },
  askGiaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(95,133,117,0.15)",
    overflow: "hidden",
  },
  askGiaHeader: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: "#7B9B8C",
  },
  askGiaHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  askGiaIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  askGiaTextBlock: {
    flex: 1,
  },
  askGiaTitle: {
    color: "#FFFFFF",
    fontSize: CARD_TITLE_SIZE,
    fontWeight: CARD_TITLE_WEIGHT,
  },
  askGiaSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: LABEL_SIZE,
  },
  askGiaChevron: {
    marginLeft: 8,
  },
  askGiaBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  askGiaCommonLabel: {
    fontSize: LABEL_SMALL_SIZE,
    color: TEXT_SECONDARY,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  askGiaChip: {
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  askGiaChipText: {
    fontSize: BODY_SIZE,
    color: TEXT_PRIMARY,
  },
  askGiaInputBlock: {
    marginTop: 8,
  },
  askGiaInput: {
    borderWidth: 1,
    borderColor: "rgba(95,133,117,0.3)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2D4A3E",
    backgroundColor: "#FFFFFF",
  },
  askGiaButton: {
    marginTop: 8,
    backgroundColor: "#5F8575",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  askGiaButtonText: {
    color: "#FFFFFF",
    fontSize: BUTTON_TEXT_SIZE,
    fontWeight: BUTTON_TEXT_WEIGHT,
  },
  askGiaFootnote: {
    marginTop: 4,
    fontSize: LABEL_SMALL_SIZE,
    color: TEXT_SECONDARY,
  },
  askGiaAnswerBlock: {
    marginTop: 10,
  },
  askGiaAnswerLabel: {
    fontSize: BODY_SMALL_SIZE,
    color: TEXT_SECONDARY,
    marginBottom: 4,
  },
  askGiaAnswerBubble: {
    backgroundColor: "#F5F1ED",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  askGiaAnswerQuestion: {
    fontSize: BODY_SMALL_SIZE,
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  askGiaAnswerText: {
    fontSize: BODY_SMALL_SIZE,
    color: TEXT_SECONDARY,
  },
  gardenCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 2,
    borderColor: "#D8D5CF",
    marginBottom: 12,
  },
  gardenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  gardenTitle: {
    fontSize: CARD_TITLE_SIZE,
    color: "#7B9B8C",
    fontWeight: CARD_TITLE_WEIGHT,
    marginBottom: 2,
  },
  gardenSubtitle: {
    fontSize: BODY_SMALL_SIZE,
    color: TEXT_SECONDARY,
  },
  gardenPond: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#E7F1ED",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 220,
  },
  gardenEmpty: {
    paddingHorizontal: 20,
  },
  gardenEmptyText: {
    fontSize: BODY_SMALL_SIZE,
    color: TEXT_SECONDARY,
    textAlign: "center",
  },
  gardenFlowerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gardenFlowerItem: {
    width: "20%",
    alignItems: "center",
    marginBottom: 8,
  },
  gardenFlowerIcon: {
    width: 48,
    height: 48,
  },
  gardenStatsRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  gardenStatCard: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: "#FFF7F2",
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0E4DA",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  gardenStatIconCirclePink: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7B9B8C",
    marginBottom: 6,
  },
  gardenStatIconCircleFlame: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F49EC4",
    marginBottom: 6,
  },
  gardenStatIconCircleCalendar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#95C98E",
    marginBottom: 6,
  },
  gardenStatLotusIcon: {
    width: 36,
    height: 36,
  },
  gardenStatValue: {
    fontSize: 20,
    color: TEXT_PRIMARY,
    fontWeight: STAT_VALUE_WEIGHT,
  },
  gardenStatLabel: {
    fontSize: LABEL_SMALL_SIZE,
    color: TEXT_SECONDARY,
    fontStyle: "italic",
    textAlign: "center",
  },
  reminderToastContainer: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  reminderToast: {
    backgroundColor: "#5F8575",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  reminderTextWrapper: {
    flex: 1,
    paddingRight: 8,
  },
  reminderTitle: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 2,
  },
  reminderMessage: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },
  reminderClose: {
    padding: 4,
  },
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  confettiInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 22,
    borderWidth: 2,
    borderColor: "#7B9B8C",
    alignItems: "center",
    width: "80%",
    maxWidth: 360,
  },
  confettiLotusIcon: {
    width: 72,
    height: 72,
    marginBottom: 10,
  },
  confettiTitle: {
    fontSize: 20,
    color: "#5A7A6B",
    fontStyle: "italic",
    marginBottom: 6,
  },
  confettiSubtitle: {
    fontSize: 14,
    color: "#6B7370",
    marginBottom: 12,
    textAlign: "center",
  },
  confettiButton: {
    marginTop: 4,
    backgroundColor: "#5F8575",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  confettiButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
