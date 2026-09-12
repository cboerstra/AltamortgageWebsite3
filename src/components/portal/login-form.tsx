"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/lib/icons";

type Stage = "email" | "code";

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export function LoginForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError(await readError(res, "Something went wrong. Please try again."));
        return;
      }
      setStage("code");
      setNotice("If that email has an application with us, a 6-digit code is on its way. It expires in 10 minutes.");
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/portal/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        setError(await readError(res, "That code did not work. Please try again."));
        return;
      }
      router.replace("/portal");
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "email") {
    return (
      <form onSubmit={requestCode} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="portal-email">Email address</Label>
          <Input
            id="portal-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="The email you used on your application"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy || email.trim() === ""} className="w-full bg-navy hover:bg-navy-light text-white">
          {busy ? <Icons.loading className="mr-2 h-4 w-4 animate-spin" /> : null}
          Email me a sign-in code
        </Button>
        <p className="text-xs text-text-muted">
          No password to remember. We email you a one-time code each time you sign in.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-5">
      {notice && (
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">{notice}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="portal-code">6-digit code</Label>
        <Input
          id="portal-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          className="font-mono text-lg tracking-[0.4em]"
        />
        <p className="text-xs text-text-muted">Sent to {email}</p>
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || code.length !== 6} className="w-full bg-navy hover:bg-navy-light text-white">
        {busy ? <Icons.loading className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign in
      </Button>
      <div className="flex justify-between text-xs">
        <button type="button" className="text-navy underline underline-offset-2 hover:no-underline" onClick={() => { setStage("email"); setCode(""); setError(""); }}>
          Use a different email
        </button>
        <button type="button" className="text-navy underline underline-offset-2 hover:no-underline" disabled={busy} onClick={() => requestCode()}>
          Send a new code
        </button>
      </div>
    </form>
  );
}
