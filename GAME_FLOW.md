# 🎮 Game Flow - Visual Escape Room (Firebase)

## ✅ Tudo Pronto para 50 Minutos!

Tens **múltiplas equipas em máquinas diferentes** tudo sincronizado em Firebase:

```
┌─────────────────────────────────────────────────────────────┐
│                FACILITADOR (Game Hub - Dashboard)            │
│          https://codefestrooms-81695626.web.app             │
│                                                              │
│  Button: "▶️ START GAME (50m)"  --------> Inicia TUDO       │
│                     ▼                                        │
│  ⏱️ TIMER 50:00 (🟢 verde)                                  │
│  └─ Muda cor: 🟡 amarelo em 16m, 🔴 vermelho em 5m        │
│                                                              │
│  🏆 LEADERBOARD LIVE                                        │
│  #1 Team Alpha    400 pts (4 rooms)  ⏱️ 38m 23s            │
│  #2 Team Beta     400 pts (4 rooms)  ⏱️ 41m 05s  ← TEMPO!   │
│  #3 Team Gamma    300 pts (3 rooms)  ⏱️ 48m 40s            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         ▲                            ▲                        
         │                            │                        
    Sincroniza com         Sincroniza com                      
      Firebase                Firebase                         
         │                            │                        
    ┌────┴────┐                 ┌─────┴──────┐               
    │          │                 │             │               
┌───▼──────┐┌──▼────────┐┌──────▼───┐ ┌───────▼────┐         
│ Laptop   ││ Laptop    ││ Laptop   │ │ Laptop     │         
│ Grupo 1  ││ Grupo 2   ││ Grupo 3  │ │ Grupo 4    │         
│          ││           ││          │ │            │         
│ Room 2:  ││ Room 1:   ││ Final:   │ │ Room 3:    │         
│ refactor ││ archaeo   ││ modern   │ │ security   │         
│          ││           ││          │ │            │         
│ (Objetivo no topo)    │ (Objetivo no topo)    │            
│ 🟢🟢🔘🔘 ││ 🟢🔘🔘🔘 ││ 🟢🟢🟢🔘 │ │ 🟢🟢🔘🔘  │         
└──────────┘└──────────┘└──────────┘ └────────────┘         
```

---

## 🚀 Kickoff (Minuto 0)

### **Tu (Facilitador)**
1. Abre o Game Hub (Dashboard): `https://codefestrooms-81695626.web.app`
2. Mostra slide com QR Code + URLs
3. Explica tema & regras (30 seg)
4. Divide em grupos de 2-4

### **Grupos**
1. Cada um abre o URL da Room 1 (ou clica QR)
2. Clicam no botão da Room 1 no Game Hub
3. Veem o **OBJETIVO NO TOPO DA ROOM**:
   - 🏚️ Arqueologia: "Encontra o bug de IVA"
   - Dica: "O desconto/shipping afetam a taxa"
   - Tempo estimado: 8-12 min
4. Começam o desafio

### **TU CLICAS: "▶️ START GAME"**
- ✅ Timer começa em TODAS as máquinas
- ✅ Todo o mundo vê 50:00 a descer
- ✅ Cores mudam: 🟢 → 🟡 → 🔴

---

## ⏰ O Timer (Sincronização Global)

```javascript
// Timer SÓ VISÍVEL NO GAME HUB (Dashboard do Facilitador)
// Grupos não veem timer (foco no desafio)

FACILITADOR VÊ:  ⏱️ 47m 33s (verde) - NO GAME HUB
GRUPO 1 VÊ:      Nada (sem timer no room)
GRUPO 2 VÊ:      Nada (sem timer no room)
GRUPO 3 VÊ:      Nada (sem timer no room)

// Tudo vem da mesma source: window.GAME_TIMING.startTime
```

**Cores Dinâmicas no Game Hub:**
- 🟢 **Verde**: > 16 minutos (relaxado, tudo bem)
- 🟡 **Amarelo**: 16 min até 5 min (começa a ficar apertado!)
- 🔴 **Vermelho**: < 5 minutos (APRESSA-TE!)

---

## 🎯 O Fluxo de Uma Equipa

```
MINUTO 1-2:
├─ Grupo abre URL do Game Hub ou clica QR
├─ Vê bot0ão de Room 1
├─ Clica em Room 1
├─ VÊEM OBJETIVO no topo da Room:
│  "[🏚️ Arqueologia] Encontra o bug de IVA"
│  Dica: "O desconto e shipping afetam base"
└─ Começam desafio

MINUTO 2-8:
├─ Estão em Room 1 trabalhando
├─ Sem timer visível (foco no work)
├─ Fazem login, veem fatura com bug
├─ Descobrem: 2000 - 200 + 450 = 2250 base
│  Imposto deveria ser 2250 * 0.23 = 517.50€
│  Mas aparece 460€ (está mal!)
└─ Clicam "Mark Complete"
   ✅ Firebase regista tempo: 6m 45s
   ✅ Score +100 pts
   ✅ Badge 🔘 → 🟢

MINUTO 8-10:
├─ Veem objetivo de Room 2: "[🧱 Refactor] Complexity ≤ 10"
├─ Clicam em Room 2 no Game Hub
└─ Entram em Room 2...

MINUTO 20-48:
├─ Grupos navegam por Room 2 → Room 3 → Final
├─ Cada Mark Complete grava timestamp
├─ Dashboard atualiza em TEMPO REAL
└─ Leaderboard muda a cada completação

MINUTO 48-50:
├─ Timer no VERMELHO 🔴
├─ "⚠️ 2 MINUTOS!"
└─ Último rush...

MINUTO 50:00:
├─ ⏹️ TIMER ACABA
├─ Leaderboard CONGELA
└─ Resultado final é determinado por:
   1. Quantas rooms completaram (primário)
   2. Quanto tempo levaram (desempate) ⚡
```

