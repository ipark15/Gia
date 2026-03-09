import { useCallback, useEffect, useState } from 'react';
import type { TimelineEntry } from '../components/Insights';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

type CheckInRow = Database['public']['Tables']['check_ins']['Row'];

function moodFromNumber(n: number): 'happy' | 'neutral' | 'sad' {
  if (n >= 4) return 'happy';
  if (n >= 3) return 'neutral';
  return 'sad';
}

function rowToEntry(row: CheckInRow): TimelineEntry {
  return {
    id: row.id,
    date: row.date,
    routineCompleted: row.routine_completed,
    mood: (row.mood as 'happy' | 'neutral' | 'sad') ?? moodFromNumber(row.skin_feeling ?? 3),
    skinFeeling: row.skin_feeling ?? undefined,
    flareTags: row.flare_tags?.length ? row.flare_tags : undefined,
    contextTags: row.context_tags?.length ? row.context_tags : undefined,
    note: row.note ?? undefined,
    sleepHours: row.sleep_hours ?? undefined,
    stressLevel: row.stress_level ?? undefined,
    onPeriod: row.on_period ?? undefined,
  };
}

export function useCheckIns(): { entries: TimelineEntry[]; loading: boolean; refresh: () => Promise<void> } {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCheckIns = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('check_ins')
      .select('id, date, routine_completed, mood, skin_feeling, flare_tags, context_tags, note, sleep_hours, stress_level, on_period')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(200);
    if (error) {
      setEntries([]);
    } else {
      setEntries(((data ?? []) as CheckInRow[]).map(rowToEntry));
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchCheckIns();
  }, [fetchCheckIns]);

  return { entries, loading, refresh: fetchCheckIns };
}
