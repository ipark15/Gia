import { useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoutineCompletion } from '../context/RoutineCompletionContext';
import { useRoutineStats } from '../hooks/useRoutineStats';
import { supabase } from '../lib/supabaseClient';

const TODAY = new Date().toISOString().slice(0, 10);

/**
 * Always-mounted component that registers the routine completion persist handler
 * with the context. Ensures completed_days is written when the user completes
 * a routine from any screen (e.g. routine-execution), not only when Home is mounted.
 */
export function RoutinePersistenceHandler() {
  const { user } = useAuth();
  const { setPersistHandler } = useRoutineCompletion();
  const { refresh } = useRoutineStats();

  const persist = useCallback(
    async (type: 'morning' | 'evening') => {
      if (!user) return;
      const { data: existing } = await supabase
        .from('completed_days')
        .select('id, steps_completed, total_steps, morning_done, evening_done')
        .eq('user_id', user.id)
        .eq('date', TODAY)
        .maybeSingle();
      const totalSteps = 5;
      const prev = existing as {
        morning_done: boolean;
        evening_done: boolean;
        steps_completed: number;
      } | null;
      const morning = type === 'morning' || (prev?.morning_done ?? false);
      const evening = type === 'evening' || (prev?.evening_done ?? false);
      const stepsCompleted = (morning ? 3 : 0) + (evening ? 2 : 0);
      if (existing) {
        await (supabase.from('completed_days') as any)
          .update({
            morning_done: morning,
            evening_done: evening,
            steps_completed: stepsCompleted,
            total_steps: totalSteps,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('date', TODAY);
      } else {
        await (supabase.from('completed_days') as any).insert({
          user_id: user.id,
          date: TODAY,
          morning_done: morning,
          evening_done: evening,
          steps_completed: stepsCompleted,
          total_steps: totalSteps,
        });
      }
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
