# Tâche 22 - Design Responsive et Accessibilité

## Contexte
S'assurer que l'application est utilisable sur tous les appareils et respecte les standards d'accessibilité.

## User Stories liées
- Toutes les US (utilisabilité)

## Durée estimée
**2-3 heures**

## Requirements

### Checklist
- [ ] Navigation mobile (hamburger menu)
- [ ] Tables responsives (scroll horizontal)
- [ ] Formulaires adaptés mobile
- [ ] Labels accessibles (aria-label)
- [ ] Contraste des couleurs vérifié
- [ ] Focus visible sur tous les éléments interactifs

## Acceptance Criteria

1. ✅ L'app est utilisable sur mobile (320px+)
2. ✅ Les tableaux scrollent horizontalement sur petit écran
3. ✅ La navigation est accessible au clavier
4. ✅ Les contrastes respectent WCAG AA

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/layout/mobile-nav.tsx` | Create | Nav mobile |
| `src/components/layout/header.tsx` | Modify | Ajouter menu mobile |
| `src/components/ui/responsive-table.tsx` | Create | Table responsive |

## Dependencies (blockers)
- ✅ Tâche 13 - Layout

## Code Examples

### Mobile Navigation (src/components/layout/mobile-nav.tsx)
```typescript
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  userRole: 'prof' | 'student';
  navItems: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

export function MobileNav({ userRole, navItems }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
      </SheetContent>
    </Sheet>
  );
}
```

### Responsive Table (src/components/ui/responsive-table.tsx)
```typescript
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className="min-w-[600px]">
        {children}
      </div>
    </div>
  );
}
```

### Header avec Mobile Nav (src/components/layout/header.tsx - modification)
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
import { MobileNav } from './mobile-nav';
import { LogOut, User } from 'lucide-react';
import { logout } from '@/actions/auth';

// Import des items de navigation
import {
  BookOpen,
  Users,
  FileText,
  BarChart,
  Home,
  GraduationCap,
} from 'lucide-react';

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
  const navItems = userRole === 'prof' ? profNavItems : studentNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <MobileNav userRole={userRole} navItems={navItems} />
          <h1 className="text-xl font-bold text-primary">
            RDM Exercices
          </h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              aria-label={`Menu utilisateur pour ${userName}`}
            >
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

### Styles Globaux pour Accessibilité (ajout à globals.css)
```css
/* Focus visible pour l'accessibilité */
:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* Skip link pour l'accessibilité clavier */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: hsl(var(--primary));
  color: white;
  padding: 8px 16px;
  z-index: 100;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 0;
}

/* Améliorer la lisibilité sur petit écran */
@media (max-width: 640px) {
  html {
    font-size: 14px;
  }
}
```
