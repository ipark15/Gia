import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface ExecutiveSummaryProps {
  onClose: () => void;
  patientName?: string;
  condition: string;
  startDate: string;
  nextAppointment?: string;
}

const SUMMARY_DATA = {
  adherenceRate: 78,
  totalRoutines: 45,
  completedRoutines: 35,
  avgMood: '😌' as const,
  flareUpCount: 6,
  improvingSymptoms: ['redness', 'texture'],
  worseningSymptoms: ['dryness'],
  stableSymptoms: ['breakouts'],
  commonTriggers: ['stress', 'lack of sleep', 'weather changes'],
  currentProducts: [
    'CeraVe Hydrating Cleanser',
    'The Ordinary Niacinamide 10%',
    'La Roche-Posay Toleriane Double Repair',
    'Neutrogena Clear Face SPF 55',
  ],
  concerns: [
    'Increased dryness in last 2 weeks',
    'Flare-ups correlate with stress',
  ],
  improvements: ['Less frequent breakouts', 'Improved skin texture'],
};

function buildSummaryText(
  patientName: string,
  condition: string,
  startDate: string,
  nextAppointment: string | undefined,
  options: {
    includeAdherence: boolean;
    includeMood: boolean;
    includeSymptoms: boolean;
    includeProducts: boolean;
    includeFlareUps: boolean;
    includeTriggers: boolean;
    includeProgress: boolean;
  }
): string {
  const d = SUMMARY_DATA;
  let content = 'SKIN HEALTH EXECUTIVE SUMMARY\n';
  content += `Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\n`;
  content += 'PATIENT INFORMATION\n';
  content += `Name: ${patientName}\n`;
  content += `Primary Condition: ${condition}\n`;
  content += `Tracking Since: ${new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n`;
  if (nextAppointment) {
    content += `Next Appointment: ${new Date(nextAppointment).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n`;
  }
  content += '\n---\n\n';

  if (options.includeAdherence) {
    content += 'TREATMENT ADHERENCE\n';
    content += `Overall Adherence Rate: ${d.adherenceRate}%\n`;
    content += `Routines Completed: ${d.completedRoutines}/${d.totalRoutines}\n\n`;
  }
  if (options.includeSymptoms) {
    content += 'SYMPTOM TRENDS\n';
    if (d.improvingSymptoms.length > 0) content += `Improving: ${d.improvingSymptoms.join(', ')}\n`;
    if (d.stableSymptoms.length > 0) content += `Stable: ${d.stableSymptoms.join(', ')}\n`;
    if (d.worseningSymptoms.length > 0) content += `Worsening: ${d.worseningSymptoms.join(', ')}\n`;
    content += '\n';
  }
  if (options.includeFlareUps) {
    content += 'FLARE-UP ACTIVITY\n';
    content += `Total Flare-Ups: ${d.flareUpCount} in tracking period\n\n`;
  }
  if (options.includeTriggers) {
    content += 'IDENTIFIED TRIGGERS\n';
    content += d.commonTriggers.map((t) => `- ${t}`).join('\n') + '\n\n';
  }
  if (options.includeProducts) {
    content += 'CURRENT TREATMENT REGIMEN\n';
    content += d.currentProducts.map((p) => `- ${p}`).join('\n') + '\n\n';
  }
  if (options.includeMood) {
    content += 'EMOTIONAL WELL-BEING\n';
    content += `Most Common Mood: ${d.avgMood === '😌' ? 'Good' : d.avgMood === '😐' ? 'Neutral' : 'Struggling'}\n\n`;
  }
  if (options.includeProgress) {
    content += "KEY OBSERVATIONS\n\nWhat's Working:\n";
    content += d.improvements.map((i) => `- ${i}`).join('\n') + '\n\n';
    content += 'Current Concerns:\n';
    content += d.concerns.map((c) => `- ${c}`).join('\n') + '\n';
  }
  content += '\n---\n\n';
  content += 'This summary was generated from patient self-tracking data via the gia skincare companion app.';
  return content;
}

