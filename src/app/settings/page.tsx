import ProtectedPage from '../_components/ProtectedPage';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <ProtectedPage>
      <SettingsClient />
    </ProtectedPage>
  );
}
