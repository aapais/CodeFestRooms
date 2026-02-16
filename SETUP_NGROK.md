# 🌐 Setup Ngrok para Rede Corporativa

Este guia configura o **Visual Escape Room** para funcionar com **múltiplos computadores numa rede corporativa** usando ngrok.

---

## 📋 Pré-requisitos

1. **Node.js** instalado
2. **ngrok** instalado (`choco install ngrok` ou `npm install -g ngrok`)
3. **Conta ngrok** (gratuita em https://ngrok.com)
4. **Auth token ngrok** (para sessions persistentes)

---

## 🚀 Instalação Rápida

### Passo 1: Obter Ngrok Auth Token

1. Vai a https://dashboard.ngrok.com/get-started/your-authtoken
2. Copia o teu **auth token**
3. Configure no sistema:

```powershell
# Windows (PowerShell como Admin)
ngrok config add-authtoken SEU_AUTH_TOKEN_AQUI
```

### Passo 2: Executar Setup Automático

```powershell
# Na raiz do projeto
.\setup-ngrok.ps1
```

Este script vai:
- ✅ Instalar ngrok (se necessário)
- ✅ Criar túneis para 4 rooms + hub
- ✅ Gerar `config-ngrok.js` com URLs
- ✅ Atualizar todos os HTMLs automaticamente

### Passo 3: Iniciar Servidores

```powershell
# Terminal 1: Game Hub
cd game-hub
npm start

# Terminal 2: Room 1
cd rooms\room1-archaeology
npm start

# Terminal 3: Room 2
cd rooms\room2-refactor-lab
npm start

# Terminal 4: Room 3
cd rooms\room3-security-vault
npm start

# Terminal 5: Room Final
cd rooms\final-modernisation
npm start
```

### Passo 4: Distribuir URLs

Após os servidores iniciarem, vais ter URLs públicas tipo:
- 🎮 **Game Hub:** `https://abc123.ngrok-free.app`
- 🏚️ **Room 1:** `https://def456.ngrok-free.app`
- 🧱 **Room 2:** `https://ghi789.ngrok-free.app`
- 🔐 **Room 3:** `https://jkl012.ngrok-free.app`
- 🏢 **Room Final:** `https://mno345.ngrok-free.app`

**Partilha estas URLs com os PCs das equipas via qr-code ou email.**

---

## 🔧 Configuração Manual

Se preferires fazer manualmente:

### 1. Atualizar `config-ngrok.js`

```javascript
// config-ngrok.js - EDITA COM OS TEUS URLs
window.GAME_CONFIG = {
  GAME_HUB_URL: 'https://abc123.ngrok-free.app',    // Substitui!
  ROOM1_URL: 'https://def456.ngrok-free.app',        // Substitui!
  ROOM2_URL: 'https://ghi789.ngrok-free.app',        // Substitui!
  ROOM3_URL: 'https://jkl012.ngrok-free.app',        // Substitui!
  FINAL_URL: 'https://mno345.ngrok-free.app',        // Substitui!
  WS_URL: 'wss://abc123.ngrok-free.app',             // Mesmo que HUB com wss://
};
```

### 2. Usar `config-ngrok.js` em vez de `config.js`

Em cada HTML das rooms, muda:
```html
<script src="/config.js"></script>
```
Para:
```html
<script src="/config-ngrok.js"></script>
```

---

## ⚙️ Configuração dos Túneis Ngrok

Se precisares fazer isto manualmente, usa:

```bash
# Terminal 1: Game Hub (porta 4000)
ngrok http 4000 --region eu --hostname game-hub-codefest

# Terminal 2: Room 1 (porta 3000)
ngrok http 3000 --region eu --hostname room1-codefest

# Terminal 3: Room 2 (porta 3002)
ngrok http 3002 --region eu --hostname room2-codefest

# Terminal 4: Room 3 (porta 3003)
ngrok http 3003 --region eu --hostname room3-codefest

# Terminal 5: Final (porta 8080)
ngrok http 8080 --region eu --hostname final-codefest
```

**Nota:** Hostnames customizados requerem plano ngrok Pro (€5/mês).
Versão gratuita gera URLs aleatórias cada vez.

---

## 🐛 Troubleshooting

### "ngrok: command not found"
```powershell
# Instala ngrok
choco install ngrok
# ou
npm install -g ngrok
```

### "Error: auth token not set"
```powershell
# Configura o token
ngrok config add-authtoken SEU_TOKEN
```

### "WebSocket connection failed"
- Verifica se está a usar `wss://` (secure WebSocket)
- Ngrok HTTPS requer `wss://` em vez de `ws://`

### "CORS blocked"
- Os servidores Express devem ter CORS habilitado
- Verifica se `Access-Control-Allow-Origin: *` está no header

---

## 🎯 Fluxo Completo

```
Tua Máquina
├── Game Hub (4000) → [ngrok] → https://abc.ngrok-free.app
├── Room 1 (3000) → [ngrok] → https://def.ngrok-free.app
├── Room 2 (3002) → [ngrok] → https://ghi.ngrok-free.app
├── Room 3 (3003) → [ngrok] → https://jkl.ngrok-free.app
└── Final (8080) → [ngrok] → https://mno.ngrok-free.app

Máquinas das Equipas (qualquer PC na rede corporativa)
├── Equipa A: acede a https://abc.ngrok-free.app (Game Hub)
├── Equipa B: acede a https://def.ngrok-free.app (Room 1)
└── etc...
```

---

## 📝 Notas

- **URLs mudam** cada vez que reinicia ngrok (versão gratuita)
- Usa **QR codes** para partilhar URLs rapidamente
- **Ngrok.dev** é alternativa gratuita (sem limites de conexões)
- Para **URLs permanentes**, considera plano **ngrok Pro** (~€5/mês)

---

## ❓ Dúvidas?

Se tenhas problemas de conexão, abre a consola do browser (F12) e verifica:
- ✅ Estão os requests HTTPS a passar?
- ✅ WebSocket connected (no Game Hub)?
- ✅ CORS headers corretos?

Bom jogo! 🎮
