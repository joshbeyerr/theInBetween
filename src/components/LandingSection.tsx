import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import characterImage from "../assets/character.png";
import { AppHeader } from "./AppHeader";
import "./LandingSection.css";

interface Circle {
  id: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface Dot {
  id: number;
  x: number;
  y: number;
  pathProgress: number;
}

interface FloatingCharacter {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export function LandingSection() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const hasScrolledToMapRef = useRef(false);
  const progressRef = useRef(0);
  const isLockedRef = useRef(true);

  // Define organic curved path from top center moving downward
  const threadPath = useMemo(() => {
    return "M 50 0 Q 45 12, 48 20 T 52 35 Q 55 45, 50 55 T 48 70 Q 46 80, 50 88 T 52 100";
  }, []);

  // Generate dots positioned along the curved path - these are the final positions
  const dots = useMemo((): Dot[] => {
    return [
      { id: 1, x: 50, y: 5, pathProgress: 0.05 },
      { id: 2, x: 46, y: 15, pathProgress: 0.15 },
      { id: 3, x: 48, y: 23, pathProgress: 0.23 },
      { id: 4, x: 51, y: 32, pathProgress: 0.32 },
      { id: 5, x: 54, y: 42, pathProgress: 0.42 },
      { id: 6, x: 51, y: 52, pathProgress: 0.52 },
      { id: 7, x: 48, y: 62, pathProgress: 0.62 },
      { id: 8, x: 47, y: 72, pathProgress: 0.72 },
      { id: 9, x: 49, y: 82, pathProgress: 0.82 },
      { id: 10, x: 51, y: 92, pathProgress: 0.92 },
      // Additional dots scattered around
      { id: 11, x: 35, y: 18, pathProgress: 0.20 },
      { id: 12, x: 65, y: 28, pathProgress: 0.30 },
      { id: 13, x: 30, y: 45, pathProgress: 0.48 },
      { id: 14, x: 68, y: 58, pathProgress: 0.60 },
      { id: 15, x: 38, y: 75, pathProgress: 0.76 },
      { id: 16, x: 62, y: 85, pathProgress: 0.86 },
    ];
  }, []);

  // Generate multiple circles that will overlay at center
  const circles = useMemo(() => {
    const circleCount = 30;
    const generated: Circle[] = [];
    
    for (let i = 0; i < circleCount; i++) {
      generated.push({
        id: i,
        rotation: Math.random() * 360,
        scaleX: 0.95 + Math.random() * 0.1,
        scaleY: 0.95 + Math.random() * 0.1,
      });
    }
    
    return generated;
  }, []);

  // Generate 12 character options, pick one randomly when hovering
  const allCharacterPositions = useMemo((): FloatingCharacter[] => {
    return Array.from({ length: 12 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 30 - 15,
      scale: 0.6 + Math.random() * 0.6,
    }));
  }, []);

  const [selectedCharacter, setSelectedCharacter] = useState<FloatingCharacter | null>(null);

  // Scroll to map function
  const scrollToMap = useCallback(() => {
    const mapSection = document.querySelector('.map-section-container');
    if (mapSection) {
      const headerHeight = 48; // Header height (thinner)
      const mapTop = (mapSection as HTMLElement).offsetTop - headerHeight;
      window.scrollTo({
        top: mapTop,
        behavior: 'smooth'
      });
    } else {
      // Fallback: scroll to bottom of landing section
      const windowHeight = window.innerHeight;
      window.scrollTo({
        top: windowHeight * 1.5,
        behavior: 'smooth'
      });
    }
  }, []);

