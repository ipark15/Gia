import { useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoutineCompletion } from '../context/RoutineCompletionContext';
import { useRoutineStats } from '../hooks/useRoutineStats';
import { supabase } from '../lib/supabaseClient';

/**
 * Always-mounted component that registers the routine completion persist handler
 * with the context. Writes each completion as an individual event to routine_completions
 * (with timestamp) so the app has full history.
 */
export function RoutinePersistenceHandler() {
  const { user } = useAuth();
  const { setPersistHandler } = useRoutineCompletion();
  const { refresh, addOptimisticCompletion } = useRoutineStats();

  const persist = useCallback(
    async (type: 'morning' | 'evening') => {
      if (!user) return;
      // Optimistically update stats immediately so the home screen reflects the
      // new flower, streak, and week count the moment the user lands back.
      addOptimisticCompletion(type);
      await (supabase.from('routine_completions') as any).insert({
        user_id: user.id,
        type,
        completed_at: new Date().toISOString(),
      });
      // Sync from DB after the write to reconcile any drift.
      await refresh();
    },
    [user?.id, refresh, addOptimisticCompletion]
  );

  useEffect(() => {
    setPersistHandler(persist);
    return () => setPersistHandler(null);
  }, [setPersistHandler, persist]);

  return null;
}
