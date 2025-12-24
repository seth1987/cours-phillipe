import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  // Check if user is already logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // User is already authenticated, check their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'professeur') {
      redirect('/professeur');
    } else if (profile?.role === 'etudiant') {
      redirect('/etudiant');
    }
    // If no profile yet, let them stay on auth pages (will be created by trigger)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">RDM Exercices</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Plateforme de génération d&apos;exercices
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
