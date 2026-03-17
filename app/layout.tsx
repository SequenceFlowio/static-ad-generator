import type { Metadata } from "next";
import "./globals.css";
import MobileBlock from "@/components/MobileBlock";

export const metadata: Metadata = {
  title: "SequenceFlow Ads Generator - On-brand quality ads in minutes",
  description: "Turn any brand into production-ready static ad creatives that convert. AI-powered. No designer needed. Your brand deserves better ads.",
  openGraph: {
    title: "SequenceFlow Ads Generator - On-brand quality ads in minutes",
    description: "Turn any brand into production-ready static ad creatives that convert. AI-powered. No designer needed. Your brand deserves better ads.",
    images: [{ url: "https://ads.sequenceflow.io/opengraph.jpg", width: 2962, height: 1714 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SequenceFlow Ads Generator - On-brand quality ads in minutes",
    description: "Turn any brand into production-ready static ad creatives that convert. AI-powered. No designer needed. Your brand deserves better ads.",
    images: ["https://ads.sequenceflow.io/opengraph.jpg"],
  },
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
