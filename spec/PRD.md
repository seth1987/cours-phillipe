# PRD - Générateur d'Exercices RDM

## 1. Executive Summary

| Champ | Valeur |
|-------|--------|
| **Nom du produit** | RDM-Exercices |
| **Description** | Plateforme web de génération automatique d'exercices de Résistance des Matériaux avec variantes uniques anti-triche et correction automatique |
| **Client** | Université de Bordeaux - Département Génie Civil |
| **Utilisateurs** | 1 professeur + ~30 étudiants |
| **Budget** | 0€ (stack 100% gratuit) |
| **Date de lancement cible** | Février 2025 (Semestre 2) |

---

## 2. Problem Statement

### Problématique résolue

| Problème | Solution apportée |
|----------|-------------------|
| Exercices identiques = triche facile | Variantes automatiques par étudiant (valeurs différentes) |
| Correction manuelle chronophage | Correction automatique avec tolérance paramétrable |
| Pas de suivi individuel | Tableau de bord avec stats par étudiant et par exercice |
| Création d'exercices longue | Génération IA + bibliothèque de modèles réutilisables |

### Objectif
Créer une plateforme web permettant à un professeur de générer des exercices de résistance des matériaux via l'intelligence artificielle, de les publier à ses étudiants avec des variantes personnalisées (anti-triche), et d'obtenir une correction automatique avec suivi statistique.

---

## 3. Acteurs du système

| Acteur | Rôle | Actions principales |
|--------|------|---------------------|
| **Professeur** | Administrateur | Génère, valide, publie exercices. Gère étudiants. Consulte stats. |
| **Étudiant** | Utilisateur | Consulte exercices, soumet réponses, voit feedback. |
| **Système IA** | Générateur | Génère énoncés, plages de valeurs, résolutions détaillées. |

---

## 4. Architecture Technique

### Vue d'ensemble

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Interface    │    │     Backend     │    │       IA        │
│       Web       │◄──►│    + Base       │◄──►│   (génération   │
│    (Vercel)     │    │   (Supabase)    │    │     Gemini)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                      ▲
        │                      │
┌───────┴───────┐      ┌───────┴───────┐
│   Étudiant    │      │   Professeur  │
└───────────────┘      └───────────────┘
```

### Composants techniques

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Frontend | Next.js 14 / React | Interface utilisateur responsive |
| Hébergement | Vercel (gratuit) | Déploiement automatique, CDN |
| Backend + Auth | Supabase (gratuit) | API, authentification, base PostgreSQL |
| Base de données | PostgreSQL (Supabase) | Stockage exercices, users, stats |
| Stockage fichiers | Supabase Storage | Images des exercices |
| IA Génération | Google Gemini API (gratuit) | Génération énoncés et résolutions |

---

## 5. Concepts Clés : Types et Modèles

### Deux niveaux de réutilisation

Le système distingue deux concepts fondamentaux pour organiser les exercices :

### TYPE (Squelette mathématique)

Un TYPE définit la structure mathématique d'un exercice. Il contient les formules, les variables impliquées et l'unité de la réponse. Les types sont soit pré-remplis (bibliothèque de base), soit créés par le professeur.

| Élément | Exemple : Flexion poutre bi-appuyée |
|---------|-------------------------------------|
| **Formules** | Mf = (P×L)/4, I = (b×h³)/12, σ = (Mf×y)/I |
| **Variables** | L (longueur), b (largeur), h (hauteur), P (charge) |
| **Unité réponse** | MPa |

### MODÈLE (Exercice sauvegardé)

Un MODÈLE est un exercice complet personnalisé que le professeur sauvegarde pour le réutiliser ultérieurement.

| Élément | Exemple : Modèle "Flexion passerelle bois" |
|---------|-------------------------------------------|
| **Basé sur** | TYPE flexion bi-appuyée |
| **Énoncé** | Une passerelle en bois de longueur {L} m... |
| **Plages** | L [3-6m], b [15-25cm], h [30-50cm], P [5-20kN] |
| **Image** | passerelle.png |
| **Tolérance** | ±3% |

### Ce que l'IA génère vs ce qui est fixe

| Élément | Fixe ou Généré ? | Détail |
|---------|------------------|--------|
| Formules | **FIXE** | Définies par le TYPE choisi |
| Variables | **FIXE** | Découlent des formules |
| Unité réponse | **FIXE** | Définie par le TYPE |
| Énoncé contextualisé | **GÉNÉRÉ** | Mise en situation réaliste |
| Plages min/max | **GÉNÉRÉ** | Valeurs cohérentes proposées |
| Résolution détaillée | **GÉNÉRÉ** | Explication pédagogique étape par étape |

### Flux de création

```
TYPE (formules fixes)
       │
       ▼ Prof choisit un type
