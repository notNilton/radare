import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { lazyRouteComponent } from '../../components/Route/LazyRoute';

const DashboardOverviewRoute = lazyRouteComponent(
  () => import('../../modules/dashboard/DashboardOverview').then((module) => ({
    default: module.DashboardOverview,
  })),
  'dashboard',
);

export const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: 'dashboard',
  component: DashboardOverviewRoute,
});
