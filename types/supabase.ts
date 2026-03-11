/**
 * Supabase database types for Gia.
 * Mirrors supabase/migrations/20260127000000_initial_schema.sql
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          primary_condition: string | null;
          conditions: string[];
          other_condition: string | null;
          severity: string | null;
          skin_satisfaction_baseline: number | null;
          days_per_week: number;
          times_of_day: string[];
          has_dermatologist_plan: boolean | null;
          dermatologist_products: Json;
          selected_treatment_plans: Json;
          selected_treatment_plan_id: string | null;
          next_derm_appointment: string | null;
          custom_routine: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          primary_condition?: string | null;
          conditions?: string[];
          other_condition?: string | null;
          severity?: string | null;
          skin_satisfaction_baseline?: number | null;
          days_per_week?: number;
          times_of_day?: string[];
          has_dermatologist_plan?: boolean | null;
          dermatologist_products?: Json;
          selected_treatment_plans?: Json;
          selected_treatment_plan_id?: string | null;
          next_derm_appointment?: string | null;
          custom_routine?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          primary_condition?: string | null;
          conditions?: string[];
          other_condition?: string | null;
          severity?: string | null;
          skin_satisfaction_baseline?: number | null;
          days_per_week?: number;
          times_of_day?: string[];
          has_dermatologist_plan?: boolean | null;
          dermatologist_products?: Json;
          selected_treatment_plans?: Json;
          selected_treatment_plan_id?: string | null;
          next_derm_appointment?: string | null;
          custom_routine?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      routine_completions: {
        Row: {
          id: string;
          user_id: string;
          completed_at: string;
          type: 'morning' | 'evening';
        };
        Insert: {
          id?: string;
          user_id: string;
          completed_at?: string;
          type: 'morning' | 'evening';
        };
        Update: {
          id?: string;
          user_id?: string;
          completed_at?: string;
          type?: 'morning' | 'evening';
        };
      };
      completed_days: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          steps_completed: number;
          total_steps: number;
          morning_done: boolean;
          evening_done: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          steps_completed?: number;
          total_steps?: number;
          morning_done?: boolean;
          evening_done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          steps_completed?: number;
          total_steps?: number;
          morning_done?: boolean;
          evening_done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          routine_completed: boolean;
          mood: string | null;
          skin_feeling: number | null;
          flare_tags: string[];
          context_tags: string[];
          note: string | null;
          photo_path: string | null;
          sleep_hours: number | null;
          stress_level: number | null;
          on_period: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          routine_completed?: boolean;
          mood?: string | null;
          skin_feeling?: number | null;
          flare_tags?: string[];
          context_tags?: string[];
          note?: string | null;
          photo_path?: string | null;
          sleep_hours?: number | null;
          stress_level?: number | null;
          on_period?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          routine_completed?: boolean;
          mood?: string | null;
          skin_feeling?: number | null;
          flare_tags?: string[];
          context_tags?: string[];
          note?: string | null;
          photo_path?: string | null;
          sleep_hours?: number | null;
          stress_level?: number | null;
          on_period?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      progress_photos: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          storage_path: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          storage_path: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          storage_path?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      owned_products: {
        Row: {
          id: string;
          user_id: string;
          brand: string;
          name: string;
          step: string | null;
          category: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          brand: string;
          name: string;
          step?: string | null;
          category?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          brand?: string;
          name?: string;
          step?: string | null;
          category?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
