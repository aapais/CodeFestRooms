# 🎮 Guia do Facilitador - Visual Escape Room (Firebase)

## ⏱️ Configuração: 50 Minutos

A workshop tem **exatamente 50 minutos**. Todo o sistema está sincronizado em Firebase:
- ⏱️ Timer global começa no Game Hub (Dashboard)
- 📊 Timer visível APENAS no Game Hub
- 🏆 Tempo é factor de desempate (quem termina mais rápido ganha)
- 🎯 Objetivo de cada room aparece no topo da room

---

## 📋 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                   FIREBASE HOSTING                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ Game Hub   │  │  Room 1    │  │  Room 2    │  ...         │
│  │ (Central)  │  │(Archaeology)│ │ (Refactor) │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│        ▲                                                      │
│        │                                                      │
│        └──────────────────┬──────────────────┘                │
│                           ▼                                   │
│                   ┌───────────────┐                           │
│                   │   FIRESTORE   │                           │
│                   │  (Centralizado)│                           │
│                   └───────────────┘                           │
│          • teams/{teamId}/                                    │
│          • scores/results                                     │
│          • leaderboard                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 Fluxo com Múltiplos Grupos em Máquinas Diferentes

### **Pré-Evento (Facilitador)**

```
1. Deploy para Firebase (antes do evento)
   $ npm run firebase:deploy:all
   
   Resultado:
   ✅ Game Hub em: https://codefestrooms-81695626.web.app
   ✅ Room 1 em: https://codefest-room1.web.app
   ✅ Room 2 em: https://codefest-room2.web.app
   ✅ Room 3 em: https://codefest-room3.web.app
   ✅ Final em: https://codefest-final.web.app

2. Partilhar URLs com os grupos via email/Slack/QR Code

3. Preparar Game Hub (Dashboard) (manter aberto durante o evento)
   Abrir no browser: https://codefestrooms-81695626.web.app
   
   ⚠️ IMPORTANTE NO GAME HUB (DASHBOARD):
   - Botão "▶️ Start Game (50 min)" para começar
   - Timer mostra tempo RESTANTE
   - Leaderboard com ranking ao vivo
   - Cor do timer: 🟢 Verde (>16 min) → 🟡 Amarelo (>5 min) → 🔴 Vermelho (<5 min)
```

---

## 🎬 Durante o Evento

### **Fase 1: Kickoff (0-2 min)**

```
FACILITADOR:
✓ Explica o tema e as 4 rooms
✓ Divide público em grupos (2-4 pessoas cada)
✓ Partilha URLs ou mostra QR code no slide

👉 AÇÃO CRÍTICA: Clica em "▶️ Start Game" no Game Hub (Dashboard)
   - Isto INICIA o timer global de 50 minutos
   - Todos as rooms começam a contar tempo simultaneamente
   - Sem isto, o jogo não começa!

GRUPOS:
→ Abrem: https://codefestrooms-81695626.web.app (Game Hub)
→ Clicam botão da Room 1
→ VÊEM o objetivo no topo da Room 1
→ Começam o desafio
```

### **Fase 2: Grupos Navegam & Timer Conta (2-48 min)**

#### **O Timer em Tempo Real:**

```javascript
⏱️ CADA EQUIPA VÊ A ROOM COM O OBJETIVO NO TOPO:
   E NÃO VÊ timer (timer só é visível no Game Hub)
   - Foco total no desafio
   - Sem distrações de tempo

⏲️ NO GAME HUB (DASHBOARD), O FACILITADOR VÊ:
┌─────────────────────────────────────────────────────────┐
│  🎮 VISUAL ESCAPE ROOM                                  │
│  ▶️ Start Game  🔄 Reset                                │
│  ✅ Game started! Teams can now join rooms.             │
│                                                          │
│  ⏱️ 47m 33s (timer com cor dinâmica)                   │
│     🟢 50:00 a 16:40 (verde - na boa)                 │
│     🟡 16:40 a 05:00 (amarelo - aviso!)               │
│     🔴 05:00 a 00:00 (vermelho - APRESSA-TE!)         │
│                                                          │
│  🏆 LEADERBOARD                                         │
│  #1 🥇 Team Alpha      100 pts  🟢🟢🔘🔘              │
│      Room: Room 2 (Refactor) | Tempo: 2m 27s           │
│                                                          │
│  #2 🥈 Team Beta       100 pts  🟢🟢🔘🔘              │
│      Room: Room 2 (Refactor) | Tempo: 2m 34s           │
│                                                          │
│  #3 🥉 Team Gamma        0 pts  🔘🔘🔘🔘              │
│      Room: Room 1 (Archaeo) | Tempo: 5m 12s            │
└─────────────────────────────────────────────────────────┘

NOTA: Se dois grupos terminarem 4 rooms com mesmo score:
      → Tempo é fator de desempate!
      → Quem completou tudo mais RÁPIDO ganha! ⚡
```

