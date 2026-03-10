-- Add custom_routine column to profiles table.
-- Stores user-customized AM/PM routine steps as JSON when they edit their plan
-- in the "My Routine & Products" screen. Null means use the default (derm products
-- or OTC recommendations based on selected_treatment_plan_id).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_routine jsonb DEFAULT NULL;
