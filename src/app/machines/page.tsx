import MachinesClient from './MachinesClient';
import DashboardProvider from '@/components/DashboardProvider';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <DashboardProvider>
      <MachinesClient />
    </DashboardProvider>
  );
}
