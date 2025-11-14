import 'dotenv/config'

const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.VITE_MAPBOX_TOKEN

if (!mapboxToken) {
  console.warn('Mapbox token missing. Set MAPBOX_ACCESS_TOKEN (preferred) or VITE_MAPBOX_TOKEN.')
}

export const isValidCoord = (value) => typeof value === 'number' && Number.isFinite(value)

export const geocodeAddress = async (query) => {
  if (!mapboxToken) {
    throw new Error('Mapbox access token is not configured')
  }

  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward')
  url.searchParams.set('q', query)
  url.searchParams.set('access_token', mapboxToken)
  url.searchParams.set('limit', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('country', 'CA')

  const response = await fetch(url)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mapbox geocoding failed (${response.status}): ${errorText}`)
  }

  const json = await response.json()


  const feature = json.features?.[0]
  if (!feature) return null

  const geometryCoords = Array.isArray(feature.geometry?.coordinates) ? feature.geometry.coordinates : null
  const centerCoords = Array.isArray(feature.center) ? feature.center : null
  const propCoords = feature.properties?.coordinates

  const lng = Number(
    geometryCoords?.[0] ??
      centerCoords?.[0] ??
      propCoords?.longitude ??
      (Array.isArray(propCoords?.routable_points) ? propCoords.routable_points[0]?.longitude : undefined),
  )
  const lat = Number(
    geometryCoords?.[1] ??
      centerCoords?.[1] ??
      propCoords?.latitude ??
      (Array.isArray(propCoords?.routable_points) ? propCoords.routable_points[0]?.latitude : undefined),
  )

  if (!isValidCoord(lat) || !isValidCoord(lng)) return null

  return {
    lat,
    lng,
    place_name: feature.place_name,
    context: feature.context,
  }
}

