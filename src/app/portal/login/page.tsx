import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/portal/login-form";
import { currentBorrower } from "@/lib/portal/session";
import { Icons } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Sign in to your application",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortalLoginPage() {
  // Already signed in? Straight to the portal.
  if (await currentBorrower()) redirect("/portal");

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Icons.secure className="h-4 w-4" /> Secure sign-in
      </div>
      <h1 className="mt-3 text-3xl font-bold text-navy">Your application</h1>
      <p className="mt-2 text-text-muted">
        Check your application status, finish an application you started, and upload the documents we need.
      </p>
      <div className="mt-8 rounded-xl border border-border bg-white p-6 shadow-sm">
        <LoginForm />
      </div>
    </div>
  );
}
