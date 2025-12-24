'use server';

import { createClient } from '@/lib/supabase/server';

const BUCKET_NAME = 'exercise-images';

export async function uploadExerciseImage(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { error: 'Aucun fichier fourni' };
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF, WebP ou SVG.' };
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: 'Fichier trop volumineux (max 5 Mo)' };
  }

  // Generate unique filename
  const ext = file.name.split('.').pop();
  const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return { data: { url: urlData.publicUrl, path: data.path } };
}

export async function deleteExerciseImage(path: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Verify the image belongs to the user
  if (!path.startsWith(user.id + '/')) {
    return { error: 'Non autorisé' };
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
