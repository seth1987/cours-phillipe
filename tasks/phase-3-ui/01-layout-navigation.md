# Tâche 13 - Layout et Navigation

## Contexte
Créer la structure de base de l'application avec le layout principal, la navigation et les composants communs.

## User Stories liées
- Toutes les US (interface commune)

## Durée estimée
**2-3 heures**

## Requirements

### Checklist
- [ ] Layout principal avec sidebar/header
- [ ] Navigation responsive
- [ ] Composant Header avec user info
- [ ] Sidebar avec menu contextuel (prof/student)
- [ ] Breadcrumb navigation
- [ ] Loading states globaux
- [ ] Theme provider (light mode par défaut)

## Acceptance Criteria

1. ✅ Navigation claire et intuitive
2. ✅ Design responsive (mobile/desktop)
3. ✅ Indication visuelle de la page active
4. ✅ Affichage du nom/rôle de l'utilisateur

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/layout/main-layout.tsx` | Create | Layout principal |
| `src/components/layout/header.tsx` | Create | Header avec user |
| `src/components/layout/sidebar.tsx` | Create | Menu latéral |
| `src/components/layout/nav-item.tsx` | Create | Item de navigation |
| `src/components/layout/breadcrumb.tsx` | Create | Fil d'Ariane |
| `src/app/(protected)/layout.tsx` | Create | Layout protégé |

## Dependencies (blockers)
- ✅ Tâche 01 - Project Init
- ✅ Tâche 05 - Auth System

## Code Examples

### Main Layout (src/components/layout/main-layout.tsx)
```typescript
'use client';

import { ReactNode } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  userRole: 'prof' | 'student';
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
```

### Header (src/components/layout/header.tsx)
```typescript
'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';
import { logout } from '@/actions/auth';

interface HeaderProps {
  userName: string;
  userRole: 'prof' | 'student';
}

export function Header({ userName, userRole }: HeaderProps) {
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = userRole === 'prof' ? 'Professeur' : 'Étudiant';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary">
            RDM Exercices
          </h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

### Sidebar (src/components/layout/sidebar.tsx)
```typescript
'use client';

import { usePathname } from 'next/navigation';
import { NavItem } from './nav-item';
import {
  BookOpen,
  Users,
  FileText,
  BarChart,
  Home,
  GraduationCap,
} from 'lucide-react';

interface SidebarProps {
  userRole: 'prof' | 'student';
}

const profNavItems = [
  { href: '/prof', label: 'Tableau de bord', icon: Home },
  { href: '/prof/types', label: 'Types RDM', icon: BookOpen },
  { href: '/prof/exercices', label: 'Mes exercices', icon: FileText },
  { href: '/prof/etudiants', label: 'Étudiants', icon: Users },
  { href: '/prof/resultats', label: 'Résultats', icon: BarChart },
];

const studentNavItems = [
  { href: '/student', label: 'Mes exercices', icon: GraduationCap },
  { href: '/student/historique', label: 'Historique', icon: FileText },
];

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const navItems = userRole === 'prof' ? profNavItems : studentNavItems;

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-white min-h-[calc(100vh-4rem)]">
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </nav>
    </aside>
  );
}
```

### Nav Item (src/components/layout/nav-item.tsx)
```typescript
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
}

export function NavItem({ href, label, icon: Icon, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
```
