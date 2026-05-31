"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImportForm } from "@/components/forms/import-form";
import type { Account } from "@/types/domain";

export function ImportTrigger({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Import CSV
      </Button>
      <ImportForm
        accounts={accounts}
        open={open}
        onOpenChange={setOpen}
        onImported={() => {
          // The transactions page will re-fetch on next navigation; a full reload syncs data
          window.location.reload();
        }}
      />
    </>
  );
}
