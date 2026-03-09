import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export type SummaryData = {
  adherenceRate: number;
  totalRoutines: number;
  completedRoutines: number;
  avgMood: '😌' | '😐' | '😢';
  flareUpCount: number;
  improvingSymptoms: string[];
  worseningSymptoms: string[];
  stableSymptoms: string[];
  commonTriggers: string[];
  currentProducts: string[];
  concerns: string[];
  improvements: string[];
};

const DEFAULT_SUMMARY: SummaryData = {
  adherenceRate: 0,
  totalRoutines: 0,
  completedRoutines: 0,
  avgMood: '😐',
  flareUpCount: 0,
  improvingSymptoms: [],
  worseningSymptoms: [],
  stableSymptoms: [],
  commonTriggers: [],
  currentProducts: [],
  concerns: [],
  improvements: [],
};

function moodFromScore(avg: number): '😌' | '😐' | '😢' {
  if (avg >= 4) return '😌';
  if (avg >= 2.5) return '😐';
  return '😢';
}

export function useSummaryData(): { data: SummaryData; loading: boolean; refresh: () => Promise<void> } {
  const { user } = useAuth();
  const [data, setData] = useState<SummaryData>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) {
      setData(DEFAULT_SUMMARY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [completedRes, checkInsRes, ownedRes] = await Promise.all([
      supabase.from('completed_days').select('steps_completed, total_steps').eq('user_id', user.id),
      supabase.from('check_ins').select('skin_feeling, flare_tags, context_tags').eq('user_id', user.id),
      supabase.from('owned_products').select('brand, name').eq('user_id', user.id),
    ]);

    let totalSteps = 0;
    let completedSteps = 0;
    (completedRes.data ?? []).forEach((r) => {
      totalSteps += r.total_steps || 0;
      completedSteps += r.steps_completed || 0;
    });
    const totalRoutines = totalSteps;
    const completedRoutines = completedSteps;
    const adherenceRate = totalRoutines > 0 ? Math.round((100 * completedRoutines) / totalRoutines) : 0;

    const checkIns = checkInsRes.data ?? [];
    const flareUpCount = checkIns.filter((c) => (c.flare_tags?.length ?? 0) > 0).length;
    const skinScores = checkIns.map((c) => c.skin_feeling).filter((s): s is number => s != null);
    const avgSkin = skinScores.length ? skinScores.reduce((a, b) => a + b, 0) / skinScores.length : 3;
    const avgMood = moodFromScore(avgSkin);

    const triggerCounts: Record<string, number> = {};
    checkIns.forEach((c) => {
      (c.context_tags ?? []).forEach((t) => {
        triggerCounts[t] = (triggerCounts[t] ?? 0) + 1;
      });
    });
    const commonTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t);

    const flareTagCounts: Record<string, number> = {};
    checkIns.forEach((c) => {
      (c.flare_tags ?? []).forEach((t) => {
        flareTagCounts[t] = (flareTagCounts[t] ?? 0) + 1;
      });
    });
    const allFlareTags = Object.keys(flareTagCounts);
    const stableSymptoms = allFlareTags.slice(0, 3);
    const improvingSymptoms: string[] = [];
    const worseningSymptoms: string[] = [];

    const currentProducts = (ownedRes.data ?? []).map((p) => (p.name ? `${p.brand} ${p.name}` : p.brand).trim());

    setData({
      adherenceRate,
      totalRoutines,
      completedRoutines,
      avgMood,
      flareUpCount,
      improvingSymptoms,
      worseningSymptoms,
      stableSymptoms,
      commonTriggers: commonTriggers.length ? commonTriggers : ['stress', 'lack of sleep', 'weather changes'],
      currentProducts: currentProducts.length ? currentProducts : ['Track products in Routine & Shopping to see them here'],
      concerns: flareUpCount > 0 ? ['Flare-ups reported in tracking period'] : [],
      improvements: adherenceRate >= 70 ? ['Good routine adherence'] : [],
    });
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, refresh: fetch };
}