### **Fase 3: Grupos Completam (48-50 min)**
┌──────────────────────────────────────────┐
│     Máquina do Grupo 1 (Room 1)           │
│  (browser em codefest-room1.web.app)      │
│                                           │
│  Quando clica "Mark Complete":            │
│  1. Envia POST /api/team/login            │
│  2. Firestore atualiza: teams/{groupId}   │
│  3. Score calculado automaticamente       │
│  4. Badges atualizadas em tempo real      │
└──────────────────────────────────────────┘
                    ▼
            ┌───────────────┐
            │   FIRESTORE   │
            │  (Centralizado)│
            └───────────────┘
                    ▼
┌──────────────────────────────────────────┐
│     Máquina do Facilitador                │
│  (browser aberto no Dashboard)            │
│  (https://codefestrooms-81695626.web.app)│
│                                           │
│  Vê em TEMPO REAL:                        │
│  - Grupo 1: Room 1 ✅ (100 pts)           │
│  - Grupo 2: Room 2 🧱 (em progresso)      │
│  - Grupo 3: Room 1 ✅ (100 pts)           │
│  - Leaderboard atualizado                 │
└──────────────────────────────────────────┘
```

## 🎯 Objetivos Claros por Room

Cada equipa vê isto no TOPO de cada Room assim que entra:

| Room | Emoji | Objetivo | Dica | Tempo | Complexidade |
|------|-------|----------|------|-------|--------------|
| 1 | 🏚️ | Encontra o bug de IVA | O desconto/shipping afetam taxa | 8-12 min | 🟢 Fácil |
| 2 | 🧱 | Refactoriza até Complexity ≤ 10 | Usa Copilot para explicar | 12-18 min | 🟡 Médio |
| 3 | 🔐 | Fixa vulnerabilidades de segurança | Procura XSS, SQL Injection | 12-18 min | 🟡 Médio |
| Final | 🏢 | Desenha arquitetura moderna | REST API + Docker + CI/CD | 10-15 min | 🔴 Difícil |

⏱️ **Tempo Total Recomendado:** 8+12+12+10 = **42 min** (deixa 8 min de buffer)

---

## 🏆 Pontuação & Desempate

---

## ✅ Sistema de Validação Automática

Cada room tem **validação automática** antes de permitir completação. Se o objetivo não foi cumprido, o botão "Mark Complete" mostra erro e bloqueia avanço.

### **Room 1: Arqueologia (IVA Bug - Automática)**

```
VALIDAÇÃO EXECUTADA AO CLICAR "MARK COMPLETE":
┌────────────────────────────────────────────────────┐
│ Executar fatura e verificar:                        │
│                                                     │
│ ✅ SUCESSO se:                                     │
│   • Base de imposto = 2250 EUR (exato)             │
│   • Imposto calculado = 517.50 EUR (23%)           │
│   • Total com imposto = 2767.50 EUR                │
│   • Bug FIXO: desconto e shipping não afetam taxa  │
│                                                     │
│ ❌ FALHA se:                                       │
│   • Base = 1800 (bug original: 2000-200=1800)     │
│   • Base = 2250+450 = 2700 (outro bug)            │
│   • Imposto ≠ 517.50                              │
│   • Código não foi modificado                       │
└────────────────────────────────────────────────────┘

FEEDBACK AO GRUPO:
┌────────────────────────────────────────────────────┐
│ ❌ Validação Falhou!                                │
│                                                     │
│ Base de imposto: 1800 EUR (esperado: 2250 EUR)    │
│                                                     │
│ 💡 Dica: O desconto e shipping estão a afetar      │
│    a base de cálculo! Revê a lógica.               │
│                                                     │
│ [← Voltar] [Tentar Novamente]                      │
└────────────────────────────────────────────────────┘
```

### **Room 2: Refactor Lab (Complexity - Automática)**

```
VALIDAÇÃO EXECUTADA AO CLICAR "MARK COMPLETE":
┌────────────────────────────────────────────────────┐
│ Rodar ESLint + Complexity Check:                    │
│                                                     │
│ ✅ SUCESSO se:                                     │
│   • Complexity Score ≤ 10 (medido por ESLint)      │
│   • Sem erros ESLint críticos                      │
│   • Código refatorizado (não é original)           │
│                                                     │
│ ❌ FALHA se:                                       │
│   • Complexity > 10                                 │
│   • Há erros ESLint não resolvidos                 │
│   • Código não foi modificado                       │
│   • Faltam comentários explicativos                │
└────────────────────────────────────────────────────┘

FEEDBACK AO GRUPO:
┌────────────────────────────────────────────────────┐
│ ❌ Validação Falhou!                                │
│                                                     │
│ 📊 Complexity: 12 (limite: 10)                     │
│ 🔴 ESLint errors: 3                                │
│                                                     │
│ 💡 Próximos passos:                                │
│   1. Roda: npm run lint --fix                      │
│   2. Refatora funções longas em funções menores    │
│   3. Tenta novamente!                              │
│                                                     │
│ [← Voltar] [Tentar Novamente]                      │
└────────────────────────────────────────────────────┘
```

### **Room 3: Security Vault (Vulnerabilidades - Automática)**

```
VALIDAÇÃO EXECUTADA AO CLICAR "MARK COMPLETE":
┌────────────────────────────────────────────────────┐
│ Rodar Security Scan:                                │
│                                                     │
│ ✅ SUCESSO se:                                     │
│   • SEM vulnerabilidades XSS (inputs sanitizados) │
│   • SEM SQL Injection (usar parameterized queries) │
│   • SEM hardcoded secrets                          │
│   • Headers de segurança presentes                 │
│   • CSRF tokens implementados                      │
│                                                     │
│ ❌ FALHA se:                                       │
│   • innerHTML() usado com dados não sanitizados   │
│   • Queries SQL construídas com concatenação      │
│   • API keys/passwords em código                  │
│   • Headers de segurança faltam                    │
└────────────────────────────────────────────────────┘

FEEDBACK AO GRUPO:
┌────────────────────────────────────────────────────┐
│ ❌ Validação Falhou!                                │
│                                                     │
│ 🔐 Vulnerabilidades encontradas:                   │
│   • XSS: linha 42 - innerHTML não sanitizado       │
│   • SQL Injection: linha 67 - string concatenation │
│                                                     │
│ 🛠️ Correções:                                      │
│   1. Usa textContent em vez de innerHTML           │
│   2. Usa prepared statements (?)                   │
│   3. Valida TUDO que vem do user                   │
│                                                     │
│ [← Voltar] [Tentar Novamente]                      │
└────────────────────────────────────────────────────┘
```

### **Final: Modernisation (Architecture - Semi-Automática)**

```
VALIDAÇÃO EXECUTADA AO CLICAR "MARK COMPLETE":
┌────────────────────────────────────────────────────┐
│ Verificar Arquitetura:                              │
│                                                     │
│ ✅ SUCESSO se:                                     │
│   • Dockerfile presente (e não vazio)              │
│   • docker-compose.yml presente                    │
│   • .github/workflows/ com CI/CD pipeline          │
│   • Diagrama de arquitetura (README ou file)       │
│   • REST API documentado (swagger/comments)        │
│   • Tests presentes (>5 test cases)                │
│                                                     │
│ ❌ FALHA se:                                       │
│   • Ficheiro Dockerfile falta ou está vazio        │
│   • Sem docker-compose                             │
│   • Sem CI/CD workflow                             │
│   • Sem documentação de arquitetura                │
└────────────────────────────────────────────────────┘

FEEDBACK AO GRUPO:
┌────────────────────────────────────────────────────┐
│ ❌ Validação Falhou!                                │
│                                                     │
│ ✅ Tem:                                            │
│   • Dockerfile                                     │
│   • docker-compose.yml                             │
│   • 12 tests                                       │
│                                                     │
│ ❌ Falta:                                          │
│   • .github/workflows/ (CI/CD)                     │
│   • Diagrama de arquitetura no README              │
│                                                     │
│ 🎯 Ação: Cria workflow GitHub Actions ou escreve  │
│    diagrama ASCII no README                        │
│                                                     │
│ [← Voltar] [Tentar Novamente]                      │
└────────────────────────────────────────────────────┘
```

---

## 🔧 Como Funciona Tecnicamente (Para Devs)

Cada room tem folder `validation/` com scripts:

```
/rooms/room1-archaeology/
  /src/
  /test/
  /validation/
    validate.js        ← Script de validação
    checkIVA.js        ← Lógica específica IVA
```

Quando grupo clica "Mark Complete":
1. Frontend chama: `await validateRoom(roomId, code)`
2. Backend executa arquivo `/validation/validate.js`
3. Retorna: `{ valid: true/false, message: "", errors: [] }`
4. Frontend mostra resultado (OK ou lista de erros)
5. Se valid=true: Envia para Firestore `teams/{teamId}/completedRooms`
6. Leaderboard atualiza automaticamente

**Firestore Regra:**
```javascript
// Não deixa atualizar scores manualmente - só via validação
match /teams/{teamId}/completedRooms {
  allow write: if request.auth != null && 
               request.resource.data.validatedAt != null;
}
```

---

## 🎮 O Papel do Facilitador

### **1. PRÉ-EVENTO**
- ✅ Deploy para Firebase (`npm run firebase:deploy:all`)
- ✅ Testar URLs em incógnito (sem cache)
- ✅ Preparar QR codes ou lista de URLs
- ✅ Garantir que Firestore está ativo (sem regras restritivas)

### **2. DURANTE O EVENTO** 
- ✅ Mantém Game Hub (Dashboard) aberto: `https://codefestrooms-81695626.web.app`
- ✅ Monitora leaderboard em tempo real
- ✅ Presta atenção em grupos "stuck":
  - Se alguém não consegue a Room 1 em 10 min → dar dica
  - Se alguém clicou "Mark Complete" sem fazer nada → avisar
- ✅ Anuncia marcos (ex: "Team Alpha terminou Room 1! 🎉")
- ✅ Se alguém tem erro (browser/conexão):
  - Pede refresh (Ctrl+Shift+R)
  - Verifica internet
  - Tenta de novo

### **3. PÓS-EVENTO**
- ✅ Leaderboard final está pronto no Dashboard
- ✅ Anuncia top 3
- ✅ Recolher feedback (que partes foram legais?)
- ✅ Opcional: exportar scores

---

## 📊 Monitorização em Tempo Real

### **O Que o Facilitador Vê no Game Hub (Dashboard)**

```
https://codefestrooms-81695626.web.app

┌────────────────────────────────────────────────┐
│         🎮 VISUAL ESCAPE ROOM LEADERBOARD        │
│                                                 │
│  ⏱️ 42m 15s  (timer global, visível SÓ aqui)    │
│                                                 │
│  🏆 RANKING (atualizado a cada 3 segundos)      │
│                                                 │
│  #1 🥇 Team Alpha        450 pts  🟢🟢🟢🔘     │
│      Room: Final (Last seen: 2min atrás)       │
│      Status: Em progresso                       │
│                                                 │
│  #2 🥈 Team Beta         400 pts  🟢🟢🔘🔘     │
│      Room: Room 3 (Last seen: 30s atrás)       │
│      Status: Em progresso                       │
│                                                 │
│  #3 🥉 Team Gamma        100 pts  🟢🔘🔘🔘     │
│      Room: Room 1 (Last seen: 5min atrás)      │
│      Status: Em progresso (ou Stuck?)          │
│                                                 │
│  #4 💾 Team Delta          0 pts  🔘🔘🔘🔘     │
│      Room: Room 1 (Nunca entrou?)             │
│      Status: Não iniciou                       │
│                                                 │
├────────────────────────────────────────────────┤
│ Refresh automático: ✅ | Último update: 2s atrás│
└────────────────────────────────────────────────┘
```

---

## 🚨 Troubleshooting para Facilitador

### **Cenário 1: Um Grupo Não Consegue Aceder**

```
GRUPO: "Não conseguimos abrir o URL"

FACILITADOR:
1. Verifica Internet: ping google.com
2. Verifica URL: Copiou corretamente?
3. Tenta Incógnito (sem cache)
4. Se Firebase está atualizado:
   $ npm run firebase:deploy:all
5. Aguarda 30s e tenta novamente (propagação DNS)
```

### **Cenário 2: Leaderboard Não Atualiza**

```
FACILITADOR: "Vi que clicaram Mark Complete mas score não subiu"

Possíveis Causas:
1. Browser: Ctrl+Shift+R (hard refresh da página)
2. Firebase Rules:
   $ firebase deploy --only firestore:rules
3. Verificar logs: 
   $ firebase functions:log

Nota: Com Firebase Hosting, tudo é serverless.
Não há "servidor próprio" para monitorar.
Só Firestore + CDN.
```

### **Cenário 3: Um Grupo Clicou "Mark Complete" Mas Não Fez o Desafio**

```
FACILITADOR: Ve a pontuação de um grupo muito rápido

Opções:
1. Pedir ao grupo: "Verifica se completaste mesmo?"
2. Ir para a sala e verificar código
3. Se foi erro: 
   - Acessar Firestore Console
   - Editar: teams/{teamId}/completedRooms
   - Remover "room1" manualmente
   - Score atualiza automaticamente

Firebase Console:
https://console.firebase.google.com/project/codefestrooms-81695626
```

---

## 🔐 Segurança & Regras Firestore

### **IMPORTANTE: Ativar Regras antes do Evento**

```javascript
// firestore.rules - PRODUÇÃO

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Leaderboard público (todos podem ler)
    match /teams/{teamId} {
      allow read: if true;
      // APENAS app pode escrever (via Cloud Function)
      allow write: if false;
    }
  }
}
```

**Deploy:**
```powershell
firebase deploy --only firestore:rules
```

---

## ⏱️ Timeline Recomendada (60 min)

| Tempo | Ação | O Que Monitar |
|-------|------|--------------|
| 0-5 min | Kickoff + Grupos entram | Que grupos já aparecem no Dashboard |
| 5-10 min | Room 1 (Arqueologia) | Badges começam a ficar verdes |
| 10-25 min | Room 2 (Refactor) | Verificar se alguém travou em Room 1 |
| 25-40 min | Room 3 (Security) | Top groups já alcançando 300+ pts |
| 40-55 min | Final Room | Quem consegue 600 pts? |
| 55-60 min | Anúncio Top 3 | Leaderboard final consolidado |

---

## 📱 URLs para Partilhar com Grupos

### **QR Code (gerador grátis: qr-server.com)**

```
Game Hub:
https://qr-server.com/api/qr?size=300x300&data=
https://codefestrooms-81695626.web.app

Room 1:
https://qr-server.com/api/qr?size=300x300&data=
https://codefest-room1.web.app
```

### **Ou Simplesmente:**
```
Coloca num slide:

🎮 VISUAL ESCAPE ROOM

Game Hub: https://bit.ly/escape-hub
Room 1:   https://bit.ly/escape-r1
Room 2:   https://bit.ly/escape-r2
Room 3:   https://bit.ly/escape-r3
Final:    https://bit.ly/escape-final

Ou:
Game Hub:  https://codefestrooms-81695626.web.app
```

```
COMO FUNCIONA A PONTUAÇÃO:

1️⃣ CRITÉRIO PRIMÁRIO: Quantas rooms completaram?
   Team A: 3 rooms ✅✅✅
   Team B: 3 rooms ✅✅✅
   Team C: 2 rooms ✅✅
   
   👉 Teams A e B estão EMPATADAS!

2️⃣ CRITÉRIO SECUNDÁRIO: Tempo de conclusão
   Team A completou tudo em 38 minutos
   Team B completou tudo em 41 minutos
   
   🏆 Team A GANHA (terminou mais rápido!)

3️⃣ EXEMPLO FINAL:

   Dashboard mostra:
   
   #1 🥇 Team Alpha      400 pts  ⏱️ 38m 23s
       4 rooms completadas em 38m 23s
   
   #2 🥈 Team Beta       400 pts  ⏱️ 41m 05s
       4 rooms completadas em 41m 05s
   
   #3 🥉 Team Gamma      300 pts  ⏱️ 48m 40s
       3 rooms completadas em 48m 40s
```

---

## 🎮 Passo a Passo Concreto

### **Antes do Evento**
- [ ] Deploy para Firebase completado
- [ ] Testar URLs em incógnito
- [ ] Preparar QR codes / URLs
- [ ] Firestore Rules atualizadas
- [ ] Dashboard pronto para monitorização
- [ ] Intervalo tem wifi / internet?

### **Depois da Abertura**
- [ ] Todos os grupos conseguem aceder
- [ ] Nomes aparecem no Dashboard
- [ ] Scores começam a atualizar

### **Durante o Evento**
- [ ] Dashboard constantemente monitorizado
- [ ] Anotar grupos "stuck" após 10 min
- [ ] Dar dicas se pedido

### **No Final**
- [ ] Leaderboard congelado
- [ ] Screenshot score final para registos
- [ ] Anuncia top 3
- [ ] Pedir feedback

---

## 📞 Contacto & Dúvidas

Se algo não funcionar:
1. **Browser issue**: Limpar cache, incógnito, F5, Ctrl+Shift+R
2. **Firebase issue**: Verificar Status de Services em console.firebase.google.com
3. **Scores não atualizam**: Forçar refresh de todas as páginas abertas
4. **Grupo avança sem completar**: Abrir Firestore Console e revistar dados

