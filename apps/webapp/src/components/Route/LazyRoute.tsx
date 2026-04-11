import { Component, ErrorInfo, ReactNode, Suspense, lazy } from 'react';
import type { ComponentType, CSSProperties } from 'react';

type RouteVariant = 'app' | 'auth' | 'canvas';

interface LazyRouteBoundaryProps {
  children: ReactNode;
  label: string;
  variant: RouteVariant;
}

interface LazyRouteBoundaryState {
  error?: Error;
}

class LazyRouteBoundary extends Component<LazyRouteBoundaryProps, LazyRouteBoundaryState> {
  public state: LazyRouteBoundaryState = {};

  public static getDerivedStateFromError(error: Error): LazyRouteBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route render error:', error, errorInfo);
  }

  public render() {
    if (this.state.error) {
      return (
        <RouteErrorFallback
          error={this.state.error}
          label={this.props.label}
          variant={this.props.variant}
        />
      );
    }

    return this.props.children;
  }
}

export function lazyRouteComponent(
  load: () => Promise<{ default: ComponentType }>,
  label: string,
  variant: RouteVariant = 'app',
) {
  const LazyComponent = lazy(load);

  return function LazyRouteComponent() {
    return (
      <LazyRouteBoundary label={label} variant={variant}>
        <Suspense fallback={<RouteSkeleton label={label} variant={variant} />}>
          <LazyComponent />
        </Suspense>
      </LazyRouteBoundary>
    );
  };
}

function RouteSkeleton({ label, variant }: { label: string; variant: RouteVariant }) {
  if (variant === 'auth') {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10" style={{ background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <SkeletonBlock height={220} />
          <p style={skeletonLabelStyle}>Carregando {label}...</p>
        </div>
      </div>
    );
  }

  if (variant === 'canvas') {
    return (
      <div className="flex h-full flex-col" style={{ background: 'var(--canvas-bg)' }}>
        <div style={{ height: 38, borderBottom: '1px solid var(--border)', background: 'var(--surface)' }} />
        <div className="flex flex-1">
          <div className="flex-1 p-6">
            <SkeletonBlock height="100%" />
          </div>
          <div style={{ width: 240, borderLeft: '1px solid var(--border)', background: 'var(--surface)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <SkeletonLine width={220} height={18} />
        <div style={{ height: 10 }} />
        <SkeletonLine width={420} height={10} />
      </header>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonBlock key={index} height={112} />
        ))}
      </section>
      <SkeletonBlock height={260} />
    </div>
  );
}

function RouteErrorFallback({
  error,
  label,
  variant,
}: {
  error: Error;
  label: string;
  variant: RouteVariant;
}) {
  return (
    <div
      className={variant === 'auth' ? 'grid min-h-screen place-items-center px-4 py-10' : 'grid h-full place-items-center p-6'}
      style={{ background: 'var(--bg)' }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          padding: 24,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          color: 'var(--tx-1)',
        }}
      >
        <p style={{ ...skeletonLabelStyle, marginBottom: 10 }}>Falha ao carregar {label}</p>
        <p style={{ color: 'var(--tx-2)', fontSize: 12, margin: 0 }}>
          Recarregue a página para tentar novamente.
        </p>
        <code style={{ display: 'block', marginTop: 16, color: 'var(--danger)', fontSize: 11 }}>
          {error.message}
        </code>
      </div>
    </div>
  );
}

function SkeletonBlock({ height }: { height: number | string }) {
  return (
    <div
      style={{
        minHeight: height,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        opacity: 0.78,
      }}
    />
  );
}

function SkeletonLine({ height, width }: { height: number; width: number }) {
  return (
    <div
      style={{
        height,
        maxWidth: width,
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
      }}
    />
  );
}

const skeletonLabelStyle: CSSProperties = {
  color: 'var(--tx-3)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  margin: '12px 0 0',
  textTransform: 'uppercase',
};
