# Plan de Développement - RDM Exercices

## Vue d'ensemble

Ce document décrit le plan de développement complet pour l'application **RDM Exercices**, une plateforme de génération et gestion d'exercices de Résistance des Matériaux pour l'Université de Bordeaux - Département Génie Civil.

## Résumé des phases

| Phase | Nom | Tâches | Durée estimée |
|-------|-----|--------|---------------|
| 1 | Setup | 6 | ~6-8h |
| 2 | Core Features | 6 | ~12-15h |
| 3 | UI/UX | 7 | ~18-22h |
| 4 | Polish & Deploy | 6 | ~10-14h |
| **Total** | | **25 tâches** | **~46-59h** |

---

## Phase 1 - Setup (Fondations)

Infrastructure et configuration de base.

| # | Tâche | Fichier | Durée | Dépendances |
|---|-------|---------|-------|-------------|
| 01 | Project Init | `phase-1-setup/01-project-init.md` | 1-2h | - |
| 02 | Supabase Setup | `phase-1-setup/02-supabase-setup.md` | 1h | 01 |
| 03 | Database Schema | `phase-1-setup/03-database-schema.md` | 1-2h | 02 |
| 04 | RLS Policies | `phase-1-setup/04-rls-policies.md` | 1h | 03 |
| 05 | Auth System | `phase-1-setup/05-auth-system.md` | 2h | 02, 04 |
| 06 | Seed Types | `phase-1-setup/06-seed-types.md` | 1h | 03 |

### Livrables Phase 1
- [ ] Projet Next.js 14 fonctionnel avec shadcn/ui
- [ ] Base de données Supabase configurée
- [ ] Schéma complet avec les 6 tables
- [ ] Politiques RLS pour la sécurité
- [ ] Authentification fonctionnelle
- [ ] 7 types RDM pré-chargés

---

## Phase 2 - Core Features (Logique métier)

Implémentation de la logique métier sans interface.

| # | Tâche | Fichier | Durée | Dépendances |
|---|-------|---------|-------|-------------|
| 07 | Gemini Integration | `phase-2-core/01-gemini-integration.md` | 2-3h | 01 |
| 08 | Formula Calculator | `phase-2-core/02-formula-calculator.md` | 2-3h | 01 |
| 09 | Variant Generator | `phase-2-core/03-variant-generator.md` | 2h | 01 |
| 10 | Tolerance Checker | `phase-2-core/04-tolerance-checker.md` | 1h | 01 |
| 11 | Exercise Actions | `phase-2-core/05-exercise-actions.md` | 3-4h | 02-06, 08, 09 |
| 12 | Student Actions | `phase-2-core/06-student-actions.md` | 2-3h | 05, 10, 11 |

### Livrables Phase 2
- [ ] Génération d'énoncés avec Gemini AI
- [ ] Calcul correct des formules RDM chaînées
- [ ] Variantes uniques et déterministes par étudiant
- [ ] Vérification des réponses avec tolérance
- [ ] Server Actions exercices complets (CRUD + publication)
- [ ] Server Actions étudiants (gestion + soumissions)

---

## Phase 3 - UI/UX (Interface utilisateur)

Construction de l'interface utilisateur complète.

| # | Tâche | Fichier | Durée | Dépendances |
|---|-------|---------|-------|-------------|
| 13 | Layout Navigation | `phase-3-ui/01-layout-navigation.md` | 2-3h | 01, 05 |
| 14 | Type Library | `phase-3-ui/02-type-library.md` | 2-3h | 06, 11, 13 |
| 15 | Exercise Editor | `phase-3-ui/03-exercise-editor.md` | 4-5h | 07, 11, 14 |
| 16 | Exercise List | `phase-3-ui/04-exercise-list.md` | 3-4h | 11, 13 |
| 17 | Student Management | `phase-3-ui/05-student-management.md` | 2-3h | 12, 13 |
| 18 | Student Dashboard | `phase-3-ui/06-student-dashboard.md` | 4-5h | 12, 13 |
| 19 | Results Dashboard | `phase-3-ui/07-results-dashboard.md` | 3-4h | 12, 16 |

### Livrables Phase 3
- [ ] Layout responsive avec navigation
- [ ] Bibliothèque des types RDM avec formules LaTeX
- [ ] Éditeur d'exercice complet avec génération IA
- [ ] Liste des exercices avec actions contextuelles
- [ ] Gestion des comptes étudiants
- [ ] Dashboard étudiant avec résolution d'exercices
- [ ] Dashboard résultats avec export CSV

