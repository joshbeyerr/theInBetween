import { motion } from 'framer-motion'
import { AppHeader } from '../components/AppHeader'
import './Login.css'

export default function Login() {
  return (
    <div className="login-page">
      <AppHeader />
      
      <motion.main
        className="login-main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="login-container">
          {/* Title Section with Funky Alignment */}
          <motion.div
            className="login-title-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="login-title-small"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              account
            </motion.div>
            <motion.h1
              className="login-title-main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              Login
            </motion.h1>
          </motion.div>

          {/* Content Section */}
          <motion.div
            className="login-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.p
              className="login-intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              Authentication coming soon. Sign in will give you access to deeper insights on spaces, user reviews, and more features.
            </motion.p>

            <motion.div
              className="login-coming-soon"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="login-coming-soon-icon"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut"
                }}
              >
                ⏳
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.3 }}
              >
                Coming soon
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}
