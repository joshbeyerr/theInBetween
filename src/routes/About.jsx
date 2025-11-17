import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function About() {
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
            <strong>About Us</strong>
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
          <div className="section-label">About</div>
          <h2>How we operate</h2>
          <p>
            We map Toronto’s in‑between places: creative workrooms, maker shops, and shared studios with the goal of making it easier to find your next collaborator, bench, or desk. 
            <br></br>
            The directory is curated, lightly opinionated, and constantly evolving.
          </p>
        </div>
        <div className="info-grid">
          <motion.div className="info-card" whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
            <h3>Curation</h3>
            <p>We add spaces with a strong community vibe and transparent access or membership.</p>
          </motion.div>
          <motion.div className="info-card" whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
            <h3>Data</h3>
            <p>Locations are pulled from Supabase and geocoded via Mapbox when needed.</p>
          </motion.div>
          <motion.div className="info-card" whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
            <h3>Submissions</h3>
            <p>Soon: a simple form to suggest venues, fixes, or updates.</p>
          </motion.div>
        </div>
      </motion.section>

      <footer className="credit">Map © Mapbox · OpenStreetMap</footer>
    </div>
  )
}

