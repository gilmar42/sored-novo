import ProtectedPage from '../_components/ProtectedPage';
import LaborClient from './LaborClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <ProtectedPage>
      <LaborClient />
    </ProtectedPage>
  );
}
