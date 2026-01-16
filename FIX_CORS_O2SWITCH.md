# 🔧 Correction de l'erreur CORS sur O2Switch

## 🚨 Problème
Le frontend `https://gpdev.org` n'est pas autorisé à faire des requêtes vers le backend `https://backend.gpdev.org`.

## ✅ Solution

### Étape 1 : Modifier la variable WHITELIST_ORIGINS sur le serveur

Connectez-vous à votre serveur via SSH ou Terminal cPanel :

```bash
cd /home2/kuwa6817/interview-trainer-ai/backend
```

#### Option A : Modifier le fichier .env existant

```bash
nano .env
```

Cherchez la ligne `WHITELIST_ORIGINS` et modifiez-la pour ajouter `https://gpdev.org` :

```bash
# AVANT (probablement)
WHITELIST_ORIGINS=http://localhost:5173,http://localhost:8000

# APRÈS (ce qu'il faut)
WHITELIST_ORIGINS=https://gpdev.org,https://backend.gpdev.org
```

Enregistrez avec `Ctrl+O`, puis `Ctrl+X` pour quitter.

#### Option B : Remplacer le fichier .env

```bash
# Vérifier le fichier .env.production existe
cat .env.production

# Copier le fichier .env.production vers .env
cp .env.production .env

# Vérifier que .env est correct
cat .env
```

### Étape 2 : Redémarrer le serveur Node.js

La méthode dépend de votre configuration :

#### Si vous utilisez PM2 (probable sur O2Switch) :
```bash
pm2 restart interview-trainer-ai
# OU
pm2 restart all
```

#### Si vous utilisez un autre gestionnaire :
Arrêtez le processus Node.js actuel et relancez-le avec la méthode que vous utilisez habituellement.

### Étape 3 : Vérifier que CORS fonctionne

Allez sur https://gpdev.org et essayez de créer un compte avec une image de profil.

L'erreur CORS devrait disparaître.

---

## 🔍 Vérifier la configuration CORS

Si l'erreur persiste, vérifiez les logs :

```bash
cd /home2/kuwa6817/interview-trainer-ai/backend

# Voir si CORS bloque la requête
grep -i "cors" logs/*.log | tail -20

# OU voir tous les logs récents
grep -i "upload\|cors\|error" logs/*.log | tail -50
```

Vous devriez voir soit :
- ✅ Des logs d'upload réussis (si CORS fonctionne)
- ❌ "CORS error: https://gpdev.org is not allowed by CORS" (si WHITELIST_ORIGINS n'est pas correct)

---

## 🎯 Liste des variables CORS correctes

Assurez-vous que `WHITELIST_ORIGINS` contient ces valeurs (séparées par des virgules, sans espaces) :

```bash
WHITELIST_ORIGINS=https://gpdev.org,https://backend.gpdev.org
```

**Important :**
- ✅ `https://gpdev.org` - votre frontend
- ✅ `https://backend.gpdev.org` - votre backend (pour permettre les requêtes cross-origin si nécessaire)
- ❌ NE PAS inclure `http://localhost` en production
- ❌ PAS d'espaces autour des virgules

---

## 📞 Problèmes courants

### Problème : J'ai modifié .env mais l'erreur persiste

**Solution :** Le serveur Node.js n'a pas été redémarré après la modification. Redémarrez-le avec PM2 :
```bash
pm2 restart interview-trainer-ai
```

### Problème : Je ne trouve pas le fichier .env

**Solution :** Créez-le à partir du fichier de production :
```bash
cd /home2/kuwa6817/interview-trainer-ai/backend
cp .env.production .env
```

### Problème : L'erreur CORS change mais l'upload échoue quand même

**Solution :** Vérifiez les logs pour voir si c'est maintenant une erreur de permissions ou autre :
```bash
grep -i "upload\|error" logs/*.log | tail -50
```

---

## ✅ Checklist

- [ ] Variable `WHITELIST_ORIGINS` contient `https://gpdev.org,https://backend.gpdev.org`
- [ ] Fichier `.env` enregistré sur le serveur
- [ ] Serveur Node.js redémarré
- [ ] Testé l'upload d'image sur https://gpdev.org
- [ ] Vérifié les logs si problème persiste
