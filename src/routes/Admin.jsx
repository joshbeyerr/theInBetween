import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { supabaseClient } from '../lib/supabaseClient.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export default function Admin() {
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    industry: '',
    vibes: '',
    pricing: '',
    price: '',
    website: '',
    contact: '',
    lat: '',
    long: '',
  })

  const [hours, setHours] = useState({
    monday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
    tuesday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
    wednesday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
    thursday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
    friday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
    saturday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
    sunday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: null, message: '' })
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [autoFilled, setAutoFilled] = useState(false)
  const [placeSuggestions, setPlaceSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchTimeoutRef = useRef(null)
  const nameInputRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabaseClient) {
        setIsCheckingAuth(false)
        return
      }

      try {
        const response = await supabaseClient.auth.getSession()
        const session = response?.data?.session
        
        if (!session) {
          navigate('/admin-login')
          return
        }

        // Check if user has admin role
        const { data: profile, error } = await supabaseClient
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()

        if (error || profile?.role !== 'admin') {
          navigate('/admin-login')
          return
        }

        setIsAuthenticated(true)
      } catch (err) {
        console.error('Auth check failed:', err)
        navigate('/admin-login')
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    let authSubscription = null
    if (supabaseClient) {
      const subscriptionResult = supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          navigate('/admin-login')
        }
      })
      authSubscription = subscriptionResult?.data?.subscription
    }

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleHoursChange = (day, field, value) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  const copyHoursToAll = () => {
    const mondayHours = hours.monday
    const newHours = {}
    daysOfWeek.forEach((day) => {
      newHours[day] = { ...mondayHours }
    })
    setHours(newHours)
  }

  // Debounced Google Places search when name changes
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Don't search if name is too short
    if (formData.name.trim().length < 3) {
      setPlaceSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Set up debounced search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/places/search?q=${encodeURIComponent(formData.name)}`)

        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Place search API error:', response.status, errorText)
          setPlaceSuggestions([])
          setShowSuggestions(false)
          return
        }

        const data = await response.json()

        const results = data.results || []
        
        
        if (results.length > 0) {
          console.log('Found places:', results)
          setPlaceSuggestions(results)
          setShowSuggestions(true)
        } else {
          console.log('No places found - hiding suggestions')
          setPlaceSuggestions([])
          setShowSuggestions(false)
        }
      } catch (err) {
        console.error('Place search failed:', err)
        setPlaceSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsSearching(false)
      }
    }, 800) // 800ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [formData.name])

  // Handle selecting a place from suggestions
  const handleSelectPlace = (place) => {
    // Auto-fill fields if they're empty
    setFormData((prev) => ({
      ...prev,
      address: prev.address || place.address || '',
      website: prev.website || place.website || '',
      contact: prev.contact || place.phone || '',
      lat: prev.lat || (place.location?.lat?.toString() || ''),
      long: prev.long || (place.location?.lng?.toString() || ''),
    }))

    // Auto-fill hours if available
    if (place.hours) {
      setHours((prev) => {
        const newHours = { ...prev }
        daysOfWeek.forEach((day) => {
          if (place.hours[day] && (!prev[day].open || !prev[day].close)) {
            newHours[day] = {
              open: prev[day].open || place.hours[day].open || '',
              openAmpm: prev[day].openAmpm || place.hours[day].openAmpm || 'AM',
              close: prev[day].close || place.hours[day].close || '',
              closeAmpm: prev[day].closeAmpm || place.hours[day].closeAmpm || 'PM',
            }
          }
        })
        return newHours
      })
    }

    setShowSuggestions(false)
    setPlaceSuggestions([])
    setAutoFilled(true)
    // Reset auto-filled flag after a delay
    setTimeout(() => setAutoFilled(false), 2000)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleGeocode = async () => {
    if (!formData.address.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please enter an address first' })
      return
    }

    setIsGeocoding(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      const response = await fetch(`${API_BASE_URL}/api/geocode?q=${encodeURIComponent(formData.address)}`)
      if (!response.ok) {
        throw new Error('Geocoding failed')
      }

      const data = await response.json()
      setFormData((prev) => ({
        ...prev,
        lat: data.lat?.toString() || '',
        long: data.lng?.toString() || '',
      }))
      setSubmitStatus({ type: 'success', message: `Found coordinates: ${data.lat}, ${data.lng}` })
    } catch (err) {
      setSubmitStatus({ type: 'error', message: 'Failed to geocode address. You can enter coordinates manually.' })
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      // Parse and format time input
      const parseTime = (timeStr, ampm) => {
        if (!timeStr || !timeStr.trim()) return null
        
        let time = timeStr.trim().toLowerCase()
        
        // Remove any existing am/pm from the string
        time = time.replace(/[ap]m/g, '').trim()
        
        // Parse hour:minute or just hour
        let hour, minute = '00'
        
        if (time.includes(':')) {
          const parts = time.split(':')
          hour = parts[0].trim()
          minute = parts[1].trim() || '00'
        } else {
          hour = time
        }
        
        // Validate and format
        const hourNum = parseInt(hour, 10)
        if (isNaN(hourNum) || hourNum < 1 || hourNum > 12) return null
        
        const minNum = parseInt(minute, 10)
        if (isNaN(minNum) || minNum < 0 || minNum > 59) {
          minute = '00'
        } else {
          minute = String(minNum).padStart(2, '0')
        }
        
        return `${hourNum}:${minute}${ampm.toLowerCase()}`
      }

      // Convert hours to JSON format (null for empty days)
      const hoursData = {}
      let hasAnyHours = false
      daysOfWeek.forEach((day) => {
        const dayHours = hours[day]
        const openTime = parseTime(dayHours.open, dayHours.openAmpm)
        const closeTime = parseTime(dayHours.close, dayHours.closeAmpm)
        
        if (openTime && closeTime) {
          hoursData[day] = `${openTime}-${closeTime}`
          hasAnyHours = true
        } else {
          hoursData[day] = null
        }
      })

      const payload = {
        ...formData,
        hours: hasAnyHours ? hoursData : null,
        price: formData.price ? parseFloat(formData.price) : null,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        long: formData.long ? parseFloat(formData.long) : null,
      }

      const response = await fetch(`${API_BASE_URL}/api/spaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create space')
      }

      const data = await response.json()
      setSubmitStatus({ type: 'success', message: `Space "${data.name}" created successfully!` })
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        industry: '',
        vibes: '',
        pricing: '',
        price: '',
        website: '',
        contact: '',
        lat: '',
        long: '',
      })
      setHours({
        monday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
        tuesday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
        wednesday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
        thursday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
        friday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
        saturday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
        sunday: { open: '', openAmpm: 'AM', close: '', closeAmpm: 'PM' },
      })
      setAutoFilled(false)
    } catch (err) {
      setSubmitStatus({ type: 'error', message: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

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
            <strong>Admin</strong>
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
          <div className="section-label">Admin</div>
          <h2>Add New Space</h2>
          <p>Fill out the form below to add a new space to the directory.</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-grid">
            <div className="admin-form-group admin-form-group-name">
              <label htmlFor="name">
                Name <span className="required">*</span>
                {isSearching && <span className="admin-search-indicator">🔍 Searching...</span>}
              </label>
              <div className="admin-name-input-wrapper">
                <input
                  ref={nameInputRef}
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => {
                    if (placeSuggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  required
                  placeholder="e.g., Maker Space Toronto"
                />
                {showSuggestions && placeSuggestions.length > 0 && (
                  <div ref={suggestionsRef} className="admin-place-suggestions">
                    {placeSuggestions.map((place, idx) => (
                      <button
                        key={place.placeId || `place-${idx}`}
                        type="button"
                        className="admin-place-suggestion-item"
                        onClick={() => handleSelectPlace(place)}
                      >
                        <div className="admin-place-suggestion-name">{place.name}</div>
                        {place.address && (
                          <div className="admin-place-suggestion-address">{place.address}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {autoFilled && (
                <small className="admin-auto-fill-notice">✓ Auto-filled from Google Places</small>
              )}
            </div>

            <div className="admin-form-group">
              <label htmlFor="address">Address</label>
              <div className="admin-form-group-with-button">
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g., 123 Main St, Toronto, ON"
                />
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={isGeocoding || !formData.address.trim()}
                  className="admin-geocode-btn"
                >
                  {isGeocoding ? 'Geocoding...' : 'Get Coordinates'}
                </button>
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="industry">Industry</label>
              <input
                type="text"
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g., Maker Space, Coworking, Studio"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="vibes">Vibes</label>
              <input
                type="text"
                id="vibes"
                name="vibes"
                value={formData.vibes}
                onChange={handleChange}
                placeholder="e.g., Creative, Collaborative, Quiet"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="pricing">Pricing</label>
              <input
                type="text"
                id="pricing"
                name="pricing"
                value={formData.pricing}
                onChange={handleChange}
                placeholder="e.g., $50/day, Membership required"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="price">Price (Numeric)</label>
              <input
                type="number"
                step="0.01"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., 50.00"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="contact">Contact</label>
              <input
                type="text"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="e.g., info@example.com or phone number"
              />
            </div>

            <div className="admin-form-group admin-form-group-full">
              <label>Hours</label>
              <div className="admin-hours-container">
                {daysOfWeek.map((day, index) => (
                  <div key={day} className="admin-hours-row">
                    <div className="admin-hours-day">
                      <span className="admin-hours-day-label">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </span>
                    </div>
                    <div className="admin-hours-time-group">
                      <div className="admin-hours-time-inputs">
                        <input
                          type="text"
                          placeholder={index === 0 ? "9:00" : ""}
                          value={hours[day].open}
                          onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                          className="admin-hours-time-input"
                        />
                        <select
                          value={hours[day].openAmpm}
                          onChange={(e) => handleHoursChange(day, 'openAmpm', e.target.value)}
                          className="admin-hours-ampm"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                      <span className="admin-hours-separator">—</span>
                      <div className="admin-hours-time-inputs">
                        <input
                          type="text"
                          placeholder={index === 0 ? "5:00" : ""}
                          value={hours[day].close}
                          onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                          className="admin-hours-time-input"
                        />
                        <select
                          value={hours[day].closeAmpm}
                          onChange={(e) => handleHoursChange(day, 'closeAmpm', e.target.value)}
                          className="admin-hours-ampm"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="admin-hours-actions">
                        <button
                          type="button"
                          onClick={copyHoursToAll}
                          className="admin-hours-copy-btn"
                          title="Copy Monday hours to all days"
                        >
                          Copy to All
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <small>Leave empty for closed days. Hours will be saved as JSON format.</small>
            </div>

            <div className="admin-form-group">
              <label htmlFor="lat">Latitude</label>
              <input
                type="number"
                step="any"
                id="lat"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                placeholder="e.g., 43.6532"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="long">Longitude</label>
              <input
                type="number"
                step="any"
                id="long"
                name="long"
                value={formData.long}
                onChange={handleChange}
                placeholder="e.g., -79.3832"
              />
            </div>
          </div>

          {submitStatus.message && (
            <div className={`admin-status admin-status-${submitStatus.type}`}>
              {submitStatus.message}
            </div>
          )}

          <div className="admin-form-actions">
            <button type="submit" disabled={isSubmitting} className="admin-submit-btn">
              {isSubmitting ? 'Creating...' : 'Create Space'}
            </button>
          </div>
        </form>
      </motion.section>

      <footer className="credit">Map © Mapbox · OpenStreetMap</footer>
    </div>
  )
}

