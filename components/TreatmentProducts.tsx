import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ProductRecommendation {
  step: string;
  stepExplanation?: string;
  products: {
    name: string;
    brand: string;
    keyIngredient: string;
    explanation?: string;
    note?: string;
    amazonUrl?: string;
  }[];
}

interface RoutineProducts {
  amRoutine: ProductRecommendation[];
  pmRoutine: ProductRecommendation[];
}

function getProductUrl(product: { brand: string; name: string; amazonUrl?: string }): string {
  if (product.amazonUrl) {
    return product.amazonUrl;
  }
  const searchQuery = encodeURIComponent(`${product.brand} ${product.name}`);
  return `https://www.amazon.com/s?k=${searchQuery}`;
}

export function getProductRecommendations(planId: string): RoutineProducts {
  const productMappings: { [key: string]: RoutineProducts } = {
    'acne-basic': {
      amRoutine: [
        {
          step: 'Gentle cleanser',
          stepExplanation: 'Removes dirt and oil without stripping your skin',
          products: [
            {
              name: 'Hydrating Facial Cleanser',
              brand: 'CeraVe',
              keyIngredient: 'Ceramides, Hyaluronic Acid',
              explanation: "Cleans your face while keeping moisture in — won't leave skin tight or dry",
              amazonUrl: 'https://www.amazon.com/dp/B01MSSDEPK'
            },
            {
              name: 'Gentle Skin Cleanser',
              brand: 'Cetaphil',
              keyIngredient: 'Gentle formula',
              explanation: "Super mild cleanser that won't irritate or overdry acne-prone skin",
              amazonUrl: 'https://www.amazon.com/dp/B001ET76EY'
            },
          ]
        },
        {
          step: 'Oil-free moisturizer',
          stepExplanation: 'Hydrates skin without clogging pores',
          products: [
            {
              name: 'AM Facial Moisturizing Lotion',
              brand: 'CeraVe',
              keyIngredient: 'Ceramides, Niacinamide',
              explanation: "Lightweight hydration that helps calm redness and won't cause breakouts",
              amazonUrl: 'https://www.amazon.com/dp/B00F97FHAW'
            },
          ]
        },
        {
          step: 'Non-comedogenic sunscreen',
          stepExplanation: 'Protects from sun damage and prevents dark marks from acne',
          products: [
            {
              name: 'Ultra-Light Moisturizing Lotion SPF 30',
              brand: 'CeraVe',
              keyIngredient: 'Mineral sunscreen',
              explanation: "Physical sunscreen that sits on top of skin instead of sinking in — won't clog pores",
              amazonUrl: 'https://www.amazon.com/dp/B00F97FHAW'
            },
          ]
        },
      ],
      pmRoutine: [
        {
          step: 'Gentle cleanser',
          stepExplanation: "Washes away the day's dirt, oil, and sunscreen",
          products: [
            {
              name: 'Hydrating Facial Cleanser',
              brand: 'CeraVe',
              keyIngredient: 'Ceramides',
              explanation: "Removes makeup and buildup without stripping skin's protective barrier",
              amazonUrl: 'https://www.amazon.com/dp/B01MSSDEPK'
            },
          ]
        },
        {
          step: 'Adapalene 0.1% (Differin)',
          stepExplanation: 'The main acne fighter — prevents clogged pores before they start',
          products: [
            {
              name: 'Adapalene Gel 0.1% (Differin)',
              brand: 'Differin',
              keyIngredient: 'Adapalene 0.1%',
              explanation: 'Unclogs pores, speeds up skin cell turnover, and prevents new breakouts',
              note: 'USE ONLY AT NIGHT — can make skin sensitive to sun. Start every other night',
              amazonUrl: 'https://www.amazon.com/dp/B07179MBA9'
            },
          ]
        },
        {
          step: 'Lightweight moisturizer',
          stepExplanation: "Keeps skin hydrated so acne treatments don't cause dryness",
          products: [
            {
              name: 'PM Facial Moisturizing Lotion',
              brand: 'CeraVe',
              keyIngredient: 'Niacinamide, Ceramides',
              explanation: 'Repairs skin barrier overnight and calms irritation from active ingredients',
              amazonUrl: 'https://www.amazon.com/dp/B00365DABC'
            },
          ]
        },
      ]
    },
    'acne-moderate': {
      amRoutine: [
        {
          step: 'Gentle cleanser',
          products: [{ name: 'Hydrating Facial Cleanser', brand: 'CeraVe', keyIngredient: 'Ceramides' }]
        },
        {
          step: 'Niacinamide serum',
          products: [{ name: 'PM Facial Moisturizing Lotion', brand: 'CeraVe', keyIngredient: 'Niacinamide' }]
        },
        {
          step: 'Lightweight moisturizer',
          products: [{ name: 'AM Facial Moisturizing Lotion', brand: 'CeraVe', keyIngredient: 'Ceramides' }]
        },
        {
          step: 'Broad-spectrum SPF 30+',
          products: [{ name: 'Ultra-Light Moisturizing Lotion SPF 30', brand: 'CeraVe', keyIngredient: 'Mineral' }]
        },
      ],
      pmRoutine: [
        {
          step: 'Gentle cleanser',
          products: [{ name: 'Hydrating Facial Cleanser', brand: 'CeraVe', keyIngredient: 'Ceramides' }]
        },
        {
          step: 'Adapalene 0.1%',
          products: [{ name: 'Adapalene Gel 0.1%', brand: 'Differin', keyIngredient: 'Adapalene', note: 'Night only' }]
        },
        {
          step: 'Lightweight moisturizer',
          products: [{ name: 'PM Facial Moisturizing Lotion', brand: 'CeraVe', keyIngredient: 'Niacinamide' }]
        },
      ]
    },
    'rosacea-basic': {
      amRoutine: [
        {
          step: 'Fragrance-free gentle cleanser',
          products: [
            { name: 'Hydrating Facial Cleanser', brand: 'CeraVe', keyIngredient: 'Ceramides' },
            { name: 'Toleriane Hydrating Gentle Cleanser', brand: 'La Roche-Posay', keyIngredient: 'Prebiotic thermal water' },
          ]
        },
        {
          step: 'Niacinamide serum',
          products: [{ name: 'PM Facial Moisturizing Lotion', brand: 'CeraVe', keyIngredient: 'Niacinamide' }]
        },
        {
          step: 'Calming moisturizer with ceramides',
          products: [{ name: 'Moisturizing Cream', brand: 'CeraVe', keyIngredient: 'Ceramides, Hyaluronic Acid' }]
        },
        {
          step: 'Mineral sunscreen SPF 30+',
          products: [{ name: 'Anthelios Mineral Tinted SPF 50', brand: 'La Roche-Posay', keyIngredient: '100% mineral, tinted' }]
        },
      ],
      pmRoutine: [
        {
          step: 'Fragrance-free gentle cleanser',
          products: [{ name: 'Hydrating Facial Cleanser', brand: 'CeraVe', keyIngredient: 'Ceramides' }]
        },
        {
          step: 'Azelaic acid',
          products: [{ name: 'Azelaic Acid 10%', brand: 'Generic/Various', keyIngredient: '10% azelaic acid', note: 'May tingle slightly at first' }]
        },
        {
          step: 'Calming moisturizer',
          products: [{ name: 'Moisturizing Cream', brand: 'CeraVe', keyIngredient: 'Ceramides' }]
        },
      ]
    },
    'rosacea-sensitive': {
      amRoutine: [
        {
          step: 'Water rinse or micellar water',
          products: [{ name: 'Micellar Water Ultra', brand: 'La Roche-Posay', keyIngredient: 'Gentle micellar technology' }]
        },
        {
          step: 'Rich barrier repair cream',
          products: [{ name: 'Moisturizing Cream (tub)', brand: 'CeraVe', keyIngredient: 'Ceramides, Hyaluronic Acid' }]
        },
        {
          step: 'Tinted mineral sunscreen',
          products: [{ name: 'Anthelios Mineral Tinted SPF 50', brand: 'La Roche-Posay', keyIngredient: 'Tinted mineral formula' }]
        },
      ],
      pmRoutine: [
        {
          step: 'Micellar water or cream cleanser',
          products: [{ name: 'Micellar Water Ultra', brand: 'La Roche-Posay', keyIngredient: 'Gentle micellar' }]
        },
        {
          step: 'Centella or green tea serum',
          products: [{ name: 'Cicaplast Baume B5', brand: 'La Roche-Posay', keyIngredient: 'Panthenol, Madecassoside' }]
        },
        {
          step: 'Rich barrier repair cream',
          products: [{ name: 'Moisturizing Cream (tub)', brand: 'CeraVe', keyIngredient: 'Ceramides' }]
        },
      ]
    },
    'eczema-basic': {
      amRoutine: [
        {
          step: 'Water rinse or gentle splash',
          products: [{ name: 'Gentle Skin Cleanser (optional)', brand: 'Cetaphil', keyIngredient: 'Gentle formula' }]
        },
        {
          step: 'Thick barrier cream with ceramides',
          products: [
            { name: 'Moisturizing Cream (tub)', brand: 'CeraVe', keyIngredient: 'Ceramides 1, 3, 6-II' },
            { name: 'Restoraderm Eczema Calming Moisturizer', brand: 'Cetaphil', keyIngredient: 'Colloidal Oatmeal' },
          ]
        },
        {
          step: 'Mineral sunscreen',
          products: [{ name: 'Hydrating Mineral Sunscreen SPF 30', brand: 'CeraVe', keyIngredient: 'Zinc oxide, Ceramides' }]
        },
      ],
      pmRoutine: [
        {
          step: 'Fragrance-free cream cleanser',
          products: [{ name: 'Hydrating Cream-to-Foam Cleanser', brand: 'CeraVe', keyIngredient: 'Amino acids, Ceramides' }]
        },
        {
          step: 'Hydrating serum',
          products: [{ name: 'Hyaluronic Acid Serum', brand: 'CeraVe', keyIngredient: 'Hyaluronic Acid' }]
        },
        {
          step: 'Thick barrier cream',
          products: [{ name: 'Moisturizing Cream (tub)', brand: 'CeraVe', keyIngredient: 'Ceramides' }]
        },
      ]
    },
    'eczema-intensive': {
      amRoutine: [
        {
          step: 'Water rinse',
          products: [{ name: 'No cleanser needed', brand: 'N/A', keyIngredient: 'Just water' }]
        },
        {
          step: 'Ceramide-rich moisturizer',
          products: [{ name: 'Moisturizing Cream', brand: 'CeraVe', keyIngredient: 'MVE technology, Ceramides' }]
        },
        {
          step: 'Mineral sunscreen',
          products: [{ name: 'Hydrating Mineral Sunscreen SPF 30', brand: 'CeraVe', keyIngredient: 'Zinc oxide' }]
        },
      ],
      pmRoutine: [
        {
          step: 'Gentle cleansing cream',
          products: [{ name: 'Hydrating Cream-to-Foam Cleanser', brand: 'CeraVe', keyIngredient: 'Ceramides' }]
        },
        {
          step: 'Colloidal oatmeal treatment',
          products: [{ name: 'Eczema Relief Cream', brand: 'CeraVe', keyIngredient: 'Colloidal Oatmeal 1%' }]
        },
        {
          step: 'Ceramide-rich moisturizer',
          products: [{ name: 'Moisturizing Cream', brand: 'CeraVe', keyIngredient: 'Ceramides' }]
        },
        {
          step: 'Occlusive balm',
          products: [{ name: 'Healing Ointment', brand: 'CeraVe', keyIngredient: 'Petrolatum, Ceramides', note: 'Seals in moisture overnight' }]
        },
      ]
    },
    'acne-rosacea-gentle': {
      amRoutine: [
        {
          step: 'Gentle, fragrance-free cleanser',
          products: [
            { name: 'Hydrating Facial Cleanser', brand: 'CeraVe', keyIngredient: 'Ceramides' },
            { name: 'Toleriane Hydrating Gentle Cleanser', brand: 'La Roche-Posay', keyIngredient: 'Ultra-gentle' },
          ]
        },
        {
          step: 'Niacinamide serum',
          products: [{ name: 'PM Facial Moisturizing Lotion', brand: 'CeraVe', keyIngredient: 'Niacinamide' }]
        },
        {
          step: 'Lightweight moisturizer',
          products: [{ name: 'AM Facial Moisturizing Lotion', brand: 'CeraVe', keyIngredient: 'Ceramides' }]
        },
        {
          step: 'Mineral sunscreen SPF 30+',
          products: [{ name: 'Anthelios Mineral Tinted SPF 50', brand: 'La Roche-Posay', keyIngredient: 'Mineral, tinted' }]
        },
      ],
      pmRoutine: [
        {
          step: 'Gentle cleanser',
          products: [{ name: 'Hydrating Facial Cleanser', brand: 'CeraVe', keyIngredient: 'Ceramides' }]
        },
        {
          step: 'Azelaic acid 10%',
          products: [{ name: 'Azelaic Acid 10%', brand: 'Generic/Various', keyIngredient: '10% azelaic acid', note: 'Treats both acne and rosacea' }]
        },
        {
          step: 'Lightweight moisturizer',
          products: [{ name: 'PM Facial Moisturizing Lotion', brand: 'CeraVe', keyIngredient: 'Niacinamide' }]
        },
      ]
    },
    'acne-rosacea-barrier': {
      amRoutine: [
        { step: 'Micellar water', products: [{ name: 'Micellar Water Ultra', brand: 'La Roche-Posay', keyIngredient: 'Gentle micellar' }] },
        { step: 'Niacinamide serum', products: [{ name: 'PM Facial Moisturizing Lotion', brand: 'CeraVe', keyIngredient: 'Niacinamide' }] },
        { step: 'Ceramide moisturizer', products: [{ name: 'Moisturizing Cream', brand: 'CeraVe', keyIngredient: 'Ceramides' }] },
        { step: 'Mineral sunscreen', products: [{ name: 'Anthelios Mineral SPF 50', brand: 'La Roche-Posay', keyIngredient: '100% mineral' }] },
      ],
      pmRoutine: [
        { step: 'Cream cleanser', products: [{ name: 'Hydrating Cream-to-Foam Cleanser', brand: 'CeraVe', keyIngredient: 'Ceramides' }] },
        { step: 'Azelaic acid treatment', products: [{ name: 'Azelaic Acid 10%', brand: 'Generic/Various', keyIngredient: '10% azelaic acid' }] },
        { step: 'Ceramide moisturizer', products: [{ name: 'Moisturizing Cream', brand: 'CeraVe', keyIngredient: 'Ceramides' }] },
      ]
    },
    'acne-eczema-balanced': {
      amRoutine: [
        { step: 'Gentle cream cleanser', products: [{ name: 'Hydrating Cream-to-Foam Cleanser', brand: 'CeraVe', keyIngredient: 'Ceramides' }] },
        { step: 'Niacinamide serum', products: [{ name: 'PM Facial Moisturizing Lotion', brand: 'CeraVe', keyIngredient: 'Niacinamide' }] },
        { step: 'Rich ceramide moisturizer', products: [{ name: 'Moisturizing Cream', brand: 'CeraVe', keyIngredient: 'Ceramides' }] },
        { step: 'Mineral sunscreen', products: [{ name: 'Hydrating Mineral Sunscreen SPF 30', brand: 'CeraVe', keyIngredient: 'Zinc oxide' }] },
      ],
      pmRoutine: [
        { step: 'Gentle cream cleanser', products: [{ name: 'Hydrating Cream-to-Foam Cleanser', brand: 'CeraVe', keyIngredient: 'Ceramides' }] },
        { step: 'Salicylic acid (acne zones only)', products: [{ name: 'Salicylic Acid 2%', brand: 'Generic', keyIngredient: '2% salicylic acid', note: 'Apply only to acne areas' }] },
        { step: 'Rich ceramide moisturizer', products: [{ name: 'Moisturizing Cream', brand: 'CeraVe', keyIngredient: 'Ceramides' }] },
      ]
    },
    'eczema-rosacea-ultra-gentle': {
      amRoutine: [
        { step: 'Micellar water or water rinse', products: [{ name: 'Micellar Water Ultra', brand: 'La Roche-Posay', keyIngredient: 'Ultra-gentle' }] },
        { step: 'Rich ceramide cream', products: [{ name: 'Moisturizing Cream', brand: 'CeraVe', keyIngredient: 'Ceramides' }] },
        { step: 'Tinted mineral sunscreen', products: [{ name: 'Anthelios Mineral Tinted SPF 50', brand: 'La Roche-Posay', keyIngredient: 'Mineral, tinted' }] },
      ],
      pmRoutine: [
        { step: 'Micellar water', products: [{ name: 'Micellar Water Ultra', brand: 'La Roche-Posay', keyIngredient: 'Ultra-gentle' }] },
        { step: 'Centella/oatmeal serum', products: [{ name: 'Cicaplast Baume B5', brand: 'La Roche-Posay', keyIngredient: 'Centella, Panthenol' }] },
        { step: 'Rich ceramide cream', products: [{ name: 'Moisturizing Cream', brand: 'CeraVe', keyIngredient: 'Ceramides' }] },
        { step: 'Occlusive on dry patches', products: [{ name: 'Healing Ointment', brand: 'CeraVe', keyIngredient: 'Petrolatum' }] },
      ]
    },
    'triple-minimal': {
      amRoutine: [
        { step: 'Water rinse or gentle cleanser', products: [{ name: 'Hydrating Cream-to-Foam Cleanser', brand: 'CeraVe', keyIngredient: 'Ceramides', note: 'Optional' }] },
        { step: 'Niacinamide serum', products: [{ name: 'PM Facial Moisturizing Lotion', brand: 'CeraVe', keyIngredient: 'Niacinamide' }] },
        { step: 'Ceramide moisturizer', products: [{ name: 'Moisturizing Cream', brand: 'CeraVe', keyIngredient: 'Ceramides' }] },
        { step: 'Mineral sunscreen SPF 30+', products: [{ name: 'Hydrating Mineral Sunscreen SPF 30', brand: 'CeraVe', keyIngredient: 'Zinc oxide' }] },
      ],
      pmRoutine: [
        { step: 'Ultra-gentle cream cleanser', products: [{ name: 'Hydrating Cream-to-Foam Cleanser', brand: 'CeraVe', keyIngredient: 'Ceramides' }] },
        { step: 'Azelaic acid 10%', products: [{ name: 'Azelaic Acid 10%', brand: 'Generic/Various', keyIngredient: '10% azelaic acid', note: 'Multi-tasking for acne + rosacea' }] },
        { step: 'Ceramide moisturizer', products: [{ name: 'PM Facial Moisturizing Lotion', brand: 'CeraVe', keyIngredient: 'Niacinamide, Ceramides' }] },
      ]
    },
  };

  return productMappings[planId] || { amRoutine: [], pmRoutine: [] };
}

