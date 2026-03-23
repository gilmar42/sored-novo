import MaterialsClient from './MaterialsClient';
import DashboardProvider from '@/components/DashboardProvider';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <DashboardProvider>
      <MaterialsClient />
    </DashboardProvider>
  );
}
