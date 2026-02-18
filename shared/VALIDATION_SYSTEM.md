# 🎮 Sistema de Validação de Transição Entre Quartos

## Visão Geral

Este sistema garante que os equipas só podem progredir para o próximo quarto após completar com sucesso o objetivo do quarto atual. Funciona em duas camadas:

1. **Validação de Objetivo**: Cada quarto valida se o código/solução cumpre o objetivo
2. **Validação de Transição**: O sistema impede navegação para qualquer quarto não completado

## Arquitetura

### Classes Principais

#### 1. `RoomValidator` (Base Class)
Classe base para criar validadores de sala específicos.

```javascript
// Herdar desta classe
class MyRoomValidator extends RoomValidator {
  constructor() {
    super('my-room-id'); // ID único do quarto
  }

  async validate(submissionData) {
    // Implementar lógica de validação
    // Deve retornar { valid, status, errors, warnings, metadata }
  }
}
```

**Métodos úteis:**
- `addError(message, details)` - Adicionar erro crítico
- `addWarning(message, details)` - Adicionar aviso (não bloqueia progresso)
- `formatResult()` - Formatar resultado para UI
- `checkSecurityPatterns(code)` - Verificar vulnerabilidades
- `measureComplexity(code)` - Medir complexidade do código
- `codeContains(code, patterns)` - Verificar padrões de código

#### 2. `RoomTransitionValidator` (Manager)
Gerencia o fluxo de progressão entre quartos.

```javascript
const transitionValidator = new RoomTransitionValidator();

// Verificar se pode progreddir
const check = transitionValidator.canProgressToRoom(teamId, 'room2-refactor-lab');
if (!check.canProgress) {
  console.log(check.reason); // "❌ Primeiro completa a sala anterior..."
}

// Marcar quarto como completo
transitionValidator.markRoomCompleted(teamId, roomId, validationResult);

// Obter progresso
const progress = transitionValidator.getTeamProgress(teamId);
console.log(progress.progressPercentage); // 25%, 50%, 75%, 100%
```

## Fluxo de Funcionamento

### 1. Equipa entra num quarto

```
GET /api/team/:teamId/progress
↓
Retorna status de cada quarto (locked, available, completed)
```

### 2. Equipa submete solução

```
POST /api/team/progress
{
  teamId: 'team-a',
  room: 'room1-archaeology',
  validationResult: { /* resultado do validador */ }
}
↓
Sistema valida resultado
↓
Se válido: marca quarto como completo
Se inválido: pede para tentar novamente
```

### 3. Equipa tenta avançar

```
POST /api/team/navigate
{
  teamId: 'team-a',
  targetRoom: 'room2-refactor-lab'
}
↓
Sistema verifica se 'room1' está completo
↓
Se sim: permite navegação
Se não: retorna erro com explicação
```

## Estrutura de Dados

### Objective Data (por quarto)

```javascript
{
  'room1-archaeology': {
    name: '🏺 Arqueologia de Código',
    objective: 'Encontrar e corrigir bug de IVA',
    description: 'Formula: base = (price - discount + shipping)',
    completionCriteria: ['ivaCalculationFixed', 'explanationProvided'],
    points: 100
  },
  // ... outros quartos
}
```

### Progress Data (por equipa)

```javascript
{
  teamId: 'team-a',
  currentRoom: 'room2-refactor-lab',
  totalPoints: 250,
  completedCount: 2,
  totalCount: 4,
  progressPercentage: 50,
  rooms: [
    {
      id: 'room1-archaeology',
      name: '🏺 Arqueologia de Código',
      status: 'completed',
      points: 100,
      isCurrent: false
    },
    {
      id: 'room2-refactor-lab',
      name: '🔧 Laboratório de Refatorização',
      status: 'available',
      points: 150,
      isCurrent: true
    },
    {
      id: 'room3-security-vault',
      status: 'locked', // Não pode aceder
      locked: true
    }
  ]
}
```

## Endpoints da API

### 1. Obter Objetivos de Todos os Quartos

```
GET /api/rooms/objectives

Response:
{
  ok: true,
  objectives: [
    {
      position: 1,
      id: 'room1-archaeology',
      name: '🏺 Arqueologia de Código',
      objective: 'Encontrar e corrigir bug de IVA',
      points: 100
    },
    // ... outros quartos
  ],
  totalRooms: 4
}
```

### 2. Obter Progresso da Equipa

```
GET /api/team/:teamId/progress

Response:
{
  ok: true,
  teamId: 'team-a',
  teamName: 'Team Alpha',
  score: 250,
  progress: { /* estrutura acima */ },
  isComplete: false,
  gameStatus: 'in-progress'
}
```

### 3. Submeter Solução com Validação

```
POST /api/team/progress

Body:
{
  teamId: 'team-a',
  room: 'room1-archaeology',
  score: 100,
  completed: true,
  validationResult: {
    valid: true,
    status: 'success',
    errors: [],
    warnings: [],
    metadata: {
      requirements: { bugFixed: true, explanationProvided: true },
      points: 100,
      completionTime: 1245000
    }
  }
}

Response:
{
  ok: true,
  team: { /* updated team data */ },
  sessionMessage: '✅ Sala room1-archaeology completada!',
  nextRoomHint: {
    nextRoom: 'room2-refactor-lab',
    name: '🔧 Laboratório de Refatorização',
    objective: 'Refatorizar código para seguir boas práticas',
    points: 150,
    message: '🔜 Próxima sala disponível...'
  }
}
```

