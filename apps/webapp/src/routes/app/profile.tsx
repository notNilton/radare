import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { ProfileSettings } from '../../modules/profile/ProfileSettings';

export const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: 'profile',
  component: ProfileSettings,
});
