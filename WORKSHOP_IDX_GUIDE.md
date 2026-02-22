# 🎮 Visual Escape Room — Workshop com Google IDX + Gemini

## 🚀 Guia Rápido para Equipas

Bem-vindo! Este é um workshop onde vais **resolver desafios de código** com ajuda de **Gemini AI** (integrado no Google IDX).

---

## ⚡ Setup Rápido (5 minutos)

### **Passo 1: Abre Google IDX**

Abre no teu browser:
```
https://idx.google.com
```

Clica em **"Create new workspace"**

### **Passo 2: Clone o Repositório**

Na prompt ("Enter your git URL or select a template"):

```
https://github.com/aapais/EscapeRooms.git
```

_(Se não sabes o URL exato, pede ao facilitador)_

**Clica: "Create Workspace"**

**⏳ Aguarda 1-2 minutos...**

IDX vai:
- ✅ Clonar o repo
- ✅ curl https://us-central1-codefestrooms-487913.cloudfunctions.net/api/state
- ✅ Preparar ambiente

### **Passo 3: Inicia os Servidores**

Quando estiver pronto, no **Terminal do IDX** (abaixo), executa:

```bash
npm run start:all
```

**Aguarda 30 segundos...**

Vais ver algo tipo:
```
✓ Game Hub running at port 4000
✓ Room 1 listening on port 3000
✓ Room 2 listening on port 3002
✓ Room 3 listening on port 3003
✓ Final Room listening on port 8080
```

### **Passo 4: Abre a Aplicação**

IDX vai mostrar uma notificação tipo:
```
Port 4000 detected
[Open in IDE] [Open in Browser]
```

Clica em **"Open in Browser"** (ou **porta 4000**)

**🎉 Estás pronto!**

---

## 🎯 Como Começar o Jogo

### **1. Regista a Tua Equipa**

Na página que se abriu:
1. Vê um input "Team Name"
2. Escreve o **nome da tua equipa** (ex: "Dragon Slayers")
3. Clica **"Join"**

**Agora estás ligado ao leaderboard!** 🏆

### **2. Vê o Objetivo**

Na página vês o **objetivo da Room 1** no topo:

```
🏚️ Arqueologia de Código
Objetivo: Encontra o bug de IVA
Dica: O desconto e shipping afetam a base de cálculo do imposto
```

---

## 💬 Como Usar Gemini (O Segredo!)

### **Abrir Gemini Chat**

No IDX, do lado **esquerdo**, vês um painel com abas. Procura por:
- 🤖 Ícone de Chat ou **"Gemini"**

Clica ali.

### **Fazer uma Pergunta ao Gemini**

Escreve no chat (campo em baixo):

#### **Exemplo 1: Entender o Código**
```
@workspace Explica o cálculo de IVA em legacyService.js
```

Gemini vai:
- ✅ Analisar o ficheiro
- ✅ Explicar o que cada parte faz
- ✅ Mostrar o bug!

#### **Exemplo 2: Pedir Ajuda para Refactor**
```
@workspace Refactor a função invoiceEngine para reduzir complexidade. 
Dá-me um exemplo de como extrair métodos.
```

#### **Exemplo 3: Entender um Erro**
```
@workspace Porque é que este teste falha? 
Qual é o erro em security.js?
```

### **💡 Pro Tips:**

- ✅ Usa `@workspace` para Gemini analisar **TODOS** os ficheiros do projeto
- ✅ Usa `@file filename.js` para focar num ficheiro específico
- ✅ Copia a sugestão do Gemini → cola no código → guarda (`Ctrl+S`)
- ✅ A cada mudança, roda `npm test` para validar

---

## 🧪 Resolver uma Room (Passo a Passo)

### **Room 1 — Archaeology (🏚️)**

**Objetivo:** Encontra e explica o bug de IVA

**Passos:**

1. **Lê o objetivo** (no topo da página)
2. **Abre Gemini Chat** (botão 🤖 no IDX)
3. **Pede ajuda:**
   ```
   @workspace Onde está o bug no cálculo de IVA?
   ```
4. **Gemini explica** → vês o bug
5. **Edita o ficheiro** (`src/legacyService.js`)
   - Clica no ficheiro no explorador
   - Faz a correção
   - Guarda (`Ctrl+S`)
6. **Roda teste:**
   ```bash
   npm test
   ```
   Se passar ✅ → continua
7. **Volta ao Game Hub** → clica **"Mark Complete"**
8. **Firebase atualiza** → vês na leaderboard: +100 pts! 🏆

**Nota:** Só consegues avançar para a sala seguinte depois de **"Mark Complete"**. Em algumas salas, o botão só fica ativo após validação local (ex: complexidade ou ACCESS GRANTED).

---

### **Room 2 — Refactor Lab (🧱)**

**Objetivo:** Reduz a complexidade do código a ≤ 10

**Passos:**

1. **Lê o objetivo**
2. **Pede ao Gemini:**
   ```
   @workspace O código em src/invoiceEngine.js tem complexidade alta.
   Como posso refactor para reduzir os if/else?
   ```
3. **Gemini sugere** → refactors
4. **Edita o ficheiro**
5. **Verifica complexidade:**
   ```bash
   npm run complexity
   ```
   Se for ≤ 10 ✅ → próximo passo
