# Script d'audit sécurité automatisé (Windows PowerShell)
# Usage: .\scripts\security-scan.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "🔒 AUDIT DE SÉCURITÉ" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$Errors = 0
$Warnings = 0

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ ERREUR: $Message" -ForegroundColor Red
    $script:Errors++
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  WARNING: $Message" -ForegroundColor Yellow
    $script:Warnings++
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ OK: $Message" -ForegroundColor Green
}

# ================================
# 1. VÉRIFICATION FICHIERS SECRETS
# ================================
Write-Host "📁 1. Vérification fichiers secrets..." -ForegroundColor White

$trackedSecrets = git ls-files | Select-String -Pattern "\.(env\.local|env\.production|pem|key)$"

if ($trackedSecrets) {
    Write-Error-Custom "Fichiers secrets détectés dans Git:"
    $trackedSecrets | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
} else {
    Write-Success "Aucun fichier secret tracké dans Git"
}

if ((Test-Path .env.local) -and -not (Test-Path .env.example)) {
    Write-Warning-Custom ".env.local existe mais pas de .env.example"
}

Write-Host ""

# ================================
# 2. CONSOLE.LOG EN PRODUCTION
# ================================
Write-Host "📋 2. Recherche console.log dans le code..." -ForegroundColor White

$consoleLogs = Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx |
    Select-String -Pattern "console\.log" |
    Measure-Object

if ($consoleLogs.Count -gt 0) {
    Write-Warning-Custom "Trouvé $($consoleLogs.Count) console.log dans src/"

    $files = Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx |
        Select-String -Pattern "console\.log" -List |
        Select-Object -First 5 -ExpandProperty Path

    Write-Host "Fichiers concernés:" -ForegroundColor Yellow
    $files | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
} else {
    Write-Success "Aucun console.log trouvé"
}

Write-Host ""

# ================================
# 3. SECRETS HARDCODÉS
# ================================
Write-Host "🔑 3. Recherche secrets hardcodés..." -ForegroundColor White

$secretsPatterns = @(
    "API_KEY.*=.*['`"]",
    "SECRET.*=.*['`"]",
    "PASSWORD.*=.*['`"]",
    "TOKEN.*=.*['`"]"
)

foreach ($pattern in $secretsPatterns) {
    $found = Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx |
        Select-String -Pattern $pattern

    if ($found) {
        Write-Error-Custom "Pattern suspect trouvé: $pattern ($($found.Count) occurrences)"
    }
}

# Vérifier process.env sans NEXT_PUBLIC
$envUsages = Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx |
    Select-String -Pattern "process\.env\." |
    Where-Object { $_.Line -notmatch "NEXT_PUBLIC" } |
    Measure-Object

if ($envUsages.Count -gt 10) {
    Write-Warning-Custom "$($envUsages.Count) usages de process.env sans NEXT_PUBLIC"
}

Write-Success "Scan secrets hardcodés terminé"
Write-Host ""

# ================================
# 4. VALIDATION ZOD
# ================================
Write-Host "✅ 4. Vérification validations Zod..." -ForegroundColor White

if (-not (Test-Path "src\lib\validation\schemas.ts")) {
    Write-Error-Custom "Fichier src\lib\validation\schemas.ts introuvable"
} else {
    Write-Success "Fichier de schémas Zod trouvé"
}

# Vérifier Server Actions avec validation
$actionsFiles = Get-ChildItem -Path src\actions -Filter *.ts

foreach ($file in $actionsFiles) {
    $hasExport = Select-String -Path $file.FullName -Pattern "export async function"
    $hasValidation = Select-String -Path $file.FullName -Pattern "\.safeParse|\.parse"

    if ($hasExport -and -not $hasValidation) {
        Write-Warning-Custom "Server Action sans validation: $($file.Name)"
    }
}

Write-Host ""

# ================================
# 5. RLS SUPABASE
# ================================
Write-Host "🛡️  5. Vérification policies RLS..." -ForegroundColor White

$rlsFile = "supabase\migrations\002_rls_policies.sql"

if (-not (Test-Path $rlsFile)) {
    Write-Error-Custom "Fichier RLS policies introuvable: $rlsFile"
} else {
    $rlsContent = Get-Content $rlsFile -Raw

    $tablesWithRLS = ([regex]::Matches($rlsContent, "ENABLE ROW LEVEL SECURITY")).Count
    $policiesCount = ([regex]::Matches($rlsContent, "CREATE POLICY")).Count

    Write-Success "$tablesWithRLS tables avec RLS activé"
    Write-Success "$policiesCount policies définies"

    # Vérifier chaque table
    $tables = @("profiles", "rdm_types", "exercises", "exercise_instances", "attempts")

    foreach ($table in $tables) {
        if ($rlsContent -notmatch "CREATE POLICY.*ON $table") {
            Write-Error-Custom "Aucune policy trouvée pour la table: $table"
        }
    }
}

