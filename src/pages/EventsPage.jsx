import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import EventCard from '../components/EventCard'
import FilterSidebar from '../components/FilterSidebar'
import { getEvents } from '../api/events'

const SORT_OPTIONS = [
  { value: 'date_asc', label: 'Date (Soonest)' },
  { value: 'date_desc', label: 'Date (Latest)' },
  { value: 'price_asc', label: 'Price (Low→High)' },
  { value: 'price_desc', label: 'Price (High→Low)' },
]

const PAGE_SIZE = 10

function EventGridSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card">
          <div className="h-48 skeleton" />
          <div className="p-4 space-y-2">
            <div className="h-4 skeleton rounded w-1/3" />
            <div className="h-5 skeleton rounded w-3/4" />
            <div className="h-3 skeleton rounded w-1/2" />
            <div className="h-3 skeleton rounded w-1/4" />
          </div>
        </div>
      ))}
    </>
  )
}

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const filters = {
    category: searchParams.get('category') || '',
    dateRange: searchParams.get('dateRange') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    search: searchParams.get('q') || '',
  }
  const sort = searchParams.get('sort') || 'date_asc'
  const page = Number(searchParams.get('page') || 1)
  const totalPages = Math.ceil(count / PAGE_SIZE)

  const updateParam = (key, value) => {
    const params = Object.fromEntries(searchParams.entries())
    if (value) params[key] = value
    else delete params[key]
    params.page = '1'
    setSearchParams(params)
  }

  const handleFilterChange = (newFilters) => {
    const params = {}
    if (newFilters.category) params.category = newFilters.category
    if (newFilters.dateRange) params.dateRange = newFilters.dateRange
    if (newFilters.minPrice) params.minPrice = String(newFilters.minPrice)
    if (newFilters.maxPrice && newFilters.maxPrice < 500) params.maxPrice = String(newFilters.maxPrice)
    if (filters.search) params.q = filters.search
    if (sort !== 'date_asc') params.sort = sort
    params.page = '1'
    setSearchParams(params)
  }

  useEffect(() => {
    setLoading(true)
    getEvents({ ...filters, sort, page, pageSize: PAGE_SIZE }).then(({ data, count }) => {
      setEvents(data)
      setCount(count)
      setLoading(false)
    })
  }, [searchParams]) // eslint-disable-line

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events in Jeddah</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-0.5">{count} events found</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(v => !v)}
            className="lg:hidden btn-secondary flex items-center gap-2"
          >
            <span>⚙️</span> Filters
          </button>
          <select
            value={sort}
            onChange={e => updateParam('sort', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters pills */}
      {(filters.category || filters.dateRange || filters.search) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.search && (
            <span className="badge bg-brand-100 text-brand-800 gap-1">
              Search: "{filters.search}"
              <button onClick={() => updateParam('q', '')} className="ml-1">✕</button>
            </span>
          )}
          {filters.category && (
            <span className="badge bg-brand-100 text-brand-800">
              {filters.category}
              <button onClick={() => updateParam('category', '')} className="ml-1">✕</button>
            </span>
          )}
          {filters.dateRange && (
            <span className="badge bg-brand-100 text-brand-800">
              {filters.dateRange}
              <button onClick={() => updateParam('dateRange', '')} className="ml-1">✕</button>
            </span>
          )}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className={`w-64 shrink-0 ${showFilters ? 'block' : 'hidden'} lg:block`}>
          <FilterSidebar
            filters={filters}
            onChange={handleFilterChange}
          />
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <EventGridSkeleton />
            </div>
          ) : events.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {events.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParam('page', String(page - 1))}
                    className="btn-secondary disabled:opacity-40 text-sm px-3 py-1.5"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - page) <= 2)
                    .map(p => (
                      <button
                        key={p}
                        onClick={() => updateParam('page', String(p))}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          p === page ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    disabled={page >= totalPages}
                    onClick={() => updateParam('page', String(page + 1))}
                    className="btn-secondary disabled:opacity-40 text-sm px-3 py-1.5"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
              <button
                onClick={() => setSearchParams({})}
                className="btn-primary"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
