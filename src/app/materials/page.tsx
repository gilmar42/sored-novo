import ProtectedPage from '../_components/ProtectedPage';
import MaterialsClient from './MaterialsClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <ProtectedPage>
      <MaterialsClient />
    </ProtectedPage>
  );
}
