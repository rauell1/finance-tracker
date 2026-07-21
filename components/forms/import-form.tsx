"use client";

import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Account } from "@/types/domain";
import type { ParsedRow } from "@/app/api/import/route";

interface IngestSmsResultItem {
  text: string;
  status: "success" | "ignored" | "failed";
  error?: string;
  reason?: string;
}

interface ImportFormProps {
  accounts: Account[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

type Step = "upload" | "preview" | "result";

interface PreviewData {
  rows: ParsedRow[];
  format: string;
  skipped: number;
}

interface ResultData {
  imported: number;
  skipped: number;
  errors: string[];
}

export function ImportForm({ accounts, open, onOpenChange, onImported }: ImportFormProps) {
  const [step, setStep] = useState<Step>("upload");
  const [importType, setImportType] = useState<"file" | "sms">("file");
  const [accountId, setAccountId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [smsText, setSmsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("upload");
    setImportType("file");
    setFile(null);
    setSmsText("");
    setAccountId("");
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) { setError("Please select a CSV or PDF file"); return; }
    if (!accountId) { setError("Please select an account"); return; }
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("accountId", accountId);
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed"); return; }

      const totalRaw = (data.rawRows?.length ?? data.rows?.length ?? 0);
      setPreview({
        rows: data.rows ?? [],
        format: data.format,
        skipped: totalRaw - (data.rows?.length ?? 0),
      });
      setStep("preview");
    } catch {
      setError("Network error during upload");
    } finally {
      setLoading(false);
    }
  }

  async function handleSmsIngest() {
    if (!smsText.trim()) { setError("Please paste some transaction SMS text"); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/transactions/import-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: smsText }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "SMS Ingestion failed"); return; }

      setResult({
        imported: data.imported,
        skipped: data.skipped,
        errors: (data.results || [])
          .filter((r: IngestSmsResultItem) => r.status === "failed" || r.status === "ignored")
          .map((r: IngestSmsResultItem) => {
            const shortText = r.text.length > 30 ? `${r.text.substring(0, 30)}...` : r.text;
            return `[${r.status.toUpperCase()}] "${shortText}" - ${r.error || r.reason || "Skipped"}`;
          }),
      });
      setStep("result");
      onImported?.();
    } catch {
      setError("Network error during SMS ingestion");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview.rows, account_id: accountId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Confirm failed"); return; }
      setResult(data);
      setStep("result");
      onImported?.();
    } catch {
      setError("Network error during import");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  const progress = step === "upload" ? 33 : step === "preview" ? 66 : 100;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {importType === "sms" ? "Ingest Raw SMS Notifications" : "Import Transactions from CSV or PDF"}
          </DialogTitle>
        </DialogHeader>

        <Progress value={progress} className="h-1.5 mb-4" />

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Tab selector */}
            <div className="flex gap-2 border-b border-border/40 pb-2 mb-2">
              <Button
                type="button"
                variant={importType === "file" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setImportType("file"); setError(null); }}
                className="text-xs font-bold"
              >
                Upload Statement File
              </Button>
              <Button
                type="button"
                variant={importType === "sms" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setImportType("sms"); setError(null); }}
                className="text-xs font-bold"
              >
                Paste SMS Alerts
              </Button>
            </div>

            {importType === "file" ? (
              <>
                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CSV or PDF Statement File</Label>
                  <Input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports M-Pesa CSVs, and SBM / DTB / I&M Bank CSV or PDF statements (max 500 rows)
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Paste Raw SMS Transaction Text</Label>
                <textarea
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder={`Paste raw M-Pesa or bank transaction SMS alerts here. Separate multiple messages by double newlines. E.g.

KCB: Sent KES 1,000 to John on 12/05/26...

MPESA: QAB12C34D5 Confirmed. KES 500 sent to Naivas...`}
                  rows={8}
                  className="w-full p-3 bg-secondary/50 rounded-xl border border-border/80 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary leading-normal resize-none font-mono"
                />
                <p className="text-[11px] text-muted-foreground leading-normal">
                  The parsing engine automatically matches transaction patterns (M-Pesa, KCB, DTB, SBM, I&M) and registers them to their respective accounts. General texts or OTP codes are skipped.
                </p>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === "preview" && (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : preview && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">{preview.format === "mpesa" ? "M-Pesa CSV" : preview.format === "sbm" ? "SBM Bank" : "Bank Statement"}</Badge>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{preview.rows.length}</span> rows ready
                    {preview.skipped > 0 && (
                      <>, <span className="font-medium text-amber-600">{preview.skipped}</span> skipped</>
                    )}
                  </span>
                </div>
                {preview.rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No valid rows found in this file.</p>
                ) : (
                  <div className="rounded-md border max-h-80 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.rows.map((row) => (
                          <TableRow key={row.raw_index}>
                            <TableCell className="text-sm whitespace-nowrap">{row.date}</TableCell>
                            <TableCell className="text-sm max-w-[180px] truncate">{row.description}</TableCell>
                            <TableCell>
                              <Badge variant={row.txn_type === "income" ? "success" : "destructive"} className="text-xs">
                                {row.txn_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{row.category_name}</TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {row.amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {/* ── Step 3: Result ── */}
        {step === "result" && result && (
          <div className="py-4 space-y-4 text-center">
            <div className="text-4xl text-emerald-500 font-bold select-none">✓</div>
            <div>
              <p className="text-lg font-black tracking-tight text-foreground">Ingestion Complete</p>
              <p className="text-xs text-muted-foreground mt-0.5">Transactions have been logged successfully.</p>
            </div>
            <div className="flex justify-center gap-4 text-xs font-bold border-y border-border/40 py-3">
              <span className="text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-1 rounded-full border border-emerald-100/50">{result.imported} imported</span>
              {result.skipped > 0 && <span className="text-amber-600 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-1 rounded-full border border-amber-100/50">{result.skipped} skipped</span>}
              {result.errors.length > 0 && <span className="text-rose-600 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-1 rounded-full border border-rose-100/50">{result.errors.length} unresolved</span>}
            </div>
            {result.errors.length > 0 && (
              <div className="text-left max-w-md mx-auto space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Warnings & Skips Details</span>
                <ul className="text-[10px] text-muted-foreground font-mono leading-relaxed max-h-32 overflow-y-auto border border-border bg-secondary/20 rounded-xl p-3 space-y-1">
                  {result.errors.map((e, i) => <li key={i} className="truncate">{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              {importType === "file" ? (
                <Button onClick={handleUpload} disabled={loading}>
                  {loading ? "Parsing…" : "Next: Preview"}
                </Button>
              ) : (
                <Button onClick={handleSmsIngest} disabled={loading || !smsText.trim()}>
                  {loading ? "Ingesting…" : "Parse & Ingest SMS"}
                </Button>
              )}
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")} disabled={loading}>Back</Button>
              <Button onClick={handleConfirm} disabled={loading || !preview?.rows.length}>
                {loading ? "Importing…" : `Import ${preview?.rows.length ?? 0} transactions`}
              </Button>
            </>
          )}
          {step === "result" && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
