import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

const BUCKET = 'progress-photos';
type ProgressPhotoRow = Database['public']['Tables']['progress_photos']['Row'];

/** Decode base64 to ArrayBuffer for Supabase upload (fetch(uri) is unreliable in RN). */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export type ProgressPhotoItem = {
  id: string;
  date: string;
  storagePath: string;
  imageUrl: string;
  notes?: string;
};

export function useProgressPhotos(): {
  photos: ProgressPhotoItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  /** Pass base64 image data (from ImagePicker with base64: true). */
  uploadPhoto: (base64: string, date: string, notes?: string) => Promise<void>;
  /** Deletes both the DB row and the object in Supabase Storage. */
  deletePhoto: (photo: Pick<ProgressPhotoItem, 'id' | 'storagePath'>) => Promise<void>;
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
        storagePath: row.storage_path,
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
    async (base64: string, date: string, notes?: string) => {
      if (!user) return;
      const ext = 'jpg';
      const path = `${user.id}/${date}-${Date.now()}.${ext}`;
      const arrayBuffer = base64ToArrayBuffer(base64);
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
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

  const deletePhoto = useCallback(
    async (photo: Pick<ProgressPhotoItem, 'id' | 'storagePath'>) => {
      if (!user) return;
      // Delete DB row first so the app no longer references the file even if storage delete fails.
      const { error: deleteRowError } = await (supabase.from('progress_photos') as any)
        .delete()
        .eq('id', photo.id)
        .eq('user_id', user.id);
      if (deleteRowError) throw deleteRowError;

      const { error: deleteObjectError } = await supabase.storage.from(BUCKET).remove([photo.storagePath]);
      if (deleteObjectError) throw deleteObjectError;

      await fetchPhotos();
    },
    [user?.id, fetchPhotos]
  );

  return { photos, loading, refresh: fetchPhotos, uploadPhoto, deletePhoto };
}