IA GÉNÈRE (énoncé, plages, résolution)
       │
       ▼ Prof ajuste et valide
EXERCICE
       │
       ├──► Prof publie aux étudiants
       │
       └──► Prof sauvegarde en MODÈLE (optionnel)
              │
              ▼ Plus tard : "Réutiliser"
       NOUVEL EXERCICE (pré-rempli)
```

---

## 6. Cycle de Vie d'un Exercice

### États possibles

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  BROUILLON   │──►│    VALIDÉ    │──►│    PUBLIÉ    │──►│   ARCHIVÉ    │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
   IA génère         Prof relit,       Visible par        Plus visible,
   le template       modifie,          les étudiants      stats conservées
                     approuve
                                            │
                                            ▼
                                    ┌──────────────────┐
                                    │ Manuel OU Auto   │
                                    │   (deadline)     │
                                    └──────────────────┘
```

### Détail des états

| État | Description | Actions possibles |
|------|-------------|-------------------|
| **BROUILLON** | Exercice généré par l'IA, en attente de validation | Modifier, Supprimer, Valider |
| **VALIDÉ** | Approuvé par le prof, prêt à publier | Modifier, Publier, Supprimer |
| **PUBLIÉ** | Visible et accessible aux étudiants | Archiver (manuel ou auto) |
| **ARCHIVÉ** | Terminé, plus accessible aux étudiants | Consulter stats, Afficher correction |

### Règles de transition

- Modifier un exercice **PUBLIÉ** = création d'un **NOUVEL** exercice (l'ancien reste intact)
- Archivage automatique si une date limite est définie et dépassée
- Archivage manuel possible à tout moment par le professeur
- Option d'afficher la correction aux étudiants après archivage

---

## 7. User Stories & Requirements

### MVP (Must Have) - P0

| ID | User Story | Critères d'acceptation |
|----|------------|------------------------|
| US-001 | En tant que **Prof**, je veux **choisir un TYPE** dans la bibliothèque afin de **créer un exercice basé sur des formules fixes** | Liste des types avec catégories, recherche, prévisualisation formules |
| US-002 | En tant que **Prof**, je veux **générer un exercice avec l'IA** afin d'**obtenir énoncé, plages et résolution automatiquement** | Bouton "Générer", énoncé contextualisé, plages cohérentes, résolution détaillée |
| US-003 | En tant que **Prof**, je veux **modifier l'énoncé et les plages** afin de **personnaliser l'exercice** | Édition texte libre, plages min/max, mode (libre/palier) |
| US-004 | En tant que **Prof**, je veux **définir la tolérance de correction** afin d'**accepter les arrondis** | Tolérance en % (ex: ±2%), prévisualisation |
| US-005 | En tant que **Prof**, je veux **valider puis publier un exercice** afin que **les étudiants y accèdent** | Cycle brouillon→validé→publié, génération auto des variantes |
| US-006 | En tant que **Prof**, je veux **définir une deadline optionnelle** afin que **l'exercice s'archive automatiquement** | Date/heure, archivage auto, option afficher correction |
| US-007 | En tant que **Prof**, je veux **uploader une image** afin d'**illustrer l'exercice** | Drag & drop, formats PNG/JPG, prévisualisation |
| US-008 | En tant que **Prof**, je veux **consulter les statistiques** afin de **suivre la progression** | Taux réussite, tentatives, par étudiant/exercice |
| US-009 | En tant que **Prof**, je veux **gérer les comptes étudiants** afin de **contrôler l'accès** | Création compte, liste étudiants, suppression |
| US-010 | En tant que **Étudiant**, je veux **voir mes exercices disponibles** afin de **savoir ce que je dois faire** | Liste avec deadline, statut (à faire/réussi/échoué) |
| US-011 | En tant que **Étudiant**, je veux **résoudre MON exercice avec MES valeurs** afin de **ne pas pouvoir copier** | Variante unique, valeurs personnalisées |
| US-012 | En tant que **Étudiant**, je veux **soumettre ma réponse et avoir un feedback immédiat** afin de **savoir si j'ai compris** | Champ numérique + unité, correct/incorrect instantané |
| US-013 | En tant que **Étudiant**, je veux **réessayer si j'ai échoué** afin de **m'améliorer** | Tentatives illimitées, historique |
| US-014 | En tant que **Utilisateur**, je veux **m'authentifier** afin d'**accéder à mon espace** | Login email/mot de passe, rôles prof/étudiant |

