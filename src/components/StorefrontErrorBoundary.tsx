import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean; diagnostic: string };

export default class StorefrontErrorBoundary extends Component<Props, State> {
  declare readonly props: Readonly<Props>;
  state: State = { failed: false, diagnostic: '' };

  static getDerivedStateFromError(): State {
    return { failed: true, diagnostic: '' };
  }

  componentDidCatch(error: Error, details: ErrorInfo) {
    console.error('[Storefront] A page failed to render', error, details.componentStack);
    this.setState({ diagnostic: `${error.name}: ${error.message}\n${details.componentStack || ''}`.slice(0, 1600) });
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#FFF8F0] px-6 text-center text-stone-900">
        <p className="text-xs uppercase tracking-[.3em] text-rose-800">Jame Bouquets</p>
        <h1 className="max-w-lg font-serif text-3xl">We couldn't display this page.</h1>
        <p className="max-w-md text-sm leading-6 text-stone-600">
          Your order and account information are not affected. Reload the website
          to try again, or return to the homepage.
        </p>
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug') && (
          <details className="w-full max-w-xl text-left text-xs text-stone-600">
            <summary className="cursor-pointer font-semibold">Technical error details</summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap border border-stone-200 bg-white p-3">{this.state.diagnostic || 'No error details recorded.'}</pre>
          </details>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()}
            className="bg-stone-900 px-5 py-3 text-xs font-semibold text-white">Reload page</button>
          <a href="/" className="border border-stone-300 px-5 py-3 text-xs font-semibold">Back to shop</a>
        </div>
      </main>
    );
  }
}
