// Deployment + configuration diagnostics.
//
// Open <deployment-url>/api/version in a browser. It reports which commit is
// running, which integrations are configured, and — the part that matters
// when something is silently failing — whether the database can actually be
// reached from this deployment right now, and how long that took.
//
// Never leaks a secret value: only presence, timings, and error text.

import { NextResponse } from "next/server";
import { getPool, isDbConfigured } from "@/lib/db";
import { mismoBackend } from "@/lib/mismo/store";
import { isDocumentEncryptionConfigured } from "@/lib/portal/crypto";

export const runtime = "nodejs";

// Captured once per function instance. A change between two requests means
// a cold start happened in between.
const PROCESS_STARTED_AT = new Date().toISOString();

interface DbProbe {
  configured: boolean;
  reachable: boolean;
  connectMs: number | null;
  applicationsCount: number | null;
  draftsCount: number | null;
  error: string | null;
}

async function probeDatabase(): Promise<DbProbe> {
  const result: DbProbe = {
    configured: isDbConfigured(),
    reachable: false,
    connectMs: null,
    applicationsCount: null,
    draftsCount: null,
    error: null,
  };
  if (!result.configured) return result;

  const pool = getPool();
  if (!pool) return result;

  const started = Date.now();
  try {
    const client = await pool.connect();
    result.connectMs = Date.now() - started;
    try {
      const counts = await client.query<{ apps: string; drafts: string }>(
        `SELECT
           (SELECT COUNT(*) FROM applications)       AS apps,
           (SELECT COUNT(*) FROM application_drafts) AS drafts`
      );
      result.applicationsCount = Number(counts.rows[0]?.apps ?? 0);
      result.draftsCount = Number(counts.rows[0]?.drafts ?? 0);
      result.reachable = true;
    } finally {
      client.release();
    }
  } catch (err) {
    result.connectMs = Date.now() - started;
    result.error = err instanceof Error ? err.message : String(err);
  }
  return result;
}

export async function GET() {
  const db = await probeDatabase();

  // Vercel sets these on every deployment. Absent means "not on Vercel".
  const deployment = {
    platform: process.env.VERCEL ? "vercel" : "other",
    environment: process.env.VERCEL_ENV || null,
    url: process.env.VERCEL_URL || null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    gitShaShort: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF || null,
    gitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || null,
  };

  // Presence only — never the values.
  const config = {
    database: db.configured,
    blob: mismoBackend() === "blob",
    blobAuth: process.env.BLOB_READ_WRITE_TOKEN
      ? "token"
      : process.env.BLOB_STORE_ID
        ? "oidc"
        : null,
    smtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    notificationEmail: Boolean(process.env.NOTIFICATION_EMAIL),
    crm: Boolean(process.env.CRM_API_URL && process.env.CRM_API_KEY),
    cronSecret: Boolean(process.env.CRON_SECRET),
    draftLinkKey: Boolean(process.env.DRAFT_LINK_KEY),
    documentEncryptionKey: isDocumentEncryptionConfigured(),
    staffApiKey: Boolean(process.env.STAFF_API_KEY),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
  };

  return NextResponse.json(
    {
      ok: true,
      deployment,
      config,
      db,
      process: {
        startedAt: PROCESS_STARTED_AT,
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        nodeEnv: process.env.NODE_ENV || "development",
      },
      serverTime: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}
