import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { G } from '../constants/Gradients';

interface Product {
  id: string;
  name: string;
  brand: string;
  instructions: string;
  timeOfDay: 'am' | 'pm' | 'both';
  step: string;
}

interface DermatologistPlanUploadProps {
  onBack: () => void;
  onContinue: () => void;
  onUpload: (products: Product[]) => void;
}

const ROUTINE_STEPS = [
  'Cleanser',
  'Toner',
  'Treatment/Serum',
  'Spot treatment',
  'Moisturizer',
  'Sunscreen',
  'Other',
];

const TIME_OPTIONS = [
  { value: 'both', label: 'Morning & Evening' },
  { value: 'am', label: 'Morning only' },
  { value: 'pm', label: 'Evening only' },
];

export function DermatologistPlanUpload({ onBack, onContinue, onUpload }: DermatologistPlanUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStepPicker, setShowStepPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    brand: '',
    instructions: '',
    timeOfDay: 'both' as 'am' | 'pm' | 'both',
    step: '',
  });

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access photos is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = () => {
    if (!currentProduct.name.trim() || !currentProduct.step.trim()) return;

    const newProduct: Product = {
      id: Date.now().toString(),
      name: currentProduct.name.trim(),
      brand: currentProduct.brand.trim(),
      instructions: currentProduct.instructions.trim(),
      timeOfDay: currentProduct.timeOfDay,
      step: currentProduct.step.trim(),
    };

    setProducts([...products, newProduct]);
    setCurrentProduct({
      name: '',
      brand: '',
      instructions: '',
      timeOfDay: 'both',
      step: '',
    });
    setShowAddProduct(false);
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleComplete = () => {
    if (products.length === 0) {
      alert('Please add at least one product from your dermatologist plan');
      return;
    }
    onUpload(products);
    onContinue();
  };

  const handleSkipForNow = () => {
    onContinue();
  };

  const getTimeLabel = (value: 'am' | 'pm' | 'both') => {
    return TIME_OPTIONS.find(o => o.value === value)?.label || 'Morning & Evening';
  };

  return (
    <LinearGradient colors={G.pageDerm.colors} start={G.pageDerm.start} end={G.pageDerm.end} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#6B7370" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>dermatologist plan</Text>
        <View style={styles.spacer} />
      </View>
      <Text style={styles.headerSubtitle}>
        upload your treatment plan and add your prescribed products
      </Text>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Upload Photos Section */}
        <LinearGradient colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>treatment plan photos</Text>
            <Text style={styles.optionalLabel}>(optional)</Text>
          </View>
          <Text style={styles.sectionDescription}>
            take photos of your dermatologist's treatment plan, prescription, or product instructions for your records
          </Text>

          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="cloud-upload-outline" size={32} color="#5F8575" />
            <Text style={styles.uploadButtonText}>tap to upload photos</Text>
          </TouchableOpacity>

          {uploadedImages.length > 0 && (
            <View style={styles.imageGrid}>
              {uploadedImages.map((img, idx) => (
                <View key={idx} style={styles.imageContainer}>
                  <Image source={{ uri: img }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(idx)}
                  >
                    <Ionicons name="close" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Products Section */}
        <LinearGradient colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>prescribed products</Text>
            <Text style={styles.countLabel}>({products.length})</Text>
          </View>
          <Text style={styles.sectionDescription}>
            add the products your dermatologist prescribed or recommended
          </Text>

          {!showAddProduct && (
            <TouchableOpacity
              style={styles.addProductButton}
              onPress={() => setShowAddProduct(true)}
            >
              <LinearGradient colors={G.btnGreenDark.colors} start={G.btnGreenDark.start} end={G.btnGreenDark.end} style={{ flex: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addProductButtonText}>add product</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Add Product Form */}
          {showAddProduct && (
            <LinearGradient colors={G.cardSuccess.colors} start={G.cardSuccess.start} end={G.cardSuccess.end} style={styles.addProductForm}>
              <Text style={styles.formTitle}>add prescribed product</Text>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>product name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Tretinoin 0.025% Cream"
                  placeholderTextColor="#8A9088"
                  value={currentProduct.name}
                  onChangeText={(text) => setCurrentProduct({ ...currentProduct, name: text })}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>brand (optional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Generic, Retin-A"
                  placeholderTextColor="#8A9088"
                  value={currentProduct.brand}
                  onChangeText={(text) => setCurrentProduct({ ...currentProduct, brand: text })}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>routine step *</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowStepPicker(true)}
                >
                  <Text style={currentProduct.step ? styles.pickerText : styles.pickerPlaceholder}>
                    {currentProduct.step || 'select step...'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7370" />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>when to use</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.pickerText}>
                    {getTimeLabel(currentProduct.timeOfDay)}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7370" />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>instructions (optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="e.g., Apply pea-sized amount to entire face"
                  placeholderTextColor="#8A9088"
                  value={currentProduct.instructions}
                  onChangeText={(text) => setCurrentProduct({ ...currentProduct, instructions: text })}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity style={styles.formAddButton} onPress={handleAddProduct}>
                  <LinearGradient colors={G.btnGreenDark.colors} start={G.btnGreenDark.start} end={G.btnGreenDark.end} style={{ flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' }}>
                  <Text style={styles.formAddButtonText}>add</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.formCancelButton}
                  onPress={() => {
                    setShowAddProduct(false);
                    setCurrentProduct({
                      name: '',
                      brand: '',
                      instructions: '',
                      timeOfDay: 'both',
                      step: '',
                    });
                  }}
                >
                  <Text style={styles.formCancelButtonText}>cancel</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          )}

          {/* Products List */}
          {products.length > 0 && (
            <View style={styles.productsList}>
              {products.map((product) => (
                <LinearGradient key={product.id} colors={G.cardWhite.colors} start={G.cardWhite.start} end={G.cardWhite.end} style={styles.productCard}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    {product.brand && (
                      <Text style={styles.productBrand}>{product.brand}</Text>
                    )}
                    <View style={styles.productMeta}>
                      <Text style={styles.productStep}>{product.step}</Text>
                      <Text style={styles.productDot}>•</Text>
                      <Text style={styles.productTime}>
                        {product.timeOfDay === 'both' ? 'AM & PM' : product.timeOfDay === 'am' ? 'AM only' : 'PM only'}
                      </Text>
                    </View>
                    {product.instructions && (
                      <Text style={styles.productInstructions}>"{product.instructions}"</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removeProductButton}
                    onPress={() => handleRemoveProduct(product.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#6B7370" />
                  </TouchableOpacity>
                </LinearGradient>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Info Box */}
        <LinearGradient colors={G.infoGreen.colors} start={G.infoGreen.start} end={G.infoGreen.end} style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 your dermatologist-prescribed routine will be used instead of gia's OTC recommendations. you can always edit this in settings.
          </Text>
        </LinearGradient>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {products.length > 0 && (
            <TouchableOpacity style={styles.continueButton} onPress={handleComplete}>
              <LinearGradient colors={G.btnGreenDark.colors} start={G.btnGreenDark.start} end={G.btnGreenDark.end} style={{ flex: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 }}>
              <Text style={styles.continueButtonText}>continue with my plan</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.skipButton, products.length > 0 && styles.skipButtonHalf]}
            onPress={handleSkipForNow}
          >
            <Text style={styles.skipButtonText}>
              {products.length === 0 ? 'add plan later' : "i'll do this later"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Step Picker Modal */}
      <Modal visible={showStepPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Step</Text>
              <TouchableOpacity onPress={() => setShowStepPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7370" />
              </TouchableOpacity>
            </View>
            {ROUTINE_STEPS.map((step) => (
              <TouchableOpacity
                key={step}
                style={styles.pickerOption}
                onPress={() => {
                  setCurrentProduct({ ...currentProduct, step });
                  setShowStepPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{step}</Text>
                {currentProduct.step === step && (
                  <Ionicons name="checkmark" size={20} color="#5F8575" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>When to Use</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close" size={24} color="#6B7370" />
              </TouchableOpacity>
            </View>
            {TIME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.pickerOption}
                onPress={() => {
                  setCurrentProduct({ ...currentProduct, timeOfDay: option.value as 'am' | 'pm' | 'both' });
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{option.label}</Text>
                {currentProduct.timeOfDay === option.value && (
                  <Ionicons name="checkmark" size={20} color="#5F8575" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D8D5CF',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: '#5F8575',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  spacer: {
    width: 32,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7370',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D8D5CF',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#5F8575',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  optionalLabel: {
    fontSize: 12,
    color: '#6B7370',
    fontStyle: 'italic',
  },
  countLabel: {
    fontSize: 12,
    color: '#6B7370',
    fontStyle: 'italic',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#6B7370',
    marginBottom: 16,
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D8D5CF',
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#5F8575',
    fontStyle: 'italic',
    marginTop: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  imageContainer: {
    position: 'relative',
    width: '47%',
  },
  uploadedImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8D5CF',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  addProductButton: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  addProductButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  addProductForm: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(95, 133, 117, 0.2)',
    overflow: 'hidden',
  },
  formTitle: {
    fontSize: 14,
    color: '#5F8575',
    fontStyle: 'italic',
    fontWeight: '500',
    marginBottom: 12,
  },
  formField: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    color: '#6B7370',
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D5CF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#5F8575',
  },
  textArea: {
    minHeight: 60,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D5CF',
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    fontSize: 14,
    color: '#5F8575',
  },
  pickerPlaceholder: {
    fontSize: 14,
    color: '#8A9088',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  formAddButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  formAddButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  formCancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  formCancelButtonText: {
    fontSize: 14,
    color: '#6B7370',
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D8D5CF',
    overflow: 'hidden',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    color: '#5F8575',
    fontWeight: '500',
  },
  productBrand: {
    fontSize: 12,
    color: '#6B7370',
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  productStep: {
    fontSize: 12,
    color: '#6B7370',
    fontStyle: 'italic',
  },
  productDot: {
    fontSize: 12,
    color: '#6B7370',
    marginHorizontal: 4,
  },
  productTime: {
    fontSize: 12,
    color: '#6B7370',
    fontStyle: 'italic',
  },
  productInstructions: {
    fontSize: 12,
    color: '#6B7370',
    fontStyle: 'italic',
    marginTop: 8,
  },
  removeProductButton: {
    padding: 4,
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(95, 133, 117, 0.1)',
    overflow: 'hidden',
  },
  infoText: {
    fontSize: 12,
    color: '#6B7370',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  continueButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  skipButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D8D5CF',
  },
  skipButtonHalf: {
    flex: 1,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7370',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D5CF',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5F8575',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#5F8575',
  },
});
