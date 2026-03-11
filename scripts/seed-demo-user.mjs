/**
 * Seed script — creates the demo/tester account with ~6 weeks of realistic mock data.
 *
 * Usage:
 *   node --env-file=.env scripts/seed-demo-user.mjs        (Node 20.6+)
 *
 *   Or export vars manually:
 *   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/seed-demo-user.mjs
 *
 * The SUPABASE_SERVICE_ROLE_KEY is the service_role secret from
 * Supabase Dashboard → Project Settings → API.  Keep it out of git.
 *
 * The script is safe to re-run — it clears previous demo data before
 * re-seeding, so you always end up with a clean, consistent state.
 */

import { createClient } from '@supabase/supabase-js';

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_EMAIL    = 'demo@gia.app';
const DEMO_PASSWORD = 'demo1234';
const DEMO_NAME     = 'Alex';

// ─── Validation ───────────────────────────────────────────────────────────────

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing environment variables.\n');
  console.error('  Add to your .env file:');
  console.error('    SUPABASE_SERVICE_ROLE_KEY=<your service_role key>');
  console.error('\n  Then run:');
  console.error('    node --env-file=.env scripts/seed-demo-user.mjs');
  process.exit(1);
}

// ─── Supabase admin client ────────────────────────────────────────────────────

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Seed data relative to today so it always represents "the last 6 weeks"
const TODAY      = new Date();
const START_DATE = addDays(TODAY, -42); // 6 weeks ago

// ─── Routine completion pattern ───────────────────────────────────────────────
// Day numbers (1-indexed from START_DATE) where we skip completions.
// Result: ~78% adherence — realistic, not perfect.

const SKIP_BOTH    = new Set([7, 14, 21]);           // full rest days
const SKIP_EVENING = new Set([3, 6, 9, 17, 24, 31, 38]); // evening only skipped

// ─── Check-in data (per day, 1-indexed) ──────────────────────────────────────
// Days not in this map get no check-in (rest days + a couple of misses).

