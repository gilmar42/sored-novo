import ClientsClient from './ClientsClient';
import DashboardProvider from '@/components/DashboardProvider';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <DashboardProvider>
      <ClientsClient />
    </DashboardProvider>
  );
}
