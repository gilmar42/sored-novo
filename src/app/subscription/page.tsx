import SubscriptionClient from './SubscriptionClient';
import DashboardProvider from '@/components/DashboardProvider';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <DashboardProvider>
      <SubscriptionClient />
    </DashboardProvider>
  );
}
