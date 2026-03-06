import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Inventory as InventoryComponent, OwnedProduct } from '../components/Inventory';

const INVENTORY_BG = '#E8F0DC';

export default function InventoryScreen() {
  const params = useLocalSearchParams<{ planId?: string }>();
  const planId = params.planId ?? 'acne-basic';
  const [ownedProducts, setOwnedProducts] = useState<OwnedProduct[]>([]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: INVENTORY_BG }} edges={['top']}>
      <StatusBar style="dark" backgroundColor={INVENTORY_BG} />
      <InventoryComponent
        planId={String(planId)}
        onBack={() => router.back()}
        ownedProducts={ownedProducts}
        onUpdateOwnedProducts={setOwnedProducts}
      />
    </SafeAreaView>
  );
}
