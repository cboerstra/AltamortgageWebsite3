"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { gaBootstrapScript, isPrivatePath } from "@/lib/analytics";

/** Google Analytics 4 on marketing pages only. See lib/analytics for the rule. */
export function GoogleAnalytics({ id }: { id: string }) {
  const pathname = usePathname();
  if (isPrivatePath(pathname)) return null;

  return (
    <>
      <Script id="google-analytics" strategy="afterInteractive">{gaBootstrapScript(id)}</Script>
      <Script id="google-analytics-tag" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
    </>
  );
}
