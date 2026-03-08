import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

/**
 * Inventory is now merged into the treatment-plan screen (Shopping tab).
 * Redirect so old links to /inventory still work.
 */
export default function InventoryScreen() {
  const params = useLocalSearchParams<{ planId?: string }>();
  const planId = params.planId ?? 'acne-basic';

  useEffect(() => {
    router.replace({
      pathname: '/treatment-plan',
      params: { planId: String(planId), tab: 'shopping' },
    });
  }, [planId]);

  return null;
}
