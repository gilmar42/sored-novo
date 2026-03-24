import ProtectedPage from '../_components/ProtectedPage';
import ClientsClient from './ClientsClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <ProtectedPage>
      <ClientsClient />
    </ProtectedPage>
  );
}
