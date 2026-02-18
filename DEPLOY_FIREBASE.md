# 🚀 Deploy para Firebase - Workshop Setup

## Objetivo
Fazer deploy do servidor central (Game Hub API) para Firebase Functions, permitindo que todas as equipas conectem ao mesmo servidor durante o workshop.

O servidor inclui:
- ✅ Sistema de validação de transição entre rooms
- ✅ Bloqueio de acesso até completar room anterior
- ✅ Leaderboard em tempo real
- ✅ Timer sincronizado
- ✅ Firestore para persistência

## Pré-requisitos

```bash
npm install -g firebase-tools
firebase login
```

## 📦 Deploy Completo

### 1. Instalar Dependências das Functions

```bash
cd visual-escape-room/functions
npm install
cd ..
```

### 2. Deploy Functions (Servidor Central)

```bash
firebase deploy --only functions
```

Isto faz deploy da API central em:
- **URL**: `https://us-central1-codefestrooms-81695626.cloudfunctions.net/api`

### 3. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 4. Deploy Hosting (Sites Estáticos - Opcional)

```bash
firebase deploy --only hosting
```

Sites disponíveis:
- **Game Hub**: `https://codefestrooms-81695626.web.app`
- **Room 1**: `https://codefest-room1.web.app`
- **Room 2**: `https://codefest-room2.web.app`
- **Room 3**: `https://codefest-room3.web.app`
- **Final**: `https://codefest-final.web.app`

---

## 🎯 Setup para Workshop

### Arquitetura

```
┌─────────────────────────┐
│  Firebase Functions     │  ← Servidor Central
│  (API + Firestore)      │     (sempre disponível)
│  + Room Validation      │
└───────────┬─────────────┘
            │
     ┌──────┴──────────────────────┐
     │                             │
┌────▼────────┐           ┌────────▼────┐
│  Equipa 1   │           │  Equipa N   │
│  (IDX)      │    ...    │  (IDX)      │
└─────────────┘           └─────────────┘
```

### URLs que as Equipas Usam

Durante o workshop, cada equipa trabalha no **Google IDX** e conecta ao servidor Firebase:

**API Central** (todas equipas usam):
```
https://us-central1-codefestrooms-81695626.cloudfunctions.net/api
```

**Endpoints disponíveis**:
- `GET  /api/state` - Leaderboard
- `POST /api/team/login` - Registar equipa
- `POST /api/team/update` - Atualizar progresso
- `POST /api/team/complete-room` - Completar room (+pontos automáticos)
- `POST /api/team/check-access` - Verificar se pode aceder a room
- `GET  /api/rooms/objectives` - Listar objetivos das rooms
- `POST /api/kickoff` - Iniciar timer (50 min)
- `GET  /api/timer` - Ver tempo restante

---

## 🎮 Como Correr o Workshop

### 1. Antes do Workshop (Facilitador)

```bash
# 1. Deploy do servidor central
firebase deploy --only functions

# 2. Verificar que está online
curl https://us-central1-codefestrooms-81695626.cloudfunctions.net/api/state

# 3. Limpar dados de testes anteriores (se necessário)
firebase firestore:delete --all-collections
```

### 2. Durante o Workshop

**Dashboard (Facilitador - projetado num ecrã):**
npm install
node server.js
# Abrir preview porta 4000 e projetar
```

**Equipas (cada uma no seu IDX):**
1. Clonar o repo
2. `npm install`
3. Trabalhar nos desafios usando Gemini
4. As equipas conectam automaticamente ao Firebase
5. Progresso aparece no dashboard em tempo real

### 3. Iniciar o Jogo

No dashboard (ou via API):
```bash
curl -X POST https://us-central1-codefestrooms-81695626.cloudfunctions.net/api/kickoff
```

---

## 🔍 Verificar Deploy

### Testar Functions

```bash
# Ver logs
firebase functions:log

# Testar API
curl https://us-central1-codefestrooms-81695626.cloudfunctions.net/api/state
```

### Ver Firestore

```bash
# Abrir console
firebase console
# Ir para Firestore Database
```

---

## 🛠️ Troubleshooting

### Function não responde
```bash
# Verificar logs
firebase functions:log --only api

# Re-deploy
firebase deploy --only functions
```

### CORS errors
As functions já têm CORS configurado. Se houver problema:
- Verificar em `functions/index.js` que `cors({ origin: true })` está ativo

### Firestore permissions
- Verificar `firestore.rules` 
- Fazer deploy: `firebase deploy --only firestore:rules`

---

## 📊 Monitorização

Durante o workshop, podes ver:
- **Functions**: https://console.firebase.google.com/project/codefestrooms-81695626/functions
- **Firestore**: https://console.firebase.google.com/project/codefestrooms-81695626/firestore
- **Logs**: `firebase functions:log --only api`

---

## ✅ Checklist Pré-Workshop

- [ ] `firebase deploy --only functions` executado
- [ ] API responde em `/api/state`
- [ ] Firestore rules deployed
- [ ] Dashboard local testado
- [ ] URLs partilhados com equipas (ou no repo)
- [ ] Timer pode ser iniciado via `/api/kickoff`

