import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { HistoryTable } from '../../modules/history/HistoryTable';

export const historyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: 'history',
  component: HistoryTable,
});
