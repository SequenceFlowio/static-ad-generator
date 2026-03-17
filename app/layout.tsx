import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SequenceFlow — Static Ad Generator",
  description: "Generate production-ready static ad images for any brand in three steps.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
