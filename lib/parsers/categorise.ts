export function categorise(description: string, txnType: "income" | "expense", isMpesa = false): string {
  const d = description.toLowerCase();
  if (/kplc|kenya power|safaricom|airtel|telkom/.test(d)) return "Utilities";
  if (/naivas|carrefour|quickmart|chandarana/.test(d)) return "Food & Dining";
  if (/uber|bolt|faras|matatu/.test(d)) return "Transport";
  if (/netflix|spotify|showmax|dstv/.test(d)) return "Subscriptions";
  if (/nhif|hospital|clinic|pharmacy|chemist/.test(d)) return "Healthcare";
  if (/school|fees|university|college|tuition/.test(d)) return "Education";
  if (/airbnb|hotel|flight|kenya airways|jambojet/.test(d)) return "Travel";
  if (/salary|payroll|wages/.test(d)) return "Salary";
  if (/freelance|upwork|fiverr/.test(d)) return "Freelance";
  return txnType === "income" ? (isMpesa ? "Funds received" : "Other Income") : "Other Expense";
}

export function extractCounterparty(details: string): string {
  if (!details) return "Unknown";
  const cleaned = details
    .replace(/^(pay bill (online )?to|merchant payment (online )?to|customer (transfer|payment) (of funds )?(to|from)|funds received from|business payment from|buy goods (and services )?to|withdrawal (charge|at)|airtime purchase|m-?shwari|kcb m-?pesa)\s*/i, "")
    .replace(/\b\d{9,12}\b/g, "")
    .replace(/-\s*\d+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || details.trim();
}
