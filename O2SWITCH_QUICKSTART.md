# 🚀 Instructions Rapides pour O2Switch

## 📋 Étape 1 : Pull les modifications

```bash
cd /home2/kuwa6817/interview-trainer-ai
git pull origin main
```

## 🔧 Étape 2 : Créer les dossiers nécessaires

```bash
mkdir -p backend/logs
mkdir -p backend/uploads
chmod 755 backend/logs
chmod 755 backend/uploads
```

## 🔨 Étape 3 : Builder le backend (si nécessaire)

```bash
cd backend
npm run build
```

## 🔄 Étape 4 : Redémarrer le serveur

Utilisez la méthode que vous utilisez actuellement pour démarrer votre serveur Node.js.

## 🧪 Étape 5 : Tester l'upload

Allez sur https://gpdev.org et essayez de créer un compte avec une image de profil.

## 🔍 Étape 6 : Voir les logs

```bash
cd /home2/kuwa6817/interview-trainer-ai/backend

# Option 1 : Voir le fichier de log le plus récent
tail -100 logs/*.log

# Option 2 : Voir uniquement les logs d'upload
grep -i "upload\|multer\|📤\|📦\|📁\|📝\|🔍" logs/*.log | tail -50

# Option 3 : Voir uniquement les erreurs
grep -i "error\|❌\|failed" logs/*.log | tail -50

# Option 4 : Suivre les logs en temps réel
tail -f logs/$(ls -t logs/*.log | head -n 1)
```

## 🎯 Que chercher dans les logs ?

### ✅ Upload réussi :
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

### ❌ Erreurs possibles :
```
❌ Upload directory is NOT writable
❌ Failed to create upload directory
❌ File type rejected
❌ Multer upload error
EACCES (Permission denied)
ENOENT (No such file or directory)
```

## 📞 Problèmes courants

### Problème : Dossier uploads manquant
```bash
mkdir -p /home2/kuwa6817/interview-trainer-ai/backend/uploads
chmod 755 /home2/kuwa6817/interview-trainer-ai/backend/uploads
```

### Problème : Pas de fichiers de logs
```bash
mkdir -p /home2/kuwa6817/interview-trainer-ai/backend/logs
chmod 755 /home2/kuwa6817/interview-trainer-ai/backend/logs
# Redémarrer le serveur
```

### Problème : Permissions incorrectes
```bash
cd /home2/kuwa6817/interview-trainer-ai/backend
ls -la uploads/
# Vérifier que vous avez des permissions d'écriture
```

---

## 📤 Copiez-collez les logs d'erreur ici

Une fois que vous avez les logs, partagez les lignes contenant "❌" ou des erreurs pour que je puisse identifier le problème précis.