interface TreatmentProductsProps {
  planId: string;
  onBack: () => void;
  onContinue: () => void;
}

export function TreatmentProducts({ planId, onBack, onContinue }: TreatmentProductsProps) {
  const { amRoutine, pmRoutine } = getProductRecommendations(planId);

  const openProductUrl = (product: { brand: string; name: string; amazonUrl?: string }) => {
    const url = getProductUrl(product);
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cart-outline" size={24} color="#7B9B8C" />
        <Text style={styles.headerTitle}>Recommended Products</Text>
      </View>
      <Text style={styles.headerSubtitle}>
        Evidence-based OTC products to support your routine
      </Text>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={20} color="#7B9B8C" />
        <View style={styles.infoBannerContent}>
          <Text style={styles.infoBannerText}>
            These products contain the active ingredients in your treatment plan at effective concentrations.
          </Text>
          <Text style={styles.infoBannerSubtext}>
            You can use any products with these ingredients—brand recommendations are based on dermatologist preferences.
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* AM Routine */}
        <View style={styles.routineSection}>
          <Text style={styles.routineTitle}>☀️ MORNING (AM) ROUTINE</Text>
          {amRoutine.map((rec, idx) => (
            <View key={idx} style={styles.stepCard}>
              <Text style={styles.stepTitle}>Step {idx + 1}: {rec.step}</Text>
              {rec.stepExplanation && (
                <Text style={styles.stepExplanation}>{rec.stepExplanation}</Text>
              )}
              {rec.products.map((product, pidx) => (
                <View key={pidx} style={styles.productItem}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productBrand}>{product.brand}</Text>
                    {product.brand !== 'N/A' && (
                      <TouchableOpacity
                        style={styles.buyButton}
                        onPress={() => openProductUrl(product)}
                      >
                        <Ionicons name="cart-outline" size={12} color="#7B9B8C" />
                        <Text style={styles.buyButtonText}>Buy</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productKey}>
                    <Text style={styles.keyLabel}>Key: </Text>
                    {product.keyIngredient}
                  </Text>
                  {product.explanation && (
                    <Text style={styles.productNote}>💡 {product.explanation}</Text>
                  )}
                  {product.note && (
                    <Text style={styles.productNote}>💡 {product.note}</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* PM Routine */}
        <View style={styles.routineSection}>
          <Text style={styles.routineTitle}>🌙 EVENING (PM) ROUTINE</Text>
          {pmRoutine.map((rec, idx) => (
            <View key={idx} style={styles.stepCard}>
              <Text style={styles.stepTitle}>Step {idx + 1}: {rec.step}</Text>
              {rec.stepExplanation && (
                <Text style={styles.stepExplanation}>{rec.stepExplanation}</Text>
              )}
              {rec.products.map((product, pidx) => (
                <View key={pidx} style={styles.productItem}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productBrand}>{product.brand}</Text>
                    {product.brand !== 'N/A' && (
                      <TouchableOpacity
                        style={styles.buyButton}
                        onPress={() => openProductUrl(product)}
                      >
                        <Ionicons name="cart-outline" size={12} color="#7B9B8C" />
                        <Text style={styles.buyButtonText}>Buy</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productKey}>
                    <Text style={styles.keyLabel}>Key: </Text>
                    {product.keyIngredient}
                  </Text>
                  {product.explanation && (
                    <Text style={styles.productNote}>💡 {product.explanation}</Text>
                  )}
                  {product.note && (
                    <Text style={styles.productNote}>💡 {product.note}</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* CTA message */}
        <View style={styles.ctaBox}>
          <Text style={styles.ctaText}>
            You can add/customize products in your profile later
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#7B9B8C',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7370',
    marginBottom: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(212, 227, 219, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(123, 155, 140, 0.3)',
    marginBottom: 16,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerText: {
    fontSize: 14,
    color: '#6B7370',
    lineHeight: 20,
    marginBottom: 4,
  },
  infoBannerSubtext: {
    fontSize: 12,
    color: '#8A9088',
  },
  scrollView: {
    flex: 1,
  },
  routineSection: {
    marginBottom: 24,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B9B8C',
    marginBottom: 16,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8D5CF',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7B9B8C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stepExplanation: {
    fontSize: 12,
    color: '#6B7370',
    marginBottom: 12,
  },
  productItem: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#D8D5CF',
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7B9B8C',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buyButtonText: {
    fontSize: 12,
    color: '#7B9B8C',
    textDecorationLine: 'underline',
  },
  productName: {
    fontSize: 12,
    color: '#6B7370',
    marginBottom: 4,
  },
  productKey: {
    fontSize: 12,
    color: '#7B9B8C',
  },
  keyLabel: {
    fontWeight: '500',
  },
  productNote: {
    fontSize: 12,
    color: '#6B7370',
    fontStyle: 'italic',
    marginTop: 4,
  },
  ctaBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8D5CF',
    marginBottom: 24,
  },
  ctaText: {
    fontSize: 12,
    color: '#6B7370',
    textAlign: 'center',
  },
});