Write-Host ""

# ================================
# 6. DÉPENDANCES VULNÉRABLES
# ================================
Write-Host "📦 6. Scan vulnérabilités npm..." -ForegroundColor White

try {
    $auditJson = npm audit --json 2>&1 | ConvertFrom-Json

    $critical = $auditJson.metadata.vulnerabilities.critical
    $high = $auditJson.metadata.vulnerabilities.high

    if ($critical -gt 0) {
        Write-Error-Custom "$critical vulnérabilités critiques détectées"
    }

    if ($high -gt 0) {
        Write-Warning-Custom "$high vulnérabilités haute sévérité détectées"
    }

    if ($critical -eq 0) {
        Write-Success "Aucune vulnérabilité critique npm"
    }
} catch {
    Write-Warning-Custom "Erreur lors du scan npm audit"
}

Write-Host ""

# ================================
# 7. FICHIERS SENSIBLES
# ================================
Write-Host "🔍 7. Recherche fichiers sensibles..." -ForegroundColor White

$sensitivePatterns = @("*.pem", "*.key", "*.p12", "*.pfx", "credentials.json", "serviceAccount.json")

foreach ($pattern in $sensitivePatterns) {
    $found = Get-ChildItem -Path . -Recurse -Include $pattern -Exclude node_modules -ErrorAction SilentlyContinue

    if ($found) {
        foreach ($file in $found) {
            Write-Warning-Custom "Fichier sensible trouvé: $($file.FullName)"
        }
    }
}

Write-Success "Scan fichiers sensibles terminé"
Write-Host ""

# ================================
# 8. TYPESCRIPT STRICT MODE
# ================================
Write-Host "📝 8. Vérification TypeScript strict mode..." -ForegroundColor White

if (Test-Path "tsconfig.json") {
    $tsconfig = Get-Content "tsconfig.json" -Raw

    if ($tsconfig -match '"strict":\s*true') {
        Write-Success "TypeScript strict mode activé"
    } else {
        Write-Warning-Custom "TypeScript strict mode désactivé"
    }

    if ($tsconfig -match '"noImplicitAny":\s*false') {
        Write-Error-Custom "noImplicitAny désactivé"
    }
} else {
    Write-Error-Custom "tsconfig.json introuvable"
}

Write-Host ""

# ================================
# 9. MIDDLEWARE SÉCURITÉ
# ================================
Write-Host "🚦 9. Vérification middleware..." -ForegroundColor White

$middlewareFile = "src\middleware.ts"

if (-not (Test-Path $middlewareFile)) {
    Write-Error-Custom "Fichier middleware introuvable"
} else {
    Write-Success "Middleware trouvé"

    $middlewareContent = Get-Content $middlewareFile -Raw

    if ($middlewareContent -notmatch "auth\.getUser|updateSession") {
        Write-Warning-Custom "Middleware ne vérifie pas l'authentification"
    }

    if ($middlewareContent -notmatch "redirect") {
        Write-Warning-Custom "Middleware ne fait pas de redirections"
    }
}

Write-Host ""

# ================================
# 10. GITIGNORE
# ================================
Write-Host "🚫 10. Vérification .gitignore..." -ForegroundColor White

$gitignoreRequired = @(".env*.local", "node_modules", ".next", "*.pem", "*.key")

if (Test-Path .gitignore) {
    $gitignoreContent = Get-Content .gitignore -Raw

    foreach ($pattern in $gitignoreRequired) {
        if ($gitignoreContent -notmatch [regex]::Escape($pattern)) {
            Write-Error-Custom "$pattern manquant dans .gitignore"
        }
    }

    Write-Success "Vérification .gitignore terminée"
} else {
    Write-Error-Custom ".gitignore introuvable"
}

Write-Host ""

# ================================
# RÉSUMÉ
# ================================
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Erreurs: $Errors" -ForegroundColor Red
Write-Host "Warnings: $Warnings" -ForegroundColor Yellow

if ($Errors -eq 0 -and $Warnings -eq 0) {
    Write-Host "🎉 Aucun problème de sécurité détecté!" -ForegroundColor Green
    exit 0
} elseif ($Errors -eq 0) {
    Write-Host "⚠️  Quelques warnings à vérifier" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "🔴 Des erreurs critiques ont été détectées!" -ForegroundColor Red
    exit 1
}
