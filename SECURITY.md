# 🔒 Security Implementation Guide

> **Date :** 3 Février 2026  
> **Version :** 1.0  
> **Status :** Corrections implémentées, tests en attente

---

## 📋 Résumé des Corrections

### ✅ Phase 1 : Critique (IDOR - Broken Access Control)

| Fichier | Correction | Statut |
|---------|-----------|--------|
| `backend/controllers/sessionController.ts` | `getSessionById` vérifie `user: req.user?._id` | ✅ |
| `backend/controllers/questionController.ts` | `addQuestionsToSession` vérifie propriété session | ✅ |
| `backend/controllers/questionController.ts` | `togglePinQuestion` vérifie propriété via populate | ✅ |
| `backend/controllers/questionController.ts` | `updateQuestionNote` vérifie propriété via populate | ✅ |
| `backend/middlewares/authMiddleware.ts` | Standardisé sur Bearer tokens uniquement | ✅ |

### ✅ Phase 2 : Haute Priorité

| Fichier | Fonctionnalité | Statut |
|---------|----------------|--------|
| `backend/middlewares/ownershipMiddleware.ts` | Middleware réutilisable de vérification propriété | ✅ |
| `backend/middlewares/aiValidationMiddleware.ts` | Validation & sanitization entrées AI | ✅ |
| `backend/middlewares/auditMiddleware.ts` | Logging audit des opérations sensibles | ✅ |
| `backend/middlewares/correlationMiddleware.ts` | Correlation IDs pour tracing | ✅ |
| `backend/app.ts` | CSP renforcé, CORS strict, middlewares intégrés | ✅ |

### ✅ Phase 3 : Tests de Sécurité

| Fichier | Description | Statut |
|---------|-------------|--------|
| `backend/tests/security/idor.test.ts` | Tests IDOR (Broken Access Control) | ✅ |
| `backend/tests/security/ai-input.test.ts` | Tests validation entrées AI | ✅ |

---

## 🔐 Procédure de Rotation des Secrets (CRITIQUE)

### ⚠️ AVERTISSEMENT
Cette opération va **invalider toutes les sessions utilisateurs existantes**. Effectuer pendant une fenêtre de maintenance.

### Étape 1 : Générer les nouveaux secrets

```bash
# Générer JWT_SECRET (256 bits)
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET: $JWT_SECRET"

# Générer REFRESH_TOKEN_SECRET
REFRESH_TOKEN_SECRET=$(openssl rand -hex 32)
echo "REFRESH_TOKEN_SECRET: $REFRESH_TOKEN_SECRET"
```

### Étape 2 : Rotation Groq API Key

1. Aller sur https://console.groq.com/
2. Naviguer vers "API Keys"
3. Révoquer l'ancienne clé : [ANCIENNE_CLE_GROQ]
4. Générer une nouvelle clé
5. Copier la nouvelle clé

### Étape 3 : Rotation MongoDB Atlas

1. Aller sur https://cloud.mongodb.com/
2. Database Access → Users
3. Modifier l'utilisateur `gpdev`
4. Nouveau mot de passe (générer un mot de passe fort)
5. Mettre à jour la chaîne de connexion dans `.env`

### Étape 4 : Rotation Gmail App Password

1. Aller sur https://myaccount.google.com/apppasswords
2. Révoquer l'ancien mot de passe : [ANCIEN_MOT_DE_PASSE]
3. Générer un nouveau "App Password"
4. Sélectionner "Mail" et "Autre (nom personnalisé)" → "InterviewPrepAI"
5. Copier le nouveau mot de passe (16 caractères)

### Étape 5 : Mettre à jour le fichier .env

```bash
cd /home/guigui/projets-dev/interviewprepai/backend

# Créer le nouveau .env
cat > .env << ENVFILE
PORT=8000
MONGO_URI=mongodb+srv://gpdev:[NOUVEAU_MOT_DE_PASSE]@interviewtrainerai.j5jb7j9.mongodb.net/?appName=InterviewTrainerAI
GROQ_API_KEY=[NOUVELLE_CLE_GROQ]
JWT_SECRET=[NOUVEAU_JWT_SECRET]
REFRESH_TOKEN_SECRET=[NOUVEAU_REFRESH_TOKEN_SECRET]
NODE_ENV=production
LOG_LEVEL=info
WHITELIST_ORIGINS=https://ton-domaine.com,https://www.ton-domaine.com

# Configuration Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=guillaumeporez46@gmail.com
EMAIL_PASS=[NOUVEAU_APP_PASSWORD]
EMAIL_FROM=noreply@interviewtrainer.ai

# Configuration Frontend
CLIENT_URL=https://ton-domaine.com
ENVFILE
```