---

## Phase 4 - Polish & Deploy (Finalisation)

Optimisations, tests et déploiement.

| # | Tâche | Fichier | Durée | Dépendances |
|---|-------|---------|-------|-------------|
| 20 | Auth Pages | `phase-4-deploy/01-auth-pages.md` | 1-2h | 05 |
| 21 | Error Handling | `phase-4-deploy/02-error-handling.md` | 2h | 01 |
| 22 | Responsive Design | `phase-4-deploy/03-responsive-design.md` | 2-3h | 13 |
| 23 | Env Config | `phase-4-deploy/04-env-config.md` | 1-2h | 01 |
| 24 | Vercel Deploy | `phase-4-deploy/05-vercel-deploy.md` | 1-2h | 23, tout |
| 25 | Testing | `phase-4-deploy/06-testing.md` | 3-4h | 01 |

### Livrables Phase 4
- [ ] Pages d'authentification soignées
- [ ] Gestion des erreurs et loading states
- [ ] Design responsive et accessible
- [ ] Configuration environnement documentée
- [ ] Déploiement Vercel fonctionnel
- [ ] Tests unitaires avec >70% coverage

---

## Guide d'exécution

### Ordre recommandé

```
Phase 1 (séquentiel) → Phase 2 (parallélisable) → Phase 3 (parallélisable) → Phase 4 (séquentiel)
```

### Tâches parallélisables

**Phase 2** (après tâches 01-06) :
- Tâches 07, 08, 09, 10 peuvent être faites en parallèle
- Tâche 11 après 08, 09
- Tâche 12 après 10, 11

**Phase 3** (après Phase 2) :
- Tâches 14, 15, 17 peuvent être faites en parallèle après 13
- Tâches 16, 18, 19 dépendent des précédentes

### Points de validation

Après chaque phase, vérifier :

1. **Phase 1** : `npm run dev` démarre, connexion Supabase OK
2. **Phase 2** : Tests unitaires passent
3. **Phase 3** : Parcours utilisateur complet possible
4. **Phase 4** : Déploiement Vercel réussi

---

## Stack Technique

| Catégorie | Technologie |
|-----------|-------------|
| Framework | Next.js 14 (App Router) |
| UI | Tailwind CSS + shadcn/ui |
| Base de données | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Google Gemini API |
| Math | mathjs + KaTeX |
| Tests | Vitest |
| Déploiement | Vercel |

---

## Commandes utiles

```bash
# Développement
npm run dev

# Build
npm run build

# Tests
npm run test
npm run test:coverage

# Vérifications
npm run lint
npm run typecheck
npm run check-env
```

---

## Structure des fichiers de tâche

Chaque fichier de tâche contient :
- **Contexte** : Description du pourquoi
- **User Stories** : Liens vers les US du PRD
- **Durée estimée** : Temps prévu
- **Checklist** : Liste des sous-tâches
- **Acceptance Criteria** : Critères de validation
- **Files to Create/Modify** : Fichiers impactés
- **Dependencies** : Tâches préalables
- **Code Examples** : Exemples de code complets

---

## Suivi de progression

### Légende
- [ ] À faire
- [x] Terminé

### Checklist globale

#### Phase 1 - Setup
- [ ] 01 - Project Init
- [ ] 02 - Supabase Setup
- [ ] 03 - Database Schema
- [ ] 04 - RLS Policies
- [ ] 05 - Auth System
- [ ] 06 - Seed Types

#### Phase 2 - Core Features
- [ ] 07 - Gemini Integration
- [ ] 08 - Formula Calculator
- [ ] 09 - Variant Generator
- [ ] 10 - Tolerance Checker
- [ ] 11 - Exercise Actions
- [ ] 12 - Student Actions

#### Phase 3 - UI/UX
- [ ] 13 - Layout Navigation
- [ ] 14 - Type Library
- [ ] 15 - Exercise Editor
- [ ] 16 - Exercise List
- [ ] 17 - Student Management
- [ ] 18 - Student Dashboard
- [ ] 19 - Results Dashboard

#### Phase 4 - Polish & Deploy
- [ ] 20 - Auth Pages
- [ ] 21 - Error Handling
- [ ] 22 - Responsive Design
- [ ] 23 - Env Config
- [ ] 24 - Vercel Deploy
- [ ] 25 - Testing

---

**Projet** : RDM Exercices
**Client** : Université de Bordeaux - Département Génie Civil
**Date** : Décembre 2024
