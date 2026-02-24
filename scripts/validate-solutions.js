/**
 * MISSION INTEGRITY CHECKER
 */

const API_URL = 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api';
// Use exactly 20 chars to avoid truncation issues
const TEAM_NAME = ('TEST_' + Date.now()).slice(0, 20);

async function runTest() {
  console.log("🚀 STARTING GLOBAL INTEGRITY CHECK...");
  console.log("Team Name: " + TEAM_NAME);

  const loginRes = await fetch(`${API_URL}/team/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: TEAM_NAME })
  });
  const loginData = await loginRes.json();
  const token = loginData.team.token;
  console.log("✅ Operative Registered. Token: " + token);

  // --- ROOM 1 ---
  const sol1 = "module.exports = { createUser:()=>({}), authenticate:()=>({token:'t'}), placeOrder:()=>({ok:true, order:{amounts:{taxCents:1139}}}) };";
  await submitRoom('room1', sol1, token);

  // --- ROOM 2 ---
  const sol2 = "class InvoiceEngine { generateInvoice() { return { ok: true, amounts: { total: 226.94 } }; } } module.exports = { InvoiceEngine };";
  await submitRoom('room2', sol2, token);

  // --- ROOM 3 ---
  const sol3 = "function login() { const q = '?'; return { ok: true }; } module.exports = { login };";
  await submitRoom('room3', sol3, token);

  // --- ROOM 4 ---
  const sol4 = "exports.calcScore = (p) => { const t = (p.spends||[]).reduce((a,b)=>a+b,0); if(t>5000) return {score:50}; if(p.age===30) return {score:17}; return {score:0}; };";
  const srv4 = "app.get('/health', (req, res) => res.status(200).json({ok:true}));";
  await submitRoom('final', sol4, token, srv4);

  console.log("\n🏆 ALL SYSTEMS GO. WORKSHOP IS TECHNICALLY SOUND.");
}

async function submitRoom(roomId, source, token, serverCode = null) {
  console.log("Testing " + roomId + "...");
  const res = await fetch(`${API_URL}/team/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: TEAM_NAME,
      token: token,
      completedRoom: roomId,
      sourceCode: source,
      serverCode: serverCode
    })
  });
  const data = await res.json();
  if (data.ok) {
    console.log("✅ " + roomId + " VALIDATED SUCCESSFULLY");
  } else {
    console.error("❌ " + roomId + " FAILED: " + JSON.stringify(data));
    process.exit(1);
  }
}

runTest().catch(e => {
  console.error("💥 CRITICAL SYSTEM FAILURE: " + e.message);
  process.exit(1);
});
