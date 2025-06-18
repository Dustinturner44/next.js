'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ClientErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div id="error-boundary-caught">
          <h2>Cache Error Boundary Caught Error</h2>
          <p>Error: {this.state.error?.message || 'Unknown cache error'}</p>
        </div>
      )
    }

    return this.props.children
  }
}
