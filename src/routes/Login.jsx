import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Login() {
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
            <strong>Login</strong>
          </div>
        </div>
        <div className="masthead-right">
          <Link to="/" className="navlink">Back to Map</Link>
        </div>
      </motion.header>

      <motion.section
        className="section info-section"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="section-heading">
          <div className="section-label">Account</div>
          <h2>Login</h2>
          <p>Authentication coming soon. This page is a placeholder.</p>
        </div>
      </motion.section>

      <footer className="credit">Map © Mapbox · OpenStreetMap</footer>
    </div>
  )
}

