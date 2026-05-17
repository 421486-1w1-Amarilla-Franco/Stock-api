import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface State { error: Error | null }
interface Props { children: ReactNode }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-fallback">
        <div className="error-card">
          <div className="error-icon">
            <AlertTriangle size={28} strokeWidth={1.6} />
          </div>
          <div className="error-title">Algo salió mal en esta pantalla</div>
          <div className="error-desc">
            <code>{this.state.error.message}</code>
          </div>
          <button className="btn btn-primary" onClick={this.reset}>
            Volver a intentar
          </button>
        </div>
      </div>
    );
  }
}
