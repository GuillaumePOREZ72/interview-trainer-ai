# InterviewPrepAI API Documentation

## 🚀 Swagger UI

L'API est documentée avec Swagger/OpenAPI 3.0 et accessible via l'interface web :

**URL :** `http://localhost:3000/api-docs`

### Fonctionnalités de Swagger UI

- **Visualisation interactive** de tous les endpoints
- **Test direct** des API depuis le navigateur
- **Schémas de données** avec exemples
- **Authentification** JWT intégrée (bouton "Authorize")

## 📚 Endpoints Principaux

### 🔐 Authentication
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir le token
- `POST /api/auth/logout` - Déconnexion

### 📋 Sessions
- `GET /api/sessions/my-sessions` - Liste des sessions
- `POST /api/sessions/create` - Créer une session
- `GET /api/sessions/:id` - Détails d'une session
- `DELETE /api/sessions/:id` - Supprimer une session

### ❓ Questions
- `GET /api/questions/:sessionId` - Questions d'une session
- `POST /api/questions` - Ajouter une question
- `PUT /api/questions/:id` - Modifier une question
- `DELETE /api/questions/:id` - Supprimer une question

### 🤖 AI Features
- `POST /api/ai/generate-questions` - Générer des questions IA
- `POST /api/ai/generate-explanation` - Expliquer un concept
- `POST /api/ai/analyze-vocal` - Analyser une réponse vocale

### 🎤 Mock Interview (Nouveau !)
- `POST /api/mock-interview/start` - Démarrer un entretien
- `POST /api/mock-interview/:sessionId/answer` - Soumettre une réponse
- `GET /api/mock-interview/:sessionId/stream` - Stream SSE temps réel
- `POST /api/mock-interview/:sessionId/complete` - Terminer l'entretien
- `GET /api/mock-interview/:sessionId` - Détails de la session
- `GET /api/mock-interview/history` - Historique des entretiens

## 🔑 Authentification

La plupart des endpoints nécessitent un token JWT. Pour tester dans Swagger :

1. Cliquez sur le bouton **"Authorize"** en haut à droite
2. Entrez votre token : `Bearer eyJhbGciOiJIUzI1NiIs...`
3. Cliquez sur **"Authorize"** puis **"Close"**
4. Toutes les requêtes suivantes incluront automatiquement le token

### Obtenir un token

```bash
# S'inscrire
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"password123"}'

# Se connecter
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

Réponse :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## 🎤 Mock Interview - Exemple d'utilisation

### 1. Démarrer un entretien

```bash
curl -X POST http://localhost:3000/api/mock-interview/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "role": "Frontend Developer",
    "experience": 5,
    "topicsToFocus": ["React", "TypeScript", "CSS"],
    "language": "en"
  }'
```

Réponse :
```json
{
  "success": true,
  "sessionId": "507f1f77bcf86cd799439011",
  "question": {
    "text": "What is the Virtual DOM in React?",
    "audioUrl": "/audio/tts/en/abc123.mp3",
    "index": 0
  }
}
```

### 2. Soumettre une réponse

```bash
curl -X POST http://localhost:3000/api/mock-interview/507f1f77bcf86cd799439011/answer \
  -H "Authorization: Bearer <token>" \
  -F "transcript=The Virtual DOM is a programming concept..." \
  -F "audio=@recording.webm"
```

### 3. Stream SSE (temps réel)

```javascript
const eventSource = new EventSource(
  'http://localhost:3000/api/mock-interview/507f1f77bcf86cd799439011/stream',
  { headers: { 'Authorization': 'Bearer <token>' } }
);

eventSource.addEventListener('status', (event) => {
  const data = JSON.parse(event.data);
  console.log('Status:', data.status);
});

eventSource.addEventListener('analysis', (event) => {
  const data = JSON.parse(event.data);
  console.log('Analysis:', data);
});
```

### 4. Terminer l'entretien

```bash
curl -X POST http://localhost:3000/api/mock-interview/507f1f77bcf86cd799439011/complete \
  -H "Authorization: Bearer <token>"
```

Réponse :
```json
{
  "success": true,
  "report": {
    "overallScore": 82,
    "feedback": ["Great communication", "Good technical depth"],
    "strengths": ["Clear explanations", "Good examples"],
    "improvementAreas": ["Could be more concise"],
    "duration": 1200
  }
}
```

## 📊 Schémas de Données

### MockInterviewSession
```typescript
{
  _id: string;
  user: string;
  role: string;
  experience: number; // 0-50
  topicsToFocus: string[];
  language: "fr" | "en";
  status: "pending" | "active" | "analyzing" | "completed" | "expired";
  questions: QuestionResponse[];
  currentQuestionIndex: number;
  overallScore?: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}
```

### ResponseAnalysis
```typescript
{
  accuracy: number; // 0-100
  fillerWords: string[];
  sentiment: "positive" | "neutral" | "negative";
  confidence: number; // 0-100
  suggestions: string[];
}
```

## ⚙️ Configuration

Les variables d'environnement pour l'API :

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/interviewprepai
JWT_SECRET=your-secret-key
GROQ_API_KEY=your-groq-api-key
ELEVENLABS_API_KEY=your-elevenlabs-key
```

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 📦 Dépendances API

```json
{
  "express": "^4.19.2",
  "mongoose": "^8.4.1",
  "jsonwebtoken": "^9.0.2",
  "swagger-ui-express": "^5.x",
  "swagger-jsdoc": "^6.x"
}
```

## 📝 Notes

- Les sessions d'entretien expirent après **24 heures** (TTL MongoDB)
- Les fichiers audio sont limités à **5MB**
- Formats audio supportés : MP3, WAV, WebM, OGG, M4A
- Rate limiting : 100 requêtes par 15 minutes par IP

## 🔗 Liens Utiles

- **Documentation Swagger** : http://localhost:3000/api-docs
- **Health Check** : http://localhost:3000/api/health
- **Repository** : https://github.com/GuillaumePOREZ72/interview-trainer-ai
