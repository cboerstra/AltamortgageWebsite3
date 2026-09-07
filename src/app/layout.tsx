import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { COMPANY } from "@/lib/constants";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileCTABar } from "@/components/layout/mobile-cta-bar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans-var", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-display-var", weight: ["400", "500", "700"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://altamortgagegroup.net"),
  title: { default: "Alta Mortgage Group | Utah Mortgage Lender", template: "%s | Alta Mortgage Group | Utah Mortgage Lender" },
  description: "Alta Mortgage Group is a trusted Utah mortgage lender serving Weber and Davis counties. Purchase, refinance, and home equity loans in Ogden, Layton, Bountiful, and surrounding areas.",
  keywords: ["Utah mortgage lender", "home loans Utah", "mortgage rates Ogden", "refinance Weber County", "FHA loans Utah", "VA loans Utah", "first time home buyer Utah", "Davis County mortgage"],
  openGraph: { type: "website", locale: "en_US", siteName: COMPANY.name },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <head>
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');` }} />
        )}
      </head>
      <body className="font-sans">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-navy focus:text-white focus:px-4 focus:py-2 focus:rounded-md">Skip to main content</a>
        <Header />
        <main id="main-content" className="pb-20 lg:pb-0">{children}</main>
        <Footer />
        <MobileCTABar />
      </body>
    </html>
  );
}
