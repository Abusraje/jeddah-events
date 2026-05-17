import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import CafeCard from '../components/CafeCard'
import MapView from '../components/MapView'
import { getCafes } from '../api/cafes'

const FILTER_CHIPS = [
  { label: 'Work-friendly', value: 'Work-friendly' },
  { label: 'Specialty Coffee', value: 'Specialty Coffee' },
  { label: 'Outdoor Seating', value: 'Outdoor Seating' },
  { label: 'Late Night', value: 'Late Night' },
  { label: 'Hidden Gems', value: 'Hidden Gems' },
]

export default function CafeFinderPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [cafes, setCafes] = useState([])
  const [loading, setLoading] = useState(true)
  const [highlightId, setHighlightId] = useState(null)
  const listRef = useRef(null)

  const activeTags = searchParams.getAll('tag')
  const searchQuery = searchParams.get('q') || ''

  useEffect(() => {
    setLoading(true)
    getCafes({ tags: activeTags, search: searchQuery }).then(data => {
      setCafes(data)
      setLoading(false)
    })
  }, [searchParams]) // eslint-disable-line

  const toggleTag = (tag) => {
    const params = Object.fromEntries(searchParams.entries())
    const tags = searchParams.getAll('tag')
    const newParams = new URLSearchParams()
    if (params.q) newParams.set('q', params.q)
    if (tags.includes(tag)) {
      tags.filter(t => t !== tag).forEach(t => newParams.append('tag', t))
    } else {
      [...tags, tag].forEach(t => newParams.append('tag', t))
    }
    setSearchParams(newParams)
  }

  const mapMarkers = cafes
    .filter(c => c.latitude && c.longitude)
    .map(c => ({ lat: c.latitude, lng: c.longitude, title: c.name, id: c.id }))

  const handleMarkerClick = (cafeId) => {
    setHighlightId(cafeId)
    const el = document.getElementById(`cafe-${cafeId}`)
    if (el && listRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    setTimeout(() => setHighlightId(null), 3000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Cafe Finder</h1>
        <p className="text-gray-500">Discover the best cafes in Jeddah</p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => toggleTag(chip.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTags.includes(chip.value)
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-600'
            }`}
          >
            {chip.label}
          </button>
        ))}
        {activeTags.length > 0 && (
          <button
            onClick={() => setSearchParams({})}
            className="px-4 py-2 rounded-full text-sm text-gray-500 hover:text-red-500 border border-dashed border-gray-300"
          >
            Clear ✕
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {loading ? 'Loading…' : `${cafes.length} cafe${cafes.length !== 1 ? 's' : ''} found`}
      </p>

      {/* Split layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Map - top on mobile, right on desktop */}
        <div className="order-first lg:order-last lg:w-3/5 lg:sticky lg:top-24 lg:self-start">
          <MapView
            markers={mapMarkers}
            onMarkerClick={handleMarkerClick}
            className="h-64 sm:h-96 lg:h-[calc(100vh-180px)] rounded-2xl"
          />
        </div>

        {/* Cafe list */}
        <div ref={listRef} className="lg:w-2/5 space-y-4 overflow-y-auto lg:max-h-[calc(100vh-180px)]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card">
                <div className="h-44 skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-5 skeleton rounded w-3/4" />
                  <div className="h-3 skeleton rounded w-1/2" />
                </div>
              </div>
            ))
          ) : cafes.length > 0 ? (
            cafes.map(cafe => (
              <CafeCard
                key={cafe.id}
                cafe={cafe}
                highlight={highlightId === cafe.id}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <div className="text-5xl mb-3">☕</div>
              <p className="font-medium">No cafes found</p>
              <p className="text-sm mt-1">Try different filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
