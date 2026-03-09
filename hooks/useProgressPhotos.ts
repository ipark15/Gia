import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

const BUCKET = 'progress-photos';
type ProgressPhotoRow = Database['public']['Tables']['progress_photos']['Row'];

export type ProgressPhotoItem = {
  id: string;
  date: string;
  imageUrl: string;
  notes?: string;
};

export function useProgressPhotos(): {
  photos: ProgressPhotoItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  uploadPhoto: (uri: string, date: string, notes?: string) => Promise<void>;
} {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhotoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = useCallback(async () => {
    if (!user) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('progress_photos')
      .select('id, date, storage_path, notes')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    if (error) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as ProgressPhotoRow[];
    const withUrls = rows.map((row) => {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(row.storage_path);
      return {
        id: row.id,
        date: row.date,
        imageUrl: urlData.publicUrl,
        notes: row.notes ?? undefined,
      };
    });
    setPhotos(withUrls);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const uploadPhoto = useCallback(
    async (uri: string, date: string, notes?: string) => {
      if (!user) return;
      const ext = 'jpg';
      const path = `${user.id}/${date}-${Date.now()}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { error: insertError } = await (supabase.from('progress_photos') as any).insert({
        user_id: user.id,
        date,
        storage_path: path,
        notes: notes ?? null,
      });
      if (insertError) throw insertError;
      await fetchPhotos();
    },
    [user?.id, fetchPhotos]
  );

  return { photos, loading, refresh: fetchPhotos, uploadPhoto };
}
