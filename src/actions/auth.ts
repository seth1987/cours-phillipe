'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface LoginInput {
  email: string;
  password: string;
}

export async function login(formData: LoginInput) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: 'Email ou mot de passe incorrect' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  return {
    data: {
      userId: data.user.id,
      role: profile?.role || 'etudiant',
    },
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getCurrentUser() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}
