import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { supabaseClient } from '../lib/supabaseClient.js'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabaseClient) return

    // Check if user is already logged in and redirect if admin
    supabaseClient.auth.getSession().then((response) => {
      const session = response?.data?.session
      if (session?.user?.id) {
        checkAdminStatus(session.user.id)
      }
    }).catch((err) => {
      console.error('Error getting session:', err)
    })

    // Listen for auth changes
    let authSubscription = null
    if (supabaseClient) {
      const subscriptionResult = supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (session?.user?.id) {
          checkAdminStatus(session.user.id)
        }
      })
      authSubscription = subscriptionResult?.data?.subscription
    }

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [])

  const checkAdminStatus = async (userId) => {
    if (!supabaseClient) return

    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        return
      }

      if (data?.role === 'admin') {
        navigate('/admin')
      }
    } catch (err) {
      console.error('Error checking admin status:', err)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!supabaseClient) {
      setError('Supabase client not configured')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Check if user is admin
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          throw new Error('Failed to check admin status')
        }

        if (profile?.role === 'admin') {
          navigate('/admin')
        } else {
          setError('Access denied. Admin privileges required.')
          await supabaseClient.auth.signOut()
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to login')
    } finally {
      setIsLoading(false)
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
          <img src="/favicon.jpg" alt="In-Between" className="mark" />
          <div className="masthead-copy">
            <span>In-Between Studio</span>
            <strong>Admin Login</strong>
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
          <h2>Admin Login</h2>
          <p>Access the admin panel.</p>
        </div>

        <form onSubmit={handleLogin} style={{ maxWidth: '400px', marginTop: '5px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #E7E4E6',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #E7E4E6',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: '20px', padding: '12px', background: '#fee', color: '#c33', borderRadius: '8px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                background: '#2434ab',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </motion.section>

      <footer className="credit">Map © Mapbox · OpenStreetMap</footer>
    </div>
  )
}

