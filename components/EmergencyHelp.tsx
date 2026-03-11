import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  BODY_SMALL_SIZE,
  BUTTON_TEXT_SIZE,
  BUTTON_TEXT_WEIGHT,
  LABEL_SIZE,
  TITLE_SECTION_SIZE,
  TITLE_SECTION_WEIGHT,
} from '../constants/Typography';

export interface EmergencyHelpProps {
  onClose: () => void;
}

export function EmergencyHelp({ onClose }: EmergencyHelpProps) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="alert-circle-outline" size={26} color="#FFFFFF" />
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#6B7370" />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>When to get urgent help</Text>
          <Text style={styles.subtitle}>
            This app cannot give medical advice. Please reach out to a clinician or emergency
            service if you notice:
          </Text>
          <View style={styles.list}>
            <Text style={styles.item}>• Rapid swelling, trouble breathing, or lip / tongue swelling</Text>
            <Text style={styles.item}>• Spreading blistering rash or open, painful skin</Text>
            <Text style={styles.item}>• Fever, chills, or feeling very unwell with a skin change</Text>
            <Text style={styles.item}>• Thoughts of hurting yourself or feeling unsafe</Text>
          </View>
          <Text style={styles.footer}>
            In the US, you can call 988 for mental health crises or 911 for medical emergencies.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.closeButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderWidth: 2,
    borderColor: '#F5D6C6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E57373',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: TITLE_SECTION_SIZE,
    fontWeight: TITLE_SECTION_WEIGHT,
    color: '#5A3A32',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: BODY_SMALL_SIZE,
    color: '#6B7370',
    marginBottom: 10,
  },
  list: {
    marginBottom: 12,
  },
  item: {
    fontSize: BODY_SMALL_SIZE,
    color: '#6B7370',
    marginBottom: 4,
  },
  footer: {
    fontSize: LABEL_SIZE,
    color: '#8A9088',
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: '#5F8575',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: BUTTON_TEXT_SIZE,
    fontWeight: BUTTON_TEXT_WEIGHT,
  },
});

