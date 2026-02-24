# 🔐 SOC ALERT: ACCESS BRIDGE BREACH

## 📑 Contexto de Negócio
Um intruso conseguiu obter acesso ROOT ao cofre de ativos do NeoBank usando uma técnica de "Bypass de Predicados Lógicos". O Centro de Operações de Segurança (SOC) exige o fecho imediato da brecha.

## 🎯 Objetivo Principal
Identifica e corrige a vulnerabilidade de construção dinâmica de queries no ficheiro `src/userRepo.js`. 
**Solução Exigida:** Implementar o uso de **Prepared Statements** (parâmetros `?`) em todas as consultas ao repositório.

## ⭐️ Bónus: Crypto Expert (+100 pts)
Substitui o armazenamento de passwords em texto limpo por uma lógica de **Hashing/Bcrypt**.

## 🛠 Comandos Úteis
- **Test Access Bridge**: Simula um probe de login para ver se o sistema ainda está vulnerável.
- **Patch System**: Envia a correção para auditoria do QG.
