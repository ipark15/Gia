import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from '../types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// During SSR (Node.js), window is undefined — pass no storage so Supabase uses
// in-memory fallback and never touches AsyncStorage. On web in browser use
// localStorage; on native use AsyncStorage.
const storage =
  typeof window === 'undefined'
    ? undefined
    : Platform.OS === 'web'
      ? localStorage
      : AsyncStorage;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
