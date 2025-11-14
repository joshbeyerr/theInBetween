import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { listSpaces, fetchSpaceById, mapSpace, updateSpaceCoords } from './services/spaces.js'
import { geocodeAddress } from './lib/mapbox.js'

const app = express()
const port = process.env.PORT || 5174

app.use(cors())
app.use(express.json())

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

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception thrown:', err)
})

