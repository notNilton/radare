import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { lazyRouteComponent } from '../../components/Route/LazyRoute';

const HistoryTableRoute = lazyRouteComponent(
  () => import('../../modules/history/HistoryTable').then((module) => ({
    default: module.HistoryTable,
  })),
  'histórico',
);

export const historyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: 'history',
  component: HistoryTableRoute,
});
