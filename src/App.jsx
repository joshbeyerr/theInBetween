import React, { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { motion } from 'framer-motion'

import Hero from './Hero'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_DEV_TOKEN_HERE'

const palette = {
  maker: '#34d399',
  cowork: '#6366f1',
  studio: '#facc15',
  gallery: '#f472b6',
  default: '#60a5fa',
}

const paletteKey = (value) => value?.toLowerCase().replace(/\s+/g, '-') ?? 'default'

export default function App() {
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const markerElsRef = useRef({})
  const markersRef = useRef({})
  const popupRef = useRef(null)

  const [places, setPlaces] = useState([])
  const [selected, setSelected] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const focusPlace = useCallback((place, { withPopup = true, animate = true } = {}) => {
    if (!place) return
    setSelected(place)
    const map = mapRef.current
    if (!map) return

    const showPopup = () => {
      if (popupRef.current) {
        popupRef.current.remove()
      }
      const popup = new mapboxgl.Popup({ offset: 16, anchor: 'top' })
        .setLngLat([place.lng, place.lat])
        .setHTML(`
            <div class="popup">
                <div class="popup-title">${place.name}</div>
                <div class="popup-sub">${place.address ?? 'No address provided'}</div>
                <div class="popup-row">
                    <span class="chip">${place.tag ?? 'Space'}</span>
                        ${place.vibes ? `<span class="chip chip-soft">${place.vibes}</span>` : ''}
                    ${place.url ? `<a class="popup-link" href="${place.url}" target="_blank" rel="noreferrer">Website</a>` : ''}
                </div>
            </div>
        `)
        .addTo(map)
      popupRef.current = popup
    }

    if (animate && withPopup) {
      map.once('moveend', showPopup)
    } else if (withPopup) {
      showPopup()
    }

    map.flyTo({
      center: [place.lng, place.lat],
      zoom: 13,
      essential: true,
      duration: animate ? 800 : 0,
    })
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadSpaces = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/spaces')
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const json = await response.json()
        if (!isMounted) return

        const spaces = json
          .filter((space) => typeof space.lat === 'number' && typeof (space.lng ?? space.long) === 'number')
          .map((space) => {
            const key = paletteKey(space.industry || space.vibes)
            return {
              id: space.id,
              name: space.name ?? 'Untitled Space',
              address: space.address,
              tag: space.industry ?? space.vibes ?? 'Space',
              paletteKey: palette[key] ? key : 'default',
              pricing: space.pricing,
              price: space.price,
              url: space.website,
              contact: space.contact,
              vibes: space.vibes,
              hours: space.hours,
              lat: Number(space.lat),
              lng: Number(space.lng ?? space.long),
            }
          })

        setPlaces(spaces)
        setSelected((prev) => {
          if (prev && spaces.some((item) => item.id === prev.id)) return prev
          return spaces[0] ?? null
        })
      } catch (err) {
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadSpaces()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-79.3832, 43.6532],
      zoom: 11,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left')
    map.addControl(new mapboxgl.FullscreenControl(), 'top-left')
    map.addControl(new mapboxgl.GeolocateControl({ trackUserLocation: true }), 'top-left')

    mapRef.current = map

    return () => {
      Object.values(markersRef.current).forEach((marker) => marker.remove())
      markerElsRef.current = {}
      markersRef.current = {}
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      mapRef.current = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !places.length) return

    const applyMarkers = () => {
      Object.values(markersRef.current).forEach((marker) => marker.remove())
      markerElsRef.current = {}
      markersRef.current = {}

      const bounds = new mapboxgl.LngLatBounds()

      places.forEach((p) => {
        if (Number.isNaN(p.lng) || Number.isNaN(p.lat)) return

        const el = document.createElement('button')
        el.className = 'pill-marker'
        el.textContent = p.name
        el.style.background = palette[p.paletteKey] || palette.default

        el.addEventListener('mouseenter', () => el.classList.add('hover'))
        el.addEventListener('mouseleave', () => el.classList.remove('hover'))
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          focusPlace(p, { withPopup: true, animate: true })
        })

        markerElsRef.current[p.id] = el

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([p.lng, p.lat])
          .addTo(map)

        markersRef.current[p.id] = marker
        bounds.extend([p.lng, p.lat])
      })

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 80, duration: 800 })
      }
    }

    if (map.loaded()) {
      applyMarkers()
    } else {
      map.once('load', applyMarkers)
    }
  }, [places, focusPlace])

  useEffect(() => {
    Object.entries(markerElsRef.current).forEach(([id, el]) => {
      if (selected?.id === id) {
        el.classList.add('active')
      } else {
        el.classList.remove('active')
      }
    })
  }, [selected])

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
        <div className="masthead-right">
          <span>Toronto, Canada</span>
        </div>
      </motion.header>

      <Hero />

      <motion.section
        className="section map-section"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="section-heading">
          <div className="section-label">Directory Map</div>
          <h2>Navigate the creative corridor</h2>
          <p>
            Tap a location from the list or the map to zoom in. Each marker reveals a micro-story and quick link out to
            the space.
          </p>
        </div>

        <motion.div
          className="map-shell"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <aside className="directory">
            <div className="directory-top">
              <h3>Directory</h3>
              <span className="count">{isLoading ? 'Loading…' : `${places.length} spots`}</span>
            </div>
            <div className="directory-body">
              {error && (
                <div className="directory-error">
                  <strong>Heads up:</strong> {error}
                </div>
              )}
              {!error && (
                <ul className="directory-list">
                  {places.map((place, index) => (
                    <motion.li
                      key={place.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.08 + index * 0.05 }}
                    >
                      <motion.button
                        type="button"
                        className={`directory-item${selected?.id === place.id ? ' active' : ''}`}
                        onClick={() => focusPlace(place)}
                        whileHover={{ y: -4, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="directory-item-title">
                          <span className="dot" style={{ background: palette[place.paletteKey] || palette.default }} />
                          {place.name}
                        </div>
                        <div className="directory-item-sub">{place.address ?? 'No address listed'}</div>
                        <div className="directory-item-meta">
                          <span className="chip">{place.tag ?? 'Space'}</span>
                          {place.vibes && <span className="vibes">{place.vibes}</span>}
                          {place.pricing && <span className="pricing">{place.pricing}</span>}
                          {place.url && (
                            <span className="directory-item-link" aria-hidden="true">
                              ↗
                            </span>
                          )}
                        </div>
                      </motion.button>
                    </motion.li>
                  ))}
                  {!isLoading && places.length === 0 && (
                    <li className="directory-empty">No spaces yet — populate the Supabase table to see them here.</li>
                  )}
                </ul>
              )}
            </div>
          </aside>
          <motion.div
            className="map-wrap"
            whileHover={{ scale: 1.01, translateY: -4 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div ref={mapContainerRef} className="map" />
            <div className="map-grain" />
          </motion.div>
        </motion.div>
      </motion.section>

      <footer className="credit">Map © Mapbox · OpenStreetMap</footer>
    </div>
  )
}