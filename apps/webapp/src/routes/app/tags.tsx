import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from './_layout';
import { TagsManager } from '../../modules/tags/TagsManager';

export const tagsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: 'tags',
  component: TagsManager,
});
