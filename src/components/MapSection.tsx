import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import logoImage from '../assets/logos/3.png';
import { AddSpacePopup } from './AddSpacePopup';
import './MapSection.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_DEV_TOKEN_HERE';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const DEFAULT_CENTER: [number, number] = [-79.3832, 43.6532];
const DEFAULT_ZOOM = 11;

const palette: Record<string, string> = {
  maker: '#34d399',
  cowork: '#6366f1',
  studio: '#facc15',
  gallery: '#f472b6',
  default: '#60a5fa',
};

interface Hours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

interface Place {
  id: string;
  name: string;
  address?: string;
  tag?: string;
  paletteKey: string;
  pricing?: string;
  price?: string;
  url?: string;
  contact?: string;
  vibes?: string;
  hours?: Hours | string;
  lat: number;
  lng: number;
}

export function MapSection() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markerElsRef = useRef<Record<string, HTMLElement>>({});
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const directoryItemRefs = useRef<Record<string, HTMLLIElement>>({});
  const directoryBodyRef = useRef<HTMLDivElement | null>(null);

  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [useStaticMap, setUseStaticMap] = useState(false);
  const [staticMapUrl, setStaticMapUrl] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Only used for fitBounds prevention
  const [isAddSpaceOpen, setIsAddSpaceOpen] = useState(false);
  const [tempMarker, setTempMarker] = useState<mapboxgl.Marker | null>(null);
  const addSpaceControlRef = useRef<{ setOnClick: (handler: () => void) => void } | null>(null);

const paletteKey = (value?: string): string => {
  return value?.toLowerCase().replace(/\s+/g, '-') ?? 'default';
};

