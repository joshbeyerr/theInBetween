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

export const listSpaces = async () => {
  if (!supabase) throw new Error('Supabase client not configured')

  const { data, error } = await supabase.from('spaces').select('*').order('created_at', { ascending: false })
  if (error) throw error

  return data ?? []
}

export const fetchSpaceById = async (id) => {
  if (!supabase) throw new Error('Supabase client not configured')

  const { data, error } = await supabase.from('spaces').select('*').eq('id', id).single()
  if (error) throw error
  if (!data) return null

  return data
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

export const updateSpace = async (id, spaceData) => {
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
  const updateData = {
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
  if (updateData.address && (!isValidCoord(updateData.lat) || !isValidCoord(updateData.long))) {
    try {
      const geocodeResult = await geocodeAddress(updateData.address)
      if (geocodeResult) {
        updateData.lat = geocodeResult.lat
        updateData.long = geocodeResult.lng
      }
    } catch (err) {
      console.warn('Geocoding failed during space update:', err.message)
      // Continue without coordinates if geocoding fails
    }
  }

  const { data, error } = await supabase.from('spaces').update(updateData).eq('id', id).select().single()

  if (error) throw error
  if (!data) throw new Error('Failed to update space')

  return data
}

