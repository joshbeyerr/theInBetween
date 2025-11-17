import 'dotenv/config'

const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY

if (!googlePlacesApiKey) {
  console.warn('Google Places API key is missing. Set GOOGLE_PLACES_API_KEY in your .env file.')
}

export const searchPlace = async (query, location = 'Toronto, ON, Canada') => {

  if (!googlePlacesApiKey) {
    throw new Error('Google Places API key is not configured')
  }

  if (!query || !query.trim()) {
    throw new Error('Query is required')
  }

  try {
    // First, search for the place using Text Search
    const searchUrl = new URL('https://places.googleapis.com/v1/places:searchText')

    
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googlePlacesApiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.regularOpeningHours,places.location',
      },
      body: JSON.stringify({
        textQuery: `${query} ${location}`,
        maxResultCount: 5,
        languageCode: 'en',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google Places API failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const places = data.places || []

    if (!places || places.length === 0) {
      console.log('No places found in API response')
      return { results: [] }
    }

    // Format all results
    const results = places.map((place) => {
      // Handle displayName - it can be an object with text property or a string
      let placeName = query
      if (place.displayName) {
        if (typeof place.displayName === 'string') {
          placeName = place.displayName
        } else if (place.displayName.text) {
          placeName = place.displayName.text
        }
      }

      const result = {
        placeId: place.id || place.place_id || `place-${Math.random()}`,
        name: placeName,
        address: place.formattedAddress || null,
        website: place.websiteUri || null,
        phone: place.nationalPhoneNumber || null,
        location: place.location ? {
          lat: place.location.latitude,
          lng: place.location.longitude,
        } : null,
      }

      // Parse opening hours from weekdayDescriptions
      if (place.regularOpeningHours?.weekdayDescriptions) {
        const hours = {}
        const dayMap = {
          'Monday': 'monday',
          'Tuesday': 'tuesday',
          'Wednesday': 'wednesday',
          'Thursday': 'thursday',
          'Friday': 'friday',
          'Saturday': 'saturday',
          'Sunday': 'sunday',
        }

        place.regularOpeningHours.weekdayDescriptions.forEach((desc) => {
          // Format: "Monday: 9:00 AM – 5:00 PM" or "Monday: Closed" or "Monday: 9 AM – 5 PM"
          const match = desc.match(/^(\w+):\s*(.+)$/i)
          if (match) {
            const dayName = match[1]
            const hoursStr = match[2].trim()
            const dayKey = dayMap[dayName]

            if (dayKey && hoursStr.toLowerCase() !== 'closed') {
              // Parse various formats: "9:00 AM – 5:00 PM", "9 AM – 5 PM", "9:30AM-5:30PM"
              const timeMatch = hoursStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)\s*[–-]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)/i)
              if (timeMatch) {
                const openHour = timeMatch[1]
                const openMin = timeMatch[2] || '00'
                const openAmpm = timeMatch[3].toUpperCase()
                const closeHour = timeMatch[4]
                const closeMin = timeMatch[5] || '00'
                const closeAmpm = timeMatch[6].toUpperCase()

                hours[dayKey] = {
                  open: `${openHour}:${openMin}`,
                  openAmpm: openAmpm,
                  close: `${closeHour}:${closeMin}`,
                  closeAmpm: closeAmpm,
                }
              }
            }
          }
        })

        if (Object.keys(hours).length > 0) {
          result.hours = hours
        }
      }

      return result
    })

    return { results }
  } catch (err) {
    console.error('Google Places search failed:', err)
    throw err
  }
}

