import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MainLayout } from '@/components/layout/main-layout';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Try to get the profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('nom, role')
    .eq('id', user.id)
    .single();

  // If profile doesn't exist, create it (fallback if trigger didn't run)
  if (!profile) {
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        nom: user.user_metadata?.nom || user.email?.split('@')[0] || 'Utilisateur',
        role: user.user_metadata?.role || 'professeur',
      })
      .select('nom, role')
      .single();

    if (error) {
      // If insert fails (maybe RLS or conflict), try to fetch again
      const { data: retryProfile } = await supabase
        .from('profiles')
        .select('nom, role')
        .eq('id', user.id)
        .single();

      if (retryProfile) {
        profile = retryProfile;
      } else {
        // Last resort: sign out and redirect
        await supabase.auth.signOut();
        redirect('/login?error=Impossible de créer le profil. Contactez l\'administrateur.');
      }
    } else {
      profile = newProfile;
    }
  }

  return (
    <MainLayout
      userRole={profile.role as 'professeur' | 'etudiant'}
      userName={profile.nom}
    >
      {children}
    </MainLayout>
  );
}
