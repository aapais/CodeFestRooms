# 🚀 Visual Escape Room - Firebase Deployment

## ⚡ Quick Start

### Deploy para Produção
```powershell
# 1. Login (só primeira vez)
firebase login

# 2. Deploy tudo
npm run firebase:deploy:all

# 3. URLs gerados:
# https://codefestrooms-81695626.web.app (Game Hub)
# https://codefest-room1.web.app (Room 1)
# https://codefest-room2.web.app (Room 2)
# https://codefest-room3.web.app (Room 3)
# https://codefest-final.web.app (Final Room)
```

---

## 📦 O Que Foi Configurado

### ✅ Removido
- ❌ Ngrok (scripts, configurações, documentação)
- ❌ Cloudflare Tunnel setup
- ❌ Rede local setup
- ❌ Todos os templates de configuração manual

### ✅ Implementado
- ✅ Firebase Hosting com 5 sites (1 por room + hub)
- ✅ Config.js direto para URLs de produção
- ✅ Scripts npm para deploy individual ou completo

---

## 🎯 Arquitetura Firebase

```
Firebase Project: codefestrooms-81695626
├── Hosting Sites (5x)
│   ├── codefestrooms-81695626 (default) → Game Hub
│   ├── codefest-room1 → Room 1
│   ├── codefest-room2 → Room 2
│   ├── codefest-room3 → Room 3
│   └── codefest-final → Final Room
│
└── Firestore Database
    └── teams/ (leaderboard centralizado)
```

---

## 🔧 Configuração Automática

Cada [`config.js`](game-hub/public/config.js) nas rooms aponta diretamente para os URLs de produção do Firebase Hosting.

**Não precisas alterar nada!**

---

## 📝 Scripts Disponíveis

```powershell
# Deploy Completo
npm run firebase:deploy:all      # Deploy todas as rooms + Firestore

# Deploy Individual
npm run firebase:deploy:hub      # Só Game Hub
npm run firebase:deploy:room1    # Só Room 1
npm run firebase:deploy:room2    # Só Room 2
npm run firebase:deploy:room3    # Só Room 3
npm run firebase:deploy:final    # Só Final Room

# Outros
npm run score                    # Calcular pontuações
npm run leaderboard              # Ver leaderboard
```

---

## 🌐 URLs Produção

Após primeiro deploy (`npm run firebase:deploy:all`):

| Componente | URL Produção |
|-----------|-------------|
| 🎮 Game Hub | https://codefestrooms-81695626.web.app |
| 🏚️ Room 1 | https://codefest-room1.web.app |
| 🧱 Room 2 | https://codefest-room2.web.app |
| 🔐 Room 3 | https://codefest-room3.web.app |
| 🏢 Final Room | https://codefest-final.web.app |

**Partilha estes URLs com as equipas!**

---

## 💡 Fluxo de Trabalho

### 1️⃣ Antes do Evento
```powershell
# Deploy para produção
npm run firebase:deploy:all

# Testa URLs produção em browser privado
```

### 2️⃣ Durante o Evento
- Equipas acedem via URLs `.web.app`
- Dados sincronizam automaticamente via Firestore
- Leaderboard atualiza em tempo real

### 3️⃣ Fazer Update Durante Evento (se necessário)
```powershell
# Edita ficheiros em rooms/room1-archaeology/public/
npm run firebase:deploy:room1
# Atualizado em ~30 segundos!
```

---

## 🔐 Segurança Firestore

Edita [`firestore.rules`](firestore.rules) para produção:

```javascript
match /teams/{teamId} {
  allow read: if true;              // Todos leem leaderboard
  allow write: if request.auth != null;  // Só autenticados escrevem
}
```

Deploy rules:
```powershell
firebase deploy --only firestore:rules
```

---

## 💰 Custos

**Plano Gratuito (Spark) inclui:**
- ✅ 10GB hosting/mês GRÁTIS
- ✅ 360MB transferência/dia GRÁTIS
- ✅ 50K reads Firestore/dia GRÁTIS
- ✅ SSL/HTTPS automático GRÁTIS

**Para este evento:** ~10-50 equipas = **100% GRÁTIS**

---

## 🐛 Troubleshooting

### Erro: "Project not found"
```powershell
firebase use codefestrooms-81695626
```

### Erro: "Site does not exist"
```powershell
# Cria sites (só primeira vez)
firebase hosting:sites:create codefest-room1
firebase hosting:sites:create codefest-room2
firebase hosting:sites:create codefest-room3
firebase hosting:sites:create codefest-final

# Configura targets
firebase target:apply hosting room1 codefest-room1
firebase target:apply hosting room2 codefest-room2
firebase target:apply hosting room3 codefest-room3
firebase target:apply hosting final codefest-final
```

### Cache do Browser
Faz **Ctrl+Shift+R** (hard reload) após deploy.

---

## 📚 Documentação Detalhada

Ver [`SETUP_FIREBASE.md`](SETUP_FIREBASE.md) para:
- Setup inicial completo
- Criar novo projeto Firebase
- Configurar domínio personalizado
- Monitorização e analytics
- Backup e exportação de dados

---

## ✅ Checklist Rápido

Antes do evento:

```
☑ Firebase CLI instalado: npm install -g firebase-tools
☑ Login feito: firebase login
☑ Deploy testado: npm run firebase:deploy:all
☑ URLs .web.app funcionam
☑ Emulators testados: npm run dev
☑ URLs partilhados com equipas
```

---

**Pronto! 🎉** O projeto está configurado para Firebase Hosting apenas. Simples, escalável e profissional.

## 🔗 Links Úteis

- [Firebase Console](https://console.firebase.google.com/project/codefestrooms-81695626)
- [Firebase Docs](https://firebase.google.com/docs/hosting)
- [Emulator UI](http://localhost:4000) (quando `npm run dev` está a correr)
