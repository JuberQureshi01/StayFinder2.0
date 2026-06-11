import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-500">An unexpected error occurred. Please refresh the page.</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-black"
            >
              Refresh Page
            </button>
            <a
              href="/"
              className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Go to Home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
