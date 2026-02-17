# 🚀 Guia de Execução no Google IDX

Este guia explica como executar e testar o Visual Escape Room no **Google IDX**.

## ⚡ Início Rápido

### Opção 1: Iniciar Tudo de Uma Vez (Recomendado para IDX)

```bash
npm install
npm run start:all
```

Este comando inicia automaticamente:
- 🎮 Game Hub (porta 4000)
- 🏺 Room 1 - Archaeology
- 🔧 Room 2 - Refactor Lab
- 🔒 Room 3 - Security Vault
- 🚀 Final Room - Modernisation

### Opção 2: Iniciar Serviços Manualmente

Se preferires controlo individual, abre múltiplos terminais:

**Terminal 1 - Game Hub:**
```bash
npm run start:hub
```

**Terminal 2 - Room 1:**
```bash
npm run start:room1
```

**Terminal 3 - Room 2:**
```bash
npm run start:room2
```

**Terminal 4 - Room 3:**
```bash
npm run start:room3
```

**Terminal 5 - Final Room:**
```bash
npm run start:final
```

## 🌐 Aceder à Aplicação no Google IDX

### Port Forwarding Automático

Quando os servidores iniciarem, o Google IDX vai detectar as portas e oferecer opções:

1. **Port 4000** → 🎮 **Game Hub** (Interface Principal)
   - Clica em "Open in Editor" ou "Open in Browser"
   - Esta é a interface onde vais jogar

2. **Port 3001+** → Room APIs (usado internamente)

### Preview da Aplicação

1. Procura o ícone **"Ports"** ou **"Preview"** no IDX
2. Seleciona a **porta 4000**
3. Escolhe **"Open in new tab"** para melhor experiência

## 🎮 Como Jogar e Testar Validações

### 1. Regista uma Equipa

Na interface do Game Hub:
- Introduz um **nome de equipa**
- Clica em **"Registar"** ou **"Join Game"**

### 2. Testa o Sistema de Validação de Transição

O sistema de validação implementado vai:

✅ **Permitir** acesso ao **Room 1** (ponto de partida)

❌ **Bloquear** acesso ao **Room 2** até completares Room 1
- Tenta clicar no Room 2 → deverás ver uma mensagem de bloqueio
- Exemplo: *"🔒 Deves completar room1-archaeology primeiro!"*

❌ **Bloquear** Room 3 até completares Room 2

❌ **Bloquear** Final Room até completares Room 3

### 3. Completa os Desafios

Para desbloquear cada quarto, os testes devem passar:

```bash
# Verifica Room 1
npm run room1

# Verifica Room 2
npm run room2

# Verifica Room 3
npm run room3

# Verifica Final Room
npm run final
```

Quando os testes **passarem** ✅, o sistema marca o quarto como completo e **desbloqueia o próximo**.

## 🔍 Debug e Monitorização

### Ver Logs em Tempo Real

1. **Consola do Browser** (F12 ou Ctrl+Shift+I)
   - Tab **Console** → mensagens de validação
   - Tab **Network** → chamadas API

2. **Terminal do IDX**
   - Vê os logs dos servidores
   - Mensagens de validação aparecem aqui:
     ```
     ✅ Room transition validated: room1 → room2
     ❌ Blocked transition: room1 → room3 (prerequisites not met)
     ```

### Testar Manualmente a API

Podes testar a API de validação diretamente:

```bash
# Registar equipa
curl -X POST http://localhost:4000/api/team/register \
  -H "Content-Type: application/json" \
  -d '{"teamName": "TestTeam"}'

# Tentar completar room
curl -X POST http://localhost:4000/api/team/progress \
  -H "Content-Type: application/json" \
  -d '{"teamName": "TestTeam", "room": "room1", "action": "complete", "points": 100}'

# Tentar navegar (deve bloquear se não completou anterior)
curl -X POST http://localhost:4000/api/team/progress \
  -H "Content-Type: application/json" \
  -d '{"teamName": "TestTeam", "room": "room3", "action": "navigate"}'
```

## 🎯 Fluxo de Teste Completo

1. **Inicia todos os serviços**: `npm run start:all`
2. **Abre o Game Hub**: Port 4000 no browser
3. **Regista uma equipa**: Ex: "TestTeam"
4. **Verifica bloqueios**:
   - ✅ Room 1 está acessível
   - ❌ Room 2/3/Final estão bloqueados
5. **Completa Room 1**: `npm run room1` até passar
6. **Marca como completo** na interface
7. **Verifica desbloqueio**:
   - ✅ Room 2 agora acessível
   - ❌ Room 3/Final ainda bloqueados
8. **Repete** para os restantes quartos

## 🐛 Resolução de Problemas

### Porta já em uso
```bash
# Matar processos nas portas
npx kill-port 4000 3001 3002 3003 3004
```

### Restart limpo
```bash
# Ctrl+C para parar todos os serviços
# Depois:
npm run start:all
```

### Dependências em falta
```bash
npm install
npm install -ws
```

### Ver portas abertas no IDX
Usa o painel **"Ports"** no Google IDX para ver todas as portas forwarded.

## 📊 Leaderboard

O leaderboard atualiza em tempo real via WebSocket:
- Mostra posição de cada equipa
- Score acumulado
- Quartos completados
- Último update

## 🔐 Sistema de Validação

O sistema implementado em [`shared/validation.js`](shared/validation.js) garante:

1. **Validação de pré-requisitos**: Não podes saltar quartos
2. **Validação de objetivos**: Cada quarto tem critérios específicos
3. **Ordem sequencial**: room1 → room2 → room3 → final
4. **Estado persistente**: O progresso é mantido durante a sessão

## 💡 Dicas para Google IDX

- ✅ Usa `npm run start:all` para simplicidade
- ✅ Abre o browser preview numa **nova tab** (não no painel)
- ✅ Usa **múltiplos terminais** se quiseres controlo individual
- ✅ Verifica o painel **"Ports"** para URLs de preview
- ✅ Recarrega a página se a conexão WebSocket cair

---

🎉 **Boa diversão a testar o Visual Escape Room no Google IDX!**
