import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Admin-only crash isolation. An unexpected widget error must never leave
 * the owner staring at a blank page or silently publish invalid settings. */
export default class StudioErrorBoundary extends Component<
  {children: ReactNode; label?: string},
  {error: Error | null; retryCount: number}
> {
  declare readonly props: Readonly<{children: ReactNode; label?: string}>;
  state = {error: null as Error | null, retryCount: 0};

  static getDerivedStateFromError(error: Error) { return {error}; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Jame Studio] Editor widget crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="mx-auto flex min-h-[240px] w-full max-w-xl flex-col justify-center gap-4 border border-rose-300 bg-white p-6 text-stone-800">
          <h2 className="font-serif text-2xl">The editor had a display error.</h2>
          <p className="text-sm leading-6">
            This section could not be displayed. Your published website has not been changed by this error.
            Reload the editor or retry the preview. If you had unsaved edits, they may need to be reapplied.
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer font-semibold">Technical detail for support</summary>
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap bg-stone-100 p-3">
              {this.state.error.message}
            </pre>
          </details>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => window.location.reload()}
              className="rounded border border-stone-300 px-5 py-3 text-xs font-semibold">
              Reload editor
            </button>
          </div>
        </div>
      );
    }
    return <div key={this.state.retryCount} className="contents">{this.props.children}</div>;
  }
}
