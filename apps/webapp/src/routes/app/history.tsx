import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { lazyRouteComponent } from '../../components/Route/LazyRoute';

export interface HistorySearch {
  status?: string;
  startDate?: string;
  endDate?: string;
}

const HistoryTableRoute = lazyRouteComponent(
  () => import('./history/HistoryTable').then((module) => ({
    default: module.HistoryTable,
  })),
  'historico',
);

export const historyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: 'history',
  component: HistoryTableRoute,
  validateSearch: (search: Record<string, unknown>): HistorySearch => ({
    status: typeof search.status === 'string' ? search.status : undefined,
    startDate: typeof search.startDate === 'string' ? search.startDate : undefined,
    endDate: typeof search.endDate === 'string' ? search.endDate : undefined,
  }),
});
