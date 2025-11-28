import { motion } from 'framer-motion'
import { AppHeader } from '../components/AppHeader'
import './About.css'

export default function About() {
  return (
    <div className="about-page">
      <AppHeader />
      
      <motion.main
        className="about-main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="about-container">
          {/* Title Section with Funky Alignment */}
          <motion.div
            className="about-title-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="about-title-small"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              about
            </motion.div>
            <motion.h1
              className="about-title-main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              How we
              <br />
              <span className="about-title-accent">operate</span>
            </motion.h1>
          </motion.div>

          {/* Content Section */}
          <motion.div
            className="about-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.p
              className="about-intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              We map Toronto's in‑between places: creative workrooms, maker shops, and shared studios with the goal of making it easier to find your next founding members, collaborators, comfy couch or desk.
            </motion.p>
            <motion.p
              className="about-intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.1 }}
            >
              The directory is alive: curated, lightly opinionated, and constantly evolving.
            </motion.p>
          </motion.div>

          {/* Sections List */}
          <motion.div
            className="about-sections"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <motion.div
              className="about-section-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
            >
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
              >
                Curation
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
              >
                We add spaces with a strong community vibe and transparent access or membership. It's all a vibe check
              </motion.p>
              <div className="about-section-divider"></div>
            </motion.div>

            <motion.div
              className="about-section-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
            >
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.6 }}
              >
                Data
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.7 }}
              >
                Locations are pulled from Supabase and geocoded via Mapbox when needed.
              </motion.p>
              <div className="about-section-divider"></div>
            </motion.div>

            <motion.div
              className="about-section-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.7 }}
              whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
            >
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.8 }}
              >
                Coming Soon
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.9 }}
              >
                People tab (the lore): Because sometimes you need to find the humans before the places. Meet the people actually building these spaces.
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}