const CHECKINS = {
  //  day: { skin, flare,           context,                      note,                                         sleep, stress }
   1: { skin: 2, flare: ['breakout', 'redness'],  context: ['stress', 'poor sleep'],      note: null,                                                         sleep: 6, stress: 4 },
   2: { skin: 3, flare: ['breakout'],             context: ['stress'],                    note: null,                                                         sleep: 7, stress: 3 },
   3: { skin: 2, flare: ['breakout', 'dryness'],  context: ['poor sleep', 'dairy'],       note: null,                                                         sleep: 6, stress: 3 },
   5: { skin: 2, flare: ['redness', 'breakout'],  context: ['stress', 'dairy'],           note: 'Starting to feel like the routine is becoming a habit.',     sleep: 7, stress: 4 },
   6: { skin: 3, flare: ['dryness'],              context: ['poor sleep'],                note: null,                                                         sleep: 5, stress: 3 },
   8: { skin: 3, flare: ['redness', 'breakout'],  context: ['stress'],                    note: null,                                                         sleep: 7, stress: 4 },
   9: { skin: 3, flare: ['dryness'],              context: ['dairy'],                     note: null,                                                         sleep: 7, stress: 2 },
  10: { skin: 2, flare: ['breakout'],             context: ['stress', 'poor sleep'],      note: null,                                                         sleep: 6, stress: 5 },
  11: { skin: 3, flare: ['redness'],              context: ['exercise'],                  note: null,                                                         sleep: 7, stress: 2 },
  12: { skin: 3, flare: ['dryness'],              context: ['hydrated'],                  note: 'Rough week — stress from work triggered a breakout.',        sleep: 8, stress: 4 },
  13: { skin: 3, flare: ['breakout'],             context: ['dairy', 'stress'],           note: null,                                                         sleep: 6, stress: 4 },
  15: { skin: 3, flare: ['redness'],              context: ['exercise', 'good sleep'],    note: null,                                                         sleep: 8, stress: 2 },
  16: { skin: 3, flare: ['dryness'],              context: ['hydrated'],                  note: null,                                                         sleep: 7, stress: 2 },
  17: { skin: 4, flare: [],                       context: ['stress'],                    note: null,                                                         sleep: 6, stress: 4 },
  19: { skin: 3, flare: ['redness', 'dryness'],   context: ['dairy'],                     note: 'Skin feels a bit drier than usual. Drinking more water.',    sleep: 7, stress: 3 },
  20: { skin: 4, flare: [],                       context: ['good sleep', 'hydrated'],    note: null,                                                         sleep: 8, stress: 1 },
  22: { skin: 4, flare: [],                       context: ['good sleep'],                note: null,                                                         sleep: 8, stress: 1 },
  23: { skin: 3, flare: ['redness'],              context: ['exercise'],                  note: null,                                                         sleep: 7, stress: 2 },
  24: { skin: 4, flare: [],                       context: ['hydrated'],                  note: null,                                                         sleep: 7, stress: 2 },
  25: { skin: 4, flare: ['dryness'],              context: ['good sleep'],                note: null,                                                         sleep: 8, stress: 1 },
  26: { skin: 3, flare: [],                       context: ['exercise'],                  note: 'Noticing real improvement — fewer active breakouts!',        sleep: 7, stress: 2 },
  27: { skin: 4, flare: [],                       context: ['hydrated'],                  note: null,                                                         sleep: 8, stress: 1 },
  28: { skin: 4, flare: [],                       context: ['good sleep'],                note: null,                                                         sleep: 8, stress: 1 },
  29: { skin: 4, flare: [],                       context: ['hydrated'],                  note: null,                                                         sleep: 7, stress: 1 },
  30: { skin: 4, flare: [],                       context: ['exercise', 'good sleep'],    note: null,                                                         sleep: 8, stress: 1 },
  31: { skin: 4, flare: [],                       context: ['hydrated'],                  note: null,                                                         sleep: 7, stress: 2 },
  32: { skin: 3, flare: ['redness'],              context: ['stress'],                    note: null,                                                         sleep: 6, stress: 4 },
  33: { skin: 4, flare: [],                       context: ['good sleep', 'hydrated'],    note: 'Skin is definitely clearer. Staying consistent is paying off.', sleep: 8, stress: 1 },
  34: { skin: 4, flare: [],                       context: ['exercise'],                  note: null,                                                         sleep: 7, stress: 1 },
  35: { skin: 4, flare: [],                       context: ['hydrated'],                  note: null,                                                         sleep: 8, stress: 1 },
  36: { skin: 4, flare: [],                       context: ['good sleep'],                note: null,                                                         sleep: 8, stress: 1 },
  37: { skin: 5, flare: [],                       context: ['hydrated', 'exercise'],      note: null,                                                         sleep: 8, stress: 1 },
  38: { skin: 4, flare: [],                       context: ['good sleep'],                note: null,                                                         sleep: 8, stress: 1 },
  39: { skin: 5, flare: [],                       context: ['hydrated'],                  note: null,                                                         sleep: 8, stress: 1 },
  40: { skin: 4, flare: [],                       context: ['exercise', 'good sleep'],    note: 'Really happy with the progress over the past few weeks.',   sleep: 7, stress: 1 },
  41: { skin: 4, flare: ['redness'],              context: ['hydrated'],                  note: null,                                                         sleep: 7, stress: 2 },
  42: { skin: 5, flare: [],                       context: ['good sleep'],                note: null,                                                         sleep: 8, stress: 1 },
};

// ─── Owned products ───────────────────────────────────────────────────────────

