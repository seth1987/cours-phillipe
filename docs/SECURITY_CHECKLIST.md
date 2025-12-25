# 🔒 SECURITY CHECKLIST - Générateur d'Exercices RDM

**Date d'audit** : 2025-12-25
**Score actuel** : 65% 🔴
**Score cible** : 85% ✅

---

## ⚡ ACTIONS CRITIQUES (À faire MAINTENANT)

### 🔴 1. Régénérer TOUTES les clés API (Durée : 30 min)

**Impact** : CRITIQUE - Projet actuellement compromis

#### Supabase
```
1. Aller sur https://supabase.com/dashboard
2. Projet : ivgcnymjlnnmpcsrfntv
3. Settings → API → Reset
   - anon public key
   - service_role key
4. Copier les nouvelles clés
```

#### Gemini
```
1. Aller sur https://aistudio.google.com/app/apikey
2. SUPPRIMER l'ancienne clé : AIzaSyCLGqGiozI_ReVqeJ4pXbS3N9IaSA09-t8
3. Créer une nouvelle clé
4. Copier la nouvelle clé
```

#### Mettre à jour .env.local
```bash
# NOUVELLES CLÉS (ne PAS commiter!)
NEXT_PUBLIC_SUPABASE_URL=https://ivgcnymjlnnmpcsrfntv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NOUVELLE_CLE>
SUPABASE_SERVICE_ROLE_KEY=<NOUVELLE_CLE>
GEMINI_API_KEY=<NOUVELLE_CLE>
```

**Statut** : [ ] À faire
**Deadline** : IMMÉDIAT

---

### 🔴 2. Supprimer .env.local de l'historique Git (Durée : 15 min)

**Impact** : CRITIQUE - Clés exposées publiquement

```bash
# Sauvegarder le fichier
cp .env.local .env.local.backup

# Option recommandée : git-filter-repo
pip install git-filter-repo
git filter-repo --path .env.local --invert-paths

# Alternative : git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordonner avec l'équipe!)
git push origin --force --all

# Vérifier suppression
git log --all --full-history -- .env.local  # Doit être vide
```

**Statut** : [ ] À faire
**Deadline** : IMMÉDIAT

---

### 🔴 3. Retirer console.log exposant secrets (Durée : 1h)

**Impact** : HAUTE - Fuite d'infos sensibles en production

#### Étape 1 : Créer logger sécurisé
```bash
# Copier le template fourni
cp src/lib/logger.example.ts src/lib/logger.ts
```

#### Étape 2 : Remplacer dans src/lib/gemini.ts

**SUPPRIMER** :
```typescript
console.log('[GEMINI] GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('[GEMINI] GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);
console.log('[GEMINI] GEMINI_API_KEY first 10 chars:', process.env.GEMINI_API_KEY?.substring(0, 10));
console.log('[GEMINI] All env keys containing GEMINI:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
```

**REMPLACER PAR** :
```typescript
import { geminiLogger } from '@/lib/logger';

geminiLogger.debug('Library loaded -', GEMINI_LIB_VERSION);
geminiLogger.debug('API Key configured:', !!process.env.GEMINI_API_KEY);
```

#### Étape 3 : Remplacer dans src/actions/gemini.ts

**SUPPRIMER** :
```typescript
console.log('[GEMINI-ACTION] GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('[GEMINI-ACTION] GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);
```

**REMPLACER PAR** :
```typescript
import { geminiLogger } from '@/lib/logger';

geminiLogger.debug('Server Action loaded -', ACTION_VERSION);
geminiLogger.debug('API Key configured:', !!process.env.GEMINI_API_KEY);
```

#### Étape 4 : Remplacer dans src/actions/exercises.ts

**SUPPRIMER** :
```typescript
console.log('[CREATE-EXERCISE] Full formData received:', JSON.stringify(formData, null, 2));
```

**REMPLACER PAR** :
```typescript
import { exerciseLogger } from '@/lib/logger';

exerciseLogger.debug('Creating exercise');
exerciseLogger.debug('Input rdm_type_slug:', formData.rdm_type_slug);
```

**Statut** : [ ] À faire
**Deadline** : AUJOURD'HUI

---

### ⚠️ 4. Installer pre-commit hook (Durée : 20 min)

**Impact** : PRÉVENTION - Empêche futurs commits de secrets

```bash
# Installation
npm install --save-dev husky lint-staged
npx husky init

# Créer le hook
echo '#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx lint-staged' > .husky/pre-commit

# Linux/Mac uniquement
chmod +x .husky/pre-commit
```

**Ajouter dans package.json** :
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
      "bash -c 'if echo \"$1\" | grep -qE \"\\.(env|key|pem)$\"; then echo \"❌ Fichier secret détecté\"; exit 1; fi' --"
    ]
  }
}
```

**Test** :
```bash
git add .env.local
git commit -m "test"
# Doit afficher : "❌ Fichier secret détecté"
```

**Statut** : [ ] À faire
**Deadline** : AUJOURD'HUI

---

## 📋 VÉRIFICATIONS POST-CORRECTIONS

Après avoir appliqué les 4 corrections ci-dessus :

```bash
# ✅ 1. Vérifier que .env.local n'est plus tracké
git ls-files | grep -i "\.env"
# Output attendu : vide (ou seulement .env.example)

