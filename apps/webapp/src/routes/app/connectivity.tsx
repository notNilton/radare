import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { lazyRouteComponent } from '../../components/Route/LazyRoute';

const ConnectivityRoute = lazyRouteComponent(
  () => import('./connectivity/ConnectivityPage').then((module) => ({
    default: module.ConnectivityPage,
  })),
  'conectividade',
);

export const connectivityRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: 'connectivity',
  component: ConnectivityRoute,
});
