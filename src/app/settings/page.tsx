import SettingsClient from './SettingsClient';
import DashboardProvider from '@/components/DashboardProvider';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <DashboardProvider>
      <SettingsClient />
    </DashboardProvider>
  );
}
