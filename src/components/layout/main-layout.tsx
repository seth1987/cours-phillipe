import { ReactNode } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface MainLayoutProps {
  children: ReactNode;
  userRole: 'professeur' | 'etudiant';
  userName: string;
}

export function MainLayout({ children, userRole, userName }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={userName} userRole={userRole} />
      <div className="flex">
        <Sidebar userRole={userRole} />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
