/**
 * Shared gradient definitions for the Gia app.
 * Each entry is a tuple of [colors[], start, end] for use with expo-linear-gradient.
 *
 * Usage:
 *   import { G } from '../constants/Gradients';
 *   <LinearGradient colors={G.pagePrimary.colors} start={G.pagePrimary.start} end={G.pagePrimary.end} style={...}>
 */

import type { LinearGradientProps } from 'expo-linear-gradient';

type GradientDef = Pick<LinearGradientProps, 'colors' | 'start' | 'end'>;

const BR = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } as const; // bottom-right
const B  = { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } } as const; // bottom
const T  = { start: { x: 0, y: 1 }, end: { x: 0, y: 0 } } as const; // top
const R  = { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } } as const; // right

export const G = {
  // ── Page backgrounds ──────────────────────────────────────────────────────
  /** HomeDashboard / GardenMode: D4F1F9 → E8F0DC → F5E6F0 */
  pageHome: { colors: ['#D4F1F9', '#E8F0DC', '#F5E6F0'], ...BR } satisfies GradientDef,
  /** Insights: D4F1F9 → F5E6F0 → E8F0DC */
  pageInsights: { colors: ['#D4F1F9', '#F5E6F0', '#E8F0DC'], ...BR } satisfies GradientDef,
  /** DermatologistPlanUpload: same as home */
  pageDerm: { colors: ['#D4F1F9', '#E8F0DC', '#F5E6F0'], ...BR } satisfies GradientDef,

  // ── Cards & containers ────────────────────────────────────────────────────
  /** Standard white/beige card */
  cardWhite: { colors: ['#FFFFFF', '#F5F1ED'], ...BR } satisfies GradientDef,
  /** Completed / success card */
  cardSuccess: { colors: ['#E8F5E9', '#D4E3DB'], ...BR } satisfies GradientDef,
  /** Sage/mint background */
  cardSage: { colors: ['#E8F0DC', '#DAE8CE'], ...BR } satisfies GradientDef,
  /** Pink/rose accent card */
  cardPink: { colors: ['#F5E6F0', '#F4C8DE4D'], ...BR } satisfies GradientDef,

  // ── Buttons ───────────────────────────────────────────────────────────────
  /** Primary green button (dark) */
  btnGreenDark: { colors: ['#95C98E', '#6B9B6E'], ...R } satisfies GradientDef,
  /** Primary green button (light) */
  btnGreenLight: { colors: ['#95C98E', '#7B9B8C'], ...R } satisfies GradientDef,
  /** Pink action button — Start Routine */
  btnPink: { colors: ['#E879B9', '#F49EC4', '#EC88BB'], ...R } satisfies GradientDef,
  /** Dark green header bar */
  btnHeaderGreen: { colors: ['#5F8575', '#7FA88F'], ...R } satisfies GradientDef,
  /** Ask Gia button */
  btnAskGia: { colors: ['#5F8575', '#7FA88F'], ...BR } satisfies GradientDef,
  /** Executive Summary button */
  btnExecutiveSummary: { colors: ['#5F8575', '#7B9B8C'], ...R } satisfies GradientDef,

  // ── Garden ────────────────────────────────────────────────────────────────
  /** Water pond display */
  gardenPond: { colors: ['#D4F1F9', '#E8F0DC', '#DAE8CE'], ...BR } satisfies GradientDef,
  /** Sky (top of garden scene) */
  gardenSky: { colors: ['#A8D8FF', '#D4F1FF', '#8FD9A8'], ...B } satisfies GradientDef,
  /** Full garden scene */
  gardenScene: { colors: ['#87CEEB', '#E8F5E9'], ...B } satisfies GradientDef,
  /** Garden ground (bottom) */
  gardenGround: { colors: ['#7FB77E', 'transparent'], ...T } satisfies GradientDef,

  // ── Status / alert ────────────────────────────────────────────────────────
  /** Completed status banner */
  statusCompleted: { colors: ['#5F8575', '#7B9B8C'], ...BR } satisfies GradientDef,
  /** Red emergency / alert */
  statusAlert: { colors: ['#FFF5F5', '#FFE4E6'], ...BR } satisfies GradientDef,
  /** Flare days */
  statusFlare: { colors: ['#FFE0E0', '#FFD0D0'], ...BR } satisfies GradientDef,
  /** Missed days */
  statusMissed: { colors: ['#FFD4B3', '#FFBB8F'], ...BR } satisfies GradientDef,

  // ── Calendar ──────────────────────────────────────────────────────────────
  calCompleted: { colors: ['#95C98E', '#7B9B8C'], ...BR } satisfies GradientDef,
  calPartial:   { colors: ['#F4C8DE', '#F49EC4'], ...BR } satisfies GradientDef,
  calDisabled:  { colors: ['#E8E8E8', '#D8D5CF'], ...BR } satisfies GradientDef,

  // ── Icon circles ──────────────────────────────────────────────────────────
  iconPink:   { colors: ['#F5E6F0', '#F4C8DE'], ...BR } satisfies GradientDef,
  iconSkyGreen: { colors: ['#D4F1F9', '#95C98E'], ...BR } satisfies GradientDef,
  iconGreenDark: { colors: ['#95C98E', '#6B9B6E'], ...BR } satisfies GradientDef,

  // ── Progress bar ──────────────────────────────────────────────────────────
  progressBar: { colors: ['#FF6B9D', '#A78BFA', '#60D5FF'], ...R } satisfies GradientDef,

  // ── Shimmer animations ────────────────────────────────────────────────────
  shimmerBtn:   { colors: ['transparent', 'rgba(255,255,255,0.2)', 'transparent'], ...R } satisfies GradientDef,
  shimmerPink:  { colors: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)'], ...R } satisfies GradientDef,

  // ── Misc ──────────────────────────────────────────────────────────────────
  /** Document / preview background */
  docBg: { colors: ['#F5F1ED', '#FFFFFF'], ...BR } satisfies GradientDef,
  /** Info / encouraging green box */
  infoGreen: { colors: ['#E8F5E9', '#D4E3DB'], ...R } satisfies GradientDef,
  /** Header bar overlay */
  headerWhite: { colors: ['rgba(255,255,255,0.9)', 'rgba(245,241,237,0.9)'], ...R } satisfies GradientDef,
} as const;
