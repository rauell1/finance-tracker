/**
 * Description text for Fuliza repayments, excluded from expense calculations.
 */
export const FULIZA_REPAYMENT = "Fuliza repayment";

/**
 * Returns true if the transaction should be excluded from expense totals.
 */
export function isFulizaRepayment(description: string | null | undefined): boolean {
  return description === FULIZA_REPAYMENT;
}
