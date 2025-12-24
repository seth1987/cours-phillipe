# Tâche 23 - Configuration Environnement

## Contexte
Configurer les variables d'environnement, les scripts de déploiement et la documentation de configuration.

## User Stories liées
- Déploiement et maintenance

## Durée estimée
**1-2 heures**

## Requirements

### Checklist
- [ ] Fichier .env.example documenté
- [ ] Validation des variables au démarrage
- [ ] Script de vérification de configuration
- [ ] Documentation des clés API nécessaires

## Acceptance Criteria

1. ✅ .env.example contient toutes les variables nécessaires
2. ✅ L'app échoue proprement si une variable manque
3. ✅ Documentation claire pour la configuration

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `.env.example` | Create | Template variables |
| `src/lib/env.ts` | Create | Validation env |
| `scripts/check-env.ts` | Create | Script vérification |

## Dependencies (blockers)
- ✅ Tâche 01 - Project Init

## Code Examples

### .env.example
```bash
# ===========================================
# RDM Exercices - Configuration Environnement
# ===========================================
# Copiez ce fichier vers .env.local et remplissez les valeurs

# ------------------------------------------
# Supabase (https://supabase.com)
# ------------------------------------------
# URL de votre projet Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Clé publique (anon key) - visible côté client
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Clé de service (service_role key) - UNIQUEMENT côté serveur
# Nécessaire pour créer des comptes étudiants
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ------------------------------------------
# Google Gemini AI (https://makersuite.google.com)
# ------------------------------------------
# Clé API pour la génération d'exercices
GEMINI_API_KEY=AIza...

# ------------------------------------------
# Application
# ------------------------------------------
# URL de base de l'application (pour les redirections)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environnement (development, production)
NODE_ENV=development
```

### Validation Environnement (src/lib/env.ts)
```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Gemini
  GEMINI_API_KEY: z.string().min(1),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Configuration environnement invalide:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Variables d\'environnement manquantes ou invalides');
  }

  return parsed.data;
}

export const env = validateEnv();

// Helper pour vérifier si on est côté serveur
export const isServer = typeof window === 'undefined';

// Helper pour l'URL de l'app
export const getAppUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};
```

### Script de Vérification (scripts/check-env.ts)
```typescript
#!/usr/bin/env tsx

import { config } from 'dotenv';
import { z } from 'zod';
import { existsSync } from 'fs';

// Charger .env.local
const envPath = '.env.local';
if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  console.warn('⚠️  Fichier .env.local non trouvé');
}

const requiredVars = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', description: 'URL Supabase' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Clé publique Supabase' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Clé service Supabase' },
  { name: 'GEMINI_API_KEY', description: 'Clé API Gemini' },
];

console.log('\n🔍 Vérification de la configuration...\n');

let hasErrors = false;

for (const { name, description } of requiredVars) {
  const value = process.env[name];

  if (!value) {
    console.log(`❌ ${name} - ${description} - MANQUANT`);
    hasErrors = true;
  } else {
    // Masquer les valeurs sensibles
    const masked = value.slice(0, 10) + '...' + value.slice(-4);
    console.log(`✅ ${name} - ${description} - ${masked}`);
  }
}

console.log('');

if (hasErrors) {
  console.log('❌ Configuration incomplète. Vérifiez votre fichier .env.local\n');
  process.exit(1);
} else {
  console.log('✅ Configuration valide !\n');
  process.exit(0);
}
```

### Package.json - Ajouter le script
```json
{
  "scripts": {
    "check-env": "tsx scripts/check-env.ts",
    "predev": "npm run check-env",
    "prebuild": "npm run check-env"
  }
}
```

### Documentation Configuration (docs/CONFIGURATION.md)
```markdown
# Configuration de l'Application

## Variables d'Environnement

### Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Allez dans Settings > API
3. Copiez:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client!

### Google Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com)
2. Créez une clé API
3. Copiez la clé → `GEMINI_API_KEY`

### Vérification

```bash
npm run check-env
```

## Déploiement Vercel

1. Connectez votre repository GitHub
2. Dans les settings Vercel, ajoutez les variables d'environnement
3. Déployez

Les variables `NEXT_PUBLIC_*` seront exposées côté client.
Les autres resteront côté serveur uniquement.
```
