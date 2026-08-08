import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

// Renders the error on screen instead of letting React unmount the whole
// tree into a blank page (needed to diagnose in-app wallet browsers where
// we have no devtools access).
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      const err = this.state.error
      return (
        <pre style={{ color: '#ff6b6b', padding: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12 }}>
          {`Something went wrong:\n${err.name}: ${err.message}\n\n${err.stack ?? ''}`}
        </pre>
      )
    }
    return this.props.children
  }
}
