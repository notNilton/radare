import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4 text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Algo deu errado.</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            Desculpe o transtorno. Ocorreu um erro inesperado na aplicação.
          </p>
          <div className="bg-white p-4 rounded shadow-inner mb-8 text-left overflow-auto max-w-full">
            <code className="text-sm text-red-500">{this.state.error?.message}</code>
          </div>
          <button
            type="button"
            className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
