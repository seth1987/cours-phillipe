# Rapport Security & Best Practices Audit
**Date**: 2025-12-25
**Projet**: Générateur d'Exercices RDM
**Auditeur**: Security & Best Practices Reviewer

---

## Résumé Exécutif

| Catégorie | Score | Statut |
|-----------|-------|--------|
| Authentification | 85% | ✅ BON |
| Politiques RLS | 90% | ✅ EXCELLENT |
| Validation des données | 75% | ⚠️ À AMÉLIORER |
| Secrets & Env Vars | 40% | 🔴 CRITIQUE |
| Logs & Debugging | 30% | 🔴 CRITIQUE |
| Upload de fichiers | 70% | ⚠️ À AMÉLIORER |

**Score global**: 65% - Des améliorations critiques nécessaires

---

## 🔴 FAILLES CRITIQUES (À corriger immédiatement)

### 1. **FUITE DE SECRETS - Fichier .env.local tracké dans Git**

**Sévérité**: 🔴 CRITIQUE
**Fichier**: `.env.local`
**Impact**: Exposition publique des clés API Supabase et Gemini

#### Problème
```bash
# Le fichier .env.local contient des secrets RÉELS :
NEXT_PUBLIC_SUPABASE_URL=https://ivgcnymjlnnmpcsrfntv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSyCLGqGiozI_ReVqeJ4pXbS3N9IaSA09-t8
```

Le fichier `.gitignore` contient bien `.env*.local`, MAIS le fichier a déjà été commité dans l'historique Git !

#### Recommandations URGENTES
```bash
# 1. Supprimer le fichier de l'historique Git (dangereux, coordonner avec l'équipe)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Régénérer IMMÉDIATEMENT toutes les clés exposées
# - Nouvelle ANON_KEY Supabase
# - Nouveau SERVICE_ROLE_KEY Supabase
# - Nouvelle GEMINI_API_KEY

# 3. Vérifier que .env.local est bien ignoré
git check-ignore .env.local  # Doit afficher ".env.local"

# 4. Ajouter une règle pre-commit pour empêcher les commits de secrets
npm install --save-dev husky lint-staged
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

**Configuration à ajouter dans `package.json`** :
```json
{
  "lint-staged": {
    "*": [
      "bash -c 'if git diff --cached --name-only | grep -E \"\\.(env|key|pem)$\"; then echo \"ERROR: Fichier de secrets détecté\"; exit 1; fi'"
    ]
  }
}
```

---

### 2. **CONSOLE.LOG en production**

**Sévérité**: 🔴 HAUTE
**Impact**: Fuite d'informations sensibles, pollution des logs

#### Fichiers affectés
```typescript
// src/lib/gemini.ts (27 console.log!)
console.log('[GEMINI] GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('[GEMINI] GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);
console.log('[GEMINI] GEMINI_API_KEY first 10 chars:', process.env.GEMINI_API_KEY?.substring(0, 10));

// src/actions/gemini.ts (10 console.log)
console.log('[GEMINI-ACTION] GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);

// src/actions/exercises.ts (8 console.log)
console.log('[CREATE-EXERCISE] Full formData received:', JSON.stringify(formData, null, 2));
```

#### Recommandation
Créer un logger custom avec niveaux d'environnement :

```typescript
// src/lib/logger.ts
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment) console.log('[DEBUG]', ...args);
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) console.info('[INFO]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
};

// Usage:
import { logger } from '@/lib/logger';
logger.debug('[GEMINI] API Key exists:', !!process.env.GEMINI_API_KEY);
```

Puis retirer TOUS les `console.log` directs et utiliser le logger.

---

## ⚠️ FAILLES MAJEURES

### 3. **Validation côté serveur insuffisante**

**Sévérité**: ⚠️ MOYENNE
**Fichier**: `src/actions/exercises.ts`

#### Problème
```typescript
// Line 27-43: createExercise()
const parsed = createExerciseSchema.safeParse(formData);
if (!parsed.success) {
  return { error: parsed.error.issues[0].message };
}

// MAIS ensuite aucune validation sur la cohérence des données :
// - formulas vs expected_answers
// - variable_ranges vs statement_template
// - tolerance_percent vs formulas
```

#### Recommandation
Ajouter des validations métier :

```typescript
// Après le safeParse, valider la cohérence :
const { data } = parsed;

