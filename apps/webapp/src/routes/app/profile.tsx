import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { lazyRouteComponent } from '../../components/Route/LazyRoute';

const ProfileSettingsRoute = lazyRouteComponent(
  () => import('../../modules/profile/ProfileSettings').then((module) => ({
    default: module.ProfileSettings,
  })),
  'perfil',
);

export const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: 'profile',
  component: ProfileSettingsRoute,
});
