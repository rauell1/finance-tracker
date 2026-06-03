const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'royok', '.gemini', 'antigravity', 'brain', '4142e84c-3659-4fb5-8691-74e16a4524c9', '.system_generated', 'steps', '612', 'content.md');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  // The JSON is on line 9 (index 8) or we can just extract it by searching for the first '{'
  const jsonStart = content.indexOf('{');
  if (jsonStart === -1) {
    console.error('No JSON found in file');
    process.exit(1);
  }
  const jsonStr = content.slice(jsonStart);
  const data = JSON.parse(jsonStr);

  const accounts = data.accounts;
  const txns = data.txns;

  console.log(`Loaded ${accounts.length} accounts and ${txns.length} transactions.`);

  // 1. Unique currencies
  const currencies = new Set();
  txns.forEach(t => currencies.add(t.currency_code));
  console.log('Unique currencies:', Array.from(currencies));

  // 2. Accounts mapping
  const acctMap = {};
  accounts.forEach(a => {
    acctMap[a.id] = a.name + ` (${a.account_code})`;
  });

  // 3. Group transactions by account and type
  const groupings = {};
  txns.forEach(t => {
    const isCounter = t.metadata && t.metadata.is_transfer_counter === true;
    if (isCounter) return; // skip counter

    const acctName = acctMap[t.account_id] || t.account_id;
    if (!groupings[acctName]) {
      groupings[acctName] = { income: 0, expense: 0, transfer_out: 0, transfer_in: 0, count: 0 };
    }
    groupings[acctName].count++;

    const amt = Number(t.amount);
    if (t.txn_type === 'income') {
      groupings[acctName].income += amt;
    } else if (t.txn_type === 'expense') {
      groupings[acctName].expense += amt;
    } else if (t.txn_type === 'transfer') {
      groupings[acctName].transfer_out += amt;
    }

    if (t.txn_type === 'transfer' && t.transfer_account_id) {
      const destName = acctMap[t.transfer_account_id] || t.transfer_account_id;
      if (!groupings[destName]) {
        groupings[destName] = { income: 0, expense: 0, transfer_out: 0, transfer_in: 0, count: 0 };
      }
      groupings[destName].transfer_in += amt;
    }
  });

  console.log('\n--- Transaction Groupings (Excluding is_transfer_counter) ---');
  console.log(JSON.stringify(groupings, null, 2));

  // 4. Check future or out-of-range dates
  const dates = txns.map(t => t.occurred_on).sort();
  console.log(`\nDate range: ${dates[0]} to ${dates[dates.length - 1]}`);

  const postJune2026 = txns.filter(t => t.occurred_on > '2026-06-30');
  console.log(`Transactions after June 2026: ${postJune2026.length}`);
  if (postJune2026.length > 0) {
    console.log(JSON.stringify(postJune2026.slice(0, 5), null, 2));
  }

} catch (err) {
  console.error('Error:', err.message);
}
