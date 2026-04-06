import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Importações de estilos
import 'primereact/resources/themes/saga-blue/theme.css'; // Tema do PrimeReact
import 'primereact/resources/primereact.min.css'; // Estilos principais do PrimeReact
import 'primeicons/primeicons.css'; // Ícones do PrimeReact

// Obtém o elemento raiz do DOM e cria a raiz do React
const rootElement = document.getElementById('root') as HTMLElement;
if (!rootElement) {
  throw new Error('Root element not found');
}

// Cria e renderiza a aplicação
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
