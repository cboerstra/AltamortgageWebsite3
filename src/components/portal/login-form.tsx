"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/lib/icons";
import { codeCapState, DEFAULT_CODE_LIMITS, type CodeLimits } from "@/lib/portal/code-cap";

type Stage = "email" | "code";

const FALLBACK_NOTICE =
  "If that email has an application with us, a 6-digit code is on its way. It expires in 10 minutes. " +
  "Check your spam or junk folder too.";

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function LoginForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // The server sends at most N codes per email per window, and a request past
  // the cap is answered exactly like a successful one — it has to be, or the
  // answer would reveal which emails have applications. So the borrower who
  // never saw their first email clicks "Send a new code" until they hit the
  // cap, then waits for a code that is never coming. This browser knows how
  // many it has asked for, so it can say so; that is the borrower's own count
  // and gives nothing away.
  const [limits, setLimits] = useState<CodeLimits>(DEFAULT_CODE_LIMITS);
  const [requestTimes, setRequestTimes] = useState<Record<string, number[]>>({});
  const [now, setNow] = useState(() => Date.now());

  const emailKey = email.trim().toLowerCase();
  const { capped, nextAllowedAt } = codeCapState(requestTimes[emailKey] ?? [], now, limits);

  // Re-enable "Send a new code" on its own once the window has passed.
  useEffect(() => {
    if (nextAllowedAt === null) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(nextAllowedAt - Date.now(), 0) + 500);
    return () => clearTimeout(timer);
  }, [nextAllowedAt]);

  const cappedMessage =
    nextAllowedAt === null
      ? ""
      : `You've asked for ${limits.codesPerWindow} codes in the last ${limits.windowMinutes} minutes, ` +
        `which is the limit. You can ask for another at ${formatTime(nextAllowedAt)}. ` +
        `Meanwhile, check your spam or junk folder for the newest one.`;

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    const isResend = stage === "code";
    setError("");
    setNotice("");

    // Asking past the cap sends nothing, so say why here instead of letting
    // the request through to a reassuring answer.
    if (capped) {
      setError(cappedMessage);
      return;
    }

    setBusy(true);
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

      const body = (await res.json().catch(() => null)) as
        | { message?: unknown; codesPerWindow?: unknown; windowMinutes?: unknown }
        | null;
      if (typeof body?.codesPerWindow === "number" && typeof body?.windowMinutes === "number") {
        setLimits({ codesPerWindow: body.codesPerWindow, windowMinutes: body.windowMinutes });
      }

      const requestedAt = Date.now();
      setRequestTimes((prev) => ({ ...prev, [emailKey]: [...(prev[emailKey] ?? []), requestedAt] }));
      setNow(requestedAt);
      setStage("code");

      const serverMessage = typeof body?.message === "string" ? body.message : FALLBACK_NOTICE;
      setNotice(
        isResend
          ? `We asked for a new code. It replaces the previous one, so use the code from the newest email. ${serverMessage}`
          : serverMessage
      );
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
        <button
          type="button"
          className="text-navy underline underline-offset-2 hover:no-underline disabled:cursor-not-allowed disabled:text-text-muted disabled:no-underline"
          disabled={busy || capped}
          onClick={() => requestCode()}
        >
          Send a new code
        </button>
      </div>
      {capped && !error && (
        <p role="status" className="rounded-lg border border-border bg-surface px-4 py-3 text-xs text-text-muted">
          {cappedMessage}
        </p>
      )}
    </form>
  );
}
