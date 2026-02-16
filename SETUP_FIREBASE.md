# 🔥 Setup Firebase Hosting - Visual Escape Room

Este guia configura o **Visual Escape Room** com **Firebase Hosting** para acesso multi-utilizador via web.

---

## 📋 Pré-requisitos

1. **Node.js** instalado (v16+)
2. **Firebase CLI** instalado
3. **Conta Firebase** (gratuita)
4. **Projeto Firebase** configurado

---

## 🚀 Setup Rápido

### Passo 1: Instalar Firebase CLI

```powershell
# Windows (PowerShell)
npm install -g firebase-tools

# Verificar instalação
firebase --version
```

### Passo 2: Autenticar no Firebase

```powershell
firebase login
```

Isto abre o browser para autenticação com a tua conta Google.

### Passo 3: Configurar Projeto Firebase

O projeto já está configurado em `.firebaserc` com o ID: `codefestrooms-81695626`

Se precisares criar um novo projeto:

```powershell
# Criar novo projeto no console Firebase
# https://console.firebase.google.com

# Associar ao projeto
firebase use --add
```

### Passo 4: Configurar Hosting Targets

```powershell
# Game Hub (site principal)
firebase target:apply hosting game-hub codefestrooms-81695626

# Rooms individuais
firebase target:apply hosting room1 codefest-room1
firebase target:apply hosting room2 codefest-room2
firebase target:apply hosting room3 codefest-room3
firebase target:apply hosting final codefest-final
```

### Passo 5: Deploy para Produção

```powershell
# Deploy tudo
npm run firebase:deploy:all

# Ou deploy individual
npm run firebase:deploy:hub
npm run firebase:deploy:room1
npm run firebase:deploy:room2
npm run firebase:deploy:room3
npm run firebase:deploy:final
```

---

## 🌐 URLs de Produção

Após o deploy, as rooms estarão disponíveis em:

- 🎮 **Game Hub:** https://codefestrooms-81695626.web.app
- 🏚️ **Room 1:** https://codefest-room1.web.app
- 🧱 **Room 2:** https://codefest-room2.web.app
- 🔐 **Room 3:** https://codefest-room3.web.app
- 🏢 **Room Final:** https://codefest-final.web.app

---

## 💻 Desenvolvimento Local

### Com Emuladores Firebase (Recomendado)

```powershell
# Inicia todos os emuladores
npm run dev

# Acede em:
# - Game Hub: http://localhost:5000
# - Firestore UI: http://localhost:4000
```

### Com Servidores Node.js Tradicionais

```powershell
# Terminal 1: Game Hub
npm run start:hub

# Terminal 2: Room 1
npm run start:room1

# Terminal 3: Room 2
npm run start:room2

# Terminal 4: Room 3
npm run start:room3

# Terminal 5: Final Room
npm run start:final
```

---

## ⚙️ Configuração Automática

O sistema deteta automaticamente o ambiente:

| Ambiente | Detecção | URLs Usados |
|----------|----------|-------------|
| **Produção** | `*.web.app` ou `*.firebaseapp.com` | URLs Firebase |
| **Local** | `localhost` | URLs localhost |

A configuração está em [`config.js`](config.js) (cada room tem o seu):

```javascript
window.GAME_CONFIG = {
  isProduction: window.location.hostname.includes('web.app'),
  PRODUCTION: { /* URLs Firebase */ },
  LOCAL: { /* localhost URLs */ },
  get GAME_HUB_URL() { /* Retorna URL correto */ }
}
```

**Não precisas editar nada!** O sistema escolhe automaticamente.

---

## 🔄 Workflow Completo

### 1️⃣ Desenvolvimento Local

```powershell
# Desenvolve com emuladores
npm run dev

# Testa as rooms
npm test
```

### 2️⃣ Deploy para Staging/Produção

```powershell
# Deploy tudo
npm run firebase:deploy:all

# Verifica os URLs no console
firebase hosting:channel:list
```

### 3️⃣ Partilhar com Equipas

Envia os URLs Firebase:
- Game Hub: https://codefestrooms-81695626.web.app
- Room 1: https://codefest-room1.web.app
- etc.

As equipas acedem diretamente pelo browser, sem instalações!

---

## 🔧 Firestore (Base de Dados)

### Configurar Regras de Segurança

O ficheiro [`firestore.rules`](firestore.rules) define as permissões:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita para todas as equipas
    match /teams/{teamId} {
      allow read, write: if true;
    }
    match /scores/{scoreId} {
      allow read, write: if true;
    }
  }
}
```

### Deploy das Regras

```powershell
firebase deploy --only firestore:rules
```

---

## 📊 Monitorização

### Ver Logs em Tempo Real

```powershell
firebase functions:log
```

### Verificar Hosting

```powershell
firebase hosting:channel:list
```

### Console Firebase

Acede ao console: https://console.firebase.google.com

- **Hosting:** Ver deploys e tráfego
- **Firestore:** Ver dados das equipas
- **Analytics:** Métricas de utilização

---

## 🆘 Troubleshooting

### Problema: "Project not found"

```powershell
# Verifica projeto ativo
firebase use

# Alterna para o correto
firebase use codefestrooms-81695626
```

### Problema: "Hosting target not found"

```powershell
# Re-aplica os targets
firebase target:apply hosting game-hub codefestrooms-81695626
firebase target:apply hosting room1 codefest-room1
# etc...
```

### Problema: "Permission denied"

Verifica as regras do Firestore em [`firestore.rules`](firestore.rules) e faz deploy:

```powershell
firebase deploy --only firestore:rules
```

### Problema: URLs não funcionam

1. Verifica se o deploy foi bem-sucedido:
   ```powershell
   firebase hosting:channel:list
   ```

2. Confirma que os URLs em [`config.js`](config.js) estão corretos

3. Limpa cache do browser (Ctrl+Shift+R)

---

## 🎯 Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia emuladores Firebase |
| `npm run firebase:deploy:all` | Deploy de todas as rooms |
| `npm run firebase:deploy:hub` | Deploy apenas do Game Hub |
| `npm run firebase:deploy:room1` | Deploy apenas da Room 1 |
| `firebase hosting:channel:list` | Lista todos os sites hospedados |
| `firebase projects:list` | Lista projetos Firebase |

---

## 🔐 Segurança

### HTTPS Automático
Firebase Hosting fornece **HTTPS automático** com certificados SSL gratuitos.

### CORS
Firebase permite requests cross-origin por defeito.

### Firewall Corporativa
Firebase raramente é bloqueado porque usa domínios Google (`*.web.app`).

---

## 💰 Custos

### Plano Spark (Gratuito)
- **Hosting:** 10 GB/mês
- **Firestore:** 1 GB storage, 50k reads/day
- **Bandwidth:** 360 MB/day

**Suficiente para ~100 equipas simultâneas!**

### Monitorizar Uso
Console Firebase → Usage and billing

---

## 📚 Recursos

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

## ✅ Checklist Final

```
☐ Firebase CLI instalado (firebase --version)
☐ Autenticado (firebase login)
☐ Projeto configurado (firebase use)
☐ Targets aplicados (firebase target:apply...)
☐ Deploy realizado (npm run firebase:deploy:all)
☐ URLs testados no browser
☐ Firestore rules deployed (firebase deploy --only firestore:rules)
☐ Equipas conseguem aceder aos URLs
```

---

## 🎮 Pronto para Jogar!

Partilha os URLs com as equipas e deixa-os competir! O leaderboard atualiza em tempo real via Firebase Firestore.

**Boa sorte! 🚀**
