import ProtectedPage from '../_components/ProtectedPage';
import BudgetsClient from './BudgetsClient';

export const dynamic = 'force-dynamic';

export default function BudgetsPage() {
  return (
    <ProtectedPage>
      <BudgetsClient />
    </ProtectedPage>
  );
}
