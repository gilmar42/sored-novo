import ProtectedPage from '../_components/ProtectedPage';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <ProtectedPage>
      <DashboardClient />
    </ProtectedPage>
  );
}
