import { motion } from 'framer-motion'

export default function Hero() {
    return (
        <section className="hero">
            <motion.div
                className="hero-content"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="eyebrow">The In-Between Project</div>
                <h1>
                    Toronto&apos;s makers & coworking atlas
                    <span>
                        A playful, flat 2D map directory celebrating the creative nooks of the city.
                    </span>
                </h1>
                <p>
                    Built with Mapbox GL JS, React, and a dash of Readymag energy. Scroll to explore the
                    spaces in a single glance, or dive deeper via the directory.
                </p>
            </motion.div>

            <motion.div
                className="hero-blob hero-blob-a"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.85 }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
                className="hero-blob hero-blob-b"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.65 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
            <div className="hero-noise" />
        </section>
    )
}

