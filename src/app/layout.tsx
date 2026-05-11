import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trend Radar | Beauty Intelligence",
  description: "Real-time beauty trend intelligence for HUL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
