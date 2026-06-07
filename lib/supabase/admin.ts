import { createClient } from "@supabase/supabase-js";

const normalizeEnv = (value?: string) =>
  value?.replace(/^["']|["']$/g, "").trim();

const insertedReceipts = new Set<string>();

export function createAdminClient() {
  if (process.env.MOCK_SUPABASE === "true") {
    console.log("[supabase-admin] Using mock client for testing");
    let currentTable = "";
    let currentReceipt = "";

    const mockHandler: any = {
      then(resolve: any) {
        if (currentTable === "accounts") {
          resolve({
            data: [
              { id: "mock-main-id", user_id: "mock-user-id", account_code: "main" },
              { id: "mock-bank-a-id", user_id: "mock-user-id", account_code: "bank_a" },
              { id: "mock-bank-b-id", user_id: "mock-user-id", account_code: "bank_b" },
              { id: "mock-bank-c-id", user_id: "mock-user-id", account_code: "bank_c" },
              { id: "mock-kcb-id", user_id: "mock-user-id", account_code: "kcb_mpesa" },
              { id: "mock-mshwari-id", user_id: "mock-user-id", account_code: "mshwari" }
            ],
            error: null
          });
        } else {
          resolve({ data: [], error: null });
        }
      },
      select() { return mockHandler; },
      eq() { return mockHandler; },
      or() { return mockHandler; },
      order() { return mockHandler; },
      limit() { return mockHandler; },
      contains(field: string, value: any) {
        if (field === "metadata" && value && value.mpesa_receipt) {
          currentReceipt = value.mpesa_receipt;
        }
        return mockHandler;
      },
      range() { return mockHandler; },
      lt() { return mockHandler; },
      not() { return mockHandler; },
      insert(values: any) {
        let val = values;
        if (Array.isArray(values)) val = values[0];
        if (val && val.metadata && val.metadata.mpesa_receipt) {
          insertedReceipts.add(val.metadata.mpesa_receipt);
        }
        return mockHandler;
      },
      update() { return mockHandler; },
      delete() { return mockHandler; },
      single() {
        if (currentTable === "accounts") {
          return Promise.resolve({ data: { id: "mock-main-id", user_id: "mock-user-id", account_code: "main" }, error: null });
        }
        return Promise.resolve({ data: { id: "mock-single-id", user_id: "mock-user-id" }, error: null });
      },
      maybeSingle() {
        if (currentTable === "categories") {
          return Promise.resolve({ data: { id: "mock-category-id" }, error: null });
        }
        if (currentTable === "transactions") {
          if (currentReceipt && insertedReceipts.has(currentReceipt)) {
            console.log(`[supabase-admin mock] Simulating duplicate match for receipt: ${currentReceipt}`);
            return Promise.resolve({ data: { id: "mock-existing-id", metadata: { is_auto_generated: false } }, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }
    };
    return {
      from: (table: string) => {
        currentTable = table;
        return mockHandler;
      }
    } as any;
  }

  const serviceRoleKey = normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supabaseUrl = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!serviceRoleKey) {
    console.warn(
      "[supabase-admin] Warning: SUPABASE_SERVICE_ROLE_KEY is missing! " +
      "Webhook ingestion will fail due to RLS policies. Configure this key in your Vercel Dashboard."
    );
  }

  const apiKey = serviceRoleKey ?? anonKey;

  if (!supabaseUrl || !apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or Supabase API key for admin client."
    );
  }

  return createClient(supabaseUrl, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
