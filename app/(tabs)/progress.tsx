import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { G } from '../../constants/Gradients';
import { EmergencyHelp } from '../../components/EmergencyHelp';
import { ExecutiveSummary } from '../../components/ExecutiveSummary';
import { TabTopNavbar } from '../../components/TabTopNavbar';
import { HEADER_PADDING_HORIZONTAL } from '../../constants/HeaderStyles';
import { formatTimestamp, getLocalDateString, parseLocalDateString } from '../../lib/dateUtils';
import {
  BODY_SIZE,
  BODY_SMALL_SIZE,
  BUTTON_TEXT_SIZE,
  BUTTON_TEXT_WEIGHT,
  LABEL_SMALL_SIZE,
  TEXT_PRIMARY,
  TEXT_SECONDARY
} from '../../constants/Typography';
import { useAuth } from '../../context/AuthContext';
import { useProgressPhotos } from '../../hooks/useProgressPhotos';
import { useSummaryData } from '../../hooks/useSummaryData';
import { supabase } from '../../lib/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const GRID_GAP = 8;
const HORIZONTAL_PADDING = HEADER_PADDING_HORIZONTAL;
const PHOTO_SIZE =
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

interface ProgressPhoto {
  id: string;
  date: string;
  createdAt?: string;
  storagePath: string;
  imageUrl: string;
  notes?: string;
}

