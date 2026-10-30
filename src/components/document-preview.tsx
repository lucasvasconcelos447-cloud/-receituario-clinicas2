"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { Snapshot } from "@/lib/types";
const Dialog = dynamic(() => import("./pdf-preview-dialog"), { ssr: false });
export function DocumentPreview({
  snapshot,
  fictitious = false,
}: {
  snapshot: Snapshot;
  fictitious?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="button secondary"
        onClick={() => setOpen(true)}
      >
        Visualizar documento · {snapshot.branding.paper}
      </button>
      {open && (
        <Dialog
          snapshot={snapshot}
          fictitious={fictitious}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
