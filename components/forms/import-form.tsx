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

interface ImportFormProps {
  accounts: Account[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

type Step = "upload" | "preview" | "result";

interface PreviewData {
  rows: ParsedRow[];
  format: "mpesa" | "generic";
  skipped: number;
}

interface ResultData {
  imported: number;
  skipped: number;
  errors: string[];
}

export function ImportForm({ accounts, open, onOpenChange, onImported }: ImportFormProps) {
  const [step, setStep] = useState<Step>("upload");
  const [accountId, setAccountId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("upload");
    setFile(null);
    setAccountId("");
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) { setError("Please select a CSV file"); return; }
    if (!accountId) { setError("Please select an account"); return; }
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
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
          <DialogTitle>Import Transactions from CSV</DialogTitle>
        </DialogHeader>

        <Progress value={progress} className="h-1.5 mb-4" />

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="space-y-4">
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
              <Label>CSV File</Label>
              <Input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Supports M-Pesa MySafaricom exports or generic bank CSVs (max 500 rows)
              </p>
            </div>
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
                  <Badge variant="secondary">{preview.format === "mpesa" ? "M-Pesa" : "Generic CSV"}</Badge>
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
          <div className="py-4 space-y-3 text-center">
            <div className="text-4xl">✓</div>
            <p className="text-lg font-semibold">Import complete</p>
            <div className="flex justify-center gap-4 text-sm">
              <span className="text-green-600 font-medium">{result.imported} imported</span>
              {result.skipped > 0 && <span className="text-amber-600">{result.skipped} skipped</span>}
              {result.errors.length > 0 && <span className="text-destructive">{result.errors.length} errors</span>}
            </div>
            {result.errors.length > 0 && (
              <ul className="text-xs text-destructive text-left max-h-32 overflow-y-auto border rounded p-2 space-y-0.5">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleUpload} disabled={loading}>
                {loading ? "Parsing…" : "Next: Preview"}
              </Button>
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
