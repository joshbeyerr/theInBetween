import React from 'react';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import './AppHeader.css';

interface AppHeaderProps {
  scrollProgress?: number;
}

export function AppHeader({ scrollProgress = 0 }: AppHeaderProps) {
  const showStickyHeader = scrollProgress > 0.8;
  const location = useLocation();
  const isOnLandingPage = location.pathname === '/';

  return (
    <>
      {/* Fixed Header Wordmark - Fades out on scroll (only on landing page) */}
      {isOnLandingPage && (
        <motion.div 
          className="app-header-wordmark"
          initial={{ opacity: 1 }}
          animate={{ opacity: scrollProgress > 0.3 ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
        </motion.div>
      )}

      {/* Sticky Header - Always visible on other pages, fades in on landing page */}
      <motion.header
        className="app-header"
        initial={isOnLandingPage ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
        animate={isOnLandingPage ? {
          opacity: showStickyHeader ? 1 : 0,
          y: showStickyHeader ? 0 : -20,
          pointerEvents: showStickyHeader ? 'auto' : 'none'
        } : {
          opacity: 1,
          y: 0,
          pointerEvents: 'auto'
        }}
        transition={{ duration: 0.4 }}
      >
        <div className="app-header-background"></div>
        <div className="app-header-content">
          <Link to="/" className="app-header-title-link">
            <span className="app-header-title">The In-Between Spaces</span>
          </Link>
          <nav className="app-header-nav">
            <Link to="/about" className="app-header-link">
              About Us
            </Link>
            <Link to="/login" className="app-header-link">
              Login
            </Link>
          </nav>
        </div>
      </motion.header>
    </>
  );
}

