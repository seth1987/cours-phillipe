import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Try to get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // If profile exists, redirect based on role
  if (profile?.role === 'professeur') {
    redirect('/professeur');
  } else if (profile?.role === 'etudiant') {
    redirect('/etudiant');
  }

  // If no profile, redirect to professeur (protected layout will create it)
  redirect('/professeur');
}