interface DataToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function DataToggle({ label, description, checked, onChange }: DataToggleProps) {
  return (
    <TouchableOpacity
      style={[styles.toggleRow, checked ? styles.toggleRowChecked : styles.toggleRowUnchecked]}
      onPress={() => onChange(!checked)}
      activeOpacity={0.85}
    >
      <View style={[styles.toggleCheck, checked ? styles.toggleCheckChecked : styles.toggleCheckUnchecked]}>
        {checked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </View>
      <View style={styles.toggleTextBlock}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function ExecutiveSummary({
  onClose,
  patientName = 'Patient',
  condition,
  startDate,
  nextAppointment,
}: ExecutiveSummaryProps) {
  const [step, setStep] = useState<'customize' | 'preview'>('preview');
  const [includeAdherence, setIncludeAdherence] = useState(true);
  const [includeMood, setIncludeMood] = useState(true);
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeFlareUps, setIncludeFlareUps] = useState(true);
  const [includeTriggers, setIncludeTriggers] = useState(true);
  const [includeProgress, setIncludeProgress] = useState(true);

  const options = {
    includeAdherence,
    includeMood,
    includeSymptoms,
    includeProducts,
    includeFlareUps,
    includeTriggers,
    includeProgress,
  };

  const handleShareOrDownload = async () => {
    const message = buildSummaryText(
      patientName,
      condition,
      startDate,
      nextAppointment,
      options
    );
    try {
      await Share.share({
        message,
        title: 'Skin Health Summary',
      });
    } catch {
      // User cancelled or share failed
    }
  };

  const d = SUMMARY_DATA;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {step === 'customize' ? 'Customize your summary' : 'Summary preview'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={24} color="#6B7370" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {step === 'customize' && (
              <>
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Select which information you'd like to share with your dermatologist.
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>Select data to include:</Text>

                <DataToggle
                  label="treatment adherence"
                  description="how consistently you've followed your routine"
                  checked={includeAdherence}
                  onChange={setIncludeAdherence}
                />
                <DataToggle
                  label="symptom trends"
                  description="which symptoms are improving, stable, or worsening"
                  checked={includeSymptoms}
                  onChange={setIncludeSymptoms}
                />
                <DataToggle
                  label="flare-up activity"
                  description="frequency and patterns of flare-ups"
                  checked={includeFlareUps}
                  onChange={setIncludeFlareUps}
                />
                <DataToggle
                  label="identified triggers"
                  description="patterns you've noticed (stress, sleep, weather, etc.)"
                  checked={includeTriggers}
                  onChange={setIncludeTriggers}
                />
                <DataToggle
                  label="current products"
                  description="your active skincare routine and products"
                  checked={includeProducts}
                  onChange={setIncludeProducts}
                />
                <DataToggle
                  label="mood tracking"
                  description="emotional well-being related to skin health"
                  checked={includeMood}
                  onChange={setIncludeMood}
                />
                <DataToggle
                  label="progress observations"
                  description="what's working and current concerns"
                  checked={includeProgress}
                  onChange={setIncludeProgress}
                />

                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => setStep('preview')}
                  activeOpacity={0.9}
                >
                  <Text style={styles.previewButtonText}>preview summary</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'preview' && (
              <>
                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => setStep('customize')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backLinkText}>adjust what data is included →</Text>
                </TouchableOpacity>

                <View style={styles.previewCard}>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewTitle}>Skin Health Executive Summary</Text>
                    <Text style={styles.previewGenerated}>Generated: {generatedDate}</Text>
                  </View>

                  <View style={styles.previewBlock}>
                    <Text style={styles.previewBlockTitle}>Patient Information</Text>
                    <Text style={styles.previewLine}>Name: {patientName}</Text>
                    <Text style={styles.previewLine}>Primary Condition: {condition}</Text>
                    <Text style={styles.previewLine}>
                      Tracking Since: {new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                    {nextAppointment && (
                      <Text style={styles.previewLine}>
                        Next Appointment: {new Date(nextAppointment).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </Text>
                    )}
                  </View>

                  {includeAdherence && (
                    <View style={styles.previewBlock}>
                      <Text style={styles.previewBlockTitle}>Treatment Adherence</Text>
                      <Text style={styles.previewLine}>Overall Rate: {d.adherenceRate}%</Text>
                      <Text style={styles.previewLine}>
                        Routines: {d.completedRoutines}/{d.totalRoutines}
                      </Text>
                    </View>
                  )}

                  {includeSymptoms && (
                    <View style={styles.previewBlock}>
                      <Text style={styles.previewBlockTitle}>Symptom Trends</Text>
                      {d.improvingSymptoms.length > 0 && (
                        <View style={[styles.trendRow, styles.trendImproving]}>
                          <Ionicons name="trending-up" size={14} color="#5F8575" />
                          <Text style={styles.trendText}>
                            Improving: {d.improvingSymptoms.join(', ')}
                          </Text>
                        </View>
                      )}
                      {d.stableSymptoms.length > 0 && (
                        <View style={[styles.trendRow, styles.trendStable]}>
                          <Ionicons name="remove" size={14} color="#7B9B8C" />
                          <Text style={styles.trendText}>
                            Stable: {d.stableSymptoms.join(', ')}
                          </Text>
                        </View>
                      )}
                      {d.worseningSymptoms.length > 0 && (
                        <View style={[styles.trendRow, styles.trendWorsening]}>
                          <Ionicons name="trending-down" size={14} color="#8B4545" />
                          <Text style={styles.trendText}>
                            Worsening: {d.worseningSymptoms.join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {includeFlareUps && (
                    <View style={styles.previewBlock}>
                      <Text style={styles.previewBlockTitle}>Flare-up Activity</Text>
                      <Text style={styles.previewLine}>Total: {d.flareUpCount} flare-ups</Text>
                    </View>
                  )}

                  {includeTriggers && (
                    <View style={styles.previewBlock}>
                      <Text style={styles.previewBlockTitle}>Identified Triggers</Text>
                      {d.commonTriggers.map((t, i) => (
                        <Text key={i} style={styles.previewBullet}>• {t}</Text>
                      ))}
                    </View>
                  )}

                  {includeProducts && (
                    <View style={styles.previewBlock}>
                      <Text style={styles.previewBlockTitle}>Current Regimen</Text>
                      {d.currentProducts.map((p, i) => (
                        <Text key={i} style={styles.previewBullet}>• {p}</Text>
                      ))}
                    </View>
                  )}

                  {includeMood && (
                    <View style={styles.previewBlock}>
                      <Text style={styles.previewBlockTitle}>Emotional Well-being</Text>
                      <Text style={styles.previewLine}>
                        Most Common Mood: {d.avgMood === '😌' ? 'Good' : d.avgMood === '😐' ? 'Neutral' : 'Struggling'}
                      </Text>
                    </View>
                  )}

                  {includeProgress && (
                    <View style={styles.previewBlock}>
                      <Text style={styles.previewBlockTitle}>Key Observations</Text>
                      <View style={[styles.obsBox, styles.obsImproving]}>
                        <Text style={styles.obsBoxTitle}>What's Working:</Text>
                        {d.improvements.map((i, idx) => (
                          <Text key={idx} style={styles.previewBullet}>• {i}</Text>
                        ))}
                      </View>
                      <View style={[styles.obsBox, styles.obsConcerns]}>
                        <Text style={styles.obsBoxTitle}>Current Concerns:</Text>
                        {d.concerns.map((c, idx) => (
                          <Text key={idx} style={styles.previewBullet}>• {c}</Text>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.previewFooter}>
                    <Text style={styles.previewFooterText}>
                      This summary was generated from patient self-tracking data via the gia skincare companion app.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={handleShareOrDownload}
                  activeOpacity={0.9}
                >
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>download / share summary</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShareOrDownload}
                  activeOpacity={0.9}
                >
                  <Ionicons name="share-outline" size={20} color="#5F8575" />
                  <Text style={styles.shareButtonText}>share summary</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => setStep('customize')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backLinkText}>← back to customize</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D5CF',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D4A3E',
    fontStyle: 'italic',
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(123,155,140,0.25)',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#2D4A3E',
    fontStyle: 'italic',
  },
  sectionHeading: {
    fontSize: 15,
    color: '#2D4A3E',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 10,
  },
  toggleRowChecked: {
    backgroundColor: '#E8F5E9',
    borderColor: '#5F8575',
  },
  toggleRowUnchecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8D5CF',
  },
  toggleCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleCheckChecked: {
    backgroundColor: '#5F8575',
    borderColor: '#5F8575',
  },
  toggleCheckUnchecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8D5CF',
  },
  toggleTextBlock: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5F8575',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#6B7370',
  },
  previewButton: {
    backgroundColor: '#5F8575',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  previewCard: {
    backgroundColor: '#F5F1ED',
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    marginBottom: 20,
  },
  previewHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#D8D5CF',
    paddingBottom: 12,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D4A3E',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  previewGenerated: {
    fontSize: 11,
    color: '#6B8B7D',
    fontStyle: 'italic',
  },
  previewBlock: {
    marginBottom: 14,
  },
  previewBlockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D4A3E',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  previewLine: {
    fontSize: 12,
    color: '#6B8B7D',
    marginBottom: 2,
  },
  previewBullet: {
    fontSize: 12,
    color: '#6B8B7D',
    marginBottom: 2,
    paddingLeft: 12,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  trendImproving: {
    backgroundColor: '#E8F5E9',
  },
  trendStable: {
    backgroundColor: '#E8F0DC',
  },
  trendWorsening: {
    backgroundColor: '#FFE0E0',
  },
  trendText: {
    fontSize: 12,
    color: '#2D4A3E',
    fontStyle: 'italic',
    marginLeft: 8,
    flex: 1,
  },
  obsBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  obsImproving: {
    backgroundColor: '#E8F5E9',
  },
  obsConcerns: {
    backgroundColor: '#FFE0E0',
  },
  obsBoxTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D4A3E',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  previewFooter: {
    borderTopWidth: 2,
    borderTopColor: '#D8D5CF',
    paddingTop: 14,
    marginTop: 8,
  },
  previewFooterText: {
    fontSize: 11,
    color: '#6B8B7D',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5F8575',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    marginBottom: 10,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#5F8575',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    marginBottom: 8,
  },
  shareButtonText: {
    color: '#5F8575',
    fontSize: 15,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 13,
    color: '#6B8B7D',
    fontStyle: 'italic',
  },
});
