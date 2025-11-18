import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { listSpaces, fetchSpaceById, mapSpace, updateSpaceCoords, createSpace, updateSpace } from './services/spaces.js'
import { createSubmission, listSubmissions } from './services/submissions.js'
import { geocodeAddress } from './lib/mapbox.js'
import { searchPlace } from './lib/googlePlaces.js'

const app = express()
const port = process.env.PORT || 5174

app.use(cors())
app.use(express.json())

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
  try {
    // Get token from Authorization header or request body
    let accessToken = req.headers.authorization?.replace('Bearer ', '')
    if (!accessToken && req.body?.accessToken) {
      accessToken = req.body.accessToken
    }

    if (!accessToken) {
      console.log('Admin auth failed: No access token provided')
      return res.status(401).json({ error: 'No access token provided' })
    }

    // Verify token with Supabase
    // Use service role key for server-side operations, but we can verify tokens with anon key too
    // For token verification, anon key works fine since tokens are issued with it
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.SUPABASE_URL
    // Try service role key first (preferred for server), fallback to anon key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log('Admin auth failed: Supabase not configured')
      console.log('SUPABASE_URL:', supabaseUrl ? 'set' : 'missing')
      console.log('SUPABASE_KEY:', supabaseKey ? 'set' : 'missing')
      return res.status(500).json({ error: 'Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in your .env file.' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
      console.log('Admin auth failed: Invalid or expired token', authError?.message)
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      console.log('Admin auth failed: User is not admin', profileError?.message, profile?.role)
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Attach user info to request for use in route handlers
    req.user = { id: user.id, email: user.email }
    next()
  } catch (err) {
    console.error('Admin auth middleware error:', err)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/spaces', async (_req, res) => {
  try {
    const spaces = await listSpaces()
    res.json(spaces.map(mapSpace))
  } catch (err) {
    console.error('GET /api/spaces failed:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/spaces/:id', async (req, res) => {
  try {
    const data = await fetchSpaceById(req.params.id)
    if (!data) {
      return res.status(404).json({ error: 'Space not found' })
    }

    res.json(mapSpace(data))
  } catch (err) {
    console.error(`GET /api/spaces/${req.params.id} failed:`, err)
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/spaces/:id/coords', async (req, res) => {
  try {
    const { lat, lng } = req.body ?? {}
    const data = await updateSpaceCoords(req.params.id, lat, lng)
    if (!data) {
      return res.status(404).json({ error: 'Space not found' })
    }

    res.json(mapSpace(data))
  } catch (err) {
    console.error(`PATCH /api/spaces/${req.params.id}/coords failed:`, err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/spaces', requireAdmin, async (req, res) => {
  try {
    const data = await createSpace(req.body)
    res.status(201).json(mapSpace(data))
  } catch (err) {
    console.error('POST /api/spaces failed:', err)
    res.status(400).json({ error: err.message })
  }
})

app.patch('/api/spaces/:id', requireAdmin, async (req, res) => {
  try {
    console.log(`PATCH /api/spaces/${req.params.id} - Updating space`)
    const data = await updateSpace(req.params.id, req.body)
    if (!data) {
      return res.status(404).json({ error: 'Space not found' })
    }
    res.json(mapSpace(data))
  } catch (err) {
    console.error(`PATCH /api/spaces/${req.params.id} failed:`, err)
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/geocode', async (req, res) => {
  try {
    const query = req.query.q?.toString().trim()

    if (!query) {
      return res.status(400).json({ error: 'Missing address query param "q"' })
    }

    const result = await geocodeAddress(query)
    if (!result) {
      return res.status(404).json({ error: 'No results found for that address' })
    }

    res.json({
      query,
      ...result,
    })
  } catch (err) {
    console.error('GET /api/geocode failed:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/places/search', async (req, res) => {
  try {
    const query = req.query.q?.toString().trim()
    const location = req.query.location?.toString() || 'Toronto, ON, Canada'

    if (!query) {
      return res.status(400).json({ error: 'Missing query param "q"' })
    }

 
    const result = await searchPlace(query, location)
    
    // Always return results, even if empty array
    res.json(result || { results: [] })
  } catch (err) {
    console.error('GET /api/places/search failed:', err)
    // Return empty results instead of error so frontend can handle gracefully
    res.json({ results: [] })
  }
})

app.post('/api/submissions', async (req, res) => {
  try {
    const data = await createSubmission(req.body)
    res.status(201).json({ success: true, id: data.id })
  } catch (err) {
    console.error('POST /api/submissions failed:', err)
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/submissions', requireAdmin, async (_req, res) => {
  try {
    const submissions = await listSubmissions()
    res.json(submissions)
  } catch (err) {
    console.error('GET /api/submissions failed:', err)
    res.status(500).json({ error: err.message })
  }
})

// Auth endpoint to verify admin status
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { accessToken } = req.body

    if (!accessToken) {
      return res.status(401).json({ error: 'No access token provided' })
    }

    // Verify token with Supabase
    // Use service role key for server-side operations, but we can verify tokens with anon key too
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.SUPABASE_URL
    // Try service role key first (preferred for server), fallback to anon key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in your .env file.' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    res.json({ success: true, user: { id: user.id, email: user.email } })
  } catch (err) {
    console.error('POST /api/auth/verify failed:', err)
    res.status(500).json({ error: err.message })
  }
})

// 404 handler for unmatched routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`)
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`API server listening on port ${port}`)
  console.log('Registered routes:')
  console.log('  POST /api/spaces (admin)')
  console.log('  PATCH /api/spaces/:id (admin)')
  console.log('  GET /api/submissions (admin)')
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception thrown:', err)
})

