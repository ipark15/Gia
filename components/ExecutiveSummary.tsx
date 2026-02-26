import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface ExecutiveSummaryProps {
  onClose: () => void;
  condition: string;
  startDate: string;
  nextAppointment?: string;
}

export function ExecutiveSummary({
  onClose,
  condition,
  startDate,
  nextAppointment,
}: ExecutiveSummaryProps) {
  const startLabel = new Date(startDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const nextLabel = nextAppointment
    ? new Date(nextAppointment).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not set';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Provider summary</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={24} color="#6B7370" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Share this with your dermatologist</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Condition focus</Text>
            <Text style={styles.value}>{condition}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Tracking since</Text>
            <Text style={styles.value}>{startLabel}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Next appointment</Text>
            <Text style={styles.value}>{nextLabel}</Text>
          </View>

          <Text style={styles.hint}>
            A full summary with timeline, flares, and routine adherence can be generated from your
            Insights data.
          </Text>

          <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5A7A6B',
  },
  closeBtn: { padding: 4 },
  subtitle: {
    fontSize: 14,
    color: '#6B7370',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#6B7370',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#2D4A3E',
    fontWeight: '500',
  },
  hint: {
    fontSize: 13,
    color: '#6B7370',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  doneButton: {
    backgroundColor: '#5F8575',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