### Phase 2 (Should Have) - P1

| ID | User Story | Critères d'acceptation |
|----|------------|------------------------|
| US-015 | En tant que **Prof**, je veux **sauvegarder un exercice en MODÈLE** afin de **le réutiliser** | Bouton sauvegarder, bibliothèque personnelle |
| US-016 | En tant que **Prof**, je veux **créer mes propres TYPES** afin d'**étendre la bibliothèque** | Formulaire formules, variables, unité |
| US-017 | En tant que **Étudiant**, je veux **voir la correction après archivage** afin de **comprendre mes erreurs** | Résolution détaillée, si activée par prof |

---

## 8. Workflow Utilisateur

### Workflow Professeur

#### Étape 1 : Génération d'exercices
1. Le prof choisit un **TYPE** dans la bibliothèque (ex: Flexion poutre bi-appuyée)
2. Il clique sur **"Générer avec l'IA"**
3. L'IA génère : énoncé contextualisé, plages de valeurs, résolution détaillée
4. L'exercice est créé en statut **BROUILLON**

#### Étape 2 : Validation
Le prof visualise et peut modifier :
- L'énoncé (texte libre)
- Les plages de variables : min, max, mode (libre avec arrondi OU paliers fixes)
- La tolérance de réponse (ex: ±2%)

Il peut consulter (lecture seule) : formules utilisées, résolution détaillée

#### Étape 3 : Publication
Lors de la publication, le prof définit :
- Titre affiché aux étudiants
- Image optionnelle (upload)
- Date limite (optionnelle) avec archivage automatique
- Affichage de la correction après archivage (oui/non)

→ Le système génère automatiquement une **VARIANTE unique par étudiant** (valeurs différentes calculées selon les plages)

#### Étape 4 : Suivi et archivage
- Consultation des statistiques en temps réel
- Archivage manuel ou automatique (deadline)
- Optionnel : sauvegarde de l'exercice en MODÈLE pour réutilisation

### Workflow Étudiant

1. Connexion avec le compte créé par le professeur
2. Visualisation de la liste des exercices disponibles (avec deadlines)
3. Ouverture d'un exercice : affichage de **SA variante** (valeurs uniques)
4. Saisie de la réponse (champ numérique + unité)
5. Soumission → feedback immédiat : correct/incorrect
6. Possibilité de réessayer (nombre illimité de tentatives)
7. Après archivage : accès à la correction si activée par le prof

---

## 9. Structure des Données

### Schéma relationnel

| Table | Description | Champs principaux |
|-------|-------------|-------------------|
| **users** | Professeurs et étudiants | id, email, nom, role (prof/étudiant), créé_par |
| **types** | Types d'exercices (squelettes) | id, nom, catégorie, formules, variables, unité, créé_par |
| **templates** | Modèles sauvegardés (bibliothèque prof) | id, type_id, titre, énoncé, plages_json, image_url, tolérance, créé_par |
| **exercises** | Exercices créés | id, type_id, template_id, titre, énoncé, plages_json, statut, image_url, tolérance, deadline |
| **exercise_instances** | Variante par étudiant | id, exercise_id, student_id, valeurs_json, réponse_attendue |
| **attempts** | Tentatives de réponse | id, instance_id, réponse_donnée, correct (bool), timestamp |

### Relations entre tables

