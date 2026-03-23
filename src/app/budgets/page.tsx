import BudgetsClient from './BudgetsClient';
import DashboardProvider from '@/components/DashboardProvider';

export const dynamic = 'force-dynamic';

export default function BudgetsPage() {
  return (
    <DashboardProvider>
      <BudgetsClient />
    </DashboardProvider>
  );
}
