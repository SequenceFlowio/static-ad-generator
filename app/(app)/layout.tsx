import Sidebar from "@/components/Sidebar";
import { LanguageProvider } from "@/components/LanguageProvider";
import { BrandProvider } from "@/lib/brand-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <BrandProvider>
        <div className="flex min-h-screen bg-gray-50 dark:bg-[#0d0d0d]">
          <Sidebar />
          <main className="ml-[240px] flex-1 px-8 py-8">
            <div className="max-w-5xl mx-auto">{children}</div>
          </main>
        </div>
      </BrandProvider>
    </LanguageProvider>
  );
}
