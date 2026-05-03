import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Midas Operations Dashboard",
  description:
    "Onchain operations dashboard for monitoring mTBILL, mBASIS, and Midas protocol activity.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Inter (body + headings) and JetBrains Mono (addresses/code only) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-text-primary font-sans antialiased min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
