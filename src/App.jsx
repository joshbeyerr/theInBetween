import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { motion } from 'framer-motion'
import horizPhoto from './assets/mapPhotos/horizPhoto.jpg'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_DEV_TOKEN_HERE'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''
const DEFAULT_CENTER = [-79.3832, 43.6532]
const DEFAULT_ZOOM = 11

// Load first two images from assets/photos (png/jpg/jpeg/webp/gif)
const photoImports = import.meta.glob('./assets/photos/*.{png,jpg,jpeg,webp,gif}', { eager: true, as: 'url' })
const MASTHEAD_PHOTOS = Object.values(photoImports).slice(0, 5)

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
  const directoryItemRefs = useRef({})

  const [places, setPlaces] = useState([])
  const [selected, setSelected] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mapError, setMapError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [useStaticMap, setUseStaticMap] = useState(false)
  const [staticMapUrl, setStaticMapUrl] = useState(null)

  // Generate static map URL using Mapbox Static Images API
  const generateStaticMap = useCallback((placesToShow) => {
    if (!placesToShow || placesToShow.length === 0) {
      // Default map if no places
      const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${DEFAULT_CENTER[0]},${DEFAULT_CENTER[1]},${DEFAULT_ZOOM}/800x600@2x?access_token=${mapboxgl.accessToken}`
      setStaticMapUrl(url)
      return
    }

    // Calculate bounds to fit all places
    const lngs = placesToShow.map(p => p.lng).filter(Boolean)
    const lats = placesToShow.map(p => p.lat).filter(Boolean)
    
    if (lngs.length === 0 || lats.length === 0) {
      const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${DEFAULT_CENTER[0]},${DEFAULT_CENTER[1]},${DEFAULT_ZOOM}/800x600@2x?access_token=${mapboxgl.accessToken}`
      setStaticMapUrl(url)
      return
    }

    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    
    const centerLng = (minLng + maxLng) / 2
    const centerLat = (minLat + maxLat) / 2
    
    // Calculate zoom level based on bounds
    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    const maxDiff = Math.max(latDiff, lngDiff)
    let zoom = 11
    if (maxDiff > 0.1) zoom = 10
    if (maxDiff > 0.2) zoom = 9
    if (maxDiff < 0.05) zoom = 12
    if (maxDiff < 0.02) zoom = 13

    // Build markers overlay string
    const markers = placesToShow
      .filter(p => p.lat && p.lng)
      .map((p, idx) => {
        const color = palette[p.paletteKey] || palette.default
        // Convert hex to RGB for Mapbox API
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        return `pin-s+${r},${g},${b}(${p.lng},${p.lat})`
      })
      .join(',')

    const baseUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static`
    const overlay = markers ? `${markers}/` : ''
    const url = `${baseUrl}/${overlay}${centerLng},${centerLat},${zoom}/800x600@2x?access_token=${mapboxgl.accessToken}`
    
    setStaticMapUrl(url)
  }, [])

  const focusPlace = useCallback((place, { withPopup = true, animate = true } = {}) => {
    if (!place) return
    setSelected(place)
    
    if (useStaticMap) {
      // For static map, just update selection (can't pan/zoom)
      return
    }
    
    const map = mapRef.current
    if (!map) return

    // Fly to the place location
    map.flyTo({
      center: [place.lng, place.lat],
      zoom: 15, // Zoom in more to ensure individual markers are visible
      essential: true,
      duration: animate ? 800 : 0,
    })

    // Popup will be shown by the selected effect
  }, [useStaticMap])

  useEffect(() => {
    let isMounted = true

    const loadSpaces = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/api/spaces`)
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

    // Check for WebGL support before initializing map
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    
    if (!gl) {
      // Fallback to static map
      setUseStaticMap(true)
      generateStaticMap(places.length > 0 ? places : [])
      setIsLoading(false)
      return
    }

    let map
    try {
      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
        failIfMajorPerformanceCaveat: false, // Allow map to load even on slower devices
      })

      // Handle map errors
      map.on('error', (e) => {
        console.error('Mapbox error:', e)
        if (e.error?.message?.includes('WebGL') || e.error?.message?.includes('ALIASED_POINT_SIZE_RANGE')) {
          // Fallback to static map
          setUseStaticMap(true)
          generateStaticMap(places)
          setIsLoading(false)
        } else {
          setMapError('There was an error loading the map. Please try refreshing the page.')
          setIsLoading(false)
        }
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left')
      map.addControl(new mapboxgl.FullscreenControl(), 'top-left')
      map.addControl(new mapboxgl.GeolocateControl({ trackUserLocation: true }), 'top-left')
      
      // Recenter control
      class RecenterControl {
        onAdd(m) {
          this._map = m
          this._container = document.createElement('div')
          this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
          const btn = document.createElement('button')
          btn.type = 'button'
          btn.setAttribute('aria-label', 'Recenter map')
          btn.innerHTML = '⌖'
          btn.style.fontSize = '16px'
          btn.addEventListener('click', () => {
            const map = this._map
            const ids = Object.keys(markersRef.current || {})
            if (ids.length > 0) {
              const b = new mapboxgl.LngLatBounds()
              ids.forEach((id) => {
                const mk = markersRef.current[id]
                try { b.extend(mk.getLngLat()) } catch {}
              })
              if (!b.isEmpty()) {
                map.fitBounds(b, { padding: 80, duration: 700 })
                return
              }
            }
            map.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 700 })
          })
          this._container.appendChild(btn)
          return this._container
        }
        onRemove() {
          this._container.parentNode && this._container.parentNode.removeChild(this._container)
          this._map = undefined
        }
      }
      map.addControl(new RecenterControl(), 'top-left')

      mapRef.current = map
    } catch (err) {
      console.error('Failed to initialize map:', err)
      if (err.message?.includes('WebGL') || err.message?.includes('ALIASED_POINT_SIZE_RANGE')) {
        // Fallback to static map
        setUseStaticMap(true)
        generateStaticMap(places)
        setIsLoading(false)
        return
      } else {
        setMapError('Failed to load the map. Please try refreshing the page.')
        setIsLoading(false)
        return
      }
    }

    return () => {
      Object.values(markersRef.current).forEach((marker) => {
        try {
          marker.remove()
        } catch (err) {
          console.error('Error removing marker:', err)
        }
      })
      markerElsRef.current = {}
      markersRef.current = {}
      if (popupRef.current) {
        try {
          popupRef.current.remove()
        } catch (err) {
          console.error('Error removing popup:', err)
        }
        popupRef.current = null
      }
      if (mapRef.current) {
        const mapToRemove = mapRef.current
        mapRef.current = null
        try {
          mapToRemove.remove()
        } catch (err) {
          console.error('Error removing map:', err)
        }
      }
    }
  }, [])

  // Regenerate static map when places change and we're using static map
  useEffect(() => {
    if (useStaticMap && places.length > 0) {
      generateStaticMap(places)
    }
  }, [places, useStaticMap, generateStaticMap])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !places.length) return

    const applyMarkers = () => {
      // Remove existing markers
      Object.values(markersRef.current).forEach((marker) => marker.remove())
      markerElsRef.current = {}
      markersRef.current = {}

      // Create HTML pill markers for each place
      places
        .filter((p) => !Number.isNaN(p.lng) && !Number.isNaN(p.lat))
        .forEach((place) => {
          const el = document.createElement('button')
          el.className = 'pill-marker'
          el.textContent = place.name
          el.style.background = '#1c32de'

          el.addEventListener('mouseenter', () => el.classList.add('hover'))
          el.addEventListener('mouseleave', () => el.classList.remove('hover'))
          el.addEventListener('click', (e) => {
            e.stopPropagation()
            focusPlace(place, { withPopup: true, animate: true })
          })

          if (selected?.id === place.id) {
            el.classList.add('active')
          }

          const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([place.lng, place.lat])
            .addTo(map)
          markersRef.current[place.id] = marker
        })


      // Fit bounds
      const bounds = new mapboxgl.LngLatBounds()
      places.forEach((p) => {
        if (!Number.isNaN(p.lng) && !Number.isNaN(p.lat)) {
          bounds.extend([p.lng, p.lat])
        }
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

    return () => {
      // Remove markers
      Object.values(markersRef.current).forEach((marker) => marker.remove())
      markersRef.current = {}
    }
  }, [places, focusPlace])

  // Update selected place visual indicator when using clustering
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selected) {
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      return
    }

    // Remove existing popup
    if (popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }

    // Show popup for selected place
    const popup = new mapboxgl.Popup({ offset: 16, anchor: 'top' })
      .setLngLat([selected.lng, selected.lat])
      .setHTML(`
        <div class="popup">
          <div class="popup-title">${selected.name}</div>
          <div class="popup-sub">${selected.address ?? 'No address provided'}</div>
          <div class="popup-row">
            <span class="chip">${selected.tag ?? 'Space'}</span>
            ${selected.vibes ? `<span class="chip chip-soft">${selected.vibes}</span>` : ''}
            ${selected.url ? `<a class="popup-link" href="${selected.url}" target="_blank" rel="noreferrer">Website</a>` : ''}
          </div>
        </div>
      `)
      .addTo(map)
    popupRef.current = popup

    // Scroll directory item into view
    const directoryItem = directoryItemRefs.current[selected.id]
    if (directoryItem) {
      directoryItem.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'nearest'
      })
    }
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
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('how-we-work')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            How we work
          </a>
          <span style={{ margin: '0 8px', opacity: .35 }}>•</span>
          <a
            href="#submission"
            className="navlink"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('submission')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Submit
          </a>
          <span style={{ margin: '0 8px', opacity: .35 }}>•</span>
          <a href="/login" className="navlink">Login</a>
        </div>
      </motion.header>



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
            Tap a location from the list or the map to zoom in. Each marker reveals a micro-story and a link to
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
            <input
              type="text"
              className="directory-search"
              placeholder="Search spaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="directory-body">
              {error && (
                <div className="directory-error">
                  <strong>Heads up:</strong> {error}
                </div>
              )}
              {!error && places.length > 0 && (
                <ul className="directory-list">
                  {places
                    .filter((place) =>
                      place.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((place, index) => (
                    <motion.li
                      key={place.id}
                      ref={(el) => {
                        if (el) directoryItemRefs.current[place.id] = el
                      }}
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
                  {!isLoading && places.length > 0 && places.filter((place) =>
                    place.name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <li className="directory-empty">No spaces found matching "{searchQuery}"</li>
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
            {useStaticMap && staticMapUrl ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img 
                  src={staticMapUrl} 
                  alt="Map of creative spaces" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }} 
                />
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: 'rgba(0, 0, 0, 0.7)'
                }}>
                  <strong style={{ display: 'block', marginBottom: '4px', color: 'rgba(0, 0, 0, 0.9)' }}>
                    Limited Map Features
                  </strong>
                  Your device is incompatible with our interactive map, so features are limited. You can still browse all spaces using the directory list.
                </div>
              </div>
            ) : mapError ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%', 
                padding: '40px',
                background: '#f9fafb',
                border: '1px solid #E7E4E6',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#dc2626' }}>
                    Map Unavailable
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>
                    {mapError}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div ref={mapContainerRef} className="map" />
                <div className="map-grain" />
              </>
            )}
          </motion.div>
        </motion.div>
      </motion.section>

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

      <motion.section
        id="submission"
        className="section info-section"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="section-heading">
          <div className="section-label">Submit a Space</div>
          <h2>Know a space we should add?</h2>
          <p>
            Found a creative space that should be on the map? Submit it below and we'll review it.
            We'll verify the details and add it to the directory.
          </p>
        </div>

        <SubmissionForm />
      </motion.section>

      <footer className="credit">Map © Mapbox · OpenStreetMap</footer>
    </div>
  )
}

