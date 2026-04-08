import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './routes/__root';
import { loginRoute } from './routes/auth/login';
import { appLayoutRoute } from './routes/app/_layout';
import { homeRoute } from './routes/app/index';
import { dashboardRoute } from './routes/app/dashboard';
import { historyRoute } from './routes/app/history';
import { tagsRoute } from './routes/app/tags';
import { profileRoute } from './routes/app/profile';

const appRouteTree = appLayoutRoute.addChildren([
  homeRoute,
  dashboardRoute,
  historyRoute,
  tagsRoute,
  profileRoute,
]);

const routeTree = rootRoute.addChildren([loginRoute, appRouteTree]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
