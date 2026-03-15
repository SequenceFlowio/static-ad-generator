import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SequenceFlow — Static Ad Generator",
  description: "Generate production-ready static ad images for any brand.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-block h-6 w-6 rounded bg-[#C7F56F]" />
              <span className="font-semibold tracking-tight">
                SequenceFlow <span className="text-gray-400 font-normal">/ Ad Generator</span>
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
