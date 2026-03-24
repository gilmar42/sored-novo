import DashboardProvider from '@/components/DashboardProvider';

export default function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardProvider>{children}</DashboardProvider>;
}
