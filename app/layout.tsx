import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Navbar";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Inter (body + headings) and JetBrains Mono (addresses/code only) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-text-primary font-sans antialiased min-h-screen">
        {/* Sidebar + main content side-by-side */}
        <div className="flex min-h-screen">
          <Sidebar />
          {/* Main content — offset to the right of the fixed sidebar */}
          <main className="flex-1 ml-[220px] min-h-screen">
            <div className="max-w-screen-xl mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
