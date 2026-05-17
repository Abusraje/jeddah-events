import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEventById, getRelatedEvents, addAttendance, removeAttendance, addReview } from '../api/events'
import { addFavorite, removeFavorite, getUserFavorites } from '../api/profiles'
import { useAuthContext } from '../context/AuthContext'
import EventCard from '../components/EventCard'
import ReviewCard from '../components/ReviewCard'
import StarRating from '../components/StarRating'
import MapView from '../components/MapView'
import { formatDate, formatPrice, getCategoryColor } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [event, setEvent] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const [attended, setAttended] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    setLoading(true)
    getEventById(id).then(async (data) => {
      setEvent(data)
      setLoading(false)
      if (data) {
        getRelatedEvents(data.category, data.id).then(setRelated)
        if (user) {
          const favs = await getUserFavorites(user.id)
          setFavorited(favs.some(f => f.target_id === id && f.target_type === 'event'))
        }
      }
    })
  }, [id, user])

  const handleFavorite = async () => {
    if (!user) { toast.error('Please sign in'); return }
    try {
      if (favorited) {
        await removeFavorite({ userId: user.id, targetId: id, targetType: 'event' })
        setFavorited(false)
        toast.success('Removed from favorites')
      } else {
        await addFavorite({ userId: user.id, targetId: id, targetType: 'event' })
        setFavorited(true)
        toast.success('Added to favorites')
      }
    } catch { toast.error('Something went wrong') }
  }

  const handleAttend = async () => {
    if (!user) { toast.error('Please sign in'); return }
    try {
      if (attended) {
        await removeAttendance(id, user.id)
        setAttended(false)
        toast.success('Removed from attendance')
      } else {
        await addAttendance(id, user.id)
        setAttended(true)
        toast.success('Marked as attending!')
      }
    } catch { toast.error('Something went wrong') }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Please sign in'); return }
    if (!reviewRating) { toast.error('Please select a rating'); return }
    setSubmittingReview(true)
    try {
      const review = await addReview(id, user.id, reviewRating, reviewComment)
      setEvent(prev => ({
        ...prev,
        reviews: [...(prev.reviews || []), review],
      }))
      setReviewRating(0)
      setReviewComment('')
      toast.success('Review submitted!')
    } catch { toast.error('Failed to submit review') }
    finally { setSubmittingReview(false) }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-72 skeleton rounded-2xl" />
        <div className="h-8 skeleton rounded w-2/3" />
        <div className="h-4 skeleton rounded w-1/2" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
        <button onClick={() => navigate('/events')} className="btn-primary mt-4">Browse Events</button>
      </div>
    )
  }

  const mapMarkers = event.latitude && event.longitude
    ? [{ lat: event.latitude, lng: event.longitude, title: event.venue, id: event.id }]
    : []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        ← Back
      </button>

      {/* Hero image */}
      <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-6 bg-gray-200">
        <img
          src={event.image_url || 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=1200'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <span className={`badge ${getCategoryColor(event.category)} mb-2`}>{event.category}</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{event.title}</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <div className="card p-6">
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(event.date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Venue</p>
                  <p className="font-semibold text-gray-900">{event.venue}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎟️</span>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Price</p>
                  <p className="font-semibold text-brand-500">{formatPrice(event.price)}</p>
                </div>
              </div>
            </div>

            {event.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About this event</h3>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
              </div>
            )}
          </div>

          {/* Map */}
          {mapMarkers.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
              <MapView markers={mapMarkers} className="h-56 rounded-xl" />
              <p className="text-sm text-gray-500 mt-2">📍 {event.venue}</p>
            </div>
          )}

          {/* Reviews */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Reviews {event.reviews?.length > 0 && `(${event.reviews.length})`}
            </h3>
            {event.reviews && event.reviews.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {event.reviews.map(r => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-4">No reviews yet. Be the first!</p>
            )}

            {user && (
              <form onSubmit={handleReviewSubmit} className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-3">Leave a review</h4>
                <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share your experience…"
                  rows={3}
                  className="mt-3 w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={submittingReview || !reviewRating}
                  className="btn-primary mt-3 disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-24">
            <div className="flex flex-col gap-3">
              <button
                onClick={handleFavorite}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
                  favorited
                    ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {favorited ? '♥' : '♡'} {favorited ? 'Saved' : 'Save Event'}
              </button>
              <button
                onClick={handleAttend}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
                  attended
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'btn-primary'
                }`}
              >
                {attended ? '✓ Attending' : 'Mark as Attending'}
              </button>
              {event.ticket_url && (
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-teal-500 text-white hover:bg-teal-600 transition-colors text-center"
                >
                  🎟️ Get Tickets
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related events */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Events</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}
    </div>
  )
}