6. **Roda teste:**
   ```bash
   npm test
   ```
7. **Clica "Mark Complete"** no Game Hub → +150 pts 🏆

---

### **Room 3 — Security Vault (🔐)**

**Objetivo:** Encontra/corrige a vulnerabilidade SQL Injection

**Passos:**

1. **Lê o objetivo**
2. **Pede ao Gemini:**
   ```
   @workspace Há uma vulnerabilidade de SQL injection aqui?
   Onde está e como corrijo?
   ```
3. **Edita** o código vulnerável
4. **Testa:**
   ```bash
   npm test
   ```
5. **Mark Complete** → +150 pts 🏆

---

### **Room Final — Modernisation (🏢)**

**Objetivo:** Integra tudo e moderniza a aplicação

**Passos:**

1. **Lê o objetivo**
2. **Pede ao Gemini:**
   ```
   @workspace Como melhor modernizar este monolith?
   Quais são os próximos passos?
   ```
3. **Segue sugestões** → refactors
4. **Testes devem passar:**
   ```bash
   npm test
   ```
5. **Mark Complete** → +200 pts 🏆

---

## 📊 Acompanhar o Progresso

### **Leaderboard (em tempo real)**

Na página do Game Hub, vês a tabela com:
- 🥇 **Rank** (1º, 2º, 3º...)
- 👥 **Team Name**
- 🎯 **Pontos** (100, 250, 400...)
- ⏱️ **Tempo** (quanto tempo a equipa levou)
- 🔴 🟢 **Badges** (quais rooms completou)

Está **sincronizado com Firebase** — actualiza a cada 3 segundos!

---

## ⏱️ O Timer

**Na página do Game Hub:**
- ⏱️ Vês um relógio grande com o tempo restante
- 🟢 **Verde** (> 16m) — estás relaxado
- 🟡 **Amarelo** (16m-5m) — começa a ficar apertado!
- 🔴 **Vermelho** (< 5m) — **APRESSA-TE!**

Quando o facilitador clica "START GAME", o timer começa em **TODAS as máquinas ao mesmo tempo**.

---

## 🆘 Troubleshooting

### **Problema: "Port 4000 not available"**

Significa que há outro serviço naquela porta.

**Solução:**
```bash
# Terminal do IDX
npm run stop:all
npm run start:all
```

Ou muda a porta no `.env`:
```
PORT=5000
```

---

### **Problema: "Cannot find module `xyz`"**

Significa que faltam dependências.

**Solução:**
```bash
npm install
```

Aguarda que IDX atualiza automaticamente.

---

### **Problema: "Gemini não consegue analisar o código"**

Significa que talvez não estejam a usar `@workspace`.

**Solução:**
```
Tenta: @workspace Explica este ficheiro
```

Não esqueças o `@workspace` — é essential!

---

### **Problema: "Teste falha com erro estranho"**

**Solução 1:** Lê a mensagem do erro com cuidado
```bash
npm test 2>&1 | head -50
```

**Solução 2:** Pede ao Gemini:
```
O meu teste falha com este erro: [COPIA O ERRO]
Como corrijo?
```

---

## 📋 Checklist (Antes de Começar)

Certifica-te que tens:

- ✅ Conta Google (para IDX)
- ✅ Browser atualizado (Chrome, Firefox, Edge, Safari)
- ✅ Internet estável
- ✅ Acesso a `https://idx.google.com`
- ✅ Acesso a GitHub.com

---

## 🎓 Dicas Avançadas

### **Gemini + Copilot Thinking Mode** (se necessário)

Se o Gemini aparenta estar "preguiçoso", tenta:
```
Continue a pensar no problema anterior. Dá-me 3 soluções diferentes.
```

---

### **Gravar o Código Automaticamente**

IDX guarda mudanças **automaticamente** — não precisas de `Ctrl+S` sempre, mas é bom praticar!

---

### **View Historico de Commits**

Se quebraste algo, podes fazer rollback:

No terminal:
```bash
git status
git diff
git checkout src/filename.js  # Reverter 1 ficheiro
```

---

### **Pesquisar num Ficheiro Grande**

IDX tem Find integrado:
```
Ctrl+F → escreve texto → Enter
```

---

## 🎉 Quando Completares Tudo

1. **Todas as 4 rooms completas** ✅
2. **Firebase regista o tempo** ⏱️
3. **Leaderboard atualiza** 🏆
4. **Tu vês o teu rank** 🥇/🥈/🥉

**Parabéns!** 🎊

---

## 📞 Ajuda

Se ficares preso:

1. **Pede ao Gemini** 💬
   ```
   @workspace Estou preso aqui. Ajuda-me a entender isto.
   ```

2. **Levanta a mão** — facilitador vem ajudar ✋

3. **Lê o README da room** (em `rooms/room-X/README.md`)

---

## 🚀 Links Rápidos

- 🎮 **Game Hub:** `http://localhost:4000`
- 🏚️ **Room 1:** `http://localhost:3000`
- 🧱 **Room 2:** `http://localhost:3002`
- 🔐 **Room 3:** `http://localhost:3003`
- 🏢 **Room Final:** `http://localhost:8080`

---

**Good luck! Que a força (e o Gemini) estejam contigo! 🚀**

_(Versão: 1.0 — Workshop 2026)_
