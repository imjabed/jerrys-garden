import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean };

export default class StorefrontErrorBoundary extends Component<Props, State> {
  declare readonly props: Readonly<Props>;
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, details: ErrorInfo) {
    console.error('[Storefront] A page failed to render', error, details.componentStack);
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
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()}
            className="bg-stone-900 px-5 py-3 text-xs font-semibold text-white">Reload page</button>
          <a href="/" className="border border-stone-300 px-5 py-3 text-xs font-semibold">Back to shop</a>
        </div>
      </main>
    );
  }
}
