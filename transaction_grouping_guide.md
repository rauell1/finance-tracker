# M-PESA Transaction Grouping & Classification Guide

This guide is designed for LLMs (Language Models) and rule-based parsing agents to understand how to categorize and group Safaricom M-PESA transactions correctly in personal finance tracking software.

---

## 1. Core Transaction Categories

M-PESA transactions are grouped into five primary categories based on the transaction type and destination:

### 1. Send Money (P2P Transfers)
- **Regex Clue**: `sent to [Name] [Phone]` or `paid to [Name]` (where the target is an individual).
- **Type**: `expense`
- **Recommended Category**: `Send Money`
- **Example**: `Ksh500.00 sent to Gathogo Kigotho 0708767392`

### 2. Lipa na M-PESA (Paybill & Buy Goods)
- **Paybill Regex Clue**: `sent to [Business Name] for account [Account Number]`.
- **Buy Goods Regex Clue**: `paid to [Business Name]`.
- **Type**: `expense`
- **Recommended Category**: Category mapping is determined by matching the business name or account number against a set of classification rules (e.g. KPLC -> `Utilities`, Supermarket -> `Food & Dining`, Uber -> `Transport`).
- **Example**: `Ksh800.00 sent to Equity Paybill Account for account 0790962744` (Paybill) or `Ksh400.00 paid to JAKAM SHOP` (Buy Goods).

### 3. Received Money
- **Regex Clue**: `received Ksh [Amount] from [Name]`.
- **Type**: `income`
- **Recommended Category**: `Funds received` (unless matched by sender name to specific categories like `Salary` or `Freelance`).
- **Example**: `You have received Ksh1,500.00 from JUDITH OKWEMBA`

### 4. Agent Withdrawal / Deposit
- **Withdrawal Regex Clue**: `withdrawn Ksh [Amount] from [Agent Name]`.
- **Deposit Regex Clue**: `Give Ksh [Amount] cash to [Agent/Merchant Name]`.
- **Type**: Withdrawal is `expense` (or transfer to cash); Deposit is `income` (or transfer from cash).
- **Recommended Category**: `Cash Withdrawal` / `Cash Deposit`
- **Example**: `withdrawn Ksh10,000 from 218902 - Agent Name`

### 5. Bank / Savings Transfers
- **Regex Clue**: `transfered to [KCB M-PESA / M-Shwari]` or `transfered from [KCB M-PESA / M-Shwari]`.
- **Type**: `transfer`
- **Recommended Category**: `null` (since it is an internal transfer between the main M-PESA wallet and a savings sub-account).
- **Example**: `Ksh9,000.00 transfered to KCB M-PESA account`

---

## 2. Handling Special Transactions

### A. Fuliza Overdraft Drawdowns & repayments
- **Drawdowns**: When a transaction is funded by a Fuliza overdraft, Safaricom sends a separate notification stating the overdraft amount, access fee, and total outstanding debt (e.g., `Fuliza M-PESA amount is Ksh 300.00...`).
  - **Rule**: Do **NOT** insert the drawdown as an income transaction. Treat the main M-PESA cash balance as allowed to go negative. The negative balance represents the loan.
- **Fees**: Always record the `Access Fee charged Ksh [Amount]` as a separate expense transaction on the main M-PESA account (Category: `Other Expense`, Description: `Fuliza Access Fee`).
- **Repayments**: When money is auto-deducted or manually paid to clear the overdraft (e.g., `Ksh 100.00 from your M-PESA has been used to partially pay your outstanding Fuliza...`).
  - **Rule**: Do **NOT** record the repayment as an expense transaction on M-PESA. Only update the outstanding balance in the `debts` table. This prevents double-counting the initial expense.

### B. Transaction Costs & Charges
- Safaricom charges transaction fees on certain P2P sends and Paybills. These fees are appended to the SMS text (e.g., `Transaction cost, Ksh7.00.`).
- **Rule**: Store the `txn_cost` value inside the transaction metadata. The application may choose to record this fee as a separate expense transaction under `Other Expense` (named `Transaction Fee`) or keep it bundled within the metadata. Do not double-count it.

---

## 3. Classification Mapping Rules (LLM Ruleset)

When auto-categorizing based on description or counterparty, apply these keyword associations:

| Category | Keywords / Merchant Patterns |
| :--- | :--- |
| **Utilities** | `KPLC`, `Kenya Power`, `Token`, `Stima`, `Safaricom`, `Airtel`, `Faiba`, `Nawasco`, `Water`, `Gas` |
| **Food & Dining** | `Naivas`, `Carrefour`, `Quickmart`, `Chandarana`, `Supermarket`, `Eatery`, `Restaurant`, `Cafe`, `Wineries`, `Grill`, `Kitchen` |
| **Transport** | `Uber`, `Bolt`, `Faras`, `Little`, `Matatu`, `Fare`, `SGR`, `Fuel`, `Petrol`, `Shell`, `Total`, `Rubis` |
| **Subscriptions** | `Netflix`, `Spotify`, `Showmax`, `DStv`, `GOtv`, `YouTube Premium` |
| **Healthcare** | `NHIF`, `SHA`, `Hospital`, `Clinic`, `Pharmacy`, `Chemist`, `Dawa` |
| **Housing** | `Rent`, `Landlord`, `Caretaker` |
| **Education** | `School`, `Fees`, `University`, `College`, `Tuition` |
