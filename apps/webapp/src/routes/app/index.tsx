import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { lazyRouteComponent } from '../../components/Route/LazyRoute';

const WorkspacePageRoute = lazyRouteComponent(
  () => import('./index/WorkspacePage').then((module) => ({
    default: module.WorkspacePage,
  })),
  'reconciliação',
  'canvas',
);

export const homeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: WorkspacePageRoute,
});
