import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export type CompletedDayRow = {
  date: string;
  steps_completed: number;
  total_steps: number;
  morning_done: boolean;
  evening_done: boolean;
};

export type RoutineCompletionEvent = {
  completedAt: string;
  type: 'morning' | 'evening';
};

export type RoutineStats = {
  completedDays: Array<{ date: string; stepsCompleted: number; totalSteps: number }>;
  /** Raw rows for computing monthly stats (routines completed per month). */
  completedDaysRaw: Array<{ date: string; morning_done: boolean; evening_done: boolean }>;
  /** Full history of each routine completion with timestamp (for timeline display). */
  routineCompletions: RoutineCompletionEvent[];
  /** Consecutive days (including today) with at least one routine completed. */
  currentStreak: number;
  /** Distinct weeks in which the user completed at least one routine. */
  weekCount: number;
  /** Total days (all time) with at least one routine completed (not necessarily consecutive). */
  daysTracked: number;
  morningRoutinesDone: number;
  eveningRoutinesDone: number;
  /** Total number of routines completed (one per morning/evening completion). */
  flowersPlanted: number;
  /** Whether the user has completed their morning routine today (from DB). */
  todayMorningCompleted: boolean;
  /** Whether the user has completed their evening routine today (from DB). */
  todayEveningCompleted: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Optimistically add a completion immediately (before DB write) so stats update without lag. */
  addOptimisticCompletion: (type: 'morning' | 'evening') => void;
};

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(d: Date): string {
  // Use local date parts so comparisons match Postgres `date` values (YYYY-MM-DD),
  // avoiding UTC shifts from `toISOString()`.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getStartOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** Computes consecutive days with at least one completion (morning or evening). */
function computeStreak(rows: CompletedDayRow[]): number {
  if (rows.length === 0) return 0;
  const today = toDateStr(new Date());
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let cursor = new Date();
  const dateSet = new Set(rows.map((r) => r.date));
  while (true) {
    const key = toDateStr(cursor);
    if (!dateSet.has(key)) break;
    const row = sorted.find((r) => r.date === key);
    if (!row || (!row.morning_done && !row.evening_done)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Number of distinct weeks that have at least one completed day. */
function computeWeekCount(rows: CompletedDayRow[]): number {
  const weeks = new Set<string>();
  rows.forEach((r) => {
    const d = parseDate(r.date);
    if (r.morning_done || r.evening_done) {
      weeks.add(toDateStr(getStartOfWeek(d)));
    }
  });
  return weeks.size;
}

/** Total number of routines completed (flowers) = count of all morning + evening completions. */
function computeFlowersPlanted(completionRows: RoutineCompletionRow[]): number {
  return completionRows.length;
}

type RoutineCompletionRow = { completed_at: string; type: 'morning' | 'evening' };

/** Convert completed_at (ISO) to local date string YYYY-MM-DD. */
function completedAtToDateStr(completedAt: string): string {
  const d = new Date(completedAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Convert routine_completions rows into CompletedDayRow[] (grouped by date). */
function completionsToCompletedDays(rows: RoutineCompletionRow[]): CompletedDayRow[] {
  const totalSteps = 5;
  const byDate = new Map<string, { morning: boolean; evening: boolean }>();
  for (const r of rows) {
    const date = completedAtToDateStr(r.completed_at);
    const prev = byDate.get(date) ?? { morning: false, evening: false };
    if (r.type === 'morning') prev.morning = true;
    else prev.evening = true;
    byDate.set(date, prev);
  }
  return Array.from(byDate.entries())
    .map(([date, { morning, evening }]) => ({
      date,
      morning_done: morning,
      evening_done: evening,
      steps_completed: (morning ? 3 : 0) + (evening ? 2 : 0),
      total_steps: totalSteps,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function useRoutineStats(): RoutineStats {
  const { user } = useAuth();
  const [rawCompletions, setRawCompletions] = useState<RoutineCompletionRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived from rawCompletions so a single state update fans out to all stats.
  const completedDays = useMemo(() => completionsToCompletedDays(rawCompletions), [rawCompletions]);

  const fetchCompletedDays = useCallback(async () => {
    if (!user) {
      setRawCompletions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('routine_completions')
      .select('completed_at, type')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(3650);
    if (error) {
      setRawCompletions([]);
    } else {
      setRawCompletions((data as RoutineCompletionRow[]) ?? []);
    }
    setLoading(false);
  }, [user?.id]);

  const addOptimisticCompletion = useCallback((type: 'morning' | 'evening') => {
    setRawCompletions((prev) => [{ completed_at: new Date().toISOString(), type }, ...prev]);
  }, []);

  useEffect(() => {
    fetchCompletedDays();
  }, [fetchCompletedDays]);

  const weekStart = getStartOfWeek(new Date());
  const weekStartStr = toDateStr(weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = toDateStr(weekEnd);
  const thisWeekRows = completedDays.filter(
    (r) => r.date >= weekStartStr && r.date <= weekEndStr
  );
  const morningRoutinesDone = thisWeekRows.filter((r) => r.morning_done).length;
  const eveningRoutinesDone = thisWeekRows.filter((r) => r.evening_done).length;

  const todayStr = toDateStr(new Date());
  const todayRow = completedDays.find((r) => r.date === todayStr);
  const todayMorningCompleted = todayRow?.morning_done ?? false;
  const todayEveningCompleted = todayRow?.evening_done ?? false;

  return {
    completedDays: completedDays.map((r) => ({
      date: r.date,
      stepsCompleted: r.steps_completed,
      totalSteps: r.total_steps,
    })),
    /** Raw rows for computing monthly stats (e.g. routines completed per month). */
    completedDaysRaw: completedDays.map((r) => ({
      date: r.date,
      morning_done: r.morning_done,
      evening_done: r.evening_done,
    })),
    routineCompletions: rawCompletions.map((r) => ({
      completedAt: r.completed_at,
      type: r.type,
    })),
    currentStreak: computeStreak(completedDays),
    weekCount: computeWeekCount(completedDays),
    daysTracked: completedDays.length,
    morningRoutinesDone,
    eveningRoutinesDone,
    flowersPlanted: computeFlowersPlanted(rawCompletions),
    todayMorningCompleted,
    todayEveningCompleted,
    loading,
    refresh: fetchCompletedDays,
    addOptimisticCompletion,
  };
}
