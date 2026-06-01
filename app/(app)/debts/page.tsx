import { getDebts, getAccounts } from "@/lib/queries";
import { DebtsClient } from "@/components/forms/debts-client";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const [debts, accounts] = await Promise.all([getDebts(), getAccounts()]);
  return <DebtsClient initialDebts={debts} accounts={accounts} />;
}
