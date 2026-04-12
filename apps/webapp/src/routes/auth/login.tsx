import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { useAuthStore } from '../../store/AuthStore';
import { lazyRouteComponent } from '../../components/Route/LazyRoute';

const LoginFormRoute = lazyRouteComponent(
  () => import('./login/LoginForm').then((module) => ({
    default: module.LoginForm,
  })),
  'login',
  'auth',
);

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginFormRoute,
});
