import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    const { hasError } = (this as any).state;
    const { fallback, children } = (this as any).props;

    if (hasError) {
      return (fallback as any) || (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-6 bg-red-500/5 rounded-2xl border border-red-500/20 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
          <h2 className="text-sm font-black text-white uppercase mb-2">Ops! Algo deu errado.</h2>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 text-xs font-bold text-vibe-neon-blue uppercase"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recarregar Página</span>
          </button>
        </div>
      );
    }

    return children;
  }
}
