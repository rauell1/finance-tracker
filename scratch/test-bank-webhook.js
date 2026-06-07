const fs = require('fs');
const path = require('path');
const ts = require('typescript');

// 1. Mock NextRequest / NextResponse
class MockNextRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.nextUrl = new URL(url);
    this.headers = new Map(Object.entries(options.headers || {}));
    this.bodyText = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : '';
  }

  clone() {
    return new MockNextRequest(this.url, {
      headers: Object.fromEntries(this.headers.entries()),
      body: this.bodyText
    });
  }

  async text() {
    return this.bodyText;
  }

  async json() {
    return JSON.parse(this.bodyText);
  }
}

class MockNextResponse {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = options.headers || {};
  }

  static json(body, options = {}) {
    return new MockNextResponse(body, options);
  }
}

// 2. Mock Supabase Client and state
const insertedReceipts = new Set();
let currentTable = "";
let currentReceipt = "";

const mockSupabaseHandler = {
  then(resolve) {
    if (currentTable === "accounts") {
      resolve({
        data: [
          { id: "mock-main-id", user_id: "mock-user-id", account_code: "main" },
          { id: "mock-bank-a-id", user_id: "mock-user-id", account_code: "bank_a" },
          { id: "mock-bank-b-id", user_id: "mock-user-id", account_code: "bank_b" },
          { id: "mock-bank-c-id", user_id: "mock-user-id", account_code: "bank_c" }
        ],
        error: null
      });
    } else if (currentTable === "transactions") {
      if (currentReceipt && insertedReceipts.has(currentReceipt)) {
        console.log(`[supabase-admin mock] Simulating duplicate match for reference: ${currentReceipt}`);
        resolve({ data: [{ id: "mock-existing-id" }], error: null });
      } else {
        resolve({ data: [], error: null });
      }
    } else {
      resolve({ data: [], error: null });
    }
  },
  select() { return mockSupabaseHandler; },
  eq() { return mockSupabaseHandler; },
  or(condition) {
    // Check both reference.eq.VAL and mpesa_receipt.eq.VAL patterns
    const refMatch = condition.match(/reference\.eq\.([A-Z0-9]+)/i);
    const mpesaMatch = condition.match(/mpesa_receipt\.eq\.([A-Z0-9]+)/i);
    currentReceipt = (refMatch ? refMatch[1] : null) || (mpesaMatch ? mpesaMatch[1] : null) || "";
    return mockSupabaseHandler;
  },
  order() { return mockSupabaseHandler; },
  limit() { return mockSupabaseHandler; },
  contains() { return mockSupabaseHandler; },
  range() { return mockSupabaseHandler; },
  lt() { return mockSupabaseHandler; },
  not() { return mockSupabaseHandler; },
  insert(values) {
    let val = values;
    if (Array.isArray(values)) val = values[0];
    if (val && val.metadata && val.metadata.reference) {
      insertedReceipts.add(val.metadata.reference);
    }
    return mockSupabaseHandler;
  },
  update() { return mockSupabaseHandler; },
  delete() { return mockSupabaseHandler; },
  single() {
    if (currentTable === "accounts") {
      return Promise.resolve({ data: { id: "mock-bank-a-id", user_id: "mock-user-id", account_code: "bank_a" }, error: null });
    }
    return Promise.resolve({ data: { id: "mock-single-id", user_id: "mock-user-id" }, error: null });
  },
  maybeSingle() {
    if (currentTable === "categories") {
      return Promise.resolve({ data: { id: "mock-category-id" }, error: null });
    }
    if (currentTable === "transactions") {
      if (currentReceipt && insertedReceipts.has(currentReceipt)) {
        console.log(`[supabase-admin mock] Simulating duplicate match for reference: ${currentReceipt}`);
        return Promise.resolve({ data: { id: "mock-existing-id" }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  }
};

const mockSupabaseClient = {
  from: (table) => {
    currentTable = table;
    return mockSupabaseHandler;
  }
};

function createAdminClient() {
  return mockSupabaseClient;
}

// 3. Load and transpile route.ts
const routePath = path.join(__dirname, '..', 'app', 'api', 'webhooks', 'mpesa-sms', 'route.ts');
let routeCode = fs.readFileSync(routePath, 'utf8');

// Replace Next.js server imports and supabase admin import
routeCode = routeCode.replace(/import\s+\{\s*NextRequest,\s*NextResponse\s*\}\s+from\s+["']next\/server["'];?/g, '');
routeCode = routeCode.replace(/import\s+\{\s*createAdminClient\s*\}\s+from\s+["']@\/lib\/supabase\/admin["'];?/g, '');

// Transpile TypeScript to JavaScript
const transpileResult = ts.transpileModule(routeCode, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
});

const jsCode = transpileResult.outputText;

// 4. Create module evaluation context
const moduleContext = {
  exports: {},
  require: (name) => {
    if (name === 'next/server') return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
    return require(name);
  },
  NextRequest: MockNextRequest,
  NextResponse: MockNextResponse,
  createAdminClient,
  process: {
    ...process,
    env: {
      ...process.env,
      MPESA_WEBHOOK_SECRET: 'cLS4oOhHsVYmA8wiv1tG3PWZReyu06zK'
    }
  },
  console
};

// Evaluate transpiled JS in the context
const compiledModule = new Function(
  'exports', 'require', 'NextRequest', 'NextResponse', 'createAdminClient', 'process', 'console',
  jsCode
);

compiledModule(
  moduleContext.exports, moduleContext.require, moduleContext.NextRequest, moduleContext.NextResponse,
  moduleContext.createAdminClient, moduleContext.process, moduleContext.console
);

const { POST } = moduleContext.exports;

const secret = 'cLS4oOhHsVYmA8wiv1tG3PWZReyu06zK';
const webhookUrl = `http://localhost:3000/api/webhooks/mpesa-sms?secret=${secret}`;

async function run() {
  console.log("Running in-memory Bank Webhook POST tests...\n");

  // Test 1: SBMBANK M-Pesa payment — should create income transaction
  console.log("--- Test 1: SBMBANK M-Pesa payment (Income) ---");
  let req = new MockNextRequest(webhookUrl, {
    headers: { 'content-type': 'application/json' },
    body: {
      source: "bank_sms",
      sender: "SBMBANK",
      message: "Your M-Pesa payment of KES 100.00 to 0322417860001 was successful on 02/06/26 05:40 AM. M-Pesa Ref: UF2LA66AC2. SBM Bank.",
      timestamp: "02/06/2026 05:40:00"
    }
  });
  let res = await POST(req);
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));
  if (res.status !== 200) throw new Error("Expected 200 OK");
  if (res.body.status !== "created" || res.body.type !== "income" || res.body.amount !== 100 || res.body.bank !== "SBMBANK") {
    throw new Error("SBMBANK parsing failed");
  }

  // Test 2: DTB account debit — should create expense transaction
  console.log("\n--- Test 2: DTB account debit (Expense) ---");
  req = new MockNextRequest(webhookUrl, {
    headers: { 'content-type': 'application/json' },
    body: {
      source: "bank_sms",
      sender: "DTB",
      message: "ALERT: Your account no. 5XXXXX5001 has been debited with KES 484.66 for a POS PURCHASE at Name.com, Inc 7202492374 CO on 02/06/2026. DTB",
      timestamp: "02/06/2026 12:00:00"
    }
  });
  res = await POST(req);
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));
  if (res.status !== 200) throw new Error("Expected 200 OK");
  if (res.body.status !== "created" || res.body.type !== "expense" || res.body.amount !== 484.66 || res.body.counterparty !== "Name.com Inc") {
    throw new Error("DTB account debit parsing failed");
  }

  // Test 3: DTB M-Pesa transfer — should create expense transaction
  console.log("\n--- Test 3: DTB M-Pesa transfer (Expense) ---");
  req = new MockNextRequest(webhookUrl, {
    headers: { 'content-type': 'application/json' },
    body: {
      source: "bank_sms",
      sender: "DTB",
      message: "Dear Roy otieno, you have successfully transferred KES 500.00 from your MPESA to account: 58XXXX5001. Mpesa Ref No: UEVLA5Z7JP. DTB",
      timestamp: "02/06/2026 13:00:00"
    }
  });
  res = await POST(req);
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));
  if (res.status !== 200) throw new Error("Expected 200 OK");
  if (res.body.status !== "created" || res.body.type !== "expense" || res.body.amount !== 500 || res.body.reference !== "UEVLA5Z7JP") {
    throw new Error("DTB M-Pesa transfer parsing failed");
  }

  // Test 4: IANDMBANK debit — should create expense transaction
  console.log("\n--- Test 4: IANDMBANK debit (Expense) ---");
  req = new MockNextRequest(webhookUrl, {
    headers: { 'content-type': 'application/json' },
    body: {
      source: "bank_sms",
      sender: "IANDMBANK",
      message: "ALERT: Your account no. 5XXXXX5001 has been debited with KES 40.13 for a POS PURCHASE at Google CLOUD 68MPQJ Dublin IRL on 05/06/2026. DTB",
      timestamp: "05/06/2026 14:00:00"
    }
  });
  res = await POST(req);
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));
  if (res.status !== 200) throw new Error("Expected 200 OK");
  if (res.body.status !== "created" || res.body.type !== "expense" || res.body.amount !== 40.13) {
    throw new Error("IANDMBANK parsing failed");
  }

  // Test 5: DTB OTP message — should return ignored
  console.log("\n--- Test 5: DTB OTP message (Ignored) ---");
  req = new MockNextRequest(webhookUrl, {
    headers: { 'content-type': 'application/json' },
    body: {
      source: "bank_sms",
      sender: "DTB",
      message: "Your OTP for DTB Mobile App login is 987654 and is valid for 5 minutes.",
      timestamp: "02/06/2026 12:05:00"
    }
  });
  res = await POST(req);
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));
  if (res.status !== 200) throw new Error("Expected 200 OK");
  if (res.body.status !== "ignored" || res.body.reason !== "non_transactional") {
    throw new Error("OTP message should be ignored as non_transactional");
  }

  // Test 6: SBMBANK maintenance alert — should return ignored
  console.log("\n--- Test 6: SBMBANK maintenance alert (Ignored) ---");
  req = new MockNextRequest(webhookUrl, {
    headers: { 'content-type': 'application/json' },
    body: {
      source: "bank_sms",
      sender: "SBMBANK",
      message: "Dear customer, our systems will undergo scheduled maintenance from midnight to 4AM.",
      timestamp: "02/06/2026 12:10:00"
    }
  });
  res = await POST(req);
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));
  if (res.status !== 200) throw new Error("Expected 200 OK");
  if (res.body.status !== "ignored" || res.body.reason !== "non_transactional") {
    throw new Error("Maintenance alert should be ignored as non_transactional");
  }

  // Test 7: Duplicate reference — should return duplicate
  console.log("\n--- Test 7: Duplicate reference ---");
  req = new MockNextRequest(webhookUrl, {
    headers: { 'content-type': 'application/json' },
    body: {
      source: "bank_sms",
      sender: "SBMBANK",
      message: "Your M-Pesa payment of KES 100.00 to 0322417860001 was successful on 02/06/26 05:40 AM. M-Pesa Ref: UF2LA66AC2. SBM Bank.",
      timestamp: "02/06/2026 05:40:00"
    }
  });
  res = await POST(req);
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));
  if (res.body.status !== "ignored" || res.body.reason !== "duplicate") {
    throw new Error("Expected duplicate reference to be ignored");
  }

  console.log("\nAll bank webhook integration tests passed successfully!");
}

run().catch(e => {
  console.error("\nTests failed:", e);
  process.exit(1);
});
