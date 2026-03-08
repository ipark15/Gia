import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  HEADER_ACTION_STRIP_WIDTH,
  HEADER_BUTTON_GAP,
  HEADER_ICON_COLOR,
} from '../constants/HeaderStyles';
import {
  SUBTITLE_COLOR,
  SUBTITLE_SIZE,
  TEXT_PRIMARY,
  TITLE_LARGE_SIZE,
  TITLE_LARGE_WEIGHT,
} from '../constants/Typography';

export interface TabTopNavbarProps {
  /** Ionicons name for the center icon (e.g. "person", "camera-outline", "document-text") */
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onHelpPress: () => void;
  onSettingsPress?: () => void;
  helpAccessibilityLabel?: string;
}

export function TabTopNavbar({
  icon,
  title,
  subtitle,
  onHelpPress,
  onSettingsPress,
  helpAccessibilityLabel = 'Help',
}: TabTopNavbarProps) {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={40} color="#FFFFFF" />
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onHelpPress}
            accessibilityLabel={helpAccessibilityLabel}
            activeOpacity={0.8}
          >
            <Ionicons name="help-circle-outline" size={20} color={HEADER_ICON_COLOR} />
          </TouchableOpacity>
          {onSettingsPress != null && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onSettingsPress}
              accessibilityLabel="Settings"
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={20} color={HEADER_ICON_COLOR} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    minHeight: 56,
  },
  headerSpacer: { width: HEADER_ACTION_STRIP_WIDTH },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7B9B8C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  headerActions: {
    width: HEADER_ACTION_STRIP_WIDTH,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: HEADER_BUTTON_GAP,
  },
  iconBtn: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: TITLE_LARGE_SIZE,
    color: TEXT_PRIMARY,
    fontWeight: TITLE_LARGE_WEIGHT,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: SUBTITLE_SIZE,
    color: SUBTITLE_COLOR,
    textAlign: 'center',
    marginBottom: 24,
  },
});
