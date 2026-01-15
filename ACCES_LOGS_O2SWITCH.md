# 🔍 Comment Accéder aux Logs de Production sur O2Switch

## 📋 Pré-requis

- Accès au panneau cPanel de votre hébergement O2Switch
- Identifiants FTP/SSH (si disponibles)
- Accès au gestionnaire de fichiers

---

## 🎯 Méthode 1 : Via cPanel (Recommandée)

### 1.1 Accéder à cPanel

1. Connectez-vous à votre compte O2Switch
2. Allez dans "cPanel"
3. Cherchez la section "Fichiers"

### 1.2 Utiliser le Gestionnaire de Fichiers

1. Cliquez sur "Gestionnaire de fichiers"
2. Naviguez vers : `/home2/kuwa6817/interview-trainer-ai/`
3. Entrez dans le dossier `backend/`
4. Entrez dans le dossier `logs/`

### 1.3 Visualiser les Logs

Vous devriez voir des fichiers comme :
- `app-2024-01-15.log` (logs du jour)
- `app-2024-01-14.log` (logs de la veille)
- etc.

Pour voir le contenu :
1. Cliquez droit sur le fichier de log
2. Sélectionnez "Edit" ou "View"
3. Recherchez les lignes contenant "upload", "error", ou "❌"

**Filtres utiles à rechercher :**
- `📤` : Début de requête d'upload
- `📦` : Callback Multer
- `📁` : Dossier uploads
- `📝` : Génération de nom de fichier
- `🔍` : Validation de type de fichier
- `❌` : Erreurs

---

## 🔧 Méthode 2 : Via Terminal cPanel (SSH)

### 2.1 Accéder au Terminal cPanel

1. Dans cPanel, cherchez "Terminal" dans la barre de recherche
2. Cliquez sur "Ouvrir le terminal"

### 2.2 Naviguer vers le dossier de logs

```bash
cd /home2/kuwa6817/interview-trainer-ai/backend/logs
```

### 2.3 Voir les fichiers de logs disponibles

```bash
ls -lt
```

### 2.4 Visualiser les logs en temps réel

```bash
# Voir les dernières lignes du fichier de log d'aujourd'hui
tail -100 app-$(date +%Y-%m-%d).log

# Suivre les logs en temps réel (utile pour tester un upload maintenant)
tail -f app-$(date +%Y-%m-%d).log
```

### 2.5 Filtrer les logs d'upload

```bash
# Voir uniquement les logs liés à l'upload
grep -i "upload\|multer\|📤\|📦\|📁\|📝\|🔍" app-$(date +%Y-%m-%d).log

# Voir uniquement les erreurs
grep -i "error\|failed\|❌" app-$(date +%Y-%m-%d).log

# Voir les 20 dernières erreurs
grep -i "error\|failed\|❌" app-$(date +%Y-%m-%d).log | tail -20
```

### 2.6 Utiliser le script de visualisation

```bash
cd /home2/kuwa6817/interview-trainer-ai/backend

# Voir les logs récents liés à l'upload
node scripts/view-logs.js --upload

# Voir uniquement les erreurs
node scripts/view-logs.js --error

# Voir les 50 dernières lignes
node scripts/view-logs.js --tail 50
```

---

## 🧪 Méthode 3 : Tester et Observer les Logs

### 3.1 Préparer l'environnement

1. Ouvrez le Terminal cPanel (comme décrit dans la méthode 2)
2. Suivez les logs en temps réel :

```bash
cd /home2/kuwa6817/interview-trainer-ai/backend
tail -f logs/app-$(date +%Y-%m-%d).log
```

3. Laissez ce terminal ouvert

### 3.2 Reproduire l'erreur

1. Sur votre navigateur, allez sur https://gpdev.org
2. Tentez de vous inscrire avec une image de profil
3. Observez le terminal pour voir les logs apparaître en temps réel

### 3.3 Analyser les logs

Recherchez ces indicateurs dans les logs :

✅ **Upload réussi** :
```
📤 Upload request received
📦 Multer destination callback triggered
✅ Upload directory is writable
📝 Multer filename callback
🔍 Multer fileFilter callback
✅ File type accepted
✅ Multer upload successful
🎉 Image upload completed
```

❌ **Erreur possible** :
```
❌ Upload directory is NOT writable
❌ Failed to create upload directory
❌ File type rejected
❌ Multer upload error
❌ Unhandled error
```

---

## 📊 Méthode 4 : Vérifier les Permissions du Dossier Uploads

```bash
# Naviguer vers le dossier backend
cd /home2/kuwa6817/interview-trainer-ai/backend

# Vérifier si le dossier uploads existe
ls -la | grep uploads

# Si le dossier n'existe pas, le créer
mkdir -p uploads

# Vérifier les permissions
ls -la uploads/

# Corriger les permissions si nécessaire
chmod 755 uploads

# Si le serveur Node a besoin de plus de permissions
chmod 775 uploads
```

**Permissions attendues :**
```
drwxr-xr-x  2 user  group  4096 Jan 15 12:00 uploads
```

Si les permissions sont incorrectes (ex: `drw-------`), exécutez :
```bash
chmod 755 uploads
```

---

## 🚨 Problèmes Courants et Solutions

### Erreur : "Cannot write to upload directory"

**Cause** : Le dossier `uploads/` n'a pas les permissions d'écriture

**Solution** :
```bash
cd /home2/kuwa6817/interview-trainer-ai/backend
chmod 755 uploads
```

### Erreur : "Upload directory not found"

**Cause** : Le dossier `uploads/` n'existe pas

**Solution** :
```bash
cd /home2/kuwa6817/interview-trainer-ai/backend
mkdir -p uploads
chmod 755 uploads
```

### Erreur : "File too large"

**Cause** : L'image dépasse la limite de 5MB

**Solution** : Utilisez une image plus petite ou modifiez la limite dans `backend/middlewares/uploadMiddleware.ts`

### Erreur : "Only .jpeg, .jpg and .png formats are allowed"

**Cause** : Le format de fichier n'est pas supporté

**Solution** : Utilisez une image en JPEG ou PNG

---

## 📞 Obtenir de l'aide

Si vous ne pouvez toujours pas accéder aux logs ou identifier le problème :

1. **Copiez-collez les logs ici** (via Terminal cPanel ou Gestionnaire de fichiers)
2. **Indiquez l'erreur exacte** que vous voyez dans le navigateur
3. **Précisez** si l'erreur se produit toujours ou de manière intermittente

---

## ✅ Checklist Après Correction

Une fois le problème identifié et corrigé :

- [ ] Vérifier que le dossier `uploads/` existe et a les bonnes permissions
- [ ] Tester l'upload d'une petite image (< 1MB)
- [ ] Vérifier que l'image apparaît dans le dossier `uploads/`
- [ ] Vérifier que l'URL de l'image est correcte dans la base de données
- [ ] Tester avec des images plus grosses (jusqu'à 5MB)
- [ ] Vérifier les logs pour confirmer qu'il n'y a plus d'erreurs
