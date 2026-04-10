import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import './styles.css';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { queryClient } from './lib/query-client';
import { router } from './router';

// Apply persisted theme before first render to avoid flash
const storedTheme = (() => {
  try { return JSON.parse(localStorage.getItem('theme') || '{}').state?.theme ?? 'dark'; }
  catch { return 'dark'; }
})();
document.documentElement.classList.add(storedTheme);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