---

## 🏆 Scoring & Desempate

### Exemplo Real

**Team Alpha:**
- Room 1: ✅ (6m 45s)
- Room 2: ✅ (12m 20s)
- Room 3: ✅ (11m 50s)
- Room 4: ✅ (7m 28s)
- **Total: 38m 23s | 4 rooms | 400 pts**

**Team Beta:**
- Room 1: ✅ (8m 10s)
- Room 2: ✅ (13m 45s)
- Room 3: ✅ (12m 30s)
- Room 4: ✅ (6m 40s)
- **Total: 41m 05s | 4 rooms | 400 pts**

**Result:**
```
#1 🥇 Team Alpha  400 pts ⏱️ 38m 23s  ← MAIS RÁPIDA!
#2 🥈 Team Beta   400 pts ⏱️ 41m 05s
```

---

## 📊 Game Hub (Facilitador)

```
┌─────────────────────────────────────────────────────────────┐
│ 🎮 VISUAL ESCAPE ROOM GAME HUB (DASHBOARD)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [▶️ Start Game] [🔄 Reset]  ✅ Game started! (50m)          │
│                                                              │
│ ⏱️ TIMER: 35m 27s  🟢 [████████░░░░░░░░░░░] 29% done       │
│                                                              │
│ 🏆 LEADERBOARD (atualiza a cada 3s)                        │
│ ┌────┬──────────────┬────────┬──────────┬────────────────┐ │
│ │ #  │ Team         │ Score  │ Rooms    │ Time / Status  │ │
│ ├────┼──────────────┼────────┼──────────┼────────────────┤ │
│ │ 1  │ 🥇 Alpha     │ 400    │ 4/4 ✅  │ 38:23  (Final) │ │
│ │ 2  │ 🥈 Beta      │ 400    │ 4/4 ✅  │ 41:05  (Final) │ │
│ │ 3  │ 🥉 Gamma     │ 300    │ 3/4 ⏳  │ Room 3 (20m)   │ │
│ │ 4  │ 💾 Delta     │ 200    │ 2/4 ⏳  │ Room 2 (12m)   │ │
│ │ 5  │ 🎲 Epsilon   │ 100    │ 1/4 ⏳  │ Room 1 (8m)    │ │
│ └────┴──────────────┴────────┴──────────┴────────────────┘ │
│                                                              │
│ 📍 WHERE ARE THEY NOW:                                     │
│ ├─ Alpha: FINISHED (38m 23s)                              │
│ ├─ Beta: FINISHED (41m 05s)                               │
│ ├─ Gamma: Room 3 Security (started 20m ago)               │
│ ├─ Delta: Room 2 Refactor (started 12m ago)               │
│ └─ Epsilon: Room 1 Archaeo (started 8m ago)               │
│                                                              │
│ 🎯 CURRENT PACE:                                           │
│ ├─ Fast: Alpha, Beta (on track for Top 2!)                │
│ ├─ OK: Gamma (might finish before 50m)                    │
│ └─ Slow: Delta, Epsilon (need to accelerate)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Facilitador Notes

### Antes do Evento
```
[ ] Deploy: npm run firebase:deploy:all
[ ] Test 1 team em incógnito 
[ ] Prepare slide com QR code
[ ] Testar internet com 4-5 browsers abertos
[ ] Guardar URLs em bit.ly (opcional)
```

### Minuto 0 (Crítico!)
```
[ ] Explica tema (30 seg)
[ ] Divide grupos (1 min)
[ ] Todos abrem URLs ou QR code (30 seg)
[ ] 👉 CLICA "▶️ START GAME" NO GAME HUB (DASHBOARD)
[ ] Verifica se timer desceu em TODOS os browsers
```

### Durante (Monitorize)
```
✓ Timer está vermelho? Anuncia "5 MIN!"
✓ Alguém não consegue? Oferece dica
✓ Grupo "stuck" > 10 min? Visita ou DM
✓ Leaderboard updated? Anuncia "Alpha terminou!"
```

### Minuto 50
```
✓ Timer bate 0:00 - GAME OVER
✓ Congela leaderboard
✓ Screenshot para comprovar
✓ Anuncia TOP 3
✓ Aplausos! 🎉
```

---

## 🔗 URLs Rápidas

| Componente | URL |
|-----------|-----|
| 📊 Game Hub (Dashboard) | https://codefestrooms-81695626.web.app |
| 🏚️ Room 1 | https://codefest-room1.web.app |
| 🧱 Room 2 | https://codefest-room2.web.app |
| 🔐 Room 3 | https://codefest-room3.web.app |
| 🏢 Room Final | https://codefest-final.web.app |

**Encurtar com bit.ly para slides**

---

## 🎯 TL;DR

1. **Antes:** Deploy com `npm run firebase:deploy:all`
2. **Kickoff:** Partilha URLs, divide grupos
3. **Minuto 0:** Clica "▶️ START GAME" 
4. **Minuto 2-48:** Monitora Dashboard
5. **Minuto 50:** "GAME OVER" - Anuncia vencedor
6. **Desempate:** Quem terminou **mais rápido** ganha!

**Tudo sincronizado em Firebase. Nada pode falhar.** ✅
