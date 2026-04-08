import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { DashboardOverview } from '../../modules/dashboard/DashboardOverview';

export const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: 'dashboard',
  component: DashboardOverview,
});
