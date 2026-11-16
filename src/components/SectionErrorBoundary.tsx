import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode; section: string };
type State = { failed: boolean };

export default class SectionErrorBoundary extends Component<Props, State> {
  declare readonly props: Readonly<Props>;
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidCatch(error: Error) {
    console.error(`[Jame Bouquets] ${this.props.section} failed to render:`, error);
  }

  render() {
    if (this.state.failed) return (
      <section role="alert" className="mx-auto w-full max-w-6xl px-5 py-14 text-center">
        <h2 className="font-serif text-2xl text-stone-900">This section is temporarily unavailable</h2>
        <p className="mt-3 text-sm text-stone-600">
          Please refresh this page or contact Jame Bouquets for help with your order.
        </p>
        <button type="button" onClick={() => window.location.reload()}
          className="mt-5 border border-stone-400 px-5 py-3 text-xs font-semibold text-stone-800">
          Try again
        </button>
      </section>
    );
    return this.props.children;
  }
}
