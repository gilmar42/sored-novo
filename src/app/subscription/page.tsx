import ProtectedPage from '../_components/ProtectedPage';
import SubscriptionClient from './SubscriptionClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <ProtectedPage>
      <SubscriptionClient />
    </ProtectedPage>
  );
}