# ✅ 2. Vérifier aucun console.log avec secrets
grep -r "console\.log.*API_KEY" src/
# Output attendu : vide

# ✅ 3. Vérifier hook pre-commit
git add .env.local
git commit -m "test"
# Output attendu : "❌ Fichier secret détecté"
git reset HEAD .env.local  # Annuler

# ✅ 4. Tester que l'app fonctionne
npm run dev
# Tester : login, création exercice, upload image

# ✅ 5. Vérifier build production
npm run build
# Output attendu : Build successful

# ✅ 6. Scanner sécurité
.\scripts\security-scan.ps1  # Windows
# ou
bash scripts/security-scan.sh  # Linux/Mac
```

---

## 📊 PROGRESSION

### Priorité 0 - CRITIQUE ⏰ Aujourd'hui
- [ ] Régénérer clés Supabase (15 min)
- [ ] Régénérer clé Gemini (5 min)
- [ ] Supprimer .env.local de Git (15 min)
- [ ] Retirer console.log secrets (1h)
- [ ] Installer pre-commit hook (20 min)

**Total : ~2h** | **Deadline : FIN DE JOURNÉE**

---

### Priorité 1 - HAUTE 📅 Cette semaine
- [ ] Validation magic number uploads (1h)
- [ ] Validation métier exercises (1h)
- [ ] Vérification rôle middleware (30 min)

**Total : ~2h30**

---

### Priorité 2 - MOYENNE 🗓️ Ce mois
- [ ] Sanitization HTML (1h)
- [ ] Policy RLS anti-update (30 min)
- [ ] Tests sécurité automatisés (1h)
- [ ] Validation formules regex (30 min)
- [ ] Protection CSRF renforcée (1h)

**Total : ~4h**

---

## ✅ CHECKLIST FINALE

### Secrets & Environnement
- [ ] .env.local supprimé de l'historique Git
- [ ] Toutes les clés API régénérées et fonctionnelles
- [ ] .gitignore contient .env*.local
- [ ] Pre-commit hook installé et testé
- [ ] Aucun secret hardcodé dans le code source

### Logs & Debug
- [ ] Logger custom créé (src/lib/logger.ts)
- [ ] Tous console.log remplacés par logger
- [ ] Aucune fuite d'informations sensibles
- [ ] Niveaux de log configurés par environnement

### Validation & Sécurité
- [ ] Validation Zod sur tous les inputs
- [ ] Validation métier (cohérence des données)
- [ ] Magic number pour validation uploads
- [ ] Sanitization HTML pour user input
- [ ] Vérification rôles dans middleware

### Supabase & Auth
- [ ] RLS activé sur toutes les tables
- [ ] Policies testées et fonctionnelles
- [ ] Auth vérifiée dans toutes Server Actions
- [ ] Cookies httpOnly configurés

### Tests & Qualité
- [ ] Script security-scan passe sans erreurs
- [ ] npm audit ne montre aucune vulnérabilité critique
- [ ] Build production réussit
- [ ] Tests manuels passent
- [ ] Application fonctionnelle

---

## 🎯 OBJECTIF

**Score actuel** : 65% 🔴
**Après P0** : 80% ⚠️
**Après P1** : 85% ✅
**Après P2** : 90% 🎉

---

## 📞 EN CAS DE PROBLÈME

### Si git filter-branch échoue
```bash
# Annuler l'opération
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git reset --hard origin/master
```

### Si les nouvelles clés ne marchent pas
1. Vérifier que .env.local est chargé
2. Redémarrer le serveur dev (Ctrl+C puis npm run dev)
3. Vérifier la console browser pour erreurs

### Si le hook pre-commit bloque tout
```bash
# Désactiver temporairement
git commit --no-verify -m "message"

# Désinstaller si nécessaire
rm -rf .husky
npm uninstall husky lint-staged
```

---

## 📚 DOCUMENTATION COMPLÈTE

Pour plus de détails, consulter :

1. **docs/security-summary.md** - Résumé exécutif (5 min)
2. **docs/security-audit-report.md** - Rapport complet (15 min)
3. **docs/security-fixes-guide.md** - Guide détaillé (10 min)

---

## ⏱️ TIMELINE RECOMMANDÉE

```
Jour 1 (Aujourd'hui) - 2h
├─ 09:00 : Régénérer clés Supabase (15min)
├─ 09:15 : Régénérer clé Gemini (5min)
├─ 09:20 : Supprimer .env.local de Git (15min)
├─ 09:35 : Créer logger sécurisé (30min)
├─ 10:05 : Remplacer console.log (30min)
├─ 10:35 : Installer pre-commit hook (20min)
└─ 10:55 : Vérifications et tests (10min)

Semaine 1 - 2h30
├─ Validation magic number uploads (1h)
├─ Validation métier exercises (1h)
└─ Vérification rôle middleware (30min)

Mois 1 - 4h
├─ Sanitization HTML (1h)
├─ Tests sécurité automatisés (1h)
├─ Policy RLS anti-update (30min)
├─ Validation formules regex (30min)
└─ Protection CSRF renforcée (1h)
```

---

**Checklist créée le** : 2025-12-25
**Responsable** : Security & Best Practices Reviewer
**Prochaine révision** : Après corrections P0

🚨 **RAPPEL** : Les corrections Priorité 0 sont CRITIQUES et BLOQUANTES pour la production.
