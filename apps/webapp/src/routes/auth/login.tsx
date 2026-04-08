import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { LoginForm } from '../../modules/auth/LoginForm';
import { useAuthStore } from '../../store/AuthStore';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginForm,
});
