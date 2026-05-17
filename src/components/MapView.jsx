import { useEffect, useRef, useState } from 'react'

const JEDDAH_CENTER = { lat: 21.4858, lng: 39.1925 }

export default function MapView({ markers = [], onMarkerClick, zoom = 12, className = '' }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [status, setStatus] = useState('loading') // loading | ready | unavailable

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey || apiKey === 'your_google_maps_api_key') {
      setStatus('unavailable')
      return
    }

    if (window.google?.maps) {
      initMap()
      return
    }

    if (document.getElementById('gmaps-script')) {
      const interval = setInterval(() => {
        if (window.google?.maps) { clearInterval(interval); initMap() }
      }, 100)
      return () => clearInterval(interval)
    }

    const script = document.createElement('script')
    script.id = 'gmaps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.defer = true
    script.onload = initMap
    script.onerror = () => setStatus('unavailable')
    document.head.appendChild(script)
  }, [apiKey]) // eslint-disable-line

  function initMap() {
    if (!mapRef.current) return
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: JEDDAH_CENTER,
      zoom,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
      disableDefaultUI: false,
      gestureHandling: 'cooperative',
    })
    setStatus('ready')
  }

  useEffect(() => {
    if (status !== 'ready' || !mapInstanceRef.current) return

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    if (markers.length === 0) return

    const bounds = new window.google.maps.LatLngBounds()
    markers.forEach(marker => {
      const m = new window.google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map: mapInstanceRef.current,
        title: marker.title,
        animation: window.google.maps.Animation.DROP,
      })
      if (onMarkerClick) {
        m.addListener('click', () => onMarkerClick(marker.id))
      }
      bounds.extend({ lat: marker.lat, lng: marker.lng })
      markersRef.current.push(m)
    })

    if (markers.length > 1) {
      mapInstanceRef.current.fitBounds(bounds)
    } else if (markers.length === 1) {
      mapInstanceRef.current.setCenter({ lat: markers[0].lat, lng: markers[0].lng })
      mapInstanceRef.current.setZoom(15)
    }
  }, [markers, status, onMarkerClick])

  if (status === 'unavailable') {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-100 ${className || 'h-64'}`}>
        <div className="text-4xl mb-3">🗺️</div>
        <p className="font-semibold text-gray-700">Map unavailable</p>
        <p className="text-sm text-gray-500 mt-1">Add a Google Maps API key to enable the map</p>
        {markers.length > 0 && (
          <div className="mt-4 space-y-1">
            {markers.map(m => (
              <button
                key={m.id}
                onClick={() => onMarkerClick?.(m.id)}
                className="block text-sm text-teal-600 hover:text-teal-800"
              >
                📍 {m.title}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className || 'h-64'}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 skeleton" />
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