```
types ────────► exercises ────────► exercise_instances ────────► attempts
  │                 │                        │
  │                 │                        │
  ▼                 ▼                        ▼
templates         users                    users
(bibliothèque)   (prof)                 (étudiants)
```

### Exemple de données JSON

**plages_json** (dans exercises) :
```json
{
  "L": {"min": 2, "max": 8, "mode": "palier", "pas": 0.5, "unite": "m"},
  "b": {"min": 10, "max": 30, "mode": "libre", "decimales": 0, "unite": "cm"},
  "h": {"min": 20, "max": 50, "mode": "libre", "decimales": 0, "unite": "cm"},
  "P": {"min": 5, "max": 50, "mode": "palier", "pas": 5, "unite": "kN"}
}
```

**valeurs_json** (dans exercise_instances) :
```json
{
  "L": 4.5,
  "b": 15,
  "h": 35,
  "P": 25
}
```

---

## 10. Interfaces Utilisateur

### Interface Professeur

#### Écran : Édition d'exercice
- **Section ÉNONCÉ** : texte modifiable avec variables entre accolades {L}, {b}...
- **Section FORMULES UTILISÉES** : liste des formules (lecture seule)
- **Section RÉSOLUTION DÉTAILLÉE** : étapes de calcul (lecture seule, repliable)
- **Section VARIABLES** : pour chaque variable, champs min/max et choix du mode
- **Section FORMULE FINALE** : formule de calcul et tolérance
- **APERÇU** : prévisualisation avec valeurs aléatoires + réponse calculée

#### Mode de génération des valeurs

| Mode | Description | Exemple |
|------|-------------|---------|
| **Valeurs libres** | N'importe quelle valeur entre min et max, arrondie | L = 3.7 m (arrondi 1 décimale) |
| **Paliers** | Valeurs par incréments fixes | L = 2, 2.5, 3, 3.5... (pas de 0.5) |

#### Écran : Publication
- Titre affiché
- Upload image (optionnel, drag & drop)
- Date limite : aucune OU date/heure précise
- Checkbox : archivage automatique après deadline
- Checkbox : afficher correction après archivage

#### Écran : Bibliothèque de modèles
- Liste des modèles sauvegardés avec recherche et filtres
- Pour chaque modèle : titre, variables, date création, nombre d'utilisations
- Actions : Utiliser, Modifier, Supprimer

#### Écran : Statistiques
- Par exercice : taux de réussite, nombre tentatives moyen, distribution des réponses
- Par étudiant : exercices complétés, score global, progression

### Interface Étudiant

#### Écran : Liste des exercices
- Exercices disponibles avec statut (à faire, réussi, échoué)
- Deadline affichée si définie ("dans 3 jours", "demain"...)
- Notification visuelle pour deadlines proches

#### Écran : Exercice
- Image (si uploadée par le prof)
- Énoncé avec les valeurs spécifiques à l'étudiant
- Champ de saisie numérique + unité
- Bouton Soumettre
- Feedback immédiat après soumission
- Possibilité de réessayer si incorrect

---

## 11. Fonctionnalités Détaillées

### Système anti-triche
Chaque étudiant reçoit une **variante unique** de l'exercice. Les valeurs numériques sont générées aléatoirement dans les plages définies par le professeur. Ainsi, même si deux étudiants échangent leurs réponses, celles-ci seront incorrectes car les valeurs diffèrent.

### Correction automatique
- La réponse attendue est calculée automatiquement pour chaque variante
- Tolérance paramétrable (ex: ±2%) pour accepter les arrondis
- Comparaison numérique avec la réponse de l'étudiant
- Feedback immédiat : correct/incorrect

### Gestion des deadlines
- Date limite optionnelle pour chaque exercice
- Affichage du temps restant côté étudiant
- Notification visuelle à l'approche de la deadline
- Archivage automatique une fois la deadline passée
- Archivage manuel possible à tout moment

### Bibliothèque de types pré-remplis

| Catégorie | Types inclus |
|-----------|--------------|
| **Flexion** | Poutre bi-appuyée (charge ponctuelle, répartie), Poutre encastrée-libre |
| **Torsion** | Arbre cylindrique plein, Arbre cylindrique creux |
| **Traction/Compression** | Barre simple, Système hyperstatique |
| **Contraintes thermiques** | Barre encastrée, Assemblage bi-matériau |
| **PFS** | Systèmes isostatiques divers |

