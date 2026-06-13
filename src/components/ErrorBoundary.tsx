import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div className="card" style={{ maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Error inesperado</h3>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
              {this.state.error?.message ?? "Algo salió mal."}
            </p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
