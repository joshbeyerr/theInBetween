import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { listSpaces, fetchSpaceById, mapSpace, updateSpaceCoords, createSpace } from './services/spaces.js'
import { createSubmission } from './services/submissions.js'
import { geocodeAddress } from './lib/mapbox.js'
import { searchPlace } from './lib/googlePlaces.js'

const app = express()
const port = process.env.PORT || 5174

app.use(cors())
app.use(express.json())

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

app.post('/api/spaces', async (req, res) => {
  try {
    const data = await createSpace(req.body)
    res.status(201).json(mapSpace(data))
  } catch (err) {
    console.error('POST /api/spaces failed:', err)
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

// Auth endpoint to verify admin status
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { accessToken } = req.body

    if (!accessToken) {
      return res.status(401).json({ error: 'No access token provided' })
    }

    // Verify token with Supabase
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Supabase not configured' })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
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

app.listen(port, '0.0.0.0', () => {
  console.log(`API server listening on port ${port}`)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception thrown:', err)
})

