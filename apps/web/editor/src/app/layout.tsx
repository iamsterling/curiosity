import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./styles.css";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "Crafty",
  description: "A WASM and WebGPU visual design surface.",
  manifest: "/editor/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/editor/icon.svg", type: "image/svg+xml" },
      { url: "/editor/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/editor/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/editor/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#111126",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
