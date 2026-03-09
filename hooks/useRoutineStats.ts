import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export type CompletedDayRow = {
  date: string;
  steps_completed: number;
  total_steps: number;
  morning_done: boolean;
  evening_done: boolean;
};

export type RoutineStats = {
  completedDays: Array<{ date: string; stepsCompleted: number; totalSteps: number }>;
  /** Raw rows for computing monthly stats (routines completed per month). */
  completedDaysRaw: Array<{ date: string; morning_done: boolean; evening_done: boolean }>;
  currentStreak: number;
  weekCount: number;
  morningRoutinesDone: number;
  eveningRoutinesDone: number;
  /** Total flowers planted (one per routine completion, all time). */
  flowersPlanted: number;
  loading: boolean;
  refresh: () => Promise<void>;
};

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
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
      weeks.add(getStartOfWeek(d).toISOString().slice(0, 10));
    }
  });
  return weeks.size;
}

/** Total routine completions (one flower per morning or evening completion, all time). */
function computeFlowersPlanted(rows: CompletedDayRow[]): number {
  return rows.reduce(
    (sum, r) => sum + (r.morning_done ? 1 : 0) + (r.evening_done ? 1 : 0),
    0
  );
}

export function useRoutineStats(): RoutineStats {
  const { user } = useAuth();
  const [completedDays, setCompletedDays] = useState<CompletedDayRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedDays = useCallback(async () => {
    if (!user) {
      setCompletedDays([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('completed_days')
      .select('date, steps_completed, total_steps, morning_done, evening_done')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(365);
    if (error) {
      setCompletedDays([]);
    } else {
      setCompletedDays((data as CompletedDayRow[]) ?? []);
    }
    setLoading(false);
  }, [user?.id]);

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
    currentStreak: computeStreak(completedDays),
    weekCount: computeWeekCount(completedDays),
    morningRoutinesDone,
    eveningRoutinesDone,
    flowersPlanted: computeFlowersPlanted(completedDays),
    loading,
    refresh: fetchCompletedDays,
  };
}
