import LaborClient from './LaborClient';
import DashboardProvider from '@/components/DashboardProvider';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <DashboardProvider>
      <LaborClient />
    </DashboardProvider>
  );
}
