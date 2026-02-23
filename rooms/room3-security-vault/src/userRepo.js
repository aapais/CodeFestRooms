'use strict';

/**
 * Security Vault Repository
 * -------------------------
 * O objetivo é identificar e corrigir a vulnerabilidade de SQL Injection (simulada).
 */

const JWT_SECRET = 'super-secret-not-for-prod';

function login(username, password) {
  // --- VULNERABILIDADE CRÍTICA ---
  // O programador original está a construir a query concatenando strings.
  // Isto permite que um atacante use ' OR '1'='1 para entrar sem password.
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "';";
  
  console.log(">>> EXECUTING QUERY:", query);

  // Simulação de execução de base de dados
  // Se detetarmos o padrão clássico de bypass, permitimos o acesso (Vulnerabilidade!)
  if (password.includes("' OR '1'='1")) {
    return { 
      ok: true, 
      token: `hacked.${JWT_SECRET}`,
      msg: "🔓 ACCESS GRANTED (SQL Injection detected!)" 
    };
  }

  // Login legítimo (apenas para teste)
  if (username === 'admin' && password === 'admin') {
    return { ok: true, token: `1.${JWT_SECRET}` };
  }

  return { ok: false, error: 'INVALID_CREDENTIALS' };
}

/**
 * Procura utilizadores pelo nome.
 * @param {string} search - Termo de pesquisa.
 * @returns {object} A query gerada.
 */
function findUsersByName(search) {
  // Outro exemplo de vulnerabilidade para o Gemini analisar
  const query = "SELECT * FROM users WHERE username LIKE '%" + search + "%';";
  return { query };
}

module.exports = {
  login,
  findUsersByName,
  JWT_SECRET
};
