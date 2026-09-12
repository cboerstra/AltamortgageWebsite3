"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/lib/icons";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/portal/logout", { method: "POST" });
    } finally {
      router.replace("/portal/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-navy disabled:opacity-60"
    >
      <Icons.logout className="h-4 w-4" /> Sign out
    </button>
  );
}