const OWNED_PRODUCTS = [
  { brand: 'CeraVe',          name: 'Foaming Facial Cleanser',          step: 'Cleanser',   category: 'Cleanser'   },
  { brand: "Paula's Choice",  name: '2% BHA Liquid Exfoliant',          step: 'Exfoliant',  category: 'Treatment'  },
  { brand: 'The Ordinary',    name: 'Niacinamide 10% + Zinc 1%',        step: 'Serum',      category: 'Serum'      },
  { brand: 'CeraVe',          name: 'AM Facial Moisturizing Lotion SPF 30', step: 'Moisturizer', category: 'Moisturizer' },
  { brand: 'La Roche-Posay',  name: 'Effaclar Adapalene Gel 0.1%',      step: 'Treatment',  category: 'Treatment'  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding demo user…\n');

  // ── 1. Create (or locate) auth user ────────────────────────────────────────
  console.log('Step 1/5  Creating auth user…');
  let userId;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: DEMO_NAME },
  });

  if (createErr) {
    // If the user already exists, look them up instead of failing
    const isAlreadyExists =
      createErr.message?.toLowerCase().includes('already') ||
      createErr.code === 'email_exists';

    if (isAlreadyExists) {
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const existing = list?.users?.find((u) => u.email === DEMO_EMAIL);
      if (!existing) {
        console.error('  ↳ User exists but could not be found by email. Aborting.');
        process.exit(1);
      }
      userId = existing.id;
      console.log(`  ↳ User already exists — reusing (${userId})`);
    } else {
      console.error(`  ↳ Failed: ${createErr.message}`);
      process.exit(1);
    }
  } else {
    userId = created.user.id;
    console.log(`  ↳ Created (${userId})`);
  }

  // ── 2. Upsert profile ──────────────────────────────────────────────────────
  console.log('Step 2/5  Upserting profile…');
  const { error: profileErr } = await admin.from('profiles').upsert({
    id: userId,
    name: DEMO_NAME,
    primary_condition: 'acne',
    conditions: ['Acne'],
    severity: 'moderate',
    skin_satisfaction_baseline: 2,
    days_per_week: 6,
    times_of_day: ['morning', 'night'],
    has_dermatologist_plan: false,
    dermatologist_products: [],
    selected_treatment_plans: { acne: 'acne-moderate' },
    selected_treatment_plan_id: 'acne-moderate',
    next_derm_appointment: null,
    custom_routine: null,
    created_at: START_DATE.toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (profileErr) { console.error(`  ↳ ${profileErr.message}`); process.exit(1); }
  console.log('  ↳ Done');

  // ── 3. Clear previous demo data (makes script re-runnable) ─────────────────
  console.log('Step 3/5  Clearing existing demo data…');
  await admin.from('routine_completions').delete().eq('user_id', userId);
  await admin.from('check_ins').delete().eq('user_id', userId);
  await admin.from('owned_products').delete().eq('user_id', userId);
  console.log('  ↳ Done');

  // ── 4. Seed routine_completions ────────────────────────────────────────────
  console.log('Step 4/5  Seeding routine completions…');
  const completions = [];

  for (let i = 0; i < 42; i++) {
    const dayNum = i + 1;
    if (SKIP_BOTH.has(dayNum)) continue;

    const date = addDays(START_DATE, i);

    // Morning ~7:20–7:29 AM (vary minute by day)
    const morning = new Date(date);
    morning.setHours(7, 20 + (i % 10), 0, 0);
    completions.push({ user_id: userId, type: 'morning', completed_at: morning.toISOString() });

    // Evening ~9:40–9:49 PM (vary minute by day)
    if (!SKIP_EVENING.has(dayNum)) {
      const evening = new Date(date);
      evening.setHours(21, 40 + (i % 10), 0, 0);
      completions.push({ user_id: userId, type: 'evening', completed_at: evening.toISOString() });
    }
  }

  const { error: compErr } = await admin.from('routine_completions').insert(completions);
  if (compErr) { console.error(`  ↳ ${compErr.message}`); process.exit(1); }
  console.log(`  ↳ ${completions.length} completions inserted`);

  // ── 5. Seed check_ins & owned_products ────────────────────────────────────
  console.log('Step 5/5  Seeding check-ins and owned products…');

  const checkIns = Object.entries(CHECKINS).map(([dayStr, c]) => {
    const dayNum = Number(dayStr);
    const date   = addDays(START_DATE, dayNum - 1);
    const mood   = c.skin >= 4 ? 'happy' : c.skin >= 3 ? 'neutral' : 'sad';
    return {
      user_id:           userId,
      date:              toDateStr(date),
      routine_completed: !SKIP_BOTH.has(dayNum),
      mood,
      skin_feeling:      c.skin,
      flare_tags:        c.flare,
      context_tags:      c.context,
      note:              c.note,
      sleep_hours:       c.sleep,
      stress_level:      c.stress,
      on_period:         null,
    };
  });

  const { error: checkErr } = await admin.from('check_ins').insert(checkIns);
  if (checkErr) { console.error(`  ↳ ${checkErr.message}`); process.exit(1); }

  const products = OWNED_PRODUCTS.map((p) => ({ ...p, user_id: userId }));
  const { error: prodErr } = await admin.from('owned_products').insert(products);
  if (prodErr) { console.error(`  ↳ ${prodErr.message}`); process.exit(1); }

  console.log(`  ↳ ${checkIns.length} check-ins + ${products.length} owned products inserted`);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n✅  Demo account ready!\n');
  console.log(`   Email:     ${DEMO_EMAIL}`);
  console.log(`   Password:  ${DEMO_PASSWORD}`);
  console.log('\n   What the data shows:');
  console.log('   • 6 weeks of history, ~78% routine adherence');
  console.log('   • Skin score improves from 2–3 → 4–5 over the period');
  console.log('   • Flare tags (breakout, redness, dryness) trend downward');
  console.log('   • Common triggers: stress, poor sleep, dairy');
  console.log('   • 5 owned products in the acne-moderate plan');
  console.log('   • Personal notes at key milestones\n');
}

main().catch((err) => {
  console.error('\n❌  Unexpected error:', err.message ?? err);
  process.exit(1);
});
