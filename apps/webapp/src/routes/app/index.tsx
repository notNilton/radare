import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { ReconciliationWorkspace } from '../../modules/reconciliation/ReconciliationWorkspace';

export const homeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: ReconciliationWorkspace,
});
