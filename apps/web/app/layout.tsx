import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { DashboardRail } from "./dashboard-rail";
import "./globals.css";
import "./editor.css";
import { Providers } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Curiosity",
  description: "One workspace for asking, researching, building, and crafting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <Suspense fallback={null}>
            <DashboardRail />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
