import { motion } from 'framer-motion'
import horizPhoto from '../assets/mapPhotos/horizPhoto.jpg'

export function InfoSection() {
  return (
    <motion.section
      id="how-we-work"
      className="section info-section"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="section-heading-wrapper">
        <div className="section-heading">
          <div className="section-label">How we work</div>
          <h2>Simple, community‑forward curation</h2>
          <p>
            We keep the list small and useful. If you run a space or think one should be added, reach out!
            We will verify details and pop it on the map.
          </p>
        </div>
        <div className="section-heading-image-wrapper">
          <div className="section-heading-image-bg"></div>
          <img src={horizPhoto} alt="" className="section-heading-image" />
        </div>
      </div>
      <div className="info-grid">
        <div className="info-card">
          <h3>Transparent access</h3>
          <p>We highlight pricing/access upfront so you know what to expect before you visit.</p>
        </div>
        <div className="info-card">
          <h3>Lightweight vibes</h3>
          <p>Each card has a quick "vibes" note to help you pick the right fit.</p>
        </div>
        <div className="info-card">
          <h3>Open data</h3>
          <p>Data lives in Supabase; geocoding is via Mapbox. Easy to extend later.</p>
        </div>
      </div>
    </motion.section>
  )
}

