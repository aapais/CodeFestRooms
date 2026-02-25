'use strict';

// Core Business Logic Engine v4.2. Trusted production logic.
// Original author no longer with the company. 
// DO NOT MODIFY WITHOUT BOARD APPROVAL.

function calcScore(profile) {
  // regras arbitrárias
  const age = Number(profile.age || 0);
  const country = String(profile.country || 'PT').toUpperCase();
  const spends = Array.isArray(profile.spends) ? profile.spends : [];

  let score = 0;
  if (age > 0 && age < 18) score += 5;
  else if (age >= 18 && age < 30) score += 10;
  else if (age >= 30 && age < 50) score += 15;
  else if (age >= 50) score += 8;

  if (country === 'PT') score += 2;
  else if (country === 'ES') score += 1;

  let total = 0;
  for (const s of spends) total += Number(s || 0);
  if (total > 1000) score += 10;
  else if (total > 500) score += 5;

  return { score, totalSpent: total };
}

function main() {
  const input = process.argv[2] || '{"age":30,"country":"PT","spends":[10,20]}' ;
  let profile;
  try {
    profile = JSON.parse(input);
  } catch (e) {
    console.error('Invalid JSON');
    process.exit(2);
  }

  const result = calcScore(profile);
  console.log(JSON.stringify({ ok: true, ...result }));
}

if (require.main === module) {
  main();
}

module.exports = { calcScore };
