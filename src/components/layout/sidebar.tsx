'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BookOpen, Users, FileText, Home, GraduationCap } from 'lucide-react';

const profNavItems = [
  { href: '/professeur', label: 'Tableau de bord', icon: Home },
  { href: '/professeur/types', label: 'Types RDM', icon: BookOpen },
  { href: '/professeur/exercices', label: 'Mes exercices', icon: FileText },
  { href: '/professeur/etudiants', label: 'Étudiants', icon: Users },
];

const studentNavItems = [
  { href: '/etudiant', label: 'Mes exercices', icon: GraduationCap },
  { href: '/etudiant/historique', label: 'Historique', icon: FileText },
];

interface SidebarProps {
  userRole: 'professeur' | 'etudiant';
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const navItems = userRole === 'professeur' ? profNavItems : studentNavItems;

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-white min-h-[calc(100vh-4rem)]">
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
