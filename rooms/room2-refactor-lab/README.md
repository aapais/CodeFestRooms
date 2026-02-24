# 🧪 METRIC: MAINTENANCE RISK (Billing Engine)

## 📑 Contexto de Negócio
O motor de faturação atingiu um nível de complexidade que impede a sua evolução. O "Risk Score" está em níveis vermelhos, o que causa atrasos na implementação de novos descontos.

## 🎯 Objetivo Principal
Refactoriza a função `generateInvoice` no ficheiro `src/invoiceEngine.js` para baixar a complexidade estrutural.
**Target:** Complexidade Máxima < 10.

## 💡 Dica do QG
Usa o Gemini para converter blocos de `if/else` aninhados em **Cláusulas de Guarda** (Early Returns). Garante que a lógica de negócio (o valor final da fatura) não é alterada durante a limpeza.

## ⭐️ Bónus: Master Architect (+75 pts)
Se fores capaz de reduzir a complexidade para **menos de 5**, o QG atribuirá a certificação máxima de excelência.

## 🛠 Ferramentas de Verificação
- **Simulate Billing**: Verifica se a matemática continua correta.
- **Scan Architecture**: Verifica o teu nível de complexidade atual.
- **Deploy Clean Core**: Submete a solução final.
