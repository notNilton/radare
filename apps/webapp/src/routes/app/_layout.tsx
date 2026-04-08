import { createRoute, Outlet, redirect } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { useAuthStore } from '../../store/AuthStore';
import { AppShell } from '../../modules/layout/AppShell';

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-layout',
  beforeLoad: () => {
    if (!useAuthStore.getState().token) {
      throw redirect({ to: '/login' });
    }
  },
  component: AppLayout,
});
