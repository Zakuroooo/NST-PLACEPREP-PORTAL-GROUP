import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlacePrep - Admin Portal",
  description: "NST PlacePrep Admin Portal — Manage students, faculty, and placement operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-gray-900" suppressHydrationWarning>
        <Toaster position="top-right" richColors closeButton />
        {children}
      </body>
    </html>
  );
}