function SubmissionForm() {
  const [formData, setFormData] = useState({
    spaceName: '',
    address: '',
    additionalInfo: '',
    email: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: null, message: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      // Use proxy path if API_BASE_URL is not set (for dev), otherwise use full URL
      const url = API_BASE_URL ? `${API_BASE_URL}/api/submissions` : '/api/submissions'
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      // Check content type before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error(`Server returned ${response.status}. Please make sure the server is running.`)
      }

      if (!response.ok) {
        // Try to parse error, but handle HTML responses
        let errorMessage = 'Failed to submit'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setSubmitStatus({ type: 'success', message: 'Thank you! Your submission has been received. We\'ll review it and get back to you soon.' })
      
      // Reset form
      setFormData({
        spaceName: '',
        address: '',
        additionalInfo: '',
        email: '',
      })
    } catch (err) {
      setSubmitStatus({ type: 'error', message: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="submission-form">
      <div className="submission-form-grid">
        <div className="submission-form-group">
          <label htmlFor="spaceName">
            Space Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="spaceName"
            name="spaceName"
            value={formData.spaceName}
            onChange={handleChange}
            required
            placeholder="e.g., Maker Space Toronto"
          />
        </div>

        <div className="submission-form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g., 123 Main St, Toronto, ON"
          />
        </div>

        <div className="submission-form-group submission-form-group-full">
          <label htmlFor="additionalInfo">Additional Info</label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleChange}
            rows="4"
            placeholder="Vibes, hours, pricing, website, or any other useful information..."
          />
        </div>

        <div className="submission-form-group submission-form-group-full">
          <label htmlFor="email">
            Email <span className="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="your.email@example.com"
          />
          <small>We'll use this to follow up about your submission.</small>
        </div>
      </div>

      {submitStatus.message && (
        <div className={`submission-status submission-status-${submitStatus.type}`}>
          {submitStatus.message}
        </div>
      )}

      <div className="submission-form-actions">
        <button type="submit" disabled={isSubmitting} className="submission-submit-btn">
          {isSubmitting ? 'Submitting...' : 'Submit Space'}
        </button>
      </div>
    </form>
  )
}