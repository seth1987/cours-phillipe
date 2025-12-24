# Tâche 24 - Déploiement Vercel

## Contexte
Configurer et déployer l'application sur Vercel avec CI/CD automatique.

## User Stories liées
- Mise en production

## Durée estimée
**1-2 heures**

## Requirements

### Checklist
- [ ] Fichier vercel.json configuré
- [ ] Build optimisé pour production
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Domaine personnalisé (optionnel)
- [ ] Preview deployments configurés

## Acceptance Criteria

1. ✅ L'application se déploie sans erreur
2. ✅ Les variables d'environnement sont configurées
3. ✅ Le build est optimisé
4. ✅ Preview deployments fonctionnent

## Files to Create/Modify

| Fichier | Action | Description |
|---------|--------|-------------|
| `vercel.json` | Create | Config Vercel |
| `next.config.js` | Modify | Optimisations prod |

## Dependencies (blockers)
- ✅ Tâche 23 - Env Config
- ✅ Toutes les tâches précédentes

## Code Examples

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["cdg1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### next.config.js (optimisations)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisations de build
  poweredByHeader: false,

  // Images optimisées
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirections
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ];
  },

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
```

### Guide de Déploiement

## Étapes de Déploiement

### 1. Préparation

```bash
# Vérifier la configuration
npm run check-env

# Vérifier le build local
npm run build

# Tester en mode production
npm start
```

### 2. Connexion à Vercel

```bash
# Installer Vercel CLI (optionnel)
npm i -g vercel

# Se connecter
vercel login

# Lier le projet
vercel link
```

### 3. Configuration sur Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Importer le repository GitHub
3. Configurer les variables d'environnement:

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJ... |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ... |
| `GEMINI_API_KEY` | AIza... |

### 4. Déploiement

```bash
# Déploiement preview
vercel

# Déploiement production
vercel --prod
```

### 5. Post-Déploiement

1. Vérifier que l'application fonctionne
2. Configurer le domaine personnalisé (optionnel)
3. Activer les analytics Vercel (optionnel)

## CI/CD Automatique

Avec GitHub connecté, chaque:
- **Push sur main** → Déploiement production
- **Pull Request** → Preview deployment

## Monitoring

- Vercel Analytics pour les performances
- Vercel Logs pour le debugging
- Alertes email en cas d'erreur de build
