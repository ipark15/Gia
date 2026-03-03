import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ExecutiveSummary } from './ExecutiveSummary';

export interface TimelineEntry {
  id: string;
  date: string;
  routineCompleted: boolean;
  flareTags?: string[];
  mood?: '😌' | '😐' | '😟';
  contextTags?: string[];
  photo?: string;
  note?: string;
}

export interface InsightsProps {
  entries: TimelineEntry[];
  onCustomizeRoutine?: () => void;
  hasDermatologistPlan?: boolean;
  nextDermAppointment?: string;
  onUpdateDermAppointment?: (date: string) => void;
  userCondition?: string;
}

const MOCK_ENTRIES: TimelineEntry[] = [
  {
    id: '1',
    date: '2026-02-09',
    routineCompleted: true,
    mood: '😌',
    contextTags: ['sleep'],
    note: 'Skin felt calm today',
  },
  {
    id: '2',
    date: '2026-02-08',
    routineCompleted: true,
    flareTags: ['redness', 'itch'],
    mood: '😟',
    contextTags: ['stress', 'weather'],
  },
  {
    id: '3',
    date: '2026-02-07',
    routineCompleted: false,
    mood: '😐',
    contextTags: ['sleep'],
    note: 'Missed routine but moisturized',
  },
];

const SYMPTOM_FILTERS = ['itch', 'redness', 'dryness', 'breakout', 'pain'];
const CONTEXT_FILTERS = ['sleep', 'stress', 'product change', 'weather', 'period'];