const formatHours = (hours?: Hours | string): string => {
  if (!hours) return '';
  if (typeof hours === 'string') return hours;
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const formatted = days
    .map(day => {
      const dayHours = hours[day as keyof Hours];
      if (!dayHours) return null;
      const dayName = day.charAt(0).toUpperCase() + day.slice(1).substring(0, 3);
      return `${dayName}: ${dayHours}`;
    })
    .filter(Boolean)
    .join(', ');
  
  return formatted || 'Hours not specified';
};

  const generateStaticMap = useCallback((placesToShow: Place[]) => {
    if (!placesToShow || placesToShow.length === 0) {
      const url = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${DEFAULT_CENTER[0]},${DEFAULT_CENTER[1]},${DEFAULT_ZOOM}/800x600@2x?access_token=${mapboxgl.accessToken}`;
      setStaticMapUrl(url);
      return;
    }

    const lngs = placesToShow.map((p) => p.lng).filter(Boolean);
    const lats = placesToShow.map((p) => p.lat).filter(Boolean);

    if (lngs.length === 0 || lats.length === 0) {
      const url = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${DEFAULT_CENTER[0]},${DEFAULT_CENTER[1]},${DEFAULT_ZOOM}/800x600@2x?access_token=${mapboxgl.accessToken}`;
      setStaticMapUrl(url);
      return;
    }

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    let zoom = 11;
    if (maxDiff > 0.1) zoom = 10;
    if (maxDiff > 0.2) zoom = 9;
    if (maxDiff < 0.05) zoom = 12;
    if (maxDiff < 0.02) zoom = 13;

    const markers = placesToShow
      .filter((p) => p.lat && p.lng)
      .map((p) => {
        const color = palette[p.paletteKey] || palette.default;
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `pin-s+${r},${g},${b}(${p.lng},${p.lat})`;
      })
      .join(',');

    const baseUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static`;
    const overlay = markers ? `${markers}/` : '';
    const url = `${baseUrl}/${overlay}${centerLng},${centerLat},${zoom}/800x600@2x?access_token=${mapboxgl.accessToken}`;

    setStaticMapUrl(url);
  }, []);

  const focusPlace = useCallback(
    (place: Place, { withPopup = true, animate = true, showDetails = false } = {}) => {
      if (!place) return;
      setSelected(place);
      setShowInfoCard(showDetails); // Only show info card if explicitly requested

      if (useStaticMap) {
        return;
      }

      const map = mapRef.current;
      if (!map) return;

      map.flyTo({
        center: [place.lng, place.lat],
        zoom: 15,
        essential: true,
        duration: animate ? 800 : 0,
      });
    },
    [useStaticMap]
  );

  // Load spaces from API
  useEffect(() => {
    let isMounted = true;

    const loadSpaces = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use proxy path if API_BASE_URL is not set (for dev), otherwise use full URL
        const url = API_BASE_URL ? `${API_BASE_URL}/api/spaces` : '/api/spaces';
        console.log('Fetching spaces from:', url);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const json = await response.json();
        console.log('Received spaces data:', json);
        if (!isMounted) return;

        const spaces: Place[] = json
          .filter(
            (space: any) =>
              typeof space.lat === 'number' &&
              typeof (space.lng ?? space.long) === 'number'
          )
          .map((space: any) => {
            const key = paletteKey(space.industry || space.vibes);
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
            };
          });

        console.log('Processed spaces:', spaces);
        setPlaces(spaces);
        // Don't auto-select any item on initial load
        // User can click items to select them
        setSelected(null);
      } catch (err) {
        console.error('Error loading spaces:', err);
        if (isMounted) {
          setError((err as Error).message);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadSpaces();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      setUseStaticMap(true);
      generateStaticMap(places.length > 0 ? places : []);
      setIsLoading(false);
      return;
    }

    let map: mapboxgl.Map | undefined;
    let resizeTimeout: ReturnType<typeof setTimeout>;
    let handleOrientationChange: (() => void) | undefined;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (map && map.loaded()) {
          try {
            map.resize();
          } catch (err) {
            console.error('Error resizing map:', err);
          }
        }
      }, 150);
    };

    const initializeMap = () => {
      if (!mapContainerRef.current || mapRef.current) return;

      const container = mapContainerRef.current;
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        setTimeout(initializeMap, 100);
        return;
      }

      try {
        map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/dark-v11', // Dark theme map
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          pitch: 0,
          bearing: 0,
          attributionControl: false,
          failIfMajorPerformanceCaveat: false,
        });

        // Prevent the map container from being focusable to avoid auto-scroll
        if (mapContainerRef.current) {
          mapContainerRef.current.setAttribute('tabindex', '-1');
          mapContainerRef.current.style.outline = 'none';
        }

        map.on('error', (e) => {
          console.error('Mapbox error:', e);
          const errorMsg = e.error?.message || e.error?.toString() || '';

          if (
            errorMsg.includes('WebGL') ||
            errorMsg.includes('ALIASED_POINT_SIZE_RANGE') ||
            errorMsg.includes('Failed to initialize WebGL') ||
            errorMsg.includes('Context lost')
          ) {
            setUseStaticMap(true);
            generateStaticMap(places);
            setIsLoading(false);
          } else if (
            errorMsg.includes('token') ||
            errorMsg.includes('authentication') ||
            errorMsg.includes('401') ||
            errorMsg.includes('403')
          ) {
            setMapError(
              'Map authentication error. Please check your Mapbox token.'
            );
            setIsLoading(false);
          } else {
            console.warn('Map error, falling back to static map:', errorMsg);
            setUseStaticMap(true);
            generateStaticMap(places);
            setIsLoading(false);
          }
        });

        map.once('load', () => {
          setIsLoading(false);
          // Mark initial load as complete immediately
          setIsInitialLoad(false);
        });

        handleOrientationChange = () => {
          setTimeout(() => {
            if (map && map.loaded()) {
              try {
                map.resize();
              } catch (err) {
                console.error(
                  'Error resizing map on orientation change:',
                  err
                );
              }
            }
          }, 300);
        };
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);

        map.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'top-left'
        );
        map.addControl(new mapboxgl.FullscreenControl(), 'top-left');
        map.addControl(
          new mapboxgl.GeolocateControl({ trackUserLocation: true }),
          'top-left'
        );

        class RecenterControl {
          _map?: mapboxgl.Map;
          _container?: HTMLDivElement;

          onAdd(m: mapboxgl.Map) {
            this._map = m;
            this._container = document.createElement('div');
            this._container.className =
              'mapboxgl-ctrl mapboxgl-ctrl-group map-recenter-control';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('aria-label', 'Recenter map');
            btn.innerHTML = '⌖';
            btn.style.fontSize = '16px';
            btn.addEventListener('click', () => {
              const map = this._map;
              if (!map) return;
              const ids = Object.keys(markersRef.current || {});
              if (ids.length > 0) {
                const b = new mapboxgl.LngLatBounds();
                ids.forEach((id) => {
                  const mk = markersRef.current[id];
                  try {
                    b.extend(mk.getLngLat());
                  } catch {}
                });
                if (!b.isEmpty()) {
                  map.fitBounds(b, { padding: 80, duration: 700 });
                  return;
                }
              }
              map.flyTo({
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
                duration: 700,
              });
            });
            this._container.appendChild(btn);
            return this._container;
          }

          onRemove() {
            if (this._container?.parentNode) {
              this._container.parentNode.removeChild(this._container);
            }
            this._map = undefined;
          }
        }
        map.addControl(new RecenterControl(), 'top-left');

        // Add Space Button Control
        class AddSpaceControl {
          _map?: mapboxgl.Map;
          _container?: HTMLDivElement;
          _onClick?: () => void;

          onAdd(m: mapboxgl.Map) {
            this._map = m;
            this._container = document.createElement('div');
            this._container.className =
              'mapboxgl-ctrl mapboxgl-ctrl-group map-add-space-control';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('aria-label', 'Add a space');
            btn.innerHTML = '+';
            btn.style.fontSize = '20px';
            btn.style.fontWeight = '300';
            btn.style.lineHeight = '1';
            btn.style.width = '32px';
            btn.style.height = '32px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', () => {
              if (this._onClick) {
                this._onClick();
              }
            });
            this._container.appendChild(btn);
            return this._container;
          }

          onRemove() {
            if (this._container?.parentNode) {
              this._container.parentNode.removeChild(this._container);
            }
            this._map = undefined;
          }

          setOnClick(handler: () => void) {
            this._onClick = handler;
          }
        }
        const addSpaceControl = new AddSpaceControl();
        map.addControl(addSpaceControl, 'top-right');
        addSpaceControlRef.current = addSpaceControl;

        mapRef.current = map;
      } catch (err) {
        console.error('Failed to initialize map:', err);
        const errorMsg = (err as Error).message || (err as Error).toString() || '';

        if (
          errorMsg.includes('WebGL') ||
          errorMsg.includes('ALIASED_POINT_SIZE_RANGE') ||
          errorMsg.includes('Failed to initialize WebGL')
        ) {
          setUseStaticMap(true);
          generateStaticMap(places);
          setIsLoading(false);
          return;
        } else {
          console.warn(
            'Map initialization error, falling back to static map:',
            errorMsg
          );
          setUseStaticMap(true);
          generateStaticMap(places);
          setIsLoading(false);
          return;
        }
      }
    };

    initializeMap();

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      if (handleOrientationChange) {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }

      Object.values(markersRef.current).forEach((marker) => {
        try {
          marker.remove();
        } catch (err) {
          console.error('Error removing marker:', err);
        }
      });
      markerElsRef.current = {};
      markersRef.current = {};
      if (popupRef.current) {
        try {
          popupRef.current.remove();
        } catch (err) {
          console.error('Error removing popup:', err);
        }
        popupRef.current = null;
      }
      if (mapRef.current) {
        const mapToRemove = mapRef.current;
        mapRef.current = null;
        
        try {
          mapToRemove.remove();
        } catch (err) {
          console.error('Error removing map:', err);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (useStaticMap && places.length > 0) {
      generateStaticMap(places);
    }
  }, [places, useStaticMap, generateStaticMap]);

  // Add markers to map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !places.length) return;

    const applyMarkers = () => {
      // Remove markers that no longer exist in places
      Object.keys(markersRef.current).forEach((id) => {
        if (!places.find((p) => p.id === id)) {
          markersRef.current[id].remove();
          delete markersRef.current[id];
          delete markerElsRef.current[id];
        }
      });

      places
        .filter((p) => !Number.isNaN(p.lng) && !Number.isNaN(p.lat))
        .forEach((place) => {
          // Check if marker already exists, if so just update active state
          if (markersRef.current[place.id]) {
            const existingMarker = markersRef.current[place.id];
            const existingEl = existingMarker.getElement() as HTMLElement;
            
            // Update active state without recreating marker
            if (selected?.id === place.id) {
              existingEl.classList.add('active');
            } else {
              existingEl.classList.remove('active');
            }
            return; // Skip creating new marker
          }

          // Create new marker only if it doesn't exist
          const el = document.createElement('button');
          el.className = 'map-marker';
          el.textContent = place.name;
          const color = palette[place.paletteKey] || palette.default;
          el.style.background = color;
          el.style.borderColor = color;

          el.addEventListener('mouseenter', () => el.classList.add('hover'));
          el.addEventListener('mouseleave', () => el.classList.remove('hover'));
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            focusPlace(place, { withPopup: true, animate: true, showDetails: false });
          });

          if (selected?.id === place.id) {
            el.classList.add('active');
          }

          const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([place.lng, place.lat])
            .addTo(map);
          markersRef.current[place.id] = marker;
          markerElsRef.current[place.id] = el;
        });

      // Don't fit bounds on initial load to prevent auto-scroll
      // Only fit bounds when user explicitly interacts (clicks directory item)
      // This prevents the page from scrolling to the map section automatically
      if (!isInitialLoad && places.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        places.forEach((p) => {
          if (!Number.isNaN(p.lng) && !Number.isNaN(p.lat)) {
            bounds.extend([p.lng, p.lat]);
          }
        });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 80, duration: 800 });
        }
      }
    };

    if (map.loaded()) {
      applyMarkers();
    } else {
      map.once('load', applyMarkers);
    }

    return () => {
      // Only clean up if places array changes completely
      // Markers persist when selected changes
    };
  }, [places, focusPlace, selected]); // Keep selected to update active state

  // Scroll directory to selected item
  useEffect(() => {
    if (!selected || !directoryBodyRef.current) return;
    
    const selectedItem = directoryItemRefs.current[selected.id];
    if (!selectedItem) return;

    // Scroll the selected item into view
    selectedItem.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [selected]);

  // Update popup when selected changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      return;
    }

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    const popup = new mapboxgl.Popup({ offset: 16, anchor: 'top' })
      .setLngLat([selected.lng, selected.lat])
      .setHTML(`
        <div class="map-popup">
          <div class="map-popup-title">${selected.name}</div>
          <div class="map-popup-sub">${selected.address ?? 'No address provided'}</div>
          <div class="map-popup-row">
            <span class="map-popup-chip">${selected.tag ?? 'Space'}</span>
            ${selected.vibes ? `<span class="map-popup-chip map-popup-chip-soft">${selected.vibes}</span>` : ''}
            ${selected.url ? `<a class="map-popup-link" href="${selected.url}" target="_blank" rel="noreferrer">Website</a>` : ''}
          </div>
        </div>
      `)
      .addTo(map);
    popupRef.current = popup;
  }, [selected]);

  // Get unique tags for filter
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    places.forEach((place) => {
      if (place.tag) tags.add(place.tag);
    });
    return Array.from(tags).sort();
  }, [places]);

  const filteredPlaces = places.filter((place) => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterTag || place.tag === filterTag;
    return matchesSearch && matchesFilter;
  });

  // Set up add space button click handler
  useEffect(() => {
    if (addSpaceControlRef.current) {
      addSpaceControlRef.current.setOnClick(() => {
        setIsAddSpaceOpen(true);
      });
    }
  }, []);

  // Geocode address
  const handleGeocode = useCallback(async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const url = API_BASE_URL ? `${API_BASE_URL}/api/geocode` : '/api/geocode';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }

      const data = await response.json();
      if (data.lat && data.lng && typeof data.lat === 'number' && typeof data.lng === 'number') {
        // Add temporary marker to map
        const map = mapRef.current;
        if (map && !useStaticMap) {
          // Remove existing temp marker
          if (tempMarker) {
            tempMarker.remove();
          }

          // COMMENTED OUT: Pin marker - not working correctly
          /*
          // Create a proper pin icon SVG - simple teardrop shape
          const pinSvg = `
            <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 0C6.268 0 0 6.268 0 14c0 8 14 26 14 26s14-18 14-26c0-7.732-6.268-14-14-14z" fill="#60a5fa" stroke="#ffffff" stroke-width="1.5"/>
              <path d="M12 26L14 40L16 26" fill="#60a5fa" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
              <circle cx="14" cy="12" r="3.5" fill="#ffffff"/>
            </svg>
          `;

          const el = document.createElement('div');
          el.className = 'map-marker-temp';
          el.innerHTML = pinSvg;
          el.style.width = '28px';
          el.style.height = '40px';
          el.style.cursor = 'pointer';

          // Ensure coordinates are numbers
          const lng = Number(data.lng);
          const lat = Number(data.lat);

          // Create marker with coordinates
          const marker = new mapboxgl.Marker({ 
            element: el, 
            anchor: 'bottom'
          })
            .setLngLat([lng, lat])
            .addTo(map);

          setTempMarker(marker);
          */

          // Ensure coordinates are numbers
          const lng = Number(data.lng);
          const lat = Number(data.lat);

          // Fly to location
          map.flyTo({
            center: [lng, lat],
            zoom: 15,
            duration: 1000,
          });
        }

        return { lat: data.lat, lng: data.lng };
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      throw err;
    }
  }, [tempMarker, useStaticMap]);

  // Handle form submission
  const handleSubmitSpace = useCallback(async (data: {
    spaceName: string;
    address: string;
    additionalInfo: string;
    email: string;
    lat?: number;
    lng?: number;
  }) => {
    try {
      const url = API_BASE_URL ? `${API_BASE_URL}/api/submissions` : '/api/submissions';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spaceName: data.spaceName,
          address: data.address,
          additionalInfo: data.additionalInfo,
          email: data.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit');
      }

      // Remove temporary marker after successful submission
      if (tempMarker) {
        tempMarker.remove();
        setTempMarker(null);
      }
    } catch (err) {
      console.error('Submission error:', err);
      throw err;
    }
  }, [tempMarker]);

  return (
    <motion.section
      className="map-section-container"
      initial={{ opacity: 0, y: 50, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1], 
      }}
      style={{ position: 'relative', zIndex: 10 }}
    >
      <motion.div
        className="map-section-layout"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Directory Sidebar */}
        <motion.aside
          className="map-directory"
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        >
          {/* Count Section */}
          <div className="map-directory-count-wrapper">
            <span className="map-directory-count-text">
              {isLoading ? (
                <span className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              ) : (
                `${filteredPlaces.length} ${filteredPlaces.length === 1 ? 'spot' : 'spots'}${filteredPlaces.length !== places.length ? ` of ${places.length}` : ''}`
              )}
            </span>
          </div>

          <div className="map-directory-search-wrapper">
            <div className="map-directory-search-container">
              <svg
                className="map-search-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="text"
                className="map-directory-search"
                placeholder="Search spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Section - Collapsible */}
          <div className="map-directory-filter-wrapper">
            <div className="map-directory-filter-section">
              <button
                className="map-directory-filter-toggle"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <span className="map-directory-filter-label">Filter by</span>
                <svg
                  className={`map-directory-filter-arrow ${isFilterOpen ? 'open' : ''}`}
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.5 5.25L7 8.75L10.5 5.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <AnimatePresence initial={false}>
                {isFilterOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="map-directory-filter-buttons">
                      <button
                        className={`map-directory-filter-btn ${filterTag === null ? 'active' : ''}`}
                        onClick={() => setFilterTag(null)}
                      >
                        All
                      </button>
                      {uniqueTags.map((tag) => (
                        <button
                          key={tag}
                          className={`map-directory-filter-btn ${filterTag === tag ? 'active' : ''}`}
                          onClick={() => setFilterTag(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="map-directory-body" ref={directoryBodyRef}>
            {error && (
              <div className="map-directory-error">
                <strong>Error:</strong> {error}
              </div>
            )}

            {!error && isLoading && (
              <div className="map-directory-loading">
                <div className="loading-spinner"></div>
                <p>Loading spaces...</p>
              </div>
            )}

            {!error && !isLoading && filteredPlaces.length > 0 && (
              <ul className="map-directory-list">
                <AnimatePresence>
                  {filteredPlaces.map((place, index) => (
                    <motion.li
                      key={place.id}
                      ref={(el) => {
                        if (el) directoryItemRefs.current[place.id] = el!;
                      }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.16, 1, 0.3, 1],
                        delay: index * 0.03,
                      }}
                    >
                      <motion.div
                        className={`map-directory-item ${
                          selected?.id === place.id ? 'active' : ''
                        }`}
                        onClick={() => focusPlace(place, { showDetails: false })}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            focusPlace(place, { showDetails: false });
                          }
                        }}
                      >
                        <div className="map-directory-item-content">
                          <div className="map-directory-item-header">
                            <span
                              className="map-directory-item-dot"
                              style={{
                                background:
                                  palette[place.paletteKey] || palette.default,
                              }}
                            />
                            <span className="map-directory-item-name">
                              {place.name}
                            </span>
                          </div>
                          <div className="map-directory-item-address">
                            {place.address ?? 'No address listed'}
                          </div>
                          <div className="map-directory-item-meta">
                            {place.tag && (
                              <span className="map-directory-tag">
                                {place.tag}
                              </span>
                            )}
                            {place.vibes && (
                              <span className="map-directory-vibes">
                                {place.vibes}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="map-directory-item-details"
                          onClick={(e) => {
                            e.stopPropagation();
                            focusPlace(place, { showDetails: true });
                          }}
                          aria-label="View details"
                          title="View details"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M8 12A4 4 0 1 0 8 4a4 4 0 0 0 0 8zM8 6v4M8 10h.01"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </motion.div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}

            {!error &&
              !isLoading &&
              places.length > 0 &&
              filteredPlaces.length === 0 && (
                <div className="map-directory-empty">
                  No spaces found matching "{searchQuery}"
                </div>
              )}

            {!error && !isLoading && places.length === 0 && (
              <div className="map-directory-empty">
                No spaces available yet.
              </div>
            )}
          </div>
        </motion.aside>

        {/* Map Area */}
        <motion.div
          className="map-area"
          initial={{ x: 50, opacity: 0, filter: "blur(10px)" }}
          whileInView={{ x: 0, opacity: 1, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        >
          {useStaticMap && staticMapUrl ? (
            <div className="map-static-wrapper">
              <img
                src={staticMapUrl}
                alt="Map of creative spaces"
                className="map-static-image"
              />
            </div>
          ) : mapError ? (
            <div className="map-error-state">
              <div className="map-error-content">
                <div className="map-error-title">Map Unavailable</div>
                <div className="map-error-message">{mapError}</div>
              </div>
            </div>
          ) : (
            <>
              <div 
                ref={mapContainerRef} 
                className="map-container"
              />
              {isLoading && (
                <div className="map-loading-overlay">
                  <div className="loading-spinner-large"></div>
                  <p>Loading map...</p>
                </div>
              )}
            </>
          )}

          {/* Info Card Overlay - shown only when details button is clicked */}
          <AnimatePresence>
            {selected && showInfoCard && (
              <motion.div
                className="map-info-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="map-info-card-header">
                  <div className="map-info-card-title-section">
                    <h3 className="map-info-card-title">{selected.name}</h3>
                    <div className="map-info-card-subtitle">
                      {selected.address ?? 'No address provided'}
                    </div>
                  </div>
                  <button
                    className="map-info-card-close"
                    onClick={() => {
                      setShowInfoCard(false);
                      setSelected(null);
                    }}
                    aria-label="Close"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M15 5L5 15M5 5l10 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="map-info-card-content">
                  <div className="map-info-card-tags">
                    {selected.tag && (
                      <span className="map-info-tag">{selected.tag}</span>
                    )}
                    {selected.vibes && (
                      <span className="map-info-tag map-info-tag-secondary">
                        {selected.vibes}
                      </span>
                    )}
                  </div>
                  {selected.hours && (
                    <div className="map-info-card-detail">
                      <span className="map-info-detail-label">Hours:</span>
                      <span className="map-info-detail-value">
                        {formatHours(selected.hours)}
                      </span>
                    </div>
                  )}
                  {selected.pricing && (
                    <div className="map-info-card-detail">
                      <span className="map-info-detail-label">Pricing:</span>
                      <span className="map-info-detail-value">
                        {selected.pricing}
                      </span>
                    </div>
                  )}
                  {selected.url && (
                    <a
                      href={selected.url}
                      target="_blank"
                      rel="noreferrer"
                      className="map-info-card-link"
                    >
                      Visit Website
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M6 12l4-4-4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Space Popup */}
          <AddSpacePopup
            isOpen={isAddSpaceOpen}
            onClose={() => {
              setIsAddSpaceOpen(false);
              if (tempMarker) {
                tempMarker.remove();
                setTempMarker(null);
              }
            }}
            onGeocode={handleGeocode}
            onSubmit={handleSubmitSpace}
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

