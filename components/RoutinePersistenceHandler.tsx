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
  const { refresh } = useRoutineStats();

  const persist = useCallback(
    async (type: 'morning' | 'evening') => {
      if (!user) return;
      await (supabase.from('routine_completions') as any).insert({
        user_id: user.id,
        type,
        completed_at: new Date().toISOString(),
      });
      await refresh();
    },
    [user?.id, refresh]
  );

  useEffect(() => {
    setPersistHandler(persist);
    return () => setPersistHandler(null);
  }, [setPersistHandler, persist]);

  return null;
}
