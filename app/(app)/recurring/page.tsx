import { getRecurringObligations, getAccounts, getCategories } from "@/lib/queries";
import { RecurringClient } from "@/components/forms/recurring-client";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const [obligations, accounts, categories] = await Promise.all([
    getRecurringObligations(),
    getAccounts(),
    getCategories("expense"),
  ]);

  return <RecurringClient initialObligations={obligations} accounts={accounts} categories={categories} />;
}
