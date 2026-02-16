# 🔄 Alternativas a Ngrok (Se Não Conseguir Acesso)

Se ngrok estiver bloqueado pela firewall corporativa, tens várias opções!

---

## 📊 **Comparação Rápida**

| Solução | Gratuito | Fácil | HTTPS | WebSocket | Bloqueado? |
|---------|----------|------|-------|-----------|-----------|
| **Ngrok** | ✅ Sim | ⭐⭐⭐ | ✅ | ✅ | ⚠️ Às vezes |
| **Cloudflare Tunnel** | ✅ Sim | ⭐⭐⭐ | ✅ | ✅ | ❌ Raramente |
| **LocalTunnel** | ✅ Sim | ⭐⭐⭐ | ✅ | ✅ | ⚠️ Às vezes |
| **Expose** | ✅ Sim | ⭐⭐⭐ | ✅ | ✅ | ❌ Raramente |
| **SSH Remote** | ✅ Sim | ⭐⭐ | ❌ | ✅ | ✅ Funciona |
| **Rede Local** | ✅ Sim | ⭐⭐⭐ | ❌ | ✅ | ✅ Seguro |

---

## 🥇 **OPÇÃO 1: Cloudflare Tunnel (RECOMENDADO)**

### **Por que?**
- ✅ Grátis, sem limite de utilizadores
- ✅ Cloudflare é difícil de bloquear
- ✅ HTTPS automático
- ✅ WebSocket funciona
- ✅ Mais rápido que ngrok

### **Setup (5 min)**

```powershell
# 1. Instala Cloudflare CLI
choco install cloudflare-wrangler
# ou Windows Package Manager
winget install Cloudflare.cloudflared

# 2. Autentica (abre browser!)
cloudflare-wrangler login
# ou
cloudflared tunnel login

# 3. Cria túneis
cloudflared tunnel create gameroom

# 4. Inicia (tudo com 1 comando!)
cloudflared tunnel run gameroom
```

**Config file (~/.cloudflared/config.yml):**
```yaml
url: http://localhost:4000
tunnel: gameroom
credentials-file: /home/user/.cloudflared/UUID.json
ingress:
  - hostname: gameroom.pages.dev
    service: http://localhost:4000
  - hostname: room1.pages.dev
    service: http://localhost:3000
  - service: http_status:404
```

### **Resultado:**
```
Game Hub:  https://gameroom.pages.dev
Room 1:    https://room1.pages.dev
(mais simples que ngrok!)
```

---

## 🥈 **OPÇÃO 2: LocalTunnel**

### **Setup Rápido**

```powershell
# 1. Instala
npm install -g localtunnel

# 2. Inicia (cada um num terminal)
lt --port 4000 --subdomain gameroom
lt --port 3000 --subdomain room1
lt --port 3002 --subdomain room2
# etc...

# 3. URLs geradas
# https://gameroom.loca.lt
# https://room1.loca.lt
# etc...
```

**Vantagens:**
- Muito simples
- Cross-platform (npm)
- Grátis, sem conta necessária

**Desvantagens:**
- URLs `.loca.lt` (menos profissional)
- Às vezes lento

---

## 🥉 **OP **ÇÃO 3: SSH Remote Port Forwarding**

### **Melhor se tiveres servidor remoto!**

Se tens um servidor Linux online (ex: AWS, DigitalOcean, Hetzner):

```bash
# No teu laptop (redireciona para servidor)
ssh -R 3000:localhost:3000 user@server.com

# Depois acede via:
# https://server.com:3000
```

**Vantagens:**
- ✅ Sempre funciona (SSH raramente é bloqueado)
- ✅ Sem dependências
- ✅ Controlo total

**Desvantagens:**
- ❌ Precisa de servidor remoto
- ❌ Sem HTTPS automático (precisa SSL em server.com)

---

## 🏠 **OPÇÃO 4: Rede Local Apenas (MAIS SEGURO)**

### **Cenário: Equipas na mesma rede corporativa**

Se os PCs estão na **mesma Wi-Fi/ethernet**, não precisas sequer de Internet público!

```powershell
# No teu laptop
ipconfig

# Nota o IPv4: 192.168.1.50 (por exemplo)

# Depois diz às equipas:
# Game Hub:  http://192.168.1.50:4000
# Room 1:    http://192.168.1.50:3000
# etc...
```

**Vantagens:**
- ✅ Totalmente seguro (corporativo aprova!)
- ✅ Sem tuneis externos
- ✅ Mais rápido
- ✅ Funciona offline

