#!/bin/bash

# Script d'audit sécurité automatisé
# Usage: bash scripts/security-scan.sh

echo "=================================="
echo "🔒 AUDIT DE SÉCURITÉ"
echo "=================================="
echo ""

# Couleurs
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Fonction d'affichage
error() {
  echo -e "${RED}❌ ERREUR:${NC} $1"
  ((ERRORS++))
}

warning() {
  echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
  ((WARNINGS++))
}

success() {
  echo -e "${GREEN}✅ OK:${NC} $1"
}

# ================================
# 1. VÉRIFICATION FICHIERS SECRETS
# ================================
echo "📁 1. Vérification fichiers secrets..."

if git ls-files | grep -qE "\.env\.local|\.env\.production|\.pem$|\.key$"; then
  error "Fichiers secrets détectés dans Git:"
  git ls-files | grep -E "\.env\.local|\.env\.production|\.pem$|\.key$"
else
  success "Aucun fichier secret tracké dans Git"
fi

if [ -f .env.local ] && [ ! -f .env.example ]; then
  warning ".env.local existe mais pas de .env.example"
fi

echo ""

# ================================
# 2. CONSOLE.LOG EN PRODUCTION
# ================================
echo "📋 2. Recherche console.log dans le code..."

CONSOLE_LOGS=$(grep -r "console\.log" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules src/ | wc -l)

if [ "$CONSOLE_LOGS" -gt 0 ]; then
  warning "Trouvé $CONSOLE_LOGS console.log dans src/"
  echo "Fichiers concernés:"
  grep -r "console\.log" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules src/ -l | head -5
  echo "  ... (utilisez 'grep -r console.log src/' pour voir tous)"
else
  success "Aucun console.log trouvé"
fi

echo ""

# ================================
# 3. SECRETS HARDCODÉS
# ================================
echo "🔑 3. Recherche secrets hardcodés..."

SECRETS_PATTERNS=(
  "API_KEY.*=.*['\"]"
  "SECRET.*=.*['\"]"
  "PASSWORD.*=.*['\"]"
  "TOKEN.*=.*['\"]"
)

for pattern in "${SECRETS_PATTERNS[@]}"; do
  FOUND=$(grep -rE "$pattern" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules src/ 2>/dev/null | wc -l)
  if [ "$FOUND" -gt 0 ]; then
    error "Pattern suspect trouvé: $pattern ($FOUND occurrences)"
  fi
done

# Vérifier process.env sans NEXT_PUBLIC
ENV_USAGES=$(grep -r "process\.env\." --include="*.ts" --include="*.tsx" --exclude-dir=node_modules src/ | grep -v "NEXT_PUBLIC" | wc -l)
if [ "$ENV_USAGES" -gt 10 ]; then
  warning "$ENV_USAGES usages de process.env sans NEXT_PUBLIC (vérifier si approprié)"
fi

success "Scan secrets hardcodés terminé"
echo ""

# ================================
# 4. VALIDATION ZOD
# ================================
echo "✅ 4. Vérification validations Zod..."

if [ ! -f "src/lib/validation/schemas.ts" ]; then
  error "Fichier src/lib/validation/schemas.ts introuvable"
else
  success "Fichier de schémas Zod trouvé"
fi

