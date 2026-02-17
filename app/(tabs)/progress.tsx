import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - 48 - 12) / 2; // 24px padding on each side, 12px gap

interface ProgressPhoto {
  id: string;
  date: string;
  imageUrl: string;
  notes?: string;
}

export default function ProgressScreen() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([
    {
      id: '1',
      date: '2026-01-01',
      imageUrl: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&h=400&fit=crop',
      notes: 'Starting my journey',
    },
    {
      id: '2',
      date: '2026-01-08',
      imageUrl: 'https://images.unsplash.com/photo-1629095923147-53d986573d57?w=400&h=400&fit=crop',
      notes: 'Week 1 - seeing some improvement',
    },
  ]);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [newNotes, setNewNotes] = useState('');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: ProgressPhoto = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        imageUrl: result.assets[0].uri,
        notes: newNotes,
      };
      setPhotos([...photos, newPhoto]);
      setShowUpload(false);
      setNewNotes('');
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: ProgressPhoto = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        imageUrl: result.assets[0].uri,
        notes: newNotes,
      };
      setPhotos([...photos, newPhoto]);
      setShowUpload(false);
      setNewNotes('');
    }
  };

  const formatDate = (dateString: string, format: 'full' | 'short') => {
    const date = new Date(dateString);
    if (format === 'full') {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const sortedPhotos = [...photos].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Track Your Progress</Text>
          <Text style={styles.subtitle}>
            Document your skincare journey with photos and notes
          </Text>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setShowUpload(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
          <Text style={styles.uploadButtonText}>Upload New Photo</Text>
        </TouchableOpacity>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Your Journey</Text>

          {photos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={48} color="#D8D5CF" />
              <Text style={styles.emptyStateText}>No photos yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start documenting your skincare journey
              </Text>
            </View>
          ) : (
            <View style={styles.photoGrid}>
              {sortedPhotos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoCard}
                  onPress={() => setSelectedPhoto(photo)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: photo.imageUrl }}
                    style={styles.photoImage}
                  />
                  <View style={styles.photoOverlay}>
                    <Text style={styles.photoDate}>{formatDate(photo.date, 'short')}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Photo Tips</Text>
          <Text style={styles.tipItem}>• Take photos in the same lighting each time</Text>
          <Text style={styles.tipItem}>• Use the same angle and distance</Text>
          <Text style={styles.tipItem}>• Take photos at the same time of day</Text>
          <Text style={styles.tipItem}>• Progress takes time - be patient with yourself</Text>
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUpload}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpload(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Progress Photo</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowUpload(false);
                  setNewNotes('');
                }}
              >
                <Ionicons name="close" size={24} color="#6B7370" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Add Notes (Optional)</Text>
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

              <Text style={styles.inputLabel}>Choose Photo</Text>
              <View style={styles.photoOptions}>
                <TouchableOpacity
                  style={styles.photoOptionButton}
                  onPress={takePhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={32} color="#7B9B8C" />
                  <Text style={styles.photoOptionText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoOptionButton}
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="images-outline" size={32} color="#7B9B8C" />
                  <Text style={styles.photoOptionText}>Choose from Library</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.photoTip}>
                Take a photo in consistent lighting for best results
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Detail Modal */}
      <Modal
        visible={selectedPhoto !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Progress Photo</Text>
                {selectedPhoto && (
                  <Text style={styles.modalSubtitle}>
                    {formatDate(selectedPhoto.date, 'full')}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
                <Ionicons name="close" size={24} color="#6B7370" />
              </TouchableOpacity>
            </View>

            {selectedPhoto && (
              <ScrollView style={styles.modalBody}>
                <Image
                  source={{ uri: selectedPhoto.imageUrl }}
                  style={styles.detailImage}
                />
                {selectedPhoto.notes && (
                  <View style={styles.notesCard}>
                    <Text style={styles.notesText}>{selectedPhoto.notes}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#5A7A6B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7370',
    textAlign: 'center',
    lineHeight: 24,
  },
  uploadButton: {
    backgroundColor: '#7B9B8C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timelineSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7B9B8C',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D8D5CF',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7370',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8A9088',
    marginTop: 4,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D8D5CF',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
  },
  photoDate: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D8D5CF',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B9B8C',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: '#6B7370',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DED0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7B9B8C',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7370',
    marginTop: 4,
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7B9B8C',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 2,
    borderColor: '#D8D5CF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#5A7A6B',
    minHeight: 80,
    marginBottom: 20,
  },
  photoOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoOptionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  photoOptionText: {
    fontSize: 14,
    color: '#7B9B8C',
    marginTop: 8,
    textAlign: 'center',
  },
  photoTip: {
    fontSize: 12,
    color: '#8A9088',
    textAlign: 'center',
  },
  detailImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  notesCard: {
    backgroundColor: '#F5F5F0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4E3DB',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7370',
    lineHeight: 22,
  },
});