### Étape 6 : Déploiement

```bash
# 1. Redémarrer le backend
pm2 restart interview-trainer-ai

# 2. Vérifier les logs
tail -f logs/app-$(date +%Y-%m-%d).log

# 3. Tester une connexion
# Tous les utilisateurs devront se reconnecter (tokens invalidés)
```

---

## 🛡️ Configuration .env.vault (Optionnel mais recommandé)

### Installation

```bash
cd backend
npm install --save-dev dotenv-vault
npx dotenv-vault new
```

### Configuration

```bash
# Pousser les variables d'environnement vers le vault
npx dotenv-vault push

# Générer le fichier .env.vault (chiffré, peut être versionné)
npx dotenv-vault build

# Le fichier .env.keys contient les clés de déchiffrement
# ⚠️ NE JAMAIS VERSIONNER .env.keys
```

### Mise à jour .gitignore

```gitignore
# Environment files
.env
.env.local
.env.*.local
.env.keys
!.env.example
!.env.vault
```

---

## 🧪 Exécution des Tests de Sécurité

### Tests IDOR

```bash
cd backend
npm test -- idor.test.ts
```

### Tests AI Validation

```bash
cd backend
npm test -- ai-input.test.ts
```

### Tous les tests

```bash
cd backend
npm test
```

**Attendu :** 140+ tests passants, y compris les nouveaux tests de sécurité

---

## 📊 Vérifications Post-Implémentation

### 1. Vérifier les IDOR sont corrigés

```bash
# Test manuel avec curl
curl -H "Authorization: Bearer TOKEN_USER2" \
  https://api.ton-domaine.com/api/sessions/SESSION_ID_USER1

# Devrait retourner 404 (non 200)
```

### 2. Vérifier la validation AI

```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "<script>alert(1)</script>", "experience": "senior", "topicsToFocus": "React", "numberOfQuestions": 5}' \
  https://api.ton-domaine.com/api/ai/generate-questions

# Devrait retourner 400 (validation error)
```

### 3. Vérifier les headers de sécurité

```bash
curl -I https://api.ton-domaine.com/api/health

# Vérifier la présence de :
# - X-Request-ID
# - Content-Security-Policy
# - Strict-Transport-Security (en prod)
```

---

## 🚨 Checklist de Déploiement en Production

### Avant le déploiement :

- [ ] Secrets rotatés (JWT, Groq, MongoDB, Gmail)
- [ ] Fichier `.env` mis à jour sur le serveur
- [ ] Tests backend passants (140+)
- [ ] Tests frontend passants (38+)
- [ ] Tests de sécurité passants (nouveaux)

### Pendant le déploiement :

- [ ] Mettre l'app en maintenance si possible
- [ ] Déployer le backend
- [ ] Redémarrer PM2
- [ ] Vérifier les logs d'erreur

### Après le déploiement :

- [ ] Tester la connexion utilisateur
- [ ] Tester la création de session
- [ ] Tester l'accès aux questions
- [ ] Vérifier les headers de sécurité
- [ ] Vérifier les logs d'audit
- [ ] Surveiller les erreurs 401/403

---

## 📈 Monitoring de Sécurité

### Logs à surveiller

```bash
# Tentatives d'accès non autorisées
tail -f backend/logs/app-*.log | grep -i "unauthorized\|ownership check failed"

# Erreurs de validation AI
tail -f backend/logs/app-*.log | grep -i "validation error"

# Erreurs d'authentification
tail -f backend/logs/app-*.log | grep -i "authentication failed"
```

### Alertes recommandées

- Plus de 10 erreurs 401/403 par minute
- Tentatives d'injection détectées
- Accès à des ressources inexistantes (scanning)

---

## 🔧 Rollback Plan

Si des problèmes surviennent :

1. **Restaurer l'ancien .env** (backup disponible dans `/tmp/`)
2. **Restaurer les anciens secrets** (si sauvegardés)
3. **Redémarrer le serveur**
4. **Investiguer les logs**

```bash
# Restaurer le backup
cp /tmp/interviewprepai-env-backup-*.txt backend/.env
pm2 restart interview-trainer-ai
```

---

## 📞 Support

En cas de problème :
1. Vérifier les logs : `tail -f backend/logs/app-*.log`
2. Tester localement : `cd backend && npm run dev`
3. Vérifier les variables d'environnement
4. Tester les endpoints individuellement avec curl/Postman

---

**Dernière mise à jour :** 3 Février 2026  
**Prochain audit recommandé :** Dans 3 mois
