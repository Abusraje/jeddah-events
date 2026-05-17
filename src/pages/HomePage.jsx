import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import EventCard from '../components/EventCard'
import CafeCard from '../components/CafeCard'
import { getFeaturedEvents } from '../api/events'
import { getCafes } from '../api/cafes'

const CATEGORIES = [
  { label: 'Cinema', icon: '🎬', path: '/cinema' },
  { label: 'Cafes', icon: '☕', path: '/cafes' },
  { label: 'Comedy', icon: '😂', path: '/events?category=Comedy' },
  { label: 'Art', icon: '🎨', path: '/events?category=Art' },
  { label: 'Music', icon: '🎵', path: '/events?category=Music' },
  { label: 'Workshops', icon: '🔧', path: '/events?category=Workshop' },
]

function EventSkeleton() {
  return (
    <div className="card shrink-0 w-72">
      <div className="h-48 skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-4 skeleton rounded w-1/3" />
        <div className="h-5 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="h-3 skeleton rounded w-2/3" />
      </div>
    </div>
  )
}

function CafeSkeleton() {
  return (
    <div className="card shrink-0 w-64">
      <div className="h-44 skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-5 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="h-3 skeleton rounded w-2/3" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [featuredEvents, setFeaturedEvents] = useState([])
  const [cafes, setCafes] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingCafes, setLoadingCafes] = useState(true)

  useEffect(() => {
    getFeaturedEvents().then(data => {
      setFeaturedEvents(data)
      setLoadingEvents(false)
    })
    getCafes({}).then(data => {
      setCafes(data.slice(0, 6))
      setLoadingCafes(false)
    })
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative min-h-[500px] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=1600)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/70 via-brand-900/60 to-brand-900/80" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Discover the Best of{' '}
            <span className="text-brand-300">Jeddah</span>
          </h1>
          <p className="text-lg text-white/80 mb-8">
            Events, cafes, cinema, and social experiences — all in one place
          </p>
          <div className="max-w-xl mx-auto">
            <SearchBar
              placeholder="Search events, cafes, experiences…"
              className="shadow-xl"
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="text-white/60 text-sm">Popular:</span>
            {['Corniche Walk', 'Live Music', 'Coffee Festival', 'Art Exhibition'].map(tag => (
              <button
                key={tag}
                onClick={() => navigate(`/events?q=${encodeURIComponent(tag)}`)}
                className="text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => navigate(cat.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-brand-600">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Events</h2>
          <button
            onClick={() => navigate('/events')}
            className="text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            View all →
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {loadingEvents
            ? Array.from({ length: 4 }).map((_, i) => <EventSkeleton key={i} />)
            : featuredEvents.length > 0
              ? featuredEvents.map(event => (
                  <div key={event.id} className="shrink-0 w-72">
                    <EventCard event={event} />
                  </div>
                ))
              : (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="text-5xl mb-3">🎭</div>
                  <p className="font-medium">No featured events yet</p>
                  <p className="text-sm mt-1">Check back soon!</p>
                </div>
              )
          }
        </div>
      </section>

      {/* Trending Cafes */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Trending Cafes</h2>
            <button
              onClick={() => navigate('/cafes')}
              className="text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              View all →
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {loadingCafes
              ? Array.from({ length: 4 }).map((_, i) => <CafeSkeleton key={i} />)
              : cafes.length > 0
                ? cafes.map(cafe => (
                    <div key={cafe.id} className="shrink-0 w-64">
                      <CafeCard cafe={cafe} />
                    </div>
                  ))
                : (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="text-5xl mb-3">☕</div>
                    <p className="font-medium">No cafes yet</p>
                  </div>
                )
            }
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-brand-500 to-brand-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Have an event to share?</h2>
          <p className="text-brand-100 mb-8 text-lg">Submit your event and reach thousands of Jeddahites</p>
          <button
            onClick={() => navigate('/submit')}
            className="bg-white text-brand-600 font-semibold px-8 py-3 rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
          >
            Submit Your Event
          </button>
        </div>
      </section>
    </div>
  )
}
