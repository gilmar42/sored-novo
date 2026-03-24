import ProtectedPage from '../_components/ProtectedPage';
import MachinesClient from './MachinesClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <ProtectedPage>
      <MachinesClient />
    </ProtectedPage>
  );
}
