'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

const publicRoutes = new Set(['/', '/login', '/register', '/payment-success', '/demo-payment']);

export default function DashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pathname, setPathname] = useState<string | null>(null);

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  if (pathname === null || publicRoutes.has(pathname)) {
    return <>{children}</>;
  }

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