export function Insights({
  entries = [],
  onCustomizeRoutine,
  hasDermatologistPlan,
  nextDermAppointment = '',
  onUpdateDermAppointment,
  userCondition = 'acne',
}: InsightsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedContext, setSelectedContext] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(nextDermAppointment);
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);

  const displayEntries = entries.length > 0 ? entries : MOCK_ENTRIES;

  const filteredEntries = useMemo(() => {
    return displayEntries.filter((entry) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const entryDate = new Date(entry.date);
        const monthDay = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();
        const monthDayLong = entryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toLowerCase();
        const numericDate = entryDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }).toLowerCase();
        const yearDate = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
        const fullDateWithDay = entryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toLowerCase();
        const noteMatch = entry.note?.toLowerCase().includes(q);
        const flareMatch = entry.flareTags?.some((t) => t.toLowerCase().includes(q));
        const contextMatch = entry.contextTags?.some((t) => t.toLowerCase().includes(q));
        const dateMatch = monthDay.includes(q) || monthDayLong.includes(q) || numericDate.includes(q) || yearDate.includes(q) || fullDateWithDay.includes(q) || entry.date.toLowerCase().includes(q);
        if (!noteMatch && !flareMatch && !contextMatch && !dateMatch) return false;
      }
      if (selectedSymptoms.length > 0) {
        const hasSymptom = selectedSymptoms.some((s) => entry.flareTags?.some((t) => t.toLowerCase() === s.toLowerCase()));
        if (!hasSymptom) return false;
      }
      if (selectedContext.length > 0) {
        const hasCtx = selectedContext.some((c) => entry.contextTags?.some((t) => t.toLowerCase() === c.toLowerCase()));
        if (!hasCtx) return false;
      }
      if (selectedMood && entry.mood !== selectedMood) return false;
      return true;
    });
  }, [displayEntries, searchQuery, selectedSymptoms, selectedContext, selectedMood]);

  const daysUntilAppointment = useMemo(() => {
    if (!appointmentDate) return null;
    const today = new Date();
    const appt = new Date(appointmentDate);
    const diff = Math.ceil((appt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [appointmentDate]);

  const toggleFilter = (filter: string, type: 'symptom' | 'context') => {
    if (type === 'symptom') {
      setSelectedSymptoms((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]));
    } else {
      setSelectedContext((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]));
    }
  };

  const handleSaveAppointment = () => {
    if (onUpdateDermAppointment && appointmentDate) {
      onUpdateDermAppointment(appointmentDate);
      setIsEditingAppointment(false);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSymptoms([]);
    setSelectedContext([]);
    setSelectedMood(null);
  };

  const activeFilterCount = selectedSymptoms.length + selectedContext.length + (selectedMood ? 1 : 0);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Insights</Text>
            <Text style={styles.subtitle}>Your skin history — searchable, reflective, yours</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => { }}>
              <Ionicons name="help-circle-outline" size={24} color="#7B9B8C" />
            </TouchableOpacity>
            {onCustomizeRoutine && (
              <TouchableOpacity style={styles.iconBtn} onPress={onCustomizeRoutine}>
                <Ionicons name="settings-outline" size={24} color="#7B9B8C" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={20} color="#6B7370" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, tags, dates..."
            placeholderTextColor="#8A9088"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Derm appointment */}
        {hasDermatologistPlan && (
          <View style={styles.section}>
            {!isEditingAppointment ? (
              <View style={[styles.apptCard, daysUntilAppointment !== null && daysUntilAppointment <= 7 && daysUntilAppointment >= 0 && styles.apptCardHighlight]}>
                <View style={styles.apptRow}>
                  <Ionicons name="calendar-outline" size={18} color="#5F8575" />
                  <Text style={styles.apptLabel}>
                    next dermatology appt:{' '}
                    {appointmentDate ? (
                      <Text style={styles.apptValue}>
                        {new Date(appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {daysUntilAppointment !== null && daysUntilAppointment >= 0 && daysUntilAppointment <= 7 && (
                          <Text style={styles.apptDays}>
                            {' '}({daysUntilAppointment === 0 ? 'today!' : daysUntilAppointment === 1 ? 'tomorrow' : `${daysUntilAppointment}d`})
                          </Text>
                        )}
                      </Text>
                    ) : (
                      <Text style={styles.apptMuted}>not set</Text>
                    )}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setIsEditingAppointment(true)} style={styles.editBtn}>
                  <Ionicons name="create-outline" size={16} color="#6B7370" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.apptEditCard}>
                <TextInput
                  style={styles.dateInput}
                  value={appointmentDate}
                  onChangeText={setAppointmentDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#8A9088"
                />
                <TouchableOpacity style={[styles.saveApptBtn, !appointmentDate && styles.saveApptBtnDisabled]} onPress={handleSaveAppointment} disabled={!appointmentDate}>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelApptBtn} onPress={() => { setAppointmentDate(nextDermAppointment); setIsEditingAppointment(false); }}>
                  <Ionicons name="close" size={18} color="#6B7370" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Executive summary button */}
        {hasDermatologistPlan && (
          <TouchableOpacity style={styles.execSummaryBtn} onPress={() => setShowExecutiveSummary(true)} activeOpacity={0.85}>
            <View style={styles.execSummaryIcon}>
              <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.execSummaryText}>generate provider summary</Text>
          </TouchableOpacity>
        )}

        {/* Filters toggle */}
        <TouchableOpacity style={styles.filtersToggle} onPress={() => setShowFilters(!showFilters)} activeOpacity={0.85}>
          <View style={styles.filtersToggleLeft}>
            <Ionicons name="filter-outline" size={20} color="#7B9B8C" />
            <Text style={styles.filtersToggleText}>Filters</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </View>
          <Ionicons name={showFilters ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7370" />
        </TouchableOpacity>

        {/* Filters panel */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            <Text style={styles.filterSectionLabel}>Symptoms</Text>
            <View style={styles.tagRow}>
              {SYMPTOM_FILTERS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.filterTag, selectedSymptoms.includes(s) && styles.filterTagActive]}
                  onPress={() => toggleFilter(s, 'symptom')}
                >
                  <Text style={[styles.filterTagText, selectedSymptoms.includes(s) && styles.filterTagTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterSectionLabel}>Context</Text>
            <View style={styles.tagRow}>
              {CONTEXT_FILTERS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.filterTag, selectedContext.includes(c) && styles.filterTagActive]}
                  onPress={() => toggleFilter(c, 'context')}
                >
                  <Text style={[styles.filterTagText, selectedContext.includes(c) && styles.filterTagTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterSectionLabel}>Mood</Text>
            <View style={styles.moodRow}>
              {(['😌', '😐', '😟'] as const).map((mood) => (
                <TouchableOpacity
                  key={mood}
                  style={[styles.moodBtn, selectedMood === mood && styles.moodBtnActive]}
                  onPress={() => setSelectedMood(selectedMood === mood ? null : mood)}
                >
                  <Text style={styles.moodEmoji}>{mood}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={clearAllFilters}>
                <Text style={styles.clearFiltersText}>Clear all filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Pattern insight */}
        <View style={styles.patternBox}>
          <Text style={styles.patternTitle}>Pattern noticed</Text>
          <Text style={styles.patternText}>
            Your skin tends to feel calmer on days when you complete your routine and get good sleep.
          </Text>
        </View>

        {/* Monthly summary toggle */}
        <TouchableOpacity style={styles.summaryToggle} onPress={() => setShowSummary(!showSummary)} activeOpacity={0.85}>
          <Text style={styles.summaryToggleText}>{showSummary ? 'Hide summary' : 'View monthly summary'}</Text>
        </TouchableOpacity>

        {showSummary && (
          <View style={styles.monthlySummary}>
            <Text style={styles.monthlySummaryTitle}>February summary</Text>
            <View style={styles.calendarCard}>
              <Text style={styles.calendarMonth}>February 2026</Text>
              <Text style={styles.calendarHint}>Days you completed your routine</Text>
              <View style={styles.calendarGrid}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <View key={i} style={styles.calendarDayLabel}>
                    <Text style={styles.calendarDayLabelText}>{d}</Text>
                  </View>
                ))}
                {Array.from({ length: 28 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.calendarCell,
                      [1, 2, 3, 5, 6, 8, 10, 12, 13].includes(i + 1) ? styles.calendarCellDone : styles.calendarCellEmpty,
                    ]}
                  >
                    <Text style={styles.calendarCellText}>{i + 1}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendDotDone]} />
                  <Text style={styles.legendText}>Routine completed</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendDotEmpty]} />
                  <Text style={styles.legendText}>No routine</Text>
                </View>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>7</Text>
                <Text style={styles.statLabel}>Routines completed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Flare days logged</Text>
              </View>
            </View>
            <Text style={styles.monthlySummaryFooter}>This month, you showed up more often than not. That matters.</Text>
          </View>
        )}

        {/* Timeline */}
        <Text style={styles.timelineTitle}>Timeline</Text>
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {displayEntries.length === 0 ? 'No entries yet' : 'No entries match your filters'}
            </Text>
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
          <View style={styles.timelineList}>
            {filteredEntries.map((entry) => (
              <View key={entry.id} style={styles.timelineCard}>
                <View style={styles.timelineCardHeader}>
                  <Text style={styles.timelineDate}>
                    {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.timelineRoutine}>
                    {entry.routineCompleted ? '✓ Routine completed' : 'No routine'}
                  </Text>
                </View>
                {entry.mood && <Text style={styles.timelineMood}>{entry.mood}</Text>}
                {entry.flareTags && entry.flareTags.length > 0 && (
                  <View style={styles.tagRow}>
                    {entry.flareTags.map((tag) => (
                      <View key={tag} style={styles.flareTag}>
                        <Text style={styles.flareTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {entry.contextTags && entry.contextTags.length > 0 && (
                  <View style={styles.tagRow}>
                    {entry.contextTags.map((tag) => (
                      <View key={tag} style={styles.contextTag}>
                        <Text style={styles.contextTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {entry.note && (
                  <View style={styles.noteRow}>
                    <Ionicons name="document-text-outline" size={16} color="#7B9B8C" />
                    <Text style={styles.noteText}>{entry.note}</Text>
                  </View>
                )}
                {entry.photo && (
                  <View style={styles.photoRow}>
                    <Ionicons name="camera-outline" size={16} color="#7B9B8C" />
                    <Text style={styles.photoText}>Photo attached</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {showExecutiveSummary && (
        <ExecutiveSummary
          onClose={() => setShowExecutiveSummary(false)}
          condition={userCondition}
          startDate="2026-01-01"
          nextAppointment={appointmentDate || undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1ED' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '600', color: '#7B9B8C', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7370', textAlign: 'center' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },

  searchWrap: { position: 'relative', marginBottom: 20 },
  searchIcon: { position: 'absolute', left: 16, top: 16, zIndex: 1 },
  searchInput: {
    height: 48,
    paddingLeft: 48,
    paddingRight: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#2D4A3E',
  },

  section: { marginBottom: 16 },
  apptCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#D8D5CF', backgroundColor: '#FFFFFF' },
  apptCardHighlight: { backgroundColor: '#E8F5E9', borderColor: '#5F8575' },
  apptRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  apptLabel: { fontSize: 13, color: '#5F8575', fontStyle: 'italic' },
  apptValue: { color: '#3A3A3A', fontStyle: 'italic' },
  apptDays: { fontSize: 12, color: '#5F8575' },
  apptMuted: { color: '#6B7370', fontStyle: 'italic' },
  editBtn: { padding: 6 },
  apptEditCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#5F8575', backgroundColor: '#FFFFFF' },
  dateInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#D8D5CF', fontSize: 14, color: '#2D4A3E' },
  saveApptBtn: { padding: 10, borderRadius: 10, backgroundColor: '#5F8575' },
  saveApptBtnDisabled: { backgroundColor: '#D8D5CF' },
  cancelApptBtn: { padding: 10 },

  execSummaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#5F8575', backgroundColor: '#FFFFFF', marginBottom: 20 },
  execSummaryIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#5F8575', alignItems: 'center', justifyContent: 'center' },
  execSummaryText: { fontSize: 14, color: '#5F8575', fontStyle: 'italic' },

  filtersToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#D8D5CF', backgroundColor: '#FFFFFF', marginBottom: 16 },
  filtersToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filtersToggleText: { color: '#5A7A6B', fontSize: 16, fontWeight: '600' },
  filterBadge: { backgroundColor: '#7B9B8C', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  filterBadgeText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },

  filtersPanel: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#D8D5CF', backgroundColor: '#FFFFFF', marginBottom: 16 },
  filterSectionLabel: { fontSize: 13, color: '#6B7370', marginBottom: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterTag: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#F5F1ED' },
  filterTagActive: { backgroundColor: '#7B9B8C' },
  filterTagText: { fontSize: 14, color: '#6B7370' },
  filterTagTextActive: { color: '#FFFFFF' },
  moodRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  moodBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, backgroundColor: '#F5F1ED' },
  moodBtnActive: { backgroundColor: '#7B9B8C' },
  moodEmoji: { fontSize: 24 },
  clearFiltersText: { fontSize: 14, color: '#7B9B8C', marginTop: 8 },

  patternBox: { padding: 20, borderRadius: 20, backgroundColor: 'rgba(212,227,219,0.3)', borderWidth: 1, borderColor: 'rgba(123,155,140,0.3)', marginBottom: 16 },
  patternTitle: { fontSize: 14, fontWeight: '600', color: '#5A7A6B', marginBottom: 8 },
  patternText: { fontSize: 14, color: '#3A3A3A', lineHeight: 22 },

  summaryToggle: { padding: 16, borderRadius: 20, borderWidth: 2, borderColor: '#7B9B8C', backgroundColor: '#FFFFFF', marginBottom: 16, alignItems: 'center' },
  summaryToggleText: { fontSize: 16, color: '#7B9B8C', fontWeight: '600' },

  monthlySummary: { padding: 24, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#D8D5CF', marginBottom: 24 },
  monthlySummaryTitle: { fontSize: 18, color: '#7B9B8C', fontWeight: '600', marginBottom: 16 },
  calendarCard: { backgroundColor: '#F5F1ED', borderRadius: 18, padding: 16, marginBottom: 16 },
  calendarMonth: { fontSize: 14, color: '#7B9B8C', textAlign: 'center', marginBottom: 4 },
  calendarHint: { fontSize: 12, color: '#6B7370', textAlign: 'center', marginBottom: 12 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  calendarDayLabel: { width: '13%', alignItems: 'center', paddingVertical: 4 },
  calendarDayLabelText: { fontSize: 12, color: '#6B7370', fontWeight: '600' },
  calendarCell: { width: '13%', minHeight: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  calendarCellDone: { backgroundColor: '#7B9B8C' },
  calendarCellEmpty: { backgroundColor: '#FFFFFF' },
  calendarCellText: { fontSize: 12, color: '#2D4A3E' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#D8D5CF' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 16, height: 16, borderRadius: 4 },
  legendDotDone: { backgroundColor: '#7B9B8C' },
  legendDotEmpty: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8D5CF' },
  legendText: { fontSize: 12, color: '#6B7370' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statBox: { flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#F5F1ED', alignItems: 'center' },
  statNumber: { fontSize: 24, color: '#7B9B8C', fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7370' },
  monthlySummaryFooter: { fontSize: 14, color: '#6B7370', textAlign: 'center' },

  timelineTitle: { fontSize: 14, color: '#6B7370', marginBottom: 12 },
  timelineList: { gap: 12 },
  timelineCard: { padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8D5CF' },
  timelineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timelineDate: { fontSize: 14, color: '#7B9B8C', fontWeight: '600' },
  timelineRoutine: { fontSize: 12, color: '#6B7370' },
  timelineMood: { fontSize: 24, marginBottom: 8 },
  flareTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#FFE0E0' },
  flareTagText: { fontSize: 12, color: '#8B4545' },
  contextTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F5F1ED' },
  contextTagText: { fontSize: 12, color: '#6B7370' },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#D8D5CF' },
  noteText: { flex: 1, fontSize: 14, color: '#3A3A3A' },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  photoText: { fontSize: 14, color: '#7B9B8C' },

  emptyState: { paddingVertical: 48, alignItems: 'center' },
  emptyTitle: { fontSize: 16, color: '#6B7370', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#6B7370', textAlign: 'center', marginBottom: 16 },
  emptyClearBtn: { paddingVertical: 8 },
  emptyClearText: { fontSize: 14, color: '#7B9B8C' },
});
