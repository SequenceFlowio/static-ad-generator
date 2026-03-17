import type { Metadata } from "next";
import "./globals.css";
import MobileBlock from "@/components/MobileBlock";

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
      <body>
        <MobileBlock />
        {children}
      </body>
    </html>
  );
}
