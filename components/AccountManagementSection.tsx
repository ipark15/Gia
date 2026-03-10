import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface AccountManagementSectionProps {
  accountData: {
    name: string;
    email: string;
  };
  onUpdateAccount?: (data: { name: string; email: string; password: string }) => Promise<void>;
}

export function AccountManagementSection({
  accountData,
  onUpdateAccount,
}: AccountManagementSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(accountData.name);
  const [email, setEmail] = useState(accountData.email);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailNotice, setEmailNotice] = useState(false);

  const handleSave = async () => {
    if (!onUpdateAccount) return;
    const emailChanged = email.trim() !== accountData.email;
    setIsSaving(true);
    try {
      await onUpdateAccount({ name, email: email.trim(), password });
      setIsEditing(false);
      setPassword('');
      if (emailChanged) setEmailNotice(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(accountData.name);
    setEmail(accountData.email);
    setPassword('');
    setShowPassword(false);
    setIsEditing(false);
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="person-outline" size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.sectionTitle}>Account</Text>
      </View>

      {isEditing ? (
        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.label}>New password (leave blank to keep current)</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85} disabled={isSaving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.display}>
          <Text style={styles.displayLabel}>Name</Text>
          <Text style={styles.displayValue}>{accountData.name}</Text>
          <Text style={styles.displayLabel}>Email</Text>
          <Text style={styles.displayValue}>{accountData.email}</Text>
          {emailNotice && (
            <View style={styles.emailNotice}>
              <Ionicons name="mail-outline" size={16} color="#5F8575" />
              <Text style={styles.emailNoticeText}>Check your new email address to confirm the change.</Text>
            </View>
          )}
          {onUpdateAccount && (
            <TouchableOpacity style={styles.editBtn} onPress={() => { setEmailNotice(false); setIsEditing(true); }} activeOpacity={0.85}>
              <Ionicons name="pencil-outline" size={18} color="#7B9B8C" />
              <Text style={styles.editBtnText}>Edit account</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(123, 155, 140, 0.3)',
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7B9B8C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#2D4A3E',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  form: {
    gap: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  label: {
    fontSize: 12,
    color: '#6B8B7D',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  input: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(123, 155, 140, 0.3)',
    fontSize: 15,
    color: '#2D4A3E',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8D5CF',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    color: '#6B7370',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#5F8575',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  display: {
    gap: 4,
  },
  displayLabel: {
    fontSize: 12,
    color: '#6B8B7D',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  displayValue: {
    fontSize: 15,
    color: '#2D4A3E',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  editBtnText: {
    fontSize: 14,
    color: '#7B9B8C',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  emailNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: 'rgba(95,133,117,0.3)',
  },
  emailNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#2D4A3E',
    lineHeight: 18,
  },
});
