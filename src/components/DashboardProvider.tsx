'use client';

import Sidebar from '@/components/Sidebar';

export default function DashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden pt-4 px-4 sm:px-6 lg:px-8">
        <main className="pb-16 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
}
