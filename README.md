# Gia — Skincare Routine App

A React Native app built with Expo Router and Supabase that helps users build and maintain consistent skincare routines.

## Stack

- **Expo Router** (file-based routing)
- **React Native**
- **Supabase** (auth, database, storage)
- **TypeScript**

## Setup

```bash
npm install
```

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running

```bash
npx expo start           # Start dev server (scan QR with Expo Go)
npx expo start --ios     # iOS simulator
npx expo start --android # Android emulator
```

## App Structure

```
app/
  _layout.tsx                  — Root layout: AuthProvider > RoutineCompletionProvider
  (onboarding)/
    index.tsx                  — Welcome / front page
    sign-in.tsx                — Sign in + create account (single screen, mode toggle)
    registration.tsx           — 6-step onboarding wizard
  (tabs)/
    index.tsx                  — Home dashboard
    insights.tsx               — Check-in timeline
    progress.tsx               — Progress photo gallery
    profile.tsx                — User profile and stats
  routine-execution.tsx        — Full-screen step-by-step routine walkthrough
  treatment-plan.tsx           — Routine & products (Routine + Shopping tabs)
  inventory.tsx                — Redirects to treatment-plan shopping tab
```

## Key Features

- **Routine execution** — step-by-step guided morning/evening skincare with a per-step countdown timer that auto-advances between steps
- **Routine completion tracking** — completions persist to Supabase and update stats (streak, flowers, weeks active) immediately via optimistic updates
- **Garden / flower system** — each routine completion earns a pink lotus; 15 pink → 1 yellow; 15 yellow → 1 purple
- **Check-ins** — daily skin check-in with mood, symptoms, context tags, sleep, stress, and optional photo
- **Progress photos** — photo gallery with timeline view
- **Derm plan upload** — users can add dermatologist-prescribed products with AM/PM/both timing
- **OTC plan selection** — curated routines per skin condition (acne, rosacea, eczema, combinations)
- **Custom routine editing** — users can reorder steps and save their own product selections
- **Ask Gia** — in-app AI chat available during routine execution

## Routine Data Priority

When determining what to show in the routine:

1. `profile.custom_routine` — user-saved edits (highest priority)
2. `profile.dermatologist_products` — if `has_dermatologist_plan === true`
3. `getProductRecommendations(planId)` — hardcoded OTC plans in `components/TreatmentProducts.tsx`

## Database Tables

| Table | Purpose |
|---|---|
| `profiles` | 1:1 with auth.users; all onboarding data and routine config |
| `routine_completions` | One row per morning/evening routine completion |
| `check_ins` | Daily check-in entries |
| `progress_photos` | Progress photo gallery metadata |
| `owned_products` | Products the user marks as owned |

Migrations live in `supabase/migrations/`. TypeScript types are hand-maintained in `types/supabase.ts`.

## Gradient Design System

All page backgrounds use `LinearGradient` wrapping `SafeAreaView` so the status bar area matches the screen background. Shared gradient tokens are defined in `constants/Gradients.ts`.

- Front page & sign-in: `#D4F1F9 → #F5E6F0 → #E8F0DC` (sky blue → blush → sage, diagonal)
- Home, routine execution, registration: `G.pageHome` (`#D4F1F9 → #E8F0DC → #F5E6F0`)