# Vérifier que les Server Actions utilisent bien .safeParse
ACTIONS_WITHOUT_VALIDATE=$(grep -l "export async function" src/actions/*.ts | while read file; do
  if ! grep -q "\.safeParse\|\.parse" "$file"; then
    echo "$file"
  fi
done)

if [ -n "$ACTIONS_WITHOUT_VALIDATE" ]; then
  warning "Server Actions sans validation Zod:"
  echo "$ACTIONS_WITHOUT_VALIDATE"
fi

echo ""

# ================================
# 5. RLS SUPABASE
# ================================
echo "🛡️  5. Vérification policies RLS..."

RLS_FILE="supabase/migrations/002_rls_policies.sql"
if [ ! -f "$RLS_FILE" ]; then
  error "Fichier RLS policies introuvable: $RLS_FILE"
else
  TABLES_WITH_RLS=$(grep -c "ENABLE ROW LEVEL SECURITY" "$RLS_FILE")
  POLICIES_COUNT=$(grep -c "CREATE POLICY" "$RLS_FILE")

  success "$TABLES_WITH_RLS tables avec RLS activé"
  success "$POLICIES_COUNT policies définies"

  # Vérifier que toutes les tables ont au moins une policy
  TABLES=(profiles rdm_types exercises exercise_instances attempts)
  for table in "${TABLES[@]}"; do
    if ! grep -q "CREATE POLICY.*ON $table" "$RLS_FILE"; then
      error "Aucune policy trouvée pour la table: $table"
    fi
  done
fi

echo ""

# ================================
# 6. DÉPENDANCES VULNÉRABLES
# ================================
echo "📦 6. Scan vulnérabilités npm..."

if command -v npm &> /dev/null; then
  npm audit --json > /tmp/npm-audit.json 2>/dev/null

  CRITICAL=$(cat /tmp/npm-audit.json | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' | head -1)
  HIGH=$(cat /tmp/npm-audit.json | grep -o '"high":[0-9]*' | grep -o '[0-9]*' | head -1)

  if [ -n "$CRITICAL" ] && [ "$CRITICAL" -gt 0 ]; then
    error "$CRITICAL vulnérabilités critiques détectées (npm audit)"
  fi

  if [ -n "$HIGH" ] && [ "$HIGH" -gt 0 ]; then
    warning "$HIGH vulnérabilités haute sévérité détectées"
  fi

  if [ -z "$CRITICAL" ] || [ "$CRITICAL" -eq 0 ]; then
    success "Aucune vulnérabilité critique npm"
  fi

  rm -f /tmp/npm-audit.json
else
  warning "npm non installé, skip audit"
fi

echo ""

# ================================
# 7. FICHIERS SENSIBLES
# ================================
echo "🔍 7. Recherche fichiers sensibles..."

SENSITIVE_FILES=(
  "*.pem"
  "*.key"
  "*.p12"
  "*.pfx"
  "credentials.json"
  "serviceAccount.json"
)

for pattern in "${SENSITIVE_FILES[@]}"; do
  FOUND=$(find . -name "$pattern" -not -path "*/node_modules/*" 2>/dev/null)
  if [ -n "$FOUND" ]; then
    warning "Fichier sensible trouvé: $FOUND"
  fi
done

success "Scan fichiers sensibles terminé"
echo ""

# ================================
# 8. TYPESCRIPT STRICT MODE
# ================================
echo "📝 8. Vérification TypeScript strict mode..."

if [ -f "tsconfig.json" ]; then
  if grep -q '"strict": true' tsconfig.json; then
    success "TypeScript strict mode activé"
  else
    warning "TypeScript strict mode désactivé"
  fi

  if grep -q '"noImplicitAny": false' tsconfig.json; then
    error "noImplicitAny désactivé (risque de type 'any' non détecté)"
  fi
else
  error "tsconfig.json introuvable"
fi

echo ""

# ================================
# 9. MIDDLEWARE SÉCURITÉ
# ================================
echo "🚦 9. Vérification middleware..."

MIDDLEWARE_FILE="src/middleware.ts"
if [ ! -f "$MIDDLEWARE_FILE" ]; then
  error "Fichier middleware introuvable: $MIDDLEWARE_FILE"
else
  success "Middleware trouvé"

  if ! grep -q "auth.getUser" "$MIDDLEWARE_FILE" && ! grep -q "updateSession" "$MIDDLEWARE_FILE"; then
    warning "Middleware ne semble pas vérifier l'authentification"
  fi

  if ! grep -q "redirect" "$MIDDLEWARE_FILE"; then
    warning "Middleware ne fait pas de redirections (routes non protégées?)"
  fi
fi

echo ""

# ================================
# 10. GITIGNORE
# ================================
echo "🚫 10. Vérification .gitignore..."

GITIGNORE_REQUIRED=(
  ".env*.local"
  "node_modules"
  ".next"
  "*.pem"
  "*.key"
)

for pattern in "${GITIGNORE_REQUIRED[@]}"; do
  if ! grep -q "$pattern" .gitignore 2>/dev/null; then
    error "$pattern manquant dans .gitignore"
  fi
done

success "Vérification .gitignore terminée"
echo ""

# ================================
# RÉSUMÉ
# ================================
echo "=================================="
echo "📊 RÉSUMÉ"
echo "=================================="
echo -e "${RED}Erreurs: $ERRORS${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 Aucun problème de sécurité détecté!${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Quelques warnings à vérifier${NC}"
  exit 0
else
  echo -e "${RED}🔴 Des erreurs critiques ont été détectées!${NC}"
  exit 1
fi
