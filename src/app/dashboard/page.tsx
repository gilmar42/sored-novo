import DashboardClient from './DashboardClient';
import DashboardProvider from '@/components/DashboardProvider';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <DashboardProvider>
      <DashboardClient />
    </DashboardProvider>
  );
}
