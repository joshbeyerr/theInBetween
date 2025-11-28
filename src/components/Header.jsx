import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

// Load first two images from assets/photos (png/jpg/jpeg/webp/gif)
const photoImports = import.meta.glob('../assets/photos/*.{png,jpg,jpeg,webp,gif}', { eager: true, as: 'url' })
const MASTHEAD_PHOTOS = Object.values(photoImports).slice(0, 5)

export function Header() {
  return (
    <motion.header
      className="masthead"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="masthead-left">
        <Link to="/">
          <img src="/favicon.jpg" alt="In-Between" className="mark" />
        </Link>
        <div className="masthead-copy">
          <span>The In-Between Project</span>
          <strong>Updated November 2025</strong>
        </div>
      </div>
      <div className="masthead-photos">
        {MASTHEAD_PHOTOS.map((src, i) => (
          <img key={i} src={src} alt="" className="masthead-photo" />
        ))}
      </div>
      <div className="masthead-right">
        <a href="/about" className="navlink">About us</a>
        <span style={{ margin: '0 8px', opacity: .35 }}>•</span>
        <a
          href="#how-we-work"
          className="navlink"
        >
          How we work
        </a>
        <span style={{ margin: '0 8px', opacity: .35 }}>•</span>
        <a
          href="#submission"
          className="navlink"
        >
          Submit
        </a>
        <span style={{ margin: '0 8px', opacity: .35 }}>•</span>
        <a href="/login" className="navlink">Login</a>
      </div>
    </motion.header>
  )
}

