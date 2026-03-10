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

type CompletionRow = { completed_at: string; type: string };
type CheckInRow = {
  skin_feeling: number | null;
  flare_tags: string[] | null;
  context_tags: string[] | null;
  date: string;
};

export function useSummaryData(): { data: SummaryData; loading: boolean; refresh: () => Promise<void> } {
  const { user, profile } = useAuth();
  const [data, setData] = useState<SummaryData>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) {
      setData(DEFAULT_SUMMARY);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [completionsRes, checkInsRes, ownedRes] = await Promise.all([
      supabase
        .from('routine_completions')
        .select('completed_at, type')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: true }),
      supabase
        .from('check_ins')
        .select('skin_feeling, flare_tags, context_tags, date')
        .eq('user_id', user.id)
        .order('date', { ascending: true }),
      supabase.from('owned_products').select('brand, name').eq('user_id', user.id),
    ]);

    // --- Adherence ---
    const completionRows = (completionsRes.data ?? []) as CompletionRow[];
    const completedRoutines = completionRows.length; // each row = one routine completion (morning or evening)

    // Routines per day based on the user's preference
    const times = (profile?.times_of_day as string[]) ?? [];
    const wantsMorning = times.includes('morning');
    const wantsEvening = times.includes('night') || times.includes('evening');
    const routinesPerDay =
      !wantsMorning && !wantsEvening
        ? 2
        : (wantsMorning ? 1 : 0) + (wantsEvening ? 1 : 0);

    // Days since tracking started
    const firstDate =
      completionRows.length > 0
        ? new Date(completionRows[0].completed_at)
        : profile?.created_at
        ? new Date(profile.created_at)
        : new Date();
    const daysSince = Math.max(1, Math.ceil((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalRoutines = daysSince * routinesPerDay;
    const adherenceRate =
      totalRoutines > 0 ? Math.min(100, Math.round((100 * completedRoutines) / totalRoutines)) : 0;

    // --- Check-ins ---
    const checkIns = (checkInsRes.data ?? []) as CheckInRow[];
    const flareUpCount = checkIns.filter((c) => (c.flare_tags?.length ?? 0) > 0).length;
    const skinScores = checkIns
      .map((c) => c.skin_feeling)
      .filter((s): s is number => s != null);
    const avgSkin = skinScores.length
      ? skinScores.reduce((a, b) => a + b, 0) / skinScores.length
      : 3;
    const avgMood = moodFromScore(avgSkin);

    // --- Symptom trends: compare first half vs second half of check-ins ---
    const allFlareTags = Array.from(new Set(checkIns.flatMap((c) => c.flare_tags ?? [])));
    const improvingSymptoms: string[] = [];
    const worseningSymptoms: string[] = [];
    const stableSymptoms: string[] = [];

    if (checkIns.length >= 4) {
      const mid = Math.floor(checkIns.length / 2);
      const firstHalf = checkIns.slice(0, mid);
      const secondHalf = checkIns.slice(mid);
      const countTag = (rows: CheckInRow[], tag: string) =>
        rows.filter((c) => c.flare_tags?.includes(tag)).length;

      allFlareTags.forEach((tag) => {
        const firstRate = firstHalf.length > 0 ? countTag(firstHalf, tag) / firstHalf.length : 0;
        const secondRate = secondHalf.length > 0 ? countTag(secondHalf, tag) / secondHalf.length : 0;
        const delta = secondRate - firstRate;
        if (delta < -0.1) improvingSymptoms.push(tag);
        else if (delta > 0.1) worseningSymptoms.push(tag);
        else stableSymptoms.push(tag);
      });
    } else {
      stableSymptoms.push(...allFlareTags.slice(0, 3));
    }

    // --- Triggers ---
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

    // --- Current products (priority: custom_routine > derm products > owned products) ---
    let currentProducts: string[] = [];
    const customRoutine = profile?.custom_routine as {
      amRoutine: Array<{ step: string; products: Array<{ brand: string; name: string }> }>;
      pmRoutine: Array<{ step: string; products: Array<{ brand: string; name: string }> }>;
    } | null | undefined;

    if (customRoutine) {
      const seen = new Set<string>();
      [...(customRoutine.amRoutine ?? []), ...(customRoutine.pmRoutine ?? [])].forEach((s) =>
        s.products.forEach((p) => {
          const key = `${p.brand} ${p.name}`.trim();
          if (!seen.has(key)) { seen.add(key); currentProducts.push(key); }
        })
      );
    } else if (
      profile?.has_dermatologist_plan &&
      Array.isArray(profile?.dermatologist_products) &&
      (profile.dermatologist_products as unknown[]).length > 0
    ) {
      const dp = profile.dermatologist_products as unknown as Array<{ brand: string; name: string }>;
      currentProducts = dp.map((p) => `${p.brand} ${p.name}`.trim());
    } else {
      currentProducts = (ownedRes.data ?? []).map((p) =>
        (p.name ? `${p.brand} ${p.name}` : p.brand).trim()
      );
    }

    // --- Concerns & improvements ---
    const concerns: string[] = [];
    const improvements: string[] = [];
    if (worseningSymptoms.length > 0) concerns.push(`Worsening: ${worseningSymptoms.join(', ')}`);
    if (flareUpCount > 0) concerns.push(`${flareUpCount} flare-up${flareUpCount !== 1 ? 's' : ''} recorded`);
    if (adherenceRate >= 70) improvements.push('Good routine adherence');
    if (improvingSymptoms.length > 0) improvements.push(`Improving: ${improvingSymptoms.join(', ')}`);
    if (avgSkin >= 4) improvements.push('Skin satisfaction trending positive');

    setData({
      adherenceRate,
      totalRoutines,
      completedRoutines,
      avgMood,
      flareUpCount,
      improvingSymptoms,
      worseningSymptoms,
      stableSymptoms,
      commonTriggers,
      currentProducts,
      concerns,
      improvements,
    });
    setLoading(false);
  }, [user?.id, profile]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, refresh: fetch };
}
