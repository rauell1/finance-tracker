const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'royok', '.gemini', 'antigravity', 'brain', '4142e84c-3659-4fb5-8691-74e16a4524c9', '.system_generated', 'steps', '612', 'content.md');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const jsonStart = content.indexOf('{');
  const jsonStr = content.slice(jsonStart);
  const data = JSON.parse(jsonStr);

  const txns = data.txns;
  const imId = "74055b50-8b26-44dd-a9e1-2cc05db2341f";

  // Filter transactions where occurred_on < '2026-07-01'
  const filteredTxns = txns.filter(t => t.occurred_on < '2026-07-01');

  const imTxns = filteredTxns.filter(t => t.account_id === imId || t.transfer_account_id === imId);

  console.log(`With occurred_on < '2026-07-01', found ${imTxns.length} transactions for I&M Bank.`);

  let incomeSum = 0;
  let transferInSum = 0;

  imTxns.forEach(t => {
    const isCounter = t.metadata && t.metadata.is_transfer_counter === true;
    if (isCounter) return;

    const amt = Number(t.amount);
    if (t.txn_type === "income" && t.account_id === imId) {
      incomeSum += amt;
    } else if (t.txn_type === "transfer" && t.transfer_account_id === imId) {
      transferInSum += amt;
    }
  });

  console.log('incomeSum:', incomeSum);
  console.log('transferInSum:', transferInSum);
  console.log('Total computed income (incomeSum + transferInSum):', incomeSum + transferInSum);

  // Print all income transactions to see which ones are there
  console.log('\nFirst 5 income transactions:');
  const incomes = imTxns.filter(t => t.txn_type === "income" && t.account_id === imId);
  console.log(JSON.stringify(incomes.slice(0, 5), null, 2));

} catch (err) {
  console.error('Error:', err.message);
}
