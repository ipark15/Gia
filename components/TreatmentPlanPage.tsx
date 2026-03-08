import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getProductRecommendations } from './TreatmentProducts';

export interface TreatmentPlanPageProps {
  planId: string;
  onBack: () => void;
  onManageRules?: () => void;
  /** When true, hide the top header (back + title). Use when embedded in a tabbed screen. */
  hideHeader?: boolean;
}

interface Product {
  brand: string;
  name: string;
  keyIngredient: string;
  amazonUrl?: string;
  note?: string;
}

interface RoutineStep {
  step: string;
  products: Product[];
}

function getProductUrl(product: { brand: string; name: string; amazonUrl?: string }): string {
  if (product.amazonUrl) {
    return product.amazonUrl;
  }
  const searchQuery = encodeURIComponent(`${product.brand} ${product.name}`);
  return `https://www.amazon.com/s?k=${searchQuery}`;
}

export function TreatmentPlanPage({ planId, onBack, onManageRules, hideHeader }: TreatmentPlanPageProps) {
  const { amRoutine, pmRoutine } = getProductRecommendations(planId);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedAmRoutine, setEditedAmRoutine] = useState<RoutineStep[]>(amRoutine);
  const [editedPmRoutine, setEditedPmRoutine] = useState<RoutineStep[]>(pmRoutine);
  const [editingProduct, setEditingProduct] = useState<{
    routine: 'am' | 'pm';
    stepIndex: number;
    productIndex: number;
  } | null>(null);

  const [productForm, setProductForm] = useState({
    brand: '',
    name: '',
    keyIngredient: '',
    amazonUrl: '',
    note: '',
  });

  const handleSaveChanges = () => {
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditedAmRoutine(amRoutine);
    setEditedPmRoutine(pmRoutine);
    setIsEditMode(false);
    setEditingProduct(null);
  };

  const addStep = (routine: 'am' | 'pm') => {
    const newStep: RoutineStep = { step: 'New step', products: [] };
    if (routine === 'am') {
      setEditedAmRoutine([...editedAmRoutine, newStep]);
    } else {
      setEditedPmRoutine([...editedPmRoutine, newStep]);
    }
  };

  const removeStep = (routine: 'am' | 'pm', index: number) => {
    if (routine === 'am') {
      setEditedAmRoutine(editedAmRoutine.filter((_, i) => i !== index));
    } else {
      setEditedPmRoutine(editedPmRoutine.filter((_, i) => i !== index));
    }
  };

  const updateStepName = (routine: 'am' | 'pm', index: number, newName: string) => {
    if (routine === 'am') {
      const updated = [...editedAmRoutine];
      updated[index].step = newName;
      setEditedAmRoutine(updated);
    } else {
      const updated = [...editedPmRoutine];
      updated[index].step = newName;
      setEditedPmRoutine(updated);
    }
  };

  const addProduct = (routine: 'am' | 'pm', stepIndex: number) => {
    const newProduct: Product = {
      brand: 'New brand',
      name: 'New product',
      keyIngredient: 'Add ingredient',
    };
    if (routine === 'am') {
      const updated = [...editedAmRoutine];
      updated[stepIndex].products.push(newProduct);
      setEditedAmRoutine(updated);
    } else {
      const updated = [...editedPmRoutine];
      updated[stepIndex].products.push(newProduct);
      setEditedPmRoutine(updated);
    }
  };

  const removeProduct = (routine: 'am' | 'pm', stepIndex: number, productIndex: number) => {
    if (routine === 'am') {
      const updated = [...editedAmRoutine];
      updated[stepIndex].products = updated[stepIndex].products.filter((_, i) => i !== productIndex);
      setEditedAmRoutine(updated);
    } else {
      const updated = [...editedPmRoutine];
      updated[stepIndex].products = updated[stepIndex].products.filter((_, i) => i !== productIndex);
      setEditedPmRoutine(updated);
    }
  };

  const startEditingProduct = (routine: 'am' | 'pm', stepIndex: number, productIndex: number) => {
    const product =
      routine === 'am'
        ? editedAmRoutine[stepIndex].products[productIndex]
        : editedPmRoutine[stepIndex].products[productIndex];

    setProductForm({
      brand: product.brand,
      name: product.name,
      keyIngredient: product.keyIngredient,
      amazonUrl: product.amazonUrl || '',
      note: product.note || '',
    });
    setEditingProduct({ routine, stepIndex, productIndex });
  };

  const saveProductEdit = () => {
    if (!editingProduct) return;
    const { routine, stepIndex, productIndex } = editingProduct;
    const updatedProduct: Product = {
      brand: productForm.brand,
      name: productForm.name,
      keyIngredient: productForm.keyIngredient,
      amazonUrl: productForm.amazonUrl || undefined,
      note: productForm.note || undefined,
    };
    if (routine === 'am') {
      const updated = [...editedAmRoutine];
      updated[stepIndex].products[productIndex] = updatedProduct;
      setEditedAmRoutine(updated);
    } else {
      const updated = [...editedPmRoutine];
      updated[stepIndex].products[productIndex] = updatedProduct;
      setEditedPmRoutine(updated);
    }
    setEditingProduct(null);
    setProductForm({ brand: '', name: '', keyIngredient: '', amazonUrl: '', note: '' });
  };

  const displayAmRoutine = isEditMode ? editedAmRoutine : amRoutine;
  const displayPmRoutine = isEditMode ? editedPmRoutine : pmRoutine;

  const openProduct = (product: Product) => {
    Linking.openURL(getProductUrl(product));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!hideHeader && (
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={24} color="#7B9B8C" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.headerIcon}>
                <Ionicons name="document-text" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.headerTitle}>My treatment plan</Text>
            </View>
            {onManageRules ? (
              <TouchableOpacity onPress={onManageRules} style={styles.headerSettings} activeOpacity={0.8}>
                <Ionicons name="settings-outline" size={22} color="#7B9B8C" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>
        )}

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#5F8575" />
          <Text style={styles.infoText}>
            Evidence-based products recommended by dermatologists for your skin concerns
          </Text>
        </View>

        {/* Edit toggle */}
        {!isEditMode ? (
          <TouchableOpacity style={styles.editCta} onPress={() => setIsEditMode(true)} activeOpacity={0.9}>
            <View style={styles.editIconWrap}>
              <Ionicons name="pencil" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.editTitle}>Customize treatment plan</Text>
              <Text style={styles.editSubtitle}>Add, remove or edit steps and products</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActionsRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges} activeOpacity={0.9}>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelEditBtn} onPress={handleCancelEdit} activeOpacity={0.9}>
              <Ionicons name="close" size={20} color="#6B8B7D" />
            </TouchableOpacity>
          </View>
        )}

        {/* Morning routine */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Morning routine</Text>
            {isEditMode && (
              <TouchableOpacity style={styles.addStepBtn} onPress={() => addStep('am')} activeOpacity={0.85}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addStepText}>Add step</Text>
              </TouchableOpacity>
            )}
          </View>
          {displayAmRoutine.map((rec, idx) => (
            <View key={idx} style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                {isEditMode ? (
                  <TextInput
                    style={styles.stepNameInput}
                    value={rec.step}
                    onChangeText={(text) => updateStepName('am', idx, text)}
                    placeholder="Step name"
                    placeholderTextColor="#9CA3AF"
                  />
                ) : (
                  <Text style={styles.stepNameText}>
                    Step {idx + 1}: {rec.step}
                  </Text>
                )}
                {isEditMode && (
                  <TouchableOpacity
                    onPress={() => removeStep('am', idx)}
                    style={styles.removeStepBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={16} color="#E11D48" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.productsBlock}>
                {rec.products.map((product, pidx) => (
                  <View key={pidx} style={styles.productRow}>
                    <View style={styles.productTextBlock}>
                      <Text style={styles.productBrand}>{product.brand}</Text>
                      <Text style={styles.productName}>{product.name}</Text>
                    </View>
                    <View style={styles.productActions}>
                      {isEditMode && (
                        <>
                          <TouchableOpacity
                            style={styles.iconSmallBtn}
                            onPress={() => startEditingProduct('am', idx, pidx)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="pencil" size={14} color="#5F8575" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconSmallBtn}
                            onPress={() => removeProduct('am', idx, pidx)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="trash-outline" size={14} color="#E11D48" />
                          </TouchableOpacity>
                        </>
                      )}
                      {!isEditMode && product.brand !== 'N/A' && (
                        <TouchableOpacity
                          style={styles.buyCta}
                          onPress={() => openProduct(product)}
                          activeOpacity={0.9}
                        >
                          <Ionicons name="cube-outline" size={14} color="#FFFFFF" />
                          <Text style={styles.buyCtaText}>Buy</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                {isEditMode && (
                  <TouchableOpacity
                    style={styles.addProductBtn}
                    onPress={() => addProduct('am', idx)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={16} color="#5F8575" />
                    <Text style={styles.addProductText}>Add product</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Evening routine */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Evening routine</Text>
            {isEditMode && (
              <TouchableOpacity style={styles.addStepBtn} onPress={() => addStep('pm')} activeOpacity={0.85}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addStepText}>Add step</Text>
              </TouchableOpacity>
            )}
          </View>
          {displayPmRoutine.map((rec, idx) => (
            <View key={idx} style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                {isEditMode ? (
                  <TextInput
                    style={styles.stepNameInput}
                    value={rec.step}
                    onChangeText={(text) => updateStepName('pm', idx, text)}
                    placeholder="Step name"
                    placeholderTextColor="#9CA3AF"
                  />
                ) : (
                  <Text style={styles.stepNameText}>
                    Step {idx + 1}: {rec.step}
                  </Text>
                )}
                {isEditMode && (
                  <TouchableOpacity
                    onPress={() => removeStep('pm', idx)}
                    style={styles.removeStepBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={16} color="#E11D48" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.productsBlock}>
                {rec.products.map((product, pidx) => (
                  <View key={pidx} style={styles.productRow}>
                    <View style={styles.productTextBlock}>
                      <Text style={styles.productBrand}>{product.brand}</Text>
                      <Text style={styles.productName}>{product.name}</Text>
                    </View>
                    <View style={styles.productActions}>
                      {isEditMode && (
                        <>
                          <TouchableOpacity
                            style={styles.iconSmallBtn}
                            onPress={() => startEditingProduct('pm', idx, pidx)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="pencil" size={14} color="#5F8575" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconSmallBtn}
                            onPress={() => removeProduct('pm', idx, pidx)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="trash-outline" size={14} color="#E11D48" />
                          </TouchableOpacity>
                        </>
                      )}
                      {!isEditMode && product.brand !== 'N/A' && (
                        <TouchableOpacity
                          style={styles.buyCta}
                          onPress={() => openProduct(product)}
                          activeOpacity={0.9}
                        >
                          <Ionicons name="cube-outline" size={14} color="#FFFFFF" />
                          <Text style={styles.buyCtaText}>Buy</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                {isEditMode && (
                  <TouchableOpacity
                    style={styles.addProductBtn}
                    onPress={() => addProduct('pm', idx)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={16} color="#5F8575" />
                    <Text style={styles.addProductText}>Add product</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Product edit modal */}
      <Modal visible={!!editingProduct} transparent animationType="fade" onRequestClose={() => setEditingProduct(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit product</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingProduct(null);
                  setProductForm({ brand: '', name: '', keyIngredient: '', amazonUrl: '', note: '' });
                }}
                hitSlop={12}
              >
                <Ionicons name="close" size={22} color="#6B8B7D" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Brand</Text>
                <TextInput
                  style={styles.modalInput}
                  value={productForm.brand}
                  onChangeText={(text) => setProductForm({ ...productForm, brand: text })}
                  placeholder="Brand"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Product name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={productForm.name}
                  onChangeText={(text) => setProductForm({ ...productForm, name: text })}
                  placeholder="Product name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Key ingredient</Text>
                <TextInput
                  style={styles.modalInput}
                  value={productForm.keyIngredient}
                  onChangeText={(text) => setProductForm({ ...productForm, keyIngredient: text })}
                  placeholder="e.g., Niacinamide"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Amazon URL (optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={productForm.amazonUrl}
                  onChangeText={(text) => setProductForm({ ...productForm, amazonUrl: text })}
                  placeholder="https://amazon.com/..."
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Note (optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputMultiline]}
                  value={productForm.note}
                  onChangeText={(text) => setProductForm({ ...productForm, note: text })}
                  placeholder="e.g., Use only at night"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveProductEdit} activeOpacity={0.9}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setEditingProduct(null);
                  setProductForm({ brand: '', name: '', keyIngredient: '', amazonUrl: '', note: '' });
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F0DC' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
  },
  backBtn: { padding: 8, borderRadius: 999 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7B9B8C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, color: '#2D4A3E', fontStyle: 'italic', fontWeight: '600' },
  headerSettings: { padding: 8, borderRadius: 999 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(123,155,140,0.3)',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#2D4A3E' },
  statLabel: { fontSize: 12, color: '#6B8B7D', fontStyle: 'italic' },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: 'rgba(123,155,140,0.3)',
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 13, color: '#2D4A3E', fontStyle: 'italic' },

  editCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#7B9B8C',
    marginBottom: 20,
  },
  editIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editTitle: { fontSize: 15, color: '#FFFFFF', fontStyle: 'italic', fontWeight: '600' },
  editSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  editActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#5F8575',
  },
  saveBtnText: { fontSize: 15, color: '#FFFFFF', fontStyle: 'italic', fontWeight: '600' },
  cancelEditBtn: {
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
  },

  section: { marginBottom: 20 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, color: '#7B9B8C', fontStyle: 'italic', fontWeight: '600' },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#95C98E',
  },
  addStepText: { fontSize: 12, color: '#FFFFFF', fontStyle: 'italic' },

  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D8D5CF',
    marginBottom: 12,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepNameInput: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: '#95C98E',
    fontSize: 14,
    color: '#2D4A3E',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  stepNameText: { fontSize: 14, color: '#7B9B8C', fontWeight: '600' },
  removeStepBtn: { padding: 6, borderRadius: 8, backgroundColor: 'rgba(248,113,113,0.08)' },

  productsBlock: { marginTop: 4, gap: 8 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderLeftWidth: 2,
    borderLeftColor: '#D8D5CF',
    paddingLeft: 10,
    paddingVertical: 6,
  },
  productTextBlock: { flex: 1, marginRight: 8 },
  productBrand: { fontSize: 13, color: '#7B9B8C', fontWeight: '600' },
  productName: { fontSize: 12, color: '#6B7370', marginTop: 2 },
  productActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconSmallBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
  },
  buyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#5F8575',
  },
  buyCtaText: { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },
  addProductBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#95C98E',
  },
  addProductText: { fontSize: 12, color: '#5F8575', fontStyle: 'italic' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(123,155,140,0.3)',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D5CF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 18, color: '#2D4A3E', fontStyle: 'italic', fontWeight: '600' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  modalField: {},
  modalLabel: { fontSize: 12, color: '#6B8B7D', marginBottom: 4, fontStyle: 'italic' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D8D5CF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D4A3E',
  },
  modalInputMultiline: { height: 80 },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#D8D5CF',
    gap: 12,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#5F8575',
    alignItems: 'center',
  },
  modalSaveText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: { fontSize: 14, color: '#6B8B7D' },
});

