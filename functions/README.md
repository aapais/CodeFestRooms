# Firebase Functions - Servidor Central

Este é o servidor central que todas as equipas acedem durante o workshop. Usa Firebase Functions + Firestore para sincronização em tempo real.

## 📋 Setup Inicial

### 1. Instalar dependências
```bash
cd functions
npm install
```

### 2. Fazer login no Firebase
```bash
firebase login
```

### 3. Deploy
```bash
# Da raiz do projeto
npm run functions:deploy

# Ou diretamente
firebase deploy --only functions
```

## 🚀 Endpoints da API

Base URL produção:  
`https://us-central1-codefestrooms-81695626.cloudfunctions.net/api`

### GET /api/state
Retorna o estado de todas as equipas

### POST /api/team/login
Criar ou fazer login de uma equipa
```json
{
  "name": "Team Alpha"
}
```

### POST /api/team/update
Atualizar estado da equipa
```json
{
  "name": "Team Alpha",
  "room": "room2",
  "status": "in-progress",
  "result": "Working on refactoring...",
  "scoreDelta": 10
}
```

### POST /api/team/complete-room
Marcar room como completa
```json
{
  "name": "Team Alpha",
  "roomId": "room1"
}
```

### POST /api/kickoff
Iniciar o timer do jogo

### GET /api/timer
Obter estado do timer

## 🔥 Firestore Collections

### `teams/`
```javascript
{
  id: "Team Alpha",
  name: "Team Alpha",
  room: "room1",
  score: 100,
  completedRooms: ["room1"],
  status: "in-progress",
  lastResult: "Completed room1",
  createdAt: 1234567890,
  updatedAt: 1234567890
}
```

### `gameState/timer`
```javascript
{
  startTime: 1234567890,
  duration: 3000000, // 50 min em ms
  updatedAt: 1234567890
}
```

## 🧪 Testar Localmente

```bash
# Iniciar emuladores
firebase emulators:start

# API estará em:
# http://localhost:5001/codefestrooms-81695626/us-central1/api
```

## 📊 Monitorização

Ver logs:
```bash
firebase functions:log
```

Console Firebase:  
https://console.firebase.google.com/project/codefestrooms-81695626/functions

## 🔒 Segurança

As regras do Firestore estão em `firestore.rules`. Por defeito permite leitura/escrita para facilitar o workshop. Para produção, ajusta conforme necessário.