// Vérifier que toutes les variables dans statement_template existent dans variable_ranges
const statementVars = [...data.statement_template.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
const rangeVars = Object.keys(data.variable_ranges);
const missingVars = statementVars.filter(v => !rangeVars.includes(v));

if (missingVars.length > 0) {
  return { error: `Variables manquantes dans variable_ranges: ${missingVars.join(', ')}` };
}

// Vérifier que expected_answers ont des formules valides
if (data.expected_answers) {
  for (const answer of data.expected_answers) {
    if (!answer.formula || answer.formula.trim() === '') {
      return { error: `La formule de "${answer.name}" est vide` };
    }
  }
}
```

---

### 4. **Upload de fichiers - Validation type MIME insuffisante**

**Sévérité**: ⚠️ MOYENNE
**Fichier**: `src/actions/storage.ts`

#### Problème
```typescript
// Line 21-24: Validation MIME uniquement côté client
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
if (!allowedTypes.includes(file.type)) {
  return { error: 'Type de fichier non autorisé...' };
}
```

**Problème**: Le `file.type` peut être spoofé par un attaquant.

#### Recommandation
Ajouter une validation du magic number (signature binaire) :

```typescript
// src/lib/utils/file-validator.ts
export async function validateImageType(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const arr = new Uint8Array(buffer).subarray(0, 4);

  // Magic numbers des formats autorisés
  const signatures: Record<string, number[][]> = {
    jpeg: [[0xFF, 0xD8, 0xFF]],
    png: [[0x89, 0x50, 0x4E, 0x47]],
    gif: [[0x47, 0x49, 0x46, 0x38]],
    webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF
  };

  for (const [format, sigs] of Object.entries(signatures)) {
    for (const sig of sigs) {
      if (sig.every((byte, i) => arr[i] === byte)) {
        return true;
      }
    }
  }

  return false;
}

// Usage dans storage.ts :
const isValidImage = await validateImageType(file);
if (!isValidImage) {
  return { error: 'Fichier corrompu ou type invalide' };
}
```

---

### 5. **Pas de protection CSRF explicite**

**Sévérité**: ⚠️ MOYENNE
**Fichiers**: Tous les Server Actions

#### Problème
Next.js Server Actions ont une protection CSRF basique, mais aucune couche supplémentaire.

#### Recommandation
Ajouter un middleware de vérification d'origine :

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // Vérifier que l'origine est bien notre domaine
  if (origin && !origin.endsWith(host!)) {
    return new Response('CSRF détecté', { status: 403 });
  }

  return await updateSession(request);
}
```

---

## ✅ POINTS FORTS

### 1. **Politiques RLS Supabase - Excellentes**

**Score**: 90%
**Fichier**: `supabase/migrations/002_rls_policies.sql`

Toutes les tables ont RLS activé avec des policies bien définies :

```sql
✅ profiles:
  - Users can view own profile
  - Profs can view students
  - Auto-insert on profile creation

✅ exercises:
  - Profs CRUD own exercises
  - Students can view published only

✅ exercise_instances:
  - Students view own instances
  - Profs view instances of their exercises

✅ attempts:
  - Students CRUD own attempts
  - Profs view attempts on their exercises
```

**Seule amélioration** : Ajouter une policy pour empêcher les profs de modifier des exercices avec tentatives :

```sql
-- À ajouter dans 002_rls_policies.sql
CREATE POLICY "Cannot update exercises with attempts" ON exercises
  FOR UPDATE USING (
    prof_id = auth.uid() AND
    NOT EXISTS (
      SELECT 1 FROM exercise_instances ei
      JOIN attempts a ON a.instance_id = ei.id
      WHERE ei.exercise_id = exercises.id
    )
  );
```

---

### 2. **Authentification Supabase - Bien implémentée**

**Score**: 85%

```typescript
✅ Middleware vérifie l'utilisateur sur toutes les routes protégées
✅ Redirections basées sur le rôle (professeur/etudiant)
✅ Toutes les Server Actions vérifient auth.getUser()
✅ Pas de token JWT custom (utilise Supabase Auth)
```

**Point d'amélioration** : Ajouter une vérification du rôle dans le middleware :

```typescript
// src/lib/supabase/middleware.ts
if (user && pathname.startsWith('/professeur')) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'professeur') {
    return NextResponse.redirect(new URL('/etudiant', request.url));
  }
}
```

---

### 3. **Schémas Zod - Bien structurés**

**Score**: 80%

```typescript
✅ Validation des emails, UUIDs, nombres
✅ Limites min/max définies
✅ Types enum pour difficulty, status
✅ Validation des URLs pour image_url
```

**Point d'amélioration** : Ajouter validation custom pour `formula` :

```typescript
const formulaSchema = z.string().refine(
  (val) => {
    // Vérifier que la formule contient uniquement des caractères mathématiques autorisés
    const allowedChars = /^[a-zA-Z0-9\s+\-*/().^{}]+$/;
    return allowedChars.test(val);
  },
  { message: 'Formule contient des caractères non autorisés' }
);
```

---

## 📊 CHECKLIST DE SÉCURITÉ

### Authentification
- ✅ Server Actions vérifient l'utilisateur
- ✅ Routes protégées via middleware
- ⚠️ Vérification du rôle manquante dans middleware
- ✅ Tokens gérés par Supabase Auth (httpOnly cookies)

### Politiques RLS
- ✅ Toutes les tables ont RLS activé
- ✅ Policies par rôle (professeur/etudiant)
- ✅ Policies séparant lecture/écriture
- ⚠️ Manque policy pour empêcher update avec tentatives

### Failles de sécurité
| Type | Sévérité | Fichier | Détecté | Corrigé |
|------|----------|---------|---------|---------|
| Secrets exposés | 🔴 CRITIQUE | `.env.local` | ✅ | ❌ |
| Console.log en prod | 🔴 HAUTE | `gemini.ts`, `exercises.ts` | ✅ | ❌ |
| Type MIME spoofing | ⚠️ MOYENNE | `storage.ts` | ✅ | ❌ |
| Validation métier | ⚠️ MOYENNE | `exercises.ts` | ✅ | ❌ |
| CSRF protection | ⚠️ BASSE | `middleware.ts` | ✅ | ❌ |

### Validations
- ✅ Schémas Zod pour tous les inputs
- ✅ Validation côté serveur
- ⚠️ Validation métier incomplète (cohérence des données)
- ⚠️ Sanitization HTML manquante pour `statement_template`

### Variables d'environnement
- ✅ `.env.example` bien configuré
- 🔴 `.env.local` exposé dans Git
- ⚠️ Pas de validation au démarrage de l'app
- ✅ NEXT_PUBLIC_ utilisé correctement

---

## 🎯 RECOMMANDATIONS PRIORITAIRES

### Priorité 1 - CRITIQUE (dans les 24h)
1. ✅ **Régénérer toutes les clés API** (Supabase + Gemini)
2. ✅ **Supprimer `.env.local` de l'historique Git**
3. ✅ **Installer hook pre-commit** pour empêcher commits de secrets
4. ✅ **Retirer tous les console.log exposant des secrets**

### Priorité 2 - HAUTE (cette semaine)
5. ⚠️ **Créer un logger custom** avec niveaux d'environnement
6. ⚠️ **Ajouter validation magic number** pour uploads
7. ⚠️ **Compléter validation métier** dans Server Actions
8. ⚠️ **Ajouter vérification rôle** dans middleware

### Priorité 3 - MOYENNE (ce mois)
9. 📌 **Ajouter sanitization HTML** pour `statement_template`
10. 📌 **Policy RLS** pour empêcher update exercices avec tentatives
11. 📌 **Validation formules** avec regex custom
12. 📌 **Tests de sécurité** automatisés (injection, XSS)

---

## 📋 FICHIERS À MODIFIER

```bash
# Modifications critiques
.env.local                              # SUPPRIMER de Git
.gitignore                              # Vérifier configuration
src/lib/gemini.ts                       # Retirer console.log
src/actions/gemini.ts                   # Retirer console.log
src/actions/exercises.ts                # Retirer console.log

# Améliorations sécurité
src/lib/logger.ts                       # À CRÉER
src/lib/utils/file-validator.ts         # À CRÉER
src/middleware.ts                       # Ajouter vérification rôle
src/actions/storage.ts                  # Validation magic number
supabase/migrations/007_security.sql    # Nouvelles policies

# Configuration hooks
.husky/pre-commit                       # À CRÉER
package.json                            # Ajouter lint-staged
```

---

## 🔍 COMMANDES D'AUDIT

```bash
# Rechercher secrets potentiels
grep -r "API_KEY\|SECRET\|PASSWORD" --include="*.ts" --include="*.tsx" src/

# Rechercher console.log
grep -r "console\.log" --include="*.ts" --include="*.tsx" src/

# Vérifier fichiers ignorés
git check-ignore -v .env.local

# Lister tous les fichiers trackés contenant "env"
git ls-files | grep -i env

# Scanner vulnérabilités npm
npm audit

# Vérifier politiques RLS Supabase
psql $DATABASE_URL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
```

---

## ✅ CONCLUSION

Le projet a de **bonnes fondations sécurité** (RLS, Supabase Auth), mais souffre de **deux problèmes critiques** :

1. 🔴 **Secrets exposés dans Git** - Risque de compromission complète
2. 🔴 **Logs debug en production** - Fuite d'informations sensibles

**Après correction de ces 2 points**, le score passera de **65% à 85%**.

Les autres améliorations (validation, CSRF, upload) sont importantes mais moins urgentes.

---

**Rapport généré le**: 2025-12-25
**Prochaine révision**: Après corrections prioritaires
