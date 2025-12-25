# Guide de Correction des Failles de Sécurité

## 🔴 PRIORITÉ 1 - CRITIQUE (À faire MAINTENANT)

### 1. Régénérer toutes les clés API

#### Supabase
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet `ivgcnymjlnnmpcsrfntv`
3. **Settings** > **API**
4. Cliquer sur **Reset** pour :
   - `anon public key`
   - `service_role key` (⚠️ DANGEREUX - bien comprendre l'impact)
5. Copier les nouvelles clés

#### Gemini
1. Aller sur https://aistudio.google.com/app/apikey
2. **Supprimer** l'ancienne clé `AIzaSyCLGqGiozI_ReVqeJ4pXbS3N9IaSA09-t8`
3. **Créer une nouvelle clé**
4. Copier la nouvelle clé

#### Mettre à jour .env.local
```bash
# NOUVELLES CLÉS (ne pas commiter!)
NEXT_PUBLIC_SUPABASE_URL=https://ivgcnymjlnnmpcsrfntv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NOUVELLE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<NOUVEAU_SERVICE_ROLE_KEY>
GEMINI_API_KEY=<NOUVELLE_GEMINI_KEY>
```

---

### 2. Supprimer .env.local de l'historique Git

⚠️ **ATTENTION** : Cette opération réécrit l'historique Git. Coordonner avec l'équipe !

```bash
# Sauvegarder d'abord le fichier
cp .env.local .env.local.backup

# Option 1 : git filter-branch (ancienne méthode)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Option 2 : git-filter-repo (recommandé, plus rapide)
# Installation : pip install git-filter-repo
git filter-repo --path .env.local --invert-paths

# Forcer le push (coordonner avec l'équipe !)
git push origin --force --all

# Vérifier que le fichier n'est plus dans l'historique
git log --all --full-history -- .env.local  # Ne doit rien afficher
```

---

### 3. Installer pre-commit hook

#### Installation
```bash
npm install --save-dev husky lint-staged

# Initialiser husky
npx husky init

# Créer le hook pre-commit
echo '#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
' > .husky/pre-commit

# Rendre exécutable (Linux/Mac)
chmod +x .husky/pre-commit
```

#### Configuration dans package.json
```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*": [
      "bash -c 'if echo \"$1\" | grep -qE \"\\.(env|key|pem|p12)$\"; then echo \"❌ ERREUR: Fichier de secrets détecté: $1\"; exit 1; fi' --"
    ]
  }
}
```

#### Test du hook
```bash
# Essayer de commiter .env.local
git add .env.local
git commit -m "test"
# Doit afficher : "❌ ERREUR: Fichier de secrets détecté"
```

---

### 4. Retirer console.log des fichiers critiques

#### Créer un logger custom

**Fichier** : `src/lib/logger.ts`
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabledLevels: LogLevel[];
  prefix?: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

const defaultConfig: LoggerConfig = {
  enabledLevels: isDevelopment ? ['debug', 'info', 'warn', 'error'] : ['warn', 'error'],
  prefix: '',
};

function createLogger(config: LoggerConfig = defaultConfig) {
  const shouldLog = (level: LogLevel) => config.enabledLevels.includes(level);

  return {
    debug: (...args: unknown[]) => {
      if (shouldLog('debug')) {
        console.log(`[DEBUG]${config.prefix}`, ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (shouldLog('info')) {
        console.info(`[INFO]${config.prefix}`, ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (shouldLog('warn')) {
        console.warn(`[WARN]${config.prefix}`, ...args);
      }
    },
    error: (...args: unknown[]) => {
      if (shouldLog('error')) {
        console.error(`[ERROR]${config.prefix}`, ...args);
      }
    },
  };
}

// Loggers spécialisés
export const logger = createLogger();
export const geminiLogger = createLogger({ ...defaultConfig, prefix: ' [GEMINI]' });
export const exerciseLogger = createLogger({ ...defaultConfig, prefix: ' [EXERCISE]' });
```

#### Remplacer console.log dans src/lib/gemini.ts

**AVANT** :
```typescript
console.log('[GEMINI] Library loaded - ' + GEMINI_LIB_VERSION);
console.log('[GEMINI] Running on:', typeof window === 'undefined' ? 'SERVER' : 'CLIENT');
console.log('[GEMINI] GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('[GEMINI] GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);
console.log('[GEMINI] GEMINI_API_KEY first 10 chars:', process.env.GEMINI_API_KEY?.substring(0, 10) || 'EMPTY');
```

**APRÈS** :
```typescript
import { geminiLogger } from '@/lib/logger';

geminiLogger.debug('Library loaded -', GEMINI_LIB_VERSION);
geminiLogger.debug('Running on:', typeof window === 'undefined' ? 'SERVER' : 'CLIENT');
geminiLogger.debug('API Key configured:', !!process.env.GEMINI_API_KEY);
// ❌ JAMAIS logger la clé ou des parties de la clé
```

#### Remplacer console.log dans src/actions/gemini.ts

**AVANT** :
```typescript
console.log('[GEMINI-ACTION] Server Action loaded - ' + ACTION_VERSION);
console.log('[GEMINI-ACTION] GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('[GEMINI-ACTION] GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);
```

**APRÈS** :
```typescript
import { geminiLogger } from '@/lib/logger';

geminiLogger.debug('Server Action loaded -', ACTION_VERSION);
geminiLogger.debug('API Key configured:', !!process.env.GEMINI_API_KEY);
```

#### Remplacer console.log dans src/actions/exercises.ts

**AVANT** :
```typescript
console.log('[CREATE-EXERCISE] === Creating exercise ===');
console.log('[CREATE-EXERCISE] Full formData received:', JSON.stringify(formData, null, 2));
console.log('[CREATE-EXERCISE] Input rdm_type_slug:', formData.rdm_type_slug);
```

**APRÈS** :
```typescript
import { exerciseLogger } from '@/lib/logger';

exerciseLogger.debug('Creating exercise');
exerciseLogger.debug('Input rdm_type_slug:', formData.rdm_type_slug);
// ❌ Ne pas logger tout formData (peut contenir données sensibles)
```

---

## ⚠️ PRIORITÉ 2 - HAUTE (cette semaine)

### 5. Ajouter validation magic number pour uploads

**Fichier** : `src/lib/utils/file-validator.ts`
```typescript
// Magic numbers (signatures binaires) des formats autorisés
const FILE_SIGNATURES: Record<string, number[][]> = {
  jpeg: [
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG standard
    [0xFF, 0xD8, 0xFF, 0xE1], // JPEG avec EXIF
  ],
  png: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP est RIFF + WEBP)
  svg: [
    [0x3C, 0x73, 0x76, 0x67], // <svg
    [0x3C, 0x3F, 0x78, 0x6D], // <?xml
  ],
};

export async function validateFileSignature(file: File): Promise<{ valid: boolean; detectedType?: string }> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    for (const [fileType, signatures] of Object.entries(FILE_SIGNATURES)) {
      for (const signature of signatures) {
        const matches = signature.every((byte, index) => bytes[index] === byte);
        if (matches) {
          return { valid: true, detectedType: fileType };
        }
      }
    }

    return { valid: false };
  } catch (error) {
    console.error('[FILE-VALIDATOR] Error reading file:', error);
    return { valid: false };
  }
}

export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

export function sanitizeFilename(filename: string): string {
  // Retirer caractères dangereux
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.+/g, '.')
    .substring(0, 255);
}
```

**Utilisation dans `src/actions/storage.ts`** :
```typescript
import { validateFileSignature, validateFileSize, sanitizeFilename } from '@/lib/utils/file-validator';

export async function uploadExerciseImage(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { error: 'Aucun fichier fourni' };
  }

  // Validation taille
  if (!validateFileSize(file, 5)) {
    return { error: 'Fichier trop volumineux (max 5 Mo)' };
  }

  // Validation signature binaire
  const { valid, detectedType } = await validateFileSignature(file);
  if (!valid) {
    return { error: 'Type de fichier non autorisé ou fichier corrompu' };
  }

  // Vérifier que le type détecté correspond au MIME
  const allowedTypes: Record<string, string[]> = {
    jpeg: ['image/jpeg', 'image/jpg'],
    png: ['image/png'],
    gif: ['image/gif'],
    webp: ['image/webp'],
    svg: ['image/svg+xml'],
  };

  if (!allowedTypes[detectedType!]?.includes(file.type)) {
    return { error: 'Type MIME ne correspond pas au contenu du fichier' };
  }

  // Sanitize filename
  const ext = file.name.split('.').pop() || '';
  const safeName = sanitizeFilename(file.name.replace(`.${ext}`, ''));
  const filename = `${user.id}/${Date.now()}-${safeName}.${ext}`;

  // Upload...
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return { data: { url: urlData.publicUrl, path: data.path } };
}
```

---

### 6. Ajouter validation métier dans exercises.ts

**Fichier** : `src/actions/exercises.ts`

Ajouter après le `safeParse` dans `createExercise()` :

```typescript
export async function createExercise(formData: CreateExerciseInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Validation Zod
  const parsed = createExerciseSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // === NOUVELLES VALIDATIONS MÉTIER ===

  // 1. Vérifier cohérence statement_template <-> variable_ranges
  const statementVars = [...formData.statement_template.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
  const rangeVars = Object.keys(formData.variable_ranges);

  const missingInRanges = statementVars.filter(v => !rangeVars.includes(v));
  if (missingInRanges.length > 0) {
    return { error: `Variables manquantes dans variable_ranges: ${missingInRanges.join(', ')}` };
  }

  const unusedRanges = rangeVars.filter(v => !statementVars.includes(v));
  if (unusedRanges.length > 0) {
    return { error: `Variables non utilisées dans l'énoncé: ${unusedRanges.join(', ')}` };
  }

  // 2. Vérifier que expected_answers ont des formules non vides
  if (formData.expected_answers) {
    for (const answer of formData.expected_answers) {
      if (!answer.formula || answer.formula.trim() === '') {
        return { error: `La formule de "${answer.name}" est vide` };
      }

      // Vérifier caractères autorisés dans formule
      const validFormulaChars = /^[a-zA-Z0-9\s+\-*/().^{}_]+$/;
      if (!validFormulaChars.test(answer.formula)) {
        return { error: `La formule de "${answer.name}" contient des caractères non autorisés` };
      }
    }
  }

  // 3. Vérifier plages cohérentes (min < max)
  for (const [varName, range] of Object.entries(formData.variable_ranges)) {
    if (range.min >= range.max) {
      return { error: `Variable ${varName}: min (${range.min}) doit être < max (${range.max})` };
    }

    if (range.step && range.step <= 0) {
      return { error: `Variable ${varName}: step doit être > 0` };
    }
  }

  // === FIN VALIDATIONS MÉTIER ===

  // Validate that rdm_type_slug is provided
  if (!formData.rdm_type_slug) {
    return { error: 'Le type RDM est obligatoire' };
  }

  // ... reste du code existant
}
```

---

### 7. Ajouter vérification rôle dans middleware

**Fichier** : `src/lib/supabase/middleware.ts`

```typescript
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Redirect non-authentifiés
  if (!user && pathname.startsWith('/professeur')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (!user && pathname.startsWith('/etudiant')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // === NOUVELLE VÉRIFICATION RÔLE ===
  if (user && (pathname.startsWith('/professeur') || pathname.startsWith('/etudiant'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Empêcher étudiant d'accéder aux routes professeur
    if (pathname.startsWith('/professeur') && profile?.role !== 'professeur') {
      return NextResponse.redirect(new URL('/etudiant', request.url));
    }

    // Empêcher professeur d'accéder aux routes étudiant
    if (pathname.startsWith('/etudiant') && profile?.role === 'professeur') {
      return NextResponse.redirect(new URL('/professeur', request.url));
    }
  }
  // === FIN VÉRIFICATION RÔLE ===

  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const redirectUrl = profile?.role === 'professeur' ? '/professeur' : '/etudiant';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return supabaseResponse;
}
```

---

## 📋 CHECKLIST DE VÉRIFICATION

Après avoir appliqué les corrections :

```bash
# ✅ Vérifier que .env.local n'est plus tracké
git ls-files | grep -i "\.env"
# Ne doit PAS afficher .env.local

# ✅ Vérifier qu'il n'y a plus de console.log avec secrets
grep -r "console\.log.*API_KEY\|console\.log.*SECRET" src/

# ✅ Vérifier que le hook pre-commit fonctionne
git add .env.local
git commit -m "test"
# Doit rejeter le commit

# ✅ Vérifier que les nouvelles clés fonctionnent
npm run dev
# Tester login, création exercice, upload image

# ✅ Lancer les tests
npm run test

# ✅ Vérifier le build de production
npm run build

# ✅ Scanner vulnérabilités npm
npm audit
```

---

## 📞 EN CAS DE PROBLÈME

### Si le filter-branch échoue
```bash
# Annuler le filter-branch
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Revenir à l'état avant filter-branch
git reset --hard origin/master
```

### Si les nouvelles clés ne marchent pas
1. Vérifier que `.env.local` est bien chargé : `console.log(process.env.GEMINI_API_KEY)`
2. Redémarrer le serveur dev : `Ctrl+C` puis `npm run dev`
3. Vérifier la console browser pour erreurs CORS/Auth

### Si le hook pre-commit bloque tout
```bash
# Désactiver temporairement
git commit --no-verify -m "message"

# Désinstaller complètement
rm -rf .husky
npm uninstall husky lint-staged
```

---

**Guide de correction créé le** : 2025-12-25
**Durée estimée** : 2-4 heures pour tout appliquer