### 4. Navegar para Quarto (com Validação)

```
POST /api/team/navigate

Body:
{
  teamId: 'team-a',
  targetRoom: 'room2-refactor-lab'
}

Success Response (200):
{
  ok: true,
  team: { /* updated team data */ },
  message: '✅ Bem-vindo a 🔧 Laboratório de Refatorização!',
  nextRoomHint: { /* hints */ }
}

Blocked Response (403):
{
  error: 'Cannot progress to this room',
  reason: '❌ Primeiro completa a sala anterior: "Arqueologia de Código"',
  blockedBy: 'room1-archaeology',
  currentRoom: 'room1-archaeology'
}
```

## Como Criar um Validador de Sala

### Passo 1: Estender RoomValidator

```javascript
// rooms/room2-refactor-lab/server/validator.js

const { RoomValidator } = require('../../../shared/validation.js');

class Room2Validator extends RoomValidator {
  constructor() {
    super('room2-refactor-lab');
    this.roomName = '🔧 Laboratório de Refatorização';
  }

  async validate(submissionData) {
    this.status = 'validating';
    this.errors = [];
    this.warnings = [];

    // Suas validações aqui
    // ...

    return this.formatResult();
  }
}

module.exports = Room2Validator;
```

### Passo 2: Implementar Validações Específicas

```javascript
async validate(submissionData) {
  // 1. Verificações básicas
  if (!submissionData.code) {
    this.addError('Código não fornecido');
    return this.formatResult();
  }

  // 2. Validações de negócio (específicas do quarto)
  const refactoringChecks = this._checkRefactoring(submissionData.code);
  if (!refactoringChecks.improved) {
    this.addError('Código não foi refatorizado', {
      suggestion: 'Considera: nomes de vars, duplicação, complexidade'
    });
  }

  // 3. Validações de qualidade/segurança (base class)
  const securityIssues = this.checkSecurityPatterns(submissionData.code);
  if (securityIssues.length > 0) {
    securityIssues.forEach(issue => {
      this.addError(`Vulnerabilidade: ${issue.message}`);
    });
  }

  // 4. Resultado final
  if (this.errors.length === 0) {
    this.status = 'success';
  }

  return this.formatResult();
}
```

### Passo 3: Testar Validador

```javascript
const validator = new Room2Validator();

const result = await validator.validate({
  code: `
    function calculateTotal(items) {
      let total = 0;
      for (let i = 0; i < items.length; i++) {
        total += items[i].price;
      }
      return total;
    }
  `,
  explanations: 'Refatorizado com reduce() para melhor performance'
});

console.log(result);
// {
//   valid: boolean,
//   status: 'success' | 'failure',
//   errors: [],
//   suggestions: []
// }
```

## Estados dos Quartos

Cada quarto pode estar em um destes estados:

| Estado | Descrição |
|--------|-----------|
| `available` | Equipa pode entrar e tentar |
| `completed` | Equipa completou com sucesso |
| `locked` | Equipa ainda não completou o anterior |
| `current` | Equipa está atualmente neste quarto |

## Mensagens de Erro Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Primeiro completa a sala anterior" | Tentou aceder anterior incompleto | Completa o quarto anterior |
| "Sala não existe" | ID de quarto inválido | Verifica ID do quarto |
| "Validação falhou" | Solução não cumpre objetivos | Lê feedback e tenta novamente |

## Exemplo Completo (Frontend)

```javascript
class RoomUI {
  async submitSolution(code, explanation) {
    // 1. Validar localmente
    const validator = new MyRoomValidator();
    const validationResult = await validator.validate({
      code,
      explanation
    });

    // 2. Mostrar feedback
    this.showValidationFeedback(validationResult);

    // 3. Se passou, enviar para backend
    if (validationResult.valid) {
      const response = await fetch('/api/team/progress', {
        method: 'POST',
        body: JSON.stringify({
          teamId: localStorage.getItem('teamId'),
          room: 'room1-archaeology',
          completed: true,
          validationResult
        })
      });

      const data = await response.json();
      
      // 4. Mostrar progresso
      this.updateProgress(data.nextRoomHint);
    }
  }

  async navigateToRoom(roomId) {
    // 1. Verificar se pode navegar
    const response = await fetch('/api/team/navigate', {
      method: 'POST',
      body: JSON.stringify({
        teamId: localStorage.getItem('teamId'),
        targetRoom: roomId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      this.showError(error.reason); // "❌ Primeiro completa..."
      return;
    }

    // 2. Navegar se permitido
    const data = await response.json();
    window.location.href = `/rooms/${roomId}`;
  }
}
```

## Debug & Administration

### Resetar Progresso (Admin)

```javascript
// Apenas para desenvolvimento - no gamemaster.js
app.post('/api/admin/reset/:teamId', (req, res) => {
  const result = transitionValidator.resetTeamProgress(req.params.teamId);
  res.json(result);
});
```

### Verificar Estado

```
GET /api/leaderboard

Mostra todas as equipas com:
- currentRoom
- completedRooms
- score
- progressPercentage
```

## Próximos Passos

1. ✅ Sistema de validação base implementado
2. ✅ Sistema de transição implementado
3. 📝 Integrar em cada quarto específico
4. 📝 Adicionar UI feedback
5. 📝 Testar fluxo completo
6. 📝 Dashboard admin

---

**Sistema criado em:** 17 de Fevereiro de 2026
**Estado:** Pronto para integração nos quartos individuais