  // Handle scroll to track progress - scroll-locked animation effect
  useEffect(() => {
    // Force reset on mount - always start fresh
    setScrollProgress(0);
    progressRef.current = 0;
    hasScrolledToMapRef.current = false;
    isLockedRef.current = true;
    
    const windowHeight = window.innerHeight;
    const animationScrollDistance = windowHeight; // 100vh equivalent scroll distance
    
    // Lock scroll position while animation is in progress
    const lockScroll = () => {
      if (progressRef.current < 1 && window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
    };
    
    // Update progress and sync with state
    const updateProgress = (newProgress: number) => {
      progressRef.current = Math.max(0, Math.min(1, newProgress));
      setScrollProgress(progressRef.current);
      
      // If animation completes, unlock scrolling
      if (progressRef.current >= 1 && isLockedRef.current) {
        isLockedRef.current = false;
        hasScrolledToMapRef.current = true;
      } else if (progressRef.current < 1 && !isLockedRef.current) {
        isLockedRef.current = true;
      }
    };
    
    // Handle wheel events to drive animation progress
    const handleWheel = (e: WheelEvent) => {
      // If animation is complete, allow normal scrolling
      if (!isLockedRef.current) {
        return;
      }
      
      // Prevent default scroll behavior during animation
      e.preventDefault();
      
      // Calculate progress increment based on scroll delta
      const scrollDelta = e.deltaY;
      const progressIncrement = Math.abs(scrollDelta) / animationScrollDistance;
      
      // Update progress based on scroll direction
      if (scrollDelta > 0) {
        // Scrolling down - increase progress
        updateProgress(progressRef.current + progressIncrement * 0.5);
      } else {
        // Scrolling up - decrease progress
        updateProgress(progressRef.current - progressIncrement * 0.5);
      }
      
      // Lock scroll position to top
      lockScroll();
    };
    
    // Handle scroll events to keep position locked
    const handleScroll = () => {
      if (isLockedRef.current) {
        lockScroll();
      }
    };
    
    // Handle touch events for mobile
    let touchStartY = 0;
    let lastProgressUpdate = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (!isLockedRef.current) return;
      touchStartY = e.touches[0].clientY;
      lastProgressUpdate = Date.now();
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isLockedRef.current) return;
      e.preventDefault();
      
      const now = Date.now();
      // Throttle updates to avoid too many state changes
      if (now - lastProgressUpdate < 16) return; // ~60fps
      lastProgressUpdate = now;
      
      const touchCurrentY = e.touches[0].clientY;
      const touchDelta = touchStartY - touchCurrentY;
      const progressIncrement = Math.abs(touchDelta) / animationScrollDistance;
      
      if (touchDelta > 10) {
        // Swiping down - increase progress
        updateProgress(progressRef.current + progressIncrement * 0.8);
        touchStartY = touchCurrentY; // Update reference point
      } else if (touchDelta < -10) {
        // Swiping up - decrease progress
        updateProgress(progressRef.current - progressIncrement * 0.8);
        touchStartY = touchCurrentY; // Update reference point
      }
      
      lockScroll();
    };
    
    // Prevent scroll restoration
    if (history.scrollRestoration) {
      history.scrollRestoration = 'manual';
    }
    
    // Ensure we start at top
    window.scrollTo(0, 0);
    
    // Add event listeners
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  const isActive = scrollProgress > 0;

  // Handle spacebar to complete animation or scroll to map
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't prevent spacebar if user is typing in an input, textarea, or contenteditable element
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable ||
                       target.closest('input, textarea, [contenteditable]');
      
      // Allow spacebar to skip animation or scroll to map
      if (e.code === 'Space' && !isTyping) {
        e.preventDefault();
        
        // If animation is still in progress, complete it first
        if (isLockedRef.current && progressRef.current < 1) {
          progressRef.current = 1;
          setScrollProgress(1);
          isLockedRef.current = false;
          hasScrolledToMapRef.current = true;
        } else {
          // Animation complete, scroll to map
          scrollToMap();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [scrollToMap]);

  // Track mouse position for custom cursor
  // useEffect(() => {
  //   const handleMouseMove = (e: MouseEvent) => {
  //     setMousePosition({ x: e.clientX, y: e.clientY });
  //     // Random rotation on mouse move for variety
  //     setCursorRotation(Math.random() * 360);
  //   };

  //   window.addEventListener("mousemove", handleMouseMove);
  //   return () => window.removeEventListener("mousemove", handleMouseMove);
  // }, []);

  // Pick a random character when hovering a dot
  useEffect(() => {
    if (hoveredDot !== null) {
      const randomChar = allCharacterPositions[Math.floor(Math.random() * allCharacterPositions.length)];
      setSelectedCharacter(randomChar);
    } else {
      setSelectedCharacter(null);
    }
  }, [hoveredDot, allCharacterPositions]);

  // Generate sketchy circle path
  const generateSketchyCircle = (r: number, strokes: number = 3) => {
    const paths: React.ReactElement[] = [];
    for (let i = 0; i < strokes; i++) {
      const offsetR = r + (Math.random() - 0.5) * 3;
      paths.push(
        <ellipse
          key={i}
          cx="50"
          cy="50"
          rx={offsetR + Math.random() * 1.5 - 0.75}
          ry={offsetR + Math.random() * 1.5 - 0.75}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={1.2}
          opacity={0.6 + Math.random() * 0.2}
        />
      );
    }
    return paths;
  };

  return (
    <section 
      ref={sectionRef}
      className="h-[200vh] flex items-start justify-center bg-gray-950 relative overflow-hidden"
    >
      {/* Header Component */}
      <AppHeader scrollProgress={scrollProgress} />

      {/* Main content - sticky/pinned during scroll */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center z-10">
        <div
          className="absolute inset-0 m-[96px]"
        >
          {/* Title - Stacked Vertically */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ 
              opacity: 1 - Math.min(1, scrollProgress * 2), // Fade out in first 50% of scroll
              scale: 1 - Math.min(0.2, scrollProgress * 0.4), // Scale down slightly
            }}
            transition={{ duration: 0 }}
          >
            <div className="text-white" style={{ fontFamily: '"Helvetica Neue", "Helvetica", sans-serif' }}>
              <div style={{ fontSize: '0.75em', fontWeight: 400, marginBottom: '0.1em', letterSpacing: '0.02em', textAlign: 'left' }}>the</div>
              <div style={{ fontSize: '1.3em', fontWeight: 700, lineHeight: '1', marginBottom: '0.05em', letterSpacing: '-0.02em', textAlign: 'left' }}>
                <span style={{ display: 'inline-block', marginRight: '-0.05em' }}>in-</span>
                <span style={{ display: 'inline-block' }}>between</span>
              </div>
              <div style={{ fontSize: '0.75em', fontWeight: 400, letterSpacing: '0.02em', textAlign: 'right' }}>spaces</div>
            </div>
          </motion.div>

          {/* Circles that transform into dots */}
          {circles.map((circle, index) => {
            const targetDot = dots[index % dots.length]; // Map circles to dots
            // Stagger animation based on circle index
            const animationStart = (circle.id / circles.length) * 0.3; // Spread start over first 30% of scroll
            const animationEnd = animationStart + 0.3; // Animation takes 30% of scroll progress
            const animProgress = Math.max(0, Math.min(1, (scrollProgress - animationStart) / (animationEnd - animationStart)));
            const easedProgress = animProgress < 1 ? animProgress * animProgress * (3 - 2 * animProgress) : 1; // Smooth easing
            
            return (
              <motion.div
                key={circle.id}
                className="absolute"
                initial={{
                  left: "50%",
                  top: "50%",
                }}
                animate={{
                  left: `${50 + (targetDot.x - 50) * easedProgress}%`,
                  top: `${50 + (targetDot.y - 50) * easedProgress}%`,
                  scale: 1 - (1 - 0.12) * easedProgress,
                }}
                transition={{
                  duration: 0,
                }}
                style={{
                  x: "-50%",
                  y: "-50%",
                }}
              >
                <svg
                  width="200"
                  height="200"
                  viewBox="0 0 100 100"
                  style={{
                    transform: `rotate(${circle.rotation}deg) scaleX(${circle.scaleX}) scaleY(${circle.scaleY})`,
                  }}
                >
                  {generateSketchyCircle(45, 3)}
                </svg>
              </motion.div>
            );
          })}

          {/* SVG Layer for Thread and Dot Overlays */}
          {scrollProgress > 0.1 && (
            <svg className="absolute inset-0 w-full h-full z-30" style={{ pointerEvents: "none" }}>
              {/* Blue thread path - more prominent */}
              <motion.path
                d={threadPath}
                stroke="#60a5fa"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: Math.max(0, Math.min(1, (scrollProgress - 0.1) / 0.6)), // Draw from 10% to 70% scroll
                  opacity: scrollProgress > 0.1 ? 0.95 : 0,
                }}
                transition={{ duration: 0 }}
                style={{ filter: "drop-shadow(0 0 8px rgba(96, 165, 250, 0.6))" }}
              />

              {/* Blue dot overlays when activated */}
              {dots.map((dot) => {
                // Activate dots based on their path progress, mapped to scroll progress
                const activationProgress = (dot.pathProgress * 0.6) + 0.1; // Map path progress (0-1) to scroll progress (0.1-0.7)
                const isActivated = scrollProgress >= activationProgress;
                const dotAnimProgress = Math.max(0, Math.min(1, (scrollProgress - activationProgress) / 0.1)); // Animate in over 10% scroll
                
                return (
                  <g key={`overlay-${dot.id}`}>
                    {isActivated && (
                      <motion.circle
                        cx={`${dot.x}%`}
                        cy={`${dot.y}%`}
                        r="12"
                        fill="#60a5fa"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: dotAnimProgress,
                          opacity: dotAnimProgress,
                        }}
                        transition={{ duration: 0 }}
                        style={{ 
                          pointerEvents: "all", 
                          cursor: "pointer",
                          filter: "drop-shadow(0 0 6px rgba(96, 165, 250, 0.5))",
                        }}
                        onMouseEnter={() => setHoveredDot(dot.id)}
                        onMouseLeave={() => setHoveredDot(null)}
                      />
                    )}
                    {/* Invisible larger circle for easier hovering */}
                    {isActivated && (
                      <circle
                        cx={`${dot.x}%`}
                        cy={`${dot.y}%`}
                        r="24"
                        fill="transparent"
                        style={{ pointerEvents: "all", cursor: "pointer" }}
                        onMouseEnter={() => setHoveredDot(dot.id)}
                        onMouseLeave={() => setHoveredDot(null)}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* Floating Character Illustration on Dot Hover (only 1) */}
          <AnimatePresence>
            {hoveredDot !== null && selectedCharacter && scrollProgress > 0 && (
              <motion.div
                className="absolute pointer-events-none z-40"
                initial={{ 
                  left: `${selectedCharacter.x}%`,
                  top: `${selectedCharacter.y}%`,
                  opacity: 0,
                  scale: 0.3,
                }}
                animate={{ 
                  left: [
                    `${selectedCharacter.x}%`, 
                    `${selectedCharacter.x + (Math.random() - 0.5) * 15}%`,
                    `${selectedCharacter.x + (Math.random() - 0.5) * 15}%`,
                    `${selectedCharacter.x}%`
                  ],
                  top: [
                    `${selectedCharacter.y}%`, 
                    `${selectedCharacter.y + (Math.random() - 0.5) * 15}%`,
                    `${selectedCharacter.y + (Math.random() - 0.5) * 15}%`,
                    `${selectedCharacter.y}%`
                  ],
                  opacity: [0, 0.85, 0.85, 0.85],
                  scale: [0.3, selectedCharacter.scale, selectedCharacter.scale, selectedCharacter.scale],
                  rotate: [0, selectedCharacter.rotation, -selectedCharacter.rotation, selectedCharacter.rotation],
                }}
                exit={{ 
                  opacity: 0,
                  scale: 0.2,
                  transition: { duration: 0.3 }
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  x: "-50%",
                  y: "-50%",
                }}
              >
                <img
                  src={characterImage}
                  alt=""
                  className="w-40 h-40 object-contain mix-blend-screen"
                  style={{
                    filter: "invert(1) brightness(1.2)",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4"
        animate={{ 
          opacity: scrollProgress > 0.1 ? 0 : 1,
          y: scrollProgress > 0.1 ? 20 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-gray-400 rounded-full flex items-start justify-center p-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-1.5 h-3 bg-gray-400 rounded-full"></div>
        </motion.div>
      </motion.div>

      {/* Scroll to Explore Text */}
      <motion.div 
        className="fixed bottom-8 right-8 z-30"
        animate={{ 
          opacity: scrollProgress > 0.1 ? 0 : 1,
          y: scrollProgress > 0.1 ? 20 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className="text-white/60 text-sm tracking-wide text-right"
          style={{ fontFamily: '"Reddit Mono", monospace' }}
        >
          Scroll to explore... or hit space
        </div>
      </motion.div>


      {/* Custom Cursor - Commented out for now */}
      {/* <motion.div
        className="fixed pointer-events-none z-[9999] mix-blend-screen"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          x: "-50%",
          y: "-50%",
        }}
        animate={{
          rotate: cursorRotation,
          scale: [0.8, 1, 0.8],
        }}
        transition={{
          rotate: { duration: 0.3 },
          scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <img
          src={characterImage}
          alt=""
          className="w-16 h-16 object-contain"
          style={{
            filter: "invert(1) brightness(1.2)",
          }}
        />
      </motion.div> */}
    </section>
  );
}
