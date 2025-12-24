# Tâche 17 - Gestion des Étudiants

## Contexte
Créer l'interface de gestion des comptes étudiants par le professeur : création, liste, suppression.

## User Stories liées
- US-009 : Gérer les comptes étudiants

## Durée estimée
**2-3 heures**

## Requirements

### Checklist
- [ ] Page liste des étudiants
- [ ] Modal création étudiant
- [ ] Validation email/mot de passe
- [ ] Action supprimer étudiant
- [ ] Affichage statistiques par étudiant
- [ ] Export liste (optionnel)

## Acceptance Criteria

1. ✅ Le prof peut créer un compte étudiant avec email/nom/mdp
2. ✅ Le prof voit la liste de ses étudiants
3. ✅ Le prof peut supprimer un étudiant
4. ✅ Les statistiques de chaque étudiant sont visibles

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/app/(protected)/prof/etudiants/page.tsx` | Create | Page liste |
| `src/components/students/student-table.tsx` | Create | Tableau |
| `src/components/students/create-student-modal.tsx` | Create | Modal création |
| `src/components/students/student-stats.tsx` | Create | Stats étudiant |

## Dependencies (blockers)
- ✅ Tâche 12 - Student Actions
- ✅ Tâche 13 - Layout

## Code Examples

### Page Étudiants (src/app/(protected)/prof/etudiants/page.tsx)
```typescript
import { getStudents } from '@/actions/students';
import { StudentTable } from '@/components/students/student-table';
import { CreateStudentButton } from '@/components/students/create-student-button';

export default async function StudentsPage() {
  const { data: students, error } = await getStudents();

  if (error) {
    return <div className="text-red-500">Erreur: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes étudiants</h1>
          <p className="text-muted-foreground">
            {students?.length || 0} étudiant(s) inscrit(s)
          </p>
        </div>
        <CreateStudentButton />
      </div>

      <StudentTable students={students || []} />
    </div>
  );
}
```

### Student Table (src/components/students/student-table.tsx)
```typescript
'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteStudent } from '@/actions/students';
import { Trash2, Mail } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Student {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface StudentTableProps {
  students: Student[];
}

export function StudentTable({ students }: StudentTableProps) {
  const router = useRouter();

  const handleDelete = async (studentId: string) => {
    const result = await deleteStudent(studentId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Étudiant supprimé');
    router.refresh();
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun étudiant inscrit.</p>
        <p className="text-sm">Créez des comptes pour vos étudiants.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Inscrit le</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">{student.full_name}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {student.email}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(student.created_at)}
            </TableCell>
            <TableCell className="text-right">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer l'étudiant ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement le compte de {student.full_name}
                      ainsi que toutes ses tentatives. Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(student.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Create Student Modal (src/components/students/create-student-modal.tsx)
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createStudent } from '@/actions/students';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface CreateStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStudentModal({ open, onOpenChange }: CreateStudentModalProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
    setShowPassword(true);
  };

  const handleCreate = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error('Tous les champs sont requis');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createStudent({ fullName, email, password });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Compte créé pour ${fullName}`);
      onOpenChange(false);
      setFullName('');
      setEmail('');
      setPassword('');
      router.refresh();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un compte étudiant</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean.dupont@etu.u-bordeaux.fr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 caractères"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={generatePassword}
              >
                Générer
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Communiquez ce mot de passe à l'étudiant de manière sécurisée.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer le compte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Create Student Button (src/components/students/create-student-button.tsx)
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateStudentModal } from './create-student-modal';
import { UserPlus } from 'lucide-react';

export function CreateStudentButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4 mr-2" />
        Ajouter un étudiant
      </Button>
      <CreateStudentModal open={open} onOpenChange={setOpen} />
    </>
  );
}
```