**Desvantagens:**
- ❌ Sem HTTPS (apenas HTTP)
- ❌ Só funciona na mesma rede
- ❌ Se equipas mudarem de rede = não funciona

**Solução para HTTPS local:**
```powershell
# Gera certificado self-signed
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes

# Depois usa em Node.js com HTTPS
```

---

## 🌐 **OPÇÃO 5: Ngrok Alternativas Menos Conhecidas**

### **Expose.sh**
```bash
expose share http://localhost:4000
# URL: https://abc123.expose.sh
```

### **Serveo.net**
```bash
ssh -R 80:localhost:8080 serveo.net
# URL: https://serveo.net (primeiro que ligar!)
```

### **Ngrok.dev**
Ngrok alternativa gratuita:
```bash
docker run -it -e NGROK_AUTHTOKEN=token ngrok/ngrok http 4000
```

---

## 🚨 **E se a Firewall Bloquear TUDO?**

### **Última opção: QR Code + Manual**

Se nenhuma solução funciona:

1. **Gera um ficheiro QR code** com os dados da rede
2. **Print e distribui** às equipas
3. **Equipas digitam manualmente** na rede local

```powershell
# Generate QR code (PowerShell)
$ip = "192.168.1.50"
$qr = "http://$ip`:4000"
Write-Host $qr

# Ou usa: https://qr-server.com/api/qr?size=300x300&data=$qr
```

---

## 📋 **Decision Tree: Qual Escolher?**

```
┌─ Ngrok está bloqueado?
│
├─ NÃO → Usa NGROK (já tens setup pronto!)
│
└─ SIM
   │
   ├─ Equipas estão na mesma rede? → IP LOCAL (192.168.1.50)
   │
   ├─ Tens 5 min? → CLOUDFLARE TUNNEL
   │
   ├─ Queres mais fácil? → LOCALTUNNEL
   │
   ├─ Tens servidor remoto? → SSH REMOTE
   │
   └─ Nada funciona? → QR CODE MANUAL
```

---

## 🔧 **Como Mudar de Ngrok para Cloudflare**

### **1. Update config-ngrok.js**
```javascript
window.GAME_CONFIG = {
  GAME_HUB_URL: 'https://gameroom.pages.dev',
  ROOM1_URL: 'https://room1.pages.dev',
  ROOM2_URL: 'https://room2.pages.dev',
  ROOM3_URL: 'https://room3.pages.dev',
  FINAL_URL: 'https://final.pages.dev',
  WS_URL: 'wss://gameroom.pages.dev',
};
```

### **2. Inicia Cloudflare (1 terminal)**
```powershell
cloudflared tunnel run gameroom
```

### **3. HTMLs carregam config-ngrok.js e... pronto!**

---

## ⚡ **Checklist: Ngrok Falhou?**

```
☐ Tentei Cloudflare Tunnel? (90% das vezes funciona)
☐ Erro: "Rate limit exceeded"? → LocalTunnel
☐ TI diz: "Em breve desbloqueamos"? → Usa IP Local enquanto esperas
☐ HTTPS obrigatório? → Cloudflare + SSL local
☐ Precisa máxima segurança? → IP Local (HTTP)
☐ Nada funciona? → Contacta TI para whitelist ngrok
```

---

## 📞 **Contactar TI (Template)**

Se nenhuma solução funcionar:

```
ASSUNTO: Whitelist de Domínios para Workshop

Necessitamos acesso a UM DESTES serviços (apenas um):

OPÇÃO A (Preferida):
- Ngrok: *.ngrok-free.app / *.ngrok.io

OPÇÃO B (Alternativa):
- Cloudflare: *.pages.dev

OPÇÃO C (Mínima segurança):
- IP Local: 192.168.1.50 (apenas na rede corporativa)

Contexto: Workshop de gamificação, sem dados sensíveis, tráfego HTTPS encriptado.
```

---

## 🎯 **TL;DR**

| Se... | Faz isto |
|-------|----------|
| Ngrok funciona | Usa já implementado ✅ |
| Ngrok bloqueado | Tenta **Cloudflare Tunnel** primeiro |
| Nada online funciona | Usa **IP Local (192.168.x.x)** + PDF/QR |
| Firewall muito restritivo | Pede a TI para **SSH tuneling** |
| TI diz "não"? | Plano B: **Equipas na mesma sala, mesmo Wi-Fi** 🎮 |

**Qual delas queres que implementa como backup?** 🚀
