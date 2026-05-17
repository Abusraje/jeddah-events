import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCafeById } from '../api/cafes'
import { addFavorite, removeFavorite, getUserFavorites } from '../api/profiles'
import { useAuthContext } from '../context/AuthContext'
import ReviewCard from '../components/ReviewCard'
import StarRating from '../components/StarRating'
import MapView from '../components/MapView'
import { priceTierSymbol } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function CafeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [cafe, setCafe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)

  useEffect(() => {
    getCafeById(id).then(async (data) => {
      setCafe(data)
      setLoading(false)
      if (user && data) {
        const favs = await getUserFavorites(user.id)
        setFavorited(favs.some(f => f.target_id === id && f.target_type === 'cafe'))
      }
    })
  }, [id, user])

  const handleFavorite = async () => {
    if (!user) { toast.error('Please sign in'); return }
    try {
      if (favorited) {
        await removeFavorite({ userId: user.id, targetId: id, targetType: 'cafe' })
        setFavorited(false)
        toast.success('Removed from favorites')
      } else {
        await addFavorite({ userId: user.id, targetId: id, targetType: 'cafe' })
        setFavorited(true)
        toast.success('Added to favorites')
      }
    } catch { toast.error('Something went wrong') }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="h-64 skeleton rounded-2xl" />
        <div className="h-6 skeleton rounded w-1/2" />
      </div>
    )
  }

  if (!cafe) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-5xl mb-4">☕</div>
        <h2 className="text-xl font-bold text-gray-900">Cafe not found</h2>
        <button onClick={() => navigate('/cafes')} className="btn-primary mt-4">Browse Cafes</button>
      </div>
    )
  }

  const mapMarkers = cafe.latitude && cafe.longitude
    ? [{ lat: cafe.latitude, lng: cafe.longitude, title: cafe.name, id: cafe.id }]
    : []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
        ← Back
      </button>

      {/* Hero */}
      <div className="relative h-64 rounded-2xl overflow-hidden bg-gray-200 mb-6">
        <img
          src={cafe.image_url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200'}
          alt={cafe.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{cafe.name}</h1>
            <p className="text-white/80 text-sm">📍 {cafe.address}</p>
          </div>
          <button
            onClick={handleFavorite}
            className={`w-10 h-10 flex items-center justify-center rounded-full ${
              favorited ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:text-red-500'
            } transition-colors`}
          >
            {favorited ? '♥' : '♡'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <StarRating value={Math.round(cafe.rating || 0)} readOnly />
              <span className="text-gray-700 font-semibold">{cafe.rating?.toFixed(1) || '—'}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-600">{priceTierSymbol(cafe.price_tier)}</span>
            </div>
            {cafe.description && (
              <p className="text-gray-700 leading-relaxed">{cafe.description}</p>
            )}
            {cafe.tags && cafe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {cafe.tags.map(tag => (
                  <span key={tag} className="badge bg-teal-100 text-teal-800">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
            <MapView markers={mapMarkers} className="h-56 rounded-xl" />
            <p className="text-sm text-gray-500 mt-2">📍 {cafe.address}</p>
          </div>

          {/* Reviews */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Reviews</h3>
            {cafe.reviews && cafe.reviews.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {cafe.reviews.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
            <div className="space-y-2 text-sm text-gray-600">
              {cafe.phone && <p>📞 {cafe.phone}</p>}
              {cafe.website && (
                <a href={cafe.website} target="_blank" rel="noopener noreferrer" className="block text-teal-600 hover:text-teal-800">
                  🌐 Website
                </a>
              )}
              {cafe.hours && <p>🕐 {cafe.hours}</p>}
              {cafe.wifi !== undefined && <p>📶 WiFi: {cafe.wifi ? 'Available' : 'Not available'}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