export default function ProgressScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { photos: storedPhotos, loading: photosLoading, uploadPhoto, deletePhoto } = useProgressPhotos();
  const { data: summaryData } = useSummaryData();
  const allPhotos: ProgressPhoto[] = useMemo(
    () =>
      storedPhotos.map((p) => ({
        id: p.id,
        date: p.date,
        createdAt: p.createdAt,
        storagePath: p.storagePath,
        imageUrl: p.imageUrl,
        notes: p.notes,
      })),
    [storedPhotos]
  );

  const [showUpload, setShowUpload] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [newNotes, setNewNotes] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<ProgressPhoto[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');

  const [appointmentDate, setAppointmentDate] = useState<string>(profile?.next_derm_appointment ?? '');
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);

  React.useEffect(() => {
    setAppointmentDate(profile?.next_derm_appointment ?? '');
  }, [profile?.next_derm_appointment]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getYearsFromPhotos = () => {
    const years = new Set(allPhotos.map((p) => parseLocalDateString(p.date).getFullYear().toString()));
    return ['all', ...Array.from(years).sort()];
  };

  const getMonthsFromYear = (year: string) => {
    if (year === 'all') return ['all'];
    const months = new Set(
      allPhotos
        .filter((p) => parseLocalDateString(p.date).getFullYear().toString() === year)
        .map((p) => parseLocalDateString(p.date).getMonth().toString())
    );
    return [
      'all',
      ...Array.from(months).sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return parseInt(a, 10) - parseInt(b, 10);
      }),
    ];
  };

  const getDatesFromMonth = (year: string, month: string) => {
    if (year === 'all' || month === 'all') return ['all'];
    const dates = new Set(
      allPhotos
        .filter((p) => {
          const d = parseLocalDateString(p.date);
          return d.getFullYear().toString() === year && d.getMonth().toString() === month;
        })
        .map((p) => parseLocalDateString(p.date).getDate().toString())
    );
    return [
      'all',
      ...Array.from(dates).sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return parseInt(a, 10) - parseInt(b, 10);
      }),
    ];
  };

  const filteredPhotos = allPhotos.filter((photo) => {
    const d = parseLocalDateString(photo.date);
    if (selectedYear !== 'all' && d.getFullYear().toString() !== selectedYear) return false;
    if (selectedMonth !== 'all' && d.getMonth().toString() !== selectedMonth) return false;
    if (selectedDate !== 'all' && d.getDate().toString() !== selectedDate) return false;
    return true;
  });

  const sortedFilteredPhotos = [...filteredPhotos].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : parseLocalDateString(a.date).getTime();
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : parseLocalDateString(b.date).getTime();
    return bTime - aTime;
  });

  const getDaysUntilAppointment = () => {
    if (!appointmentDate) return null;
    const [y, m, d] = appointmentDate.split('-').map(Number);
    const today = new Date();
    const appt = new Date(y, m - 1, d);
    const diffTime = appt.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntil = getDaysUntilAppointment();

  const handleSaveAppointment = async () => {
    if (!appointmentDate || !user) return;
    const { error } = await (supabase.from('profiles') as any)
      .update({ next_derm_appointment: appointmentDate, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (!error) {
      await refreshProfile();
      setIsEditingAppointment(false);
    } else {
      alert(error.message);
    }
  };

  const handleCancelEdit = () => {
    setAppointmentDate(profile?.next_derm_appointment ?? '');
    setIsEditingAppointment(false);
  };

  const handlePhotoPress = (photo: ProgressPhoto) => {
    if (comparisonMode) {
      const already = comparePhotos.find((p) => p.id === photo.id);
      if (already) {
        setComparePhotos(comparePhotos.filter((p) => p.id !== photo.id));
      } else if (comparePhotos.length < 2) {
        setComparePhotos([...comparePhotos, photo]);
      }
    } else {
      setSelectedPhoto(photo);
    }
  };

  const dateForUpload = getLocalDateString();
  const pickImageFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Permission to access photos is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const base64 = result.assets[0].base64;
      if (!base64) {
        alert('Could not get image data. Try another photo.');
        return;
      }
      try {
        await uploadPhoto(base64, dateForUpload, newNotes);
        setShowUpload(false);
        setNewNotes('');
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Upload failed');
      }
    }
  };

  const takePhotoWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert('Permission to use the camera is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const base64 = result.assets[0].base64;
      if (!base64) {
        alert('Could not get image data. Try taking the photo again.');
        return;
      }
      try {
        await uploadPhoto(base64, dateForUpload, newNotes);
        setShowUpload(false);
        setNewNotes('');
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Upload failed');
      }
    }
  };

  const confirmDeleteSelectedPhoto = () => {
    if (!selectedPhoto) return;
    Alert.alert(
      'Delete photo?',
      'This will remove the photo from your account and delete it from storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const toDelete = selectedPhoto;
              setSelectedPhoto(null);
              await deletePhoto({ id: toDelete.id, storagePath: toDelete.storagePath });
            } catch (e) {
              Alert.alert('Delete failed', e instanceof Error ? e.message : 'Could not delete photo');
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={G.pageInsights.colors} start={G.pageInsights.start} end={G.pageInsights.end} style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TabTopNavbar
            icon="camera-outline"
            title="Track your progress"
            subtitle="Visualize changes and see a summary of your skin journey"
            onHelpPress={() => setShowHelpModal(true)}
            onSettingsPress={() => router.push({ pathname: '/(onboarding)/registration', params: { step: '2' } })}
          />

          <View style={styles.appointmentCard}>
            <View style={styles.appointmentGrid}>
              <View style={styles.appointmentBoxWrap}>
                {!isEditingAppointment ? (
                  <View
                    style={[
                      styles.appointmentBox,
                      daysUntil !== null &&
                        daysUntil >= 0 &&
                        daysUntil <= 7 &&
                        appointmentDate
                        ? styles.appointmentBoxSoon
                        : styles.appointmentBoxDefault,
                    ]}
                  >
                    <View style={styles.appointmentRow}>
                      <View style={styles.appointmentLeft}>
                        <Ionicons name="calendar-outline" size={16} color="#5F8575" />
                        <View style={styles.appointmentTextWrap}>
                          <Text style={styles.appointmentLabel}>Next derm appt:</Text>
                          {appointmentDate ? (
                            <Text
                              style={styles.appointmentText}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {(() => {
                                const [y, m, d] = appointmentDate
                                  .split('-')
                                  .map((n) => parseInt(n, 10));
                                const date = new Date(y, m - 1, d);
                                return date.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                });
                              })()}
                              {daysUntil !== null &&
                                daysUntil >= 0 &&
                                daysUntil <= 7 && (
                                  <Text style={styles.appointmentBadge}>
                                    {daysUntil === 0
                                      ? ' (today)'
                                      : daysUntil === 1
                                        ? ' (tomorrow)'
                                        : ` (${daysUntil}d)`}
                                  </Text>
                                )}
                            </Text>
                          ) : (
                            <Text style={styles.appointmentTextEmpty}>not set</Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.appointmentEditBtn}
                        onPress={() => setIsEditingAppointment(true)}
                      >
                        <Ionicons name="create-outline" size={16} color="#6B7370" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.appointmentEditBox}>
                    <View style={styles.appointmentEditRow}>
                      <TextInput
                        style={styles.appointmentInput}
                        value={appointmentDate}
                        onChangeText={setAppointmentDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#8A9088"
                      />
                      <TouchableOpacity
                        style={[
                          styles.appointmentSaveBtn,
                          !appointmentDate && styles.appointmentSaveBtnDisabled,
                        ]}
                        disabled={!appointmentDate}
                        onPress={handleSaveAppointment}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.appointmentCancelBtn}
                        onPress={handleCancelEdit}
                      >
                        <Ionicons name="close" size={16} color="#6B7370" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.summaryButton}
                activeOpacity={0.9}
                onPress={() => setShowExecutiveSummary(true)}
              >
                <View style={styles.summaryInner}>
                  <View style={styles.summaryIconCircle}>
                    <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.summaryText}>Generate provider summary</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setShowUpload(true)}
              activeOpacity={0.9}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>Upload new photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.compareButton,
                comparisonMode && styles.compareButtonActive,
              ]}
              onPress={() => {
                setComparisonMode((prev) => !prev);
                setComparePhotos([]);
              }}
              activeOpacity={0.9}
            >
              <Ionicons name="copy-outline" size={18} color={comparisonMode ? '#FFFFFF' : '#2D4A3E'} />
              <Text
                style={[
                  styles.compareButtonText,
                  comparisonMode && styles.compareButtonTextActive,
                ]}
              >
                {comparisonMode ? 'Exit comparison mode' : 'Compare photos'}
              </Text>
            </TouchableOpacity>
          </View>

          {comparisonMode && (
            <View style={styles.comparisonInfo}>
              <Text style={styles.comparisonInfoText}>
                {comparePhotos.length === 0 && 'Select 2 photos to compare'}
                {comparePhotos.length === 1 && 'Select 1 more photo to compare'}
                {comparePhotos.length === 2 && '✓ Photos selected for comparison'}
              </Text>
            </View>
          )}

          <View style={styles.filtersSection}>
            <TouchableOpacity
              style={styles.filtersToggle}
              onPress={() => setShowFilters((prev) => !prev)}
              activeOpacity={0.9}
            >
              <View style={styles.filtersToggleLeft}>
                <Ionicons name="funnel-outline" size={18} color="#7B9B8C" />
                <Text style={styles.filtersToggleText}>Filter by date</Text>
              </View>
              <Ionicons
                name={showFilters ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#7B9B8C"
              />
            </TouchableOpacity>

            {showFilters && (
              <View style={styles.filtersBody}>
                <View style={styles.filterBlock}>
                  <Text style={styles.filterLabel}>Year</Text>
                  <View style={styles.filterChipsRow}>
                    {getYearsFromPhotos().map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.filterChip,
                          selectedYear === year && styles.filterChipActive,
                        ]}
                        onPress={() => {
                          setSelectedYear(year);
                          setSelectedMonth('all');
                          setSelectedDate('all');
                        }}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedYear === year && styles.filterChipTextActive,
                          ]}
                        >
                          {year === 'all' ? 'All years' : year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {selectedYear !== 'all' && (
                  <View style={styles.filterBlock}>
                    <Text style={styles.filterLabel}>Month</Text>
                    <View style={styles.filterChipsRow}>
                      {getMonthsFromYear(selectedYear).map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.filterChip,
                            selectedMonth === m && styles.filterChipActive,
                          ]}
                          onPress={() => {
                            setSelectedMonth(m);
                            setSelectedDate('all');
                          }}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              selectedMonth === m && styles.filterChipTextActive,
                            ]}
                          >
                            {m === 'all' ? 'All months' : monthNames[parseInt(m, 10)]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {selectedYear !== 'all' && selectedMonth !== 'all' && (
                  <View style={styles.filterBlock}>
                    <Text style={styles.filterLabel}>Date</Text>
                    <View style={styles.filterChipsRow}>
                      {getDatesFromMonth(selectedYear, selectedMonth).map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[
                            styles.filterChip,
                            selectedDate === d && styles.filterChipActive,
                          ]}
                          onPress={() => setSelectedDate(d)}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              selectedDate === d && styles.filterChipTextActive,
                            ]}
                          >
                            {d === 'all' ? 'All dates' : d}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {comparisonMode && comparePhotos.length === 2 && (
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Comparison</Text>
              <View style={styles.comparisonGrid}>
                {comparePhotos.map((photo, idx) => (
                  <View key={photo.id} style={styles.comparisonItem}>
                    <View style={styles.comparisonBadge}>
                      <Text style={styles.comparisonBadgeText}>Photo {idx + 1}</Text>
                    </View>
                    <Image
                      source={{ uri: photo.imageUrl }}
                      style={styles.comparisonImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.comparisonDate}>
                      {photo.createdAt
                        ? formatTimestamp(photo.createdAt)
                        : parseLocalDateString(photo.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>Your journey</Text>
            {(selectedYear !== 'all' ||
              selectedMonth !== 'all' ||
              selectedDate !== 'all') && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedYear('all');
                    setSelectedMonth('all');
                    setSelectedDate('all');
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear filters</Text>
                </TouchableOpacity>
              )}
          </View>

          {sortedFilteredPhotos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={40} color="#C9CBD5" />
              <Text style={styles.emptyStateTitle}>No photos for this period</Text>
              <Text style={styles.emptyStateSubtitle}>Try adjusting your filters</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {sortedFilteredPhotos.map((photo) => {
                const selected = comparePhotos.find((p) => p.id === photo.id);
                return (
                  <TouchableOpacity
                    key={photo.id}
                    style={[
                      styles.gridItem,
                      selected && styles.gridItemSelected,
                    ]}
                    onPress={() => handlePhotoPress(photo)}
                    activeOpacity={0.9}
                  >
                    {selected && (
                      <View style={styles.gridSelectedBadge}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    )}
                    <Image
                      source={{ uri: photo.imageUrl }}
                      style={styles.gridImage}
                      resizeMode="cover"
                    />
                    <View style={styles.gridOverlay}>
                      <Text style={styles.gridDate}>
                        {photo.createdAt
                          ? formatTimestamp(photo.createdAt)
                          : parseLocalDateString(photo.date).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        <Modal
          visible={showUpload}
          transparent
          animationType="slide"
          onRequestClose={() => setShowUpload(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Upload progress photo</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowUpload(false);
                    setNewNotes('');
                  }}
                  hitSlop={12}
                >
                  <Ionicons name="close" size={22} color="#6B7370" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.tipsBox}>
                  <Text style={styles.tipsTitle}>Photo tips</Text>
                  <Text style={styles.tipLine}>• Use the same lighting and angle</Text>
                  <Text style={styles.tipLine}>• Take photos in natural light</Text>
                  <Text style={styles.tipLine}>• Progress takes 4–6 weeks to show</Text>
                  <Text style={styles.tipLine}>• Compare month‑to‑month, not day‑to‑day</Text>
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Add notes (optional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={newNotes}
                    onChangeText={setNewNotes}
                    placeholder="How are you feeling about your skin today?"
                    placeholderTextColor="#8A9088"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.photoButtonsRow}>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={takePhotoWithCamera}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="camera-outline" size={26} color="#5F8575" />
                    <Text style={styles.photoButtonText}>Take photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={pickImageFromLibrary}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="images-outline" size={26} color="#5F8575" />
                    <Text style={styles.photoButtonText}>Choose from library</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.privacyText}>
                  *Your images remain private on your device. The app does not upload your photos.
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={selectedPhoto !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Progress photo</Text>
                  {selectedPhoto && (
                    <Text style={styles.modalSubtitle}>
                      {selectedPhoto.createdAt
                        ? formatTimestamp(selectedPhoto.createdAt)
                        : parseLocalDateString(selectedPhoto.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                    </Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity onPress={confirmDeleteSelectedPhoto} hitSlop={12}>
                    <Ionicons name="trash-outline" size={22} color="#8B4545" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedPhoto(null)} hitSlop={12}>
                    <Ionicons name="close" size={22} color="#6B7370" />
                  </TouchableOpacity>
                </View>
              </View>
              {selectedPhoto && (
                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.detailScrollContent}
                >
                  <Image
                    source={{ uri: selectedPhoto.imageUrl }}
                    style={styles.detailImage}
                    resizeMode="cover"
                  />
                  {selectedPhoto.notes && (
                    <View style={styles.detailNotesBox}>
                      <Text style={styles.detailNotesText}>{selectedPhoto.notes}</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {showHelpModal && <EmergencyHelp onClose={() => setShowHelpModal(false)} />}

        {showExecutiveSummary && (
          <ExecutiveSummary
            onClose={() => setShowExecutiveSummary(false)}
            patientName={profile?.name}
            condition={profile?.primary_condition ?? 'acne'}
            startDate={profile?.created_at ? new Date(profile.created_at).toISOString().slice(0, 10) : '2026-01-01'}
            nextAppointment={appointmentDate || undefined}
            summaryData={summaryData}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 24,
    paddingBottom: 32,
  },
  appointmentCard: {
    backgroundColor: '#F5F1ED',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(123,155,140,0.25)',
    marginBottom: 16,
  },
  appointmentGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  appointmentBoxWrap: {
    flex: 1,
    minWidth: 0,
  },
  appointmentBox: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
  },
  appointmentBoxDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8D5CF',
  },
  appointmentBoxSoon: {
    backgroundColor: '#E8F5E9',
    borderColor: '#5F8575',
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  appointmentTextWrap: {
    marginLeft: 6,
    flex: 1,
    minWidth: 0,
  },
  appointmentLabel: {
    fontSize: LABEL_SMALL_SIZE,
    color: '#5F8575',
    marginBottom: 2,
  },
  appointmentText: {
    fontSize: BODY_SMALL_SIZE,
    color: TEXT_PRIMARY,
  },
  appointmentTextEmpty: {
    fontSize: BODY_SMALL_SIZE,
    color: TEXT_SECONDARY,
  },
  appointmentBadge: {
    fontSize: LABEL_SMALL_SIZE,
    color: '#5F8575',
  },
  appointmentEditBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F0F3ED',
    marginLeft: 6,
  },
  appointmentEditBox: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#5F8575',
    backgroundColor: '#FFFFFF',
  },
  appointmentEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8D5CF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    color: '#2D4A3E',
  },
  appointmentSaveBtn: {
    marginLeft: 6,
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#5F8575',
  },
  appointmentSaveBtnDisabled: {
    backgroundColor: '#D8D5CF',
  },
  appointmentCancelBtn: {
    marginLeft: 6,
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
  },
  summaryButton: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#5F8575',
    backgroundColor: '#5F8575',
    justifyContent: 'center',
  },
  summaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  summaryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: BODY_SIZE,
    color: '#FFFFFF',
    fontWeight: BUTTON_TEXT_WEIGHT,
  },
  actionsSection: {
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#5F8575',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: BUTTON_TEXT_SIZE,
    fontWeight: BUTTON_TEXT_WEIGHT,
    marginLeft: 8,
  },
  compareButton: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(123,155,140,0.4)',
    backgroundColor: '#FFFFFF',
  },
  compareButtonActive: {
    backgroundColor: '#F49EC4',
    borderColor: '#F49EC4',
  },
  compareButtonText: {
    fontSize: 15,
    color: '#2D4A3E',
    fontStyle: 'italic',
    marginLeft: 6,
  },
  compareButtonTextActive: {
    color: '#FFFFFF',
  },
  comparisonInfo: {
    marginBottom: 14,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F5E6F0',
    borderWidth: 1,
    borderColor: '#F4C8DE',
  },
  comparisonInfoText: {
    fontSize: 13,
    color: '#2D4A3E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  filtersSection: {
    marginBottom: 16,
  },
  filtersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(123,155,140,0.35)',
  },
  filtersToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filtersToggleText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2D4A3E',
    fontStyle: 'italic',
  },
  filtersBody: {
    marginTop: 8,
    borderRadius: 18,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(123,155,140,0.35)',
  },
  filterBlock: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 12,
    color: '#6B8B7D',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    marginRight: 6,
    marginBottom: 6,
  },
  filterChipActive: {
    backgroundColor: '#5F8575',
  },
  filterChipText: {
    fontSize: 12,
    color: '#2D4A3E',
    fontStyle: 'italic',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  comparisonCard: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(123,155,140,0.3)',
    marginBottom: 16,
  },
  comparisonTitle: {
    fontSize: 16,
    color: '#2D4A3E',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
  },
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  comparisonBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#6B9B6E',
  },
  comparisonBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  comparisonImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
  },
  comparisonDate: {
    marginTop: 6,
    fontSize: 13,
    color: '#2D4A3E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timelineTitle: {
    fontSize: 18,
    color: '#2D4A3E',
    fontStyle: 'italic',
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#7B9B8C',
    fontStyle: 'italic',
  },
  emptyState: {
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(149,201,142,0.25)',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 14,
    color: '#6B8B7D',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: '#6B8B7D',
    fontStyle: 'italic',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -GRID_GAP / 2,
  },
  gridItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 16,
    marginHorizontal: GRID_GAP / 2,
    marginBottom: GRID_GAP,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(149,201,142,0.35)',
  },
  gridItemSelected: {
    borderColor: '#F49EC4',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245,230,240,0.9)',
  },
  gridDate: {
    fontSize: 13,
    color: '#2D4A3E',
    fontStyle: 'italic',
  },
  gridSelectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F49EC4',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    height: Dimensions.get('window').height * 0.65,
    borderRadius: 24,
    backgroundColor: '#FAF8F5',
    borderWidth: 2,
    borderColor: 'rgba(149,201,142,0.3)',
    overflow: 'hidden',
  },
  detailCard: {
    width: '100%',
    height: Dimensions.get('window').height * 0.65,
    borderRadius: 24,
    backgroundColor: '#FAF8F5',
    borderWidth: 2,
    borderColor: '#D8D5CF',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    color: '#2D4A3E',
    fontStyle: 'italic',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7370',
    marginTop: 2,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  detailScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 22,
  },
  tipsBox: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#E8F0DC',
    borderWidth: 2,
    borderColor: 'rgba(149,201,142,0.6)',
    marginBottom: 14,
  },
  tipsTitle: {
    fontSize: 14,
    color: '#2D4A3E',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  tipLine: {
    fontSize: 12,
    color: '#6B8B7D',
    fontStyle: 'italic',
  },
  modalField: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 13,
    color: '#2D4A3E',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  notesInput: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(149,201,142,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    fontSize: 13,
    color: '#2D4A3E',
    backgroundColor: '#FFFFFF',
  },
  photoButtonsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  photoButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(149,201,142,0.4)',
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  photoButtonText: {
    fontSize: 13,
    color: '#2D4A3E',
    fontStyle: 'italic',
    marginTop: 6,
  },
  privacyText: {
    fontSize: 11,
    color: '#6B8B7D',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  detailImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    marginBottom: 12,
  },
  detailNotesBox: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#E8F0DC',
    borderWidth: 1,
    borderColor: 'rgba(149,201,142,0.4)',
  },
  detailNotesText: {
    fontSize: 13,
    color: '#2D4A3E',
    fontStyle: 'italic',
  },
});

