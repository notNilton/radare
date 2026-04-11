import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { lazyRouteComponent } from '../../components/Route/LazyRoute';

const ReconciliationWorkspaceRoute = lazyRouteComponent(
  () => import('../../modules/reconciliation/ReconciliationWorkspace').then((module) => ({
    default: module.ReconciliationWorkspace,
  })),
  'reconciliação',
  'canvas',
);

export const homeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: ReconciliationWorkspaceRoute,
});
