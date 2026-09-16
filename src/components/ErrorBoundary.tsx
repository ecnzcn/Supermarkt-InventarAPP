import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unerwarteter Fehler in der Anwendung', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="error-screen">
          <h1>Etwas ist schiefgelaufen</h1>
          <p>Deine Daten sind lokal auf diesem Gerät gespeichert und bleiben erhalten.</p>
          <button type="button" onClick={this.handleReload}>
            Neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
