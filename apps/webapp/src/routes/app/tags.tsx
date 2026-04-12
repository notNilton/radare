import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { lazyRouteComponent } from '../../components/Route/LazyRoute';

const TagsManagerRoute = lazyRouteComponent(
  () => import('./tags/TagsManager').then((module) => ({
    default: module.TagsManager,
  })),
  'tags',
);

export const tagsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: 'tags',
  component: TagsManagerRoute,
});
