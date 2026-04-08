import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

function RootRouteComponent() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </>
  );
}

export const rootRoute = createRootRoute({
  component: RootRouteComponent,
});
