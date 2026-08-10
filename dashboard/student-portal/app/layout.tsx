import type { Metadata } from "next";
import { Toaster } from "sonner";
import { SWRProvider } from "@/lib/swr-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlacePrep — NST Interview Intelligence Portal",
  description:
    "India's first structured, data-driven interview preparation portal built exclusively for NST students.",
  keywords: ["placement", "interview preparation", "NST", "PlacePrep"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Toaster position="top-right" richColors closeButton />
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}
