import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
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

export interface OwnedProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  dateAdded: string;
}

export interface CustomShoppingItem {
  id: string;
  brand: string;
  name: string;
  keyIngredient?: string;
  note?: string;
  dateAdded: string;
}

export interface InventoryProps {
  onBack: () => void;
  planId: string;
  ownedProducts: OwnedProduct[];
  onUpdateOwnedProducts: (products: OwnedProduct[]) => void;
  dermatologistProducts?: Array<{
    id: string;
    name: string;
    brand: string;
    instructions: string;
    timeOfDay: 'am' | 'pm' | 'both';
    step: string;
  }>;
}

function getProductUrl(product: { brand: string; name: string; amazonUrl?: string }): string {
  if (product.amazonUrl) return product.amazonUrl;
  const searchQuery = product.brand
    ? encodeURIComponent(`${product.brand} ${product.name}`)
    : encodeURIComponent(product.name);
  return `https://www.amazon.com/s?k=${searchQuery}`;
}

export function Inventory({
  onBack,
  planId,
  ownedProducts,
  onUpdateOwnedProducts,
  dermatologistProducts,
}: InventoryProps) {
  const [activeTab, setActiveTab] = useState<'owned' | 'shopping'>('owned');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customBrand, setCustomBrand] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('other');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [showAddCustomShopping, setShowAddCustomShopping] = useState(false);
  const [customShoppingBrand, setCustomShoppingBrand] = useState('');
  const [customShoppingName, setCustomShoppingName] = useState('');
  const [customShoppingIngredient, setCustomShoppingIngredient] = useState('');
  const [customShoppingItems, setCustomShoppingItems] = useState<CustomShoppingItem[]>([]);
  const [deletedRecommendedIds, setDeletedRecommendedIds] = useState<Set<string>>(new Set());

  const { amRoutine, pmRoutine } = useMemo(
    () => getProductRecommendations(planId),
    [planId]
  );

  const allRecommended = useMemo(
    () =>
      [...amRoutine, ...pmRoutine].flatMap((step) =>
        step.products.filter((p) => p.brand !== 'N/A')
      ),
    [amRoutine, pmRoutine]
  );
  const allSteps = useMemo(() => [...amRoutine, ...pmRoutine], [amRoutine, pmRoutine]);
  const uniqueSteps = useMemo(
    () => Array.from(new Set(allSteps.map((s) => s.step))),
    [allSteps]
  );
  const uniqueRecommended = useMemo(
    () =>
      allRecommended.filter(
        (product, index, self) =>
          index === self.findIndex((p) => p.brand === product.brand && p.name === product.name)
      ),
    [allRecommended]
  );

  const shoppingList = useMemo(() => {
    if (dermatologistProducts && dermatologistProducts.length > 0) {
      return dermatologistProducts
        .filter(
          (dermProduct) =>
            !ownedProducts.some((owned) => {
              const dermBrand = (dermProduct.brand || dermProduct.step || 'Custom').toLowerCase();
              const dermName = dermProduct.name.toLowerCase();
              const ownedBrand = owned.brand.toLowerCase();
              const ownedName = owned.name.toLowerCase();
              return ownedBrand === dermBrand && ownedName === dermName;
            })
        )
        .map((dermProduct) => ({
          brand: dermProduct.brand || '',
          name: dermProduct.name,
          keyIngredient: 'Prescribed by dermatologist',
          step: dermProduct.step,
          category: dermProduct.step,
          note: dermProduct.instructions ? `Instructions: ${dermProduct.instructions}` : undefined,
        }));
    }
    return uniqueRecommended.filter(
      (recommended) =>
        !ownedProducts.some(
          (owned) => owned.brand === recommended.brand && owned.name === recommended.name
        ) && !deletedRecommendedIds.has(recommended.brand + recommended.name)
    );
  }, [dermatologistProducts, ownedProducts, uniqueRecommended, deletedRecommendedIds]);

  const handleAddCustomProduct = () => {
    if (!customBrand.trim() || !customName.trim()) return;
    const newProduct: OwnedProduct = {
      id: Date.now().toString(),
      brand: customBrand.trim(),
      name: customName.trim(),
      category: customCategory,
      dateAdded: new Date().toISOString(),
    };
    onUpdateOwnedProducts([...ownedProducts, newProduct]);
    setCustomBrand('');
    setCustomName('');
    setCustomCategory('other');
    setShowAddCustom(false);
  };

  const handleAddCustomShoppingItem = () => {
    if (!customShoppingBrand.trim() || !customShoppingName.trim()) return;
    const newProduct: CustomShoppingItem = {
      id: Date.now().toString(),
      brand: customShoppingBrand.trim(),
      name: customShoppingName.trim(),
      keyIngredient: customShoppingIngredient.trim(),
      dateAdded: new Date().toISOString(),
    };
    setCustomShoppingItems([...customShoppingItems, newProduct]);
    setCustomShoppingBrand('');
    setCustomShoppingName('');
    setCustomShoppingIngredient('');
    setShowAddCustomShopping(false);
  };

  const handleRemoveOwned = (id: string) => {
    onUpdateOwnedProducts(ownedProducts.filter((p) => p.id !== id));
  };

  const handleRemoveCustomShoppingItem = (id: string) => {
    setCustomShoppingItems(customShoppingItems.filter((p) => p.id !== id));
  };

  const handleAddToOwnedFromCustomShopping = (product: CustomShoppingItem) => {
    const newProduct: OwnedProduct = {
      id: Date.now().toString(),
      brand: product.brand,
      name: product.name,
      category: 'custom',
      dateAdded: new Date().toISOString(),
    };
    onUpdateOwnedProducts([...ownedProducts, newProduct]);
    handleRemoveCustomShoppingItem(product.id);
  };

  const handleAddToOwnedFromRecommended = (product: {
    brand: string;
    name: string;
    step?: string;
  }) => {
    const newProduct: OwnedProduct = {
      id: Date.now().toString(),
      brand: product.brand,
      name: product.name,
      category: product.step || 'other',
      dateAdded: new Date().toISOString(),
    };
    onUpdateOwnedProducts([...ownedProducts, newProduct]);
    setDeletedRecommendedIds((prev) => new Set([...prev, product.brand + product.name]));
  };

  const removeFromShoppingList = (product: { brand: string; name: string }) => {
    setDeletedRecommendedIds((prev) => new Set([...prev, product.brand + product.name]));
  };

  const openBuyUrl = (product: { brand: string; name: string; amazonUrl?: string }) => {
    Linking.openURL(getProductUrl(product));
  };

  const categoryOptions = [...uniqueSteps, 'other'];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backRow} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#6B8B7D" />
            <Text style={styles.backText}>back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My inventory</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'owned' && styles.tabActive]}
            onPress={() => setActiveTab('owned')}
            activeOpacity={0.85}
          >
            <Ionicons name="cube-outline" size={16} color={activeTab === 'owned' ? '#FFFFFF' : '#2D4A3E'} />
            <Text style={[styles.tabText, activeTab === 'owned' && styles.tabTextActive]}>
              Owned ({ownedProducts.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'shopping' && styles.tabActive]}
            onPress={() => setActiveTab('shopping')}
            activeOpacity={0.85}
          >
            <Ionicons name="cart-outline" size={16} color={activeTab === 'shopping' ? '#FFFFFF' : '#2D4A3E'} />
            <Text style={[styles.tabText, activeTab === 'shopping' && styles.tabTextActive]}>
              Shopping list ({shoppingList.length + customShoppingItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'owned' && (
          <View style={styles.tabContent}>
            {!showAddCustom && (
              <TouchableOpacity
                style={styles.addCustomBtn}
                onPress={() => setShowAddCustom(true)}
                activeOpacity={0.9}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addCustomBtnText}>add custom product</Text>
              </TouchableOpacity>
            )}

            {showAddCustom && (
              <View style={styles.addFormCard}>
                <Text style={styles.addFormTitle}>add custom product</Text>
                <TextInput
                  style={styles.input}
                  value={customBrand}
                  onChangeText={setCustomBrand}
                  placeholder="brand name"
                  placeholderTextColor="#9CA3AF"
                />
                <TextInput
                  style={styles.input}
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="product name"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.categoryTouch}
                  onPress={() => setShowCategoryPicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryTouchText}>{customCategory}</Text>
                  <Ionicons name="chevron-down" size={18} color="#6B8B7D" />
                </TouchableOpacity>
                <View style={styles.addFormActions}>
                  <TouchableOpacity style={styles.addFormAddBtn} onPress={handleAddCustomProduct} activeOpacity={0.9}>
                    <Text style={styles.addFormAddText}>add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addFormCancelBtn}
                    onPress={() => {
                      setShowAddCustom(false);
                      setCustomBrand('');
                      setCustomName('');
                      setCustomCategory('other');
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.addFormCancelText}>cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {ownedProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color="#C9CBD5" />
                <Text style={styles.emptyTitle}>No products yet</Text>
                <Text style={styles.emptySubtitle}>Add from your shopping list or customize</Text>
              </View>
            ) : (
              <View style={styles.productList}>
                {ownedProducts.map((product) => (
                  <View key={product.id} style={styles.ownedCard}>
                    <View style={styles.ownedCardInner}>
                      <View style={styles.ownedCardContent}>
                        <View style={styles.ownedCardRow}>
                          <Ionicons name="checkmark-circle" size={16} color="#5F8575" />
                          <Text style={styles.ownedBrand}>{product.brand}</Text>
                        </View>
                        <Text style={styles.ownedName}>{product.name}</Text>
                        <Text style={styles.ownedMeta}>
                          {product.category} • Added {new Date(product.dateAdded).toLocaleDateString()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveOwned(product.id)}
                        style={styles.removeIconBtn}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash-outline" size={16} color="#E11D48" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'shopping' && (
          <View style={styles.tabContent}>
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                {dermatologistProducts && dermatologistProducts.length > 0
                  ? 'Your dermatologist-prescribed products. Tap "I have this" to add to inventory.'
                  : 'Evidence-based products for your treatment plan. Tap "I have this" to add to inventory.'}
              </Text>
            </View>
            <View style={styles.disclaimerBanner}>
              <Text style={styles.disclaimerText}>
                Gia does not endorse or promote any skincare brands or retailers, and we do not monetize through ads.
              </Text>
            </View>

            {!showAddCustomShopping && (
              <TouchableOpacity
                style={styles.addCustomBtn}
                onPress={() => setShowAddCustomShopping(true)}
                activeOpacity={0.9}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addCustomBtnText}>add custom shopping item</Text>
              </TouchableOpacity>
            )}

            {showAddCustomShopping && (
              <View style={styles.addFormCard}>
                <Text style={styles.addFormTitle}>add custom shopping item</Text>
                <TextInput
                  style={styles.input}
                  value={customShoppingBrand}
                  onChangeText={setCustomShoppingBrand}
                  placeholder="brand name"
                  placeholderTextColor="#9CA3AF"
                />
                <TextInput
                  style={styles.input}
                  value={customShoppingName}
                  onChangeText={setCustomShoppingName}
                  placeholder="product name"
                  placeholderTextColor="#9CA3AF"
                />
                <TextInput
                  style={styles.input}
                  value={customShoppingIngredient}
                  onChangeText={setCustomShoppingIngredient}
                  placeholder="key ingredient"
                  placeholderTextColor="#9CA3AF"
                />
                <View style={styles.addFormActions}>
                  <TouchableOpacity style={styles.addFormAddBtn} onPress={handleAddCustomShoppingItem} activeOpacity={0.9}>
                    <Text style={styles.addFormAddText}>add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addFormCancelBtn}
                    onPress={() => {
                      setShowAddCustomShopping(false);
                      setCustomShoppingBrand('');
                      setCustomShoppingName('');
                      setCustomShoppingIngredient('');
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.addFormCancelText}>cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {customShoppingItems.length > 0 && (
              <View style={styles.shoppingSection}>
                {customShoppingItems.map((product) => (
                  <View key={product.id} style={styles.shoppingCard}>
                    <View style={styles.shoppingCardTop}>
                      <View style={styles.shoppingCardContent}>
                        <Text style={styles.shoppingBrand}>{product.brand}</Text>
                        <Text style={styles.shoppingName}>{product.name}</Text>
                        {product.keyIngredient ? (
                          <Text style={styles.shoppingKey}>
                            <Text style={styles.shoppingKeyLabel}>Key:</Text> {product.keyIngredient}
                          </Text>
                        ) : null}
                        {product.note ? (
                          <Text style={styles.shoppingNote}>⚠️ {product.note}</Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.shoppingActions}>
                      <TouchableOpacity
                        style={styles.iHaveBtn}
                        onPress={() => handleAddToOwnedFromCustomShopping(product)}
                        activeOpacity={0.9}
                      >
                        <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                        <Text style={styles.iHaveBtnText}>I have this</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemoveCustomShoppingItem(product.id)}
                        activeOpacity={0.9}
                      >
                        <Ionicons name="trash-outline" size={14} color="#2D4A3E" />
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {shoppingList.length === 0 && customShoppingItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={48} color="#C9CBD5" />
                <Text style={styles.emptyTitle}>Shopping list empty!</Text>
                <Text style={styles.emptySubtitle}>You have all recommended products</Text>
              </View>
            ) : (
              shoppingList.length > 0 && (
                <View style={styles.shoppingSection}>
                  {shoppingList.map((product, idx) => (
                    <View key={idx} style={styles.shoppingCard}>
                      <View style={styles.shoppingCardTop}>
                        <View style={styles.shoppingCardContent}>
                          <Text style={styles.shoppingBrand}>{product.category || product.brand}</Text>
                          {product.brand ? <Text style={styles.shoppingName}>{product.brand}</Text> : null}
                          <Text style={styles.shoppingName}>{product.name}</Text>
                          <Text style={styles.shoppingKey}>
                            <Text style={styles.shoppingKeyLabel}>Key:</Text> {product.keyIngredient}
                          </Text>
                          {product.note ? (
                            <Text style={styles.shoppingNote}>⚠️ {product.note}</Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          style={styles.removeIconBtn}
                          onPress={() => removeFromShoppingList(product)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="trash-outline" size={16} color="#E11D48" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.shoppingActions}>
                        <TouchableOpacity
                          style={styles.iHaveBtn}
                          onPress={() =>
                            handleAddToOwnedFromRecommended({
                              brand: product.brand,
                              name: product.name,
                              step: product.step,
                            })
                          }
                          activeOpacity={0.9}
                        >
                          <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                          <Text style={styles.iHaveBtnText}>I have this</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => openBuyUrl(product)}
                          activeOpacity={0.9}
                        >
                          <Ionicons name="cart-outline" size={14} color="#2D4A3E" />
                          <Text style={styles.removeBtnText}>Buy</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Category picker modal */}
      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Category</Text>
            {categoryOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.pickerOption}
                onPress={() => {
                  setCustomCategory(opt);
                  setShowCategoryPicker(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerOptionText}>{opt}</Text>
                {customCategory === opt && (
                  <Ionicons name="checkmark" size={18} color="#5F8575" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
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
    marginBottom: 16,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontSize: 14, color: '#6B8B7D', fontStyle: 'italic' },
  headerTitle: { fontSize: 20, color: '#2D4A3E', fontStyle: 'italic', fontWeight: '600' },
  headerSpacer: { width: 64 },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#E8F0DC',
    borderWidth: 1,
    borderColor: 'rgba(149,201,142,0.4)',
  },
  tabActive: { backgroundColor: '#5F8575', borderColor: '#5F8575' },
  tabText: { fontSize: 13, color: '#2D4A3E', fontStyle: 'italic' },
  tabTextActive: { color: '#FFFFFF' },

  tabContent: { gap: 16 },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#5F8575',
  },
  addCustomBtnText: { fontSize: 14, color: '#FFFFFF', fontStyle: 'italic' },

  addFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(95,133,117,0.2)',
    gap: 12,
  },
  addFormTitle: { fontSize: 13, color: '#5F8575', fontStyle: 'italic', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#D8D5CF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D4A3E',
  },
  categoryTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D8D5CF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryTouchText: { fontSize: 14, color: '#2D4A3E' },
  addFormActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  addFormAddBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#5F8575',
    alignItems: 'center',
  },
  addFormAddText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  addFormCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
  },
  addFormCancelText: { fontSize: 14, color: '#6B7370' },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 15, color: '#6B8B7D', fontStyle: 'italic', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#6B8B7D', fontStyle: 'italic', marginTop: 4 },

  productList: { gap: 12 },
  ownedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(149,201,142,0.2)',
  },
  ownedCardInner: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  ownedCardContent: { flex: 1 },
  ownedCardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  ownedBrand: { fontSize: 14, color: '#2D4A3E', fontWeight: '600', fontStyle: 'italic' },
  ownedName: { fontSize: 12, color: '#6B8B7D', fontStyle: 'italic', marginLeft: 24 },
  ownedMeta: { fontSize: 12, color: '#6B8B7D', fontStyle: 'italic', marginLeft: 24, marginTop: 4 },
  removeIconBtn: { padding: 8 },

  infoBanner: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#E8F0DC',
    borderWidth: 2,
    borderColor: 'rgba(149,201,142,0.2)',
  },
  infoBannerText: { fontSize: 12, color: '#6B8B7D', fontStyle: 'italic' },
  disclaimerBanner: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F5E6F0',
    borderWidth: 2,
    borderColor: 'rgba(244,158,196,0.2)',
  },
  disclaimerText: { fontSize: 12, color: '#6B8B7D', fontStyle: 'italic', textAlign: 'center' },

  shoppingSection: { gap: 12 },
  shoppingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(149,201,142,0.2)',
  },
  shoppingCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  shoppingCardContent: { flex: 1 },
  shoppingBrand: { fontSize: 14, color: '#2D4A3E', fontWeight: '600', fontStyle: 'italic' },
  shoppingName: { fontSize: 12, color: '#6B8B7D', fontStyle: 'italic', marginTop: 2 },
  shoppingKey: { fontSize: 12, color: '#5F8575', marginTop: 4 },
  shoppingKeyLabel: { fontWeight: '600' },
  shoppingNote: { fontSize: 12, color: '#6B8B7D', fontStyle: 'italic', marginTop: 6 },
  shoppingActions: { flexDirection: 'row', gap: 8 },
  iHaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#5F8575',
  },
  iHaveBtnText: { fontSize: 13, color: '#FFFFFF', fontStyle: 'italic', fontWeight: '600' },
  removeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#E8F0DC',
    borderWidth: 1,
    borderColor: 'rgba(149,201,142,0.3)',
  },
  removeBtnText: { fontSize: 13, color: '#2D4A3E', fontStyle: 'italic' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(123,155,140,0.3)',
  },
  pickerTitle: { fontSize: 16, color: '#2D4A3E', fontWeight: '600', marginBottom: 12 },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerOptionText: { fontSize: 14, color: '#2D4A3E' },
});
