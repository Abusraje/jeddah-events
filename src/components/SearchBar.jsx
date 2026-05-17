import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../api/supabase'

export default function SearchBar({ placeholder = 'Search events, cafes…', className = '' }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const debounceRef = useRef(null)

  const isCafePage = location.pathname.includes('/cafes')

  const fetchSuggestions = async (q) => {
    if (!q || q.length < 2) { setSuggestions([]); return }
    setLoading(true)
    try {
      const [events, cafes] = await Promise.all([
        supabase.from('events').select('id, title').ilike('title', `%${q}%`).limit(4),
        supabase.from('cafes').select('id, name').ilike('name', `%${q}%`).limit(3),
      ])
      const results = [
        ...(events.data || []).map(e => ({ id: e.id, label: e.title, type: 'event' })),
        ...(cafes.data || []).map(c => ({ id: c.id, label: c.name, type: 'cafe' })),
      ]
      setSuggestions(results)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 300)
    setShowDropdown(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    const path = isCafePage ? `/cafes?q=${encodeURIComponent(query)}` : `/events?q=${encodeURIComponent(query)}`
    navigate(path)
    setShowDropdown(false)
  }

  const handleSuggestionClick = (item) => {
    setShowDropdown(false)
    setQuery(item.label)
    if (item.type === 'event') navigate(`/events/${item.id}`)
    else navigate(`/cafes/${item.id}`)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">…</span>
          )}
        </div>
      </form>

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden"
        >
          {suggestions.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => handleSuggestionClick(item)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs text-gray-400 uppercase font-medium w-10 shrink-0">
                {item.type === 'event' ? '📅' : '☕'}
              </span>
              <span className="text-gray-800 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
