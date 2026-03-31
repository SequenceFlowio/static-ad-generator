import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0d0d0d]">
      <Sidebar />
      <main className="ml-[240px] flex-1 px-8 py-8">
        <div className="max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
