import { createRoute, redirect } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { lazyRouteComponent } from '../../components/Route/LazyRoute';
import { useAuthStore } from '../../store/AuthStore';
import { getRoleFromToken } from '../../lib/jwt';

const AdminUsersRoute = lazyRouteComponent(
  () => import('./admin/UsersPage').then((module) => ({
    default: module.UsersPage,
  })),
  'admin',
);

export const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: 'admin',
  beforeLoad: () => {
    const token = useAuthStore.getState().token;
    if (getRoleFromToken(token) !== 'admin') {
      throw redirect({ to: '/' });
    }
  },
  component: AdminUsersRoute,
});
