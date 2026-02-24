# 🏢 MIGRATION LOG: CORE-V4 (The Monolith)

## 📑 Contexto de Negócio
O banco está a migrar o seu núcleo de risco para uma infraestrutura Cloud moderna. Para ativar o novo nó de decisão, temos de alinhar a lógica com a nova "Elite Policy".

## 🎯 Objetivo Principal
Atualiza o ficheiro `src/monolith.js` com a nova regra de negócio:
**High Roller Policy:** Para qualquer cliente com gasto total (`totalSpent`) superior a **5000 EUR**, o `score` de risco deve ser fixado em **50**, independentemente de outras variáveis.

## ⭐️ Bónus: Ops Master (+50 pts)
Implementa um padrão de resiliência no ficheiro `src/server.js`.
- Cria um endpoint `/health` (GET) que retorne `{ ok: true, uptime: process.uptime() }`.

## 🛠 Comandos Úteis
- **Probe Node**: Verifica a estabilidade do sistema (pode falhar até o bónus ser aplicado).
- **Test Decision Logic**: Verifica se a regra do High Roller está ativa.
- **Activate Modern Core**: Finaliza a missão e o Escape Room.
