import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatPrice, getCategoryColor } from '../utils/helpers'
import { addFavorite, removeFavorite } from '../api/profiles'
import { useAuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function EventCard({ event, isFavorited: initFav = false, compact = false }) {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [favorited, setFavorited] = useState(initFav)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    setFavorited(initFav)
  }, [initFav])

  const handleFavorite = async (e) => {
    e.stopPropagation()
    if (!user) { toast.error('Please sign in to save favorites'); return }
    try {
      if (favorited) {
        await removeFavorite({ userId: user.id, targetId: event.id, targetType: 'event' })
        setFavorited(false)
        toast.success('Removed from favorites')
      } else {
        await addFavorite({ userId: user.id, targetId: event.id, targetType: 'event' })
        setFavorited(true)
        toast.success('Added to favorites')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  return (
    <div
      onClick={() => navigate(`/events/${event.id}`)}
      className={`card cursor-pointer group hover:shadow-md transition-all duration-200 ${compact ? 'flex gap-3' : ''}`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden bg-gray-100 ${compact ? 'w-24 h-24 rounded-lg shrink-0' : 'h-48'}`}>
        {!imgLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}
        <img
          src={event.image_url || `https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600`}
          alt={event.title}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${imgLoaded ? '' : 'opacity-0'}`}
        />
        {!compact && (
          <div className="absolute top-3 left-3">
            <span className={`badge ${getCategoryColor(event.category)}`}>
              {event.category}
            </span>
          </div>
        )}
        {!compact && (
          <button
            onClick={handleFavorite}
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm transition-all ${
              favorited ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-500 hover:text-red-500'
            }`}
          >
            ♥
          </button>
        )}
      </div>

      {/* Content */}
      <div className={`${compact ? 'flex-1 min-w-0 py-1' : 'p-4'}`}>
        {compact && (
          <span className={`badge ${getCategoryColor(event.category)} mb-1`}>{event.category}</span>
        )}
        <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm truncate' : 'text-base mb-1'} group-hover:text-brand-600 transition-colors`}>
          {event.title}
        </h3>
        <div className={`text-gray-500 ${compact ? 'text-xs space-y-0.5' : 'text-sm space-y-1'}`}>
          <p>📅 {formatDate(event.date)}</p>
          <p className="truncate">📍 {event.venue}</p>
        </div>
        <p className={`font-semibold text-brand-500 ${compact ? 'text-xs mt-1' : 'mt-2'}`}>
          {formatPrice(event.price)}
        </p>
      </div>
    </div>
  )
}