---

## 12. Stack Technique (100% Gratuit)

### Choix technologiques

| Besoin | Solution | Tier gratuit |
|--------|----------|--------------|
| Frontend | Next.js + React | Open source |
| Hébergement frontend | Vercel | 100 GB bande passante/mois |
| Backend + API | Supabase | 50k requêtes/mois |
| Base de données | PostgreSQL (Supabase) | 500 MB |
| Authentification | Supabase Auth | 50k utilisateurs actifs/mois |
| Stockage fichiers | Supabase Storage | 1 GB |
| Génération IA | Google Gemini API | 1500 requêtes/jour |

### Configuration Google Gemini

1. Avoir un compte Google (Gmail personnel ou universitaire)
2. Aller sur Google AI Studio : https://aistudio.google.com
3. Cliquer sur "Get API Key" → "Create API Key"
4. Copier la clé et la configurer dans l'application

**Aucune carte bancaire n'est requise.** Le tier gratuit offre 1500 requêtes/jour, largement suffisant puisque l'API n'est appelée que lors de la génération d'exercices (pas lors des réponses des étudiants).

### Limites des tiers gratuits

| Service | Limite | Usage estimé (30 étudiants) |
|---------|--------|----------------------------|
| Supabase - BDD | 500 MB | ~10 MB |
| Supabase - Auth | 50k utilisateurs/mois | 31 utilisateurs |
| Supabase - Storage | 1 GB | ~100 MB (images) |
| Vercel - Bande passante | 100 GB/mois | ~2 GB/mois |
| Vercel - Build | 6000 min/mois | ~30 min/mois |
| Gemini - Requêtes | 1500/jour | ~10-20/jour max |

### Dimensionnement
Pour 30 étudiants avec une utilisation régulière (quelques exercices par semaine), les tiers gratuits sont **largement suffisants**. Toutes les limites sont au moins 10x supérieures aux besoins réels du projet.

---

## 13. Récapitulatif des Fonctionnalités

| Fonctionnalité | Inclus MVP |
|----------------|:----------:|
| Génération d'exercices par IA | ✓ |
| Variantes uniques par étudiant (anti-triche) | ✓ |
| Correction automatique avec tolérance | ✓ |
| Bibliothèque de types pré-remplis | ✓ |
| Bibliothèque de modèles personnels | ✓ |
| Validation par le professeur avant publication | ✓ |
| Deadlines avec archivage automatique | ✓ |
| Upload d'images par exercice | ✓ |
| Statistiques par étudiant et par exercice | ✓ |
| Gestion des comptes étudiants par le prof | ✓ |
| Affichage correction après archivage | ✓ |
| Tentatives multiples autorisées | ✓ |
| 100% gratuit | ✓ |

---

## 14. Risques & Mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| API Gemini indisponible | Critique | Faible | Cache des énoncés générés, fallback template manuel |
| Formules RDM mal calculées | Critique | Moyenne | Tests unitaires exhaustifs, validation prof obligatoire |
| Quota API Gemini dépassé | Moyen | Faible | Monitoring, cache agressif, régénération rare |
| Adoption lente étudiants | Moyen | Faible | UX simple, mobile-friendly, onboarding |

---

## 15. Timeline & Milestones

### Phase MVP (6-8 semaines)

| Semaine | Milestone | Livrables |
|---------|-----------|-----------|
| 1-2 | **Setup & Auth** | Projet Next.js, Supabase, auth fonctionnelle, rôles |
| 3-4 | **Types & Exercices** | Bibliothèque types, CRUD exercices, cycle de vie |
| 5-6 | **Génération IA & Variantes** | Intégration Gemini, génération variantes uniques |
| 7 | **Correction & Stats** | Soumission, correction auto, dashboard statistiques |
| 8 | **Tests & Déploiement** | Tests E2E, déploiement Vercel, formation utilisateurs |

---

*Document basé sur la spécification fonctionnelle et technique v1.0*
*Client : Université de Bordeaux - Département Génie Civil*
*Généré le 2024-12-24*
