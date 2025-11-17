import React from 'react'
import { motion } from 'framer-motion'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <motion.header
            className="masthead"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="masthead-left">
              <div className="mark">TO</div>
              <div className="masthead-copy">
                <span>In-Between Studio</span>
                <strong>Field Notes / 2025</strong>
              </div>
            </div>
          </motion.header>

          <motion.section
            className="section info-section"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="section-heading">
              <div className="section-label">Error</div>
              <h2>Something went wrong</h2>
              <p>
                We're sorry, but something unexpected happened while loading the page.
                {this.state.error?.message && (
                  <span style={{ display: 'block', marginTop: '12px', fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>
                    {this.state.error.message.includes('WebGL') || this.state.error.message.includes('ALIASED_POINT_SIZE_RANGE')
                      ? 'Your device or browser may not support the required graphics features. Please try using a different browser or device.'
                      : 'Please try refreshing the page or contact support if the problem persists.'}
                  </span>
                )}
              </p>
            </div>
            <div style={{ marginTop: '24px' }}>
              <button
                onClick={() => {
                  window.location.reload()
                }}
                style={{
                  padding: '12px 24px',
                  background: '#2434ab',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Reload Page
              </button>
            </div>
          </motion.section>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

