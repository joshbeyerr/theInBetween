import { supabase } from '../lib/supabase.js'
import { geocodeAddress, isValidCoord } from '../lib/mapbox.js'

export const mapSpace = (space) => ({
  id: space.id,
  name: space.name,
  address: space.address,
  industry: space.industry,
  vibes: space.vibes,
  pricing: space.pricing,
  price: space.price,
  website: space.website,
  contact: space.contact,
  hours: space.hours,
  lat: space.lat,
  lng: space.long,
  createdAt: space.created_at,
})

const ensureSpaceHasCoords = async (space) => {
  const hasLat = isValidCoord(space.lat)
  const hasLng = isValidCoord(space.long)

  if (hasLat && hasLng) return space
  if (!space.address) return space

  try {
    const result = await geocodeAddress(space.address)
    if (!result) return space

    const { lat, lng } = result

    const { data, error } = await supabase
      .from('spaces')
      .update({ lat, long: lng })
      .eq('id', space.id)
      .select()
      .single()

    if (error) {
      console.error(`Failed to persist coords for space ${space.id}`, error)
      return { ...space, lat, long: lng }
    }

    return data
  } catch (err) {
    console.error(`Geocoding failed for space ${space.id}`, err)
    return space
  }
}

export const listSpaces = async () => {
  if (!supabase) throw new Error('Supabase client not configured')

  const { data, error } = await supabase.from('spaces').select('*').order('created_at', { ascending: false })
  if (error) throw error

  const spaces = data ?? []
  return Promise.all(spaces.map(ensureSpaceHasCoords))
}

export const fetchSpaceById = async (id) => {
  if (!supabase) throw new Error('Supabase client not configured')

  const { data, error } = await supabase.from('spaces').select('*').eq('id', id).single()
  if (error) throw error
  if (!data) return null

  return ensureSpaceHasCoords(data)
}

export const updateSpaceCoords = async (id, lat, lng) => {
  if (!supabase) throw new Error('Supabase client not configured')

  if (!isValidCoord(lat) || !isValidCoord(lng)) {
    throw new Error('lat and lng must be finite numbers')
  }

  const { data, error } = await supabase.from('spaces').update({ lat, long: lng }).eq('id', id).select().single()
  if (error) throw error
  if (!data) return null

  return data
}

export const createSpace = async (spaceData) => {
  if (!supabase) throw new Error('Supabase client not configured')

  const {
    name,
    address,
    industry,
    vibes,
    pricing,
    price,
    website,
    contact,
    hours,
    lat,
    long,
  } = spaceData

  if (!name || !name.trim()) {
    throw new Error('Name is required')
  }

  // Prepare the data object, only including defined fields
  const insertData = {
    name: name.trim(),
    address: address?.trim() || null,
    industry: industry?.trim() || null,
    vibes: vibes?.trim() || null,
    pricing: pricing?.trim() || null,
    price: price != null && price !== '' ? Number(price) : null,
    website: website?.trim() || null,
    contact: contact?.trim() || null,
    hours: hours || null,
    lat: lat != null && lat !== '' ? Number(lat) : null,
    long: long != null && long !== '' ? Number(long) : null,
  }

  // If address is provided but no coordinates, try to geocode
  if (insertData.address && (!isValidCoord(insertData.lat) || !isValidCoord(insertData.long))) {
    try {
      const geocodeResult = await geocodeAddress(insertData.address)
      if (geocodeResult) {
        insertData.lat = geocodeResult.lat
        insertData.long = geocodeResult.lng
      }
    } catch (err) {
      console.warn('Geocoding failed during space creation:', err.message)
      // Continue without coordinates if geocoding fails
    }
  }

  const { data, error } = await supabase.from('spaces').insert(insertData).select().single()

  if (error) throw error
  if (!data) throw new Error('Failed to create space')

  return data
}

