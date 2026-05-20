import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { addReview } from '../api/events'
import { getUserAttendance } from '../api/profiles'
import { useAuthContext } from '../context/AuthContext'
import StarRating from '../components/StarRating'

export default function SocialFeedPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [attendedEvents, setAttendedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewDrafts, setReviewDrafts] = useState({})
  const [submittingReviewId, setSubmittingReviewId] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    setLoading(true)
    getUserAttendance(user.id).then((attendance) => {
      const events = attendance
        .map(item => item.events)
        .filter(Boolean)
      setAttendedEvents(events)
      setLoading(false)
    })
  }, [navigate, user])

  const updateReviewDraft = (eventId, key, value) => {
    setReviewDrafts(prev => ({
      ...prev,
      [eventId]: {
        rating: prev[eventId]?.rating || 0,
        comment: prev[eventId]?.comment || '',
        [key]: value,
      },
    }))
  }

  const handleSubmitReview = async (eventId) => {
    const draft = reviewDrafts[eventId]
    if (!user) {
      toast.error('Please sign in')
      return
    }
    if (!draft?.rating) {
      toast.error('Choose a rating first')
      return
    }

    setSubmittingReviewId(eventId)
    try {
      await addReview(eventId, user.id, draft.rating, draft.comment || '')
      setReviewDrafts(prev => ({
        ...prev,
        [eventId]: { rating: 0, comment: '' },
      }))
      toast.success('Review added')
    } catch {
      toast.error('Failed to add review')
    } finally {
      setSubmittingReviewId('')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Attended Events</h1>
        <p className="text-sm text-gray-500 mt-1">Rate events you marked as attending and add your comments.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="card h-48 skeleton" />
          ))}
        </div>
      ) : attendedEvents.length > 0 ? (
        <div className="grid gap-4">
          {attendedEvents.map(event => {
            const draft = reviewDrafts[event.id] || { rating: 0, comment: '' }
            const isSubmitting = submittingReviewId === event.id

            return (
              <div key={event.id} className="card p-5">
                <button
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="text-left w-full"
                >
                  <h2 className="font-semibold text-gray-900 hover:text-brand-600 transition-colors">{event.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{event.venue}</p>
                </button>

                <div className="mt-4">
                  <StarRating
                    value={draft.rating}
                    onChange={(value) => updateReviewDraft(event.id, 'rating', value)}
                    size="lg"
                  />
                </div>

                <textarea
                  value={draft.comment}
                  onChange={e => updateReviewDraft(event.id, 'comment', e.target.value)}
                  placeholder="Add your comment…"
                  rows={4}
                  className="w-full mt-4 text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />

                <button
                  onClick={() => handleSubmitReview(event.id)}
                  disabled={isSubmitting || !draft.rating}
                  className="btn-primary mt-4 disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting…' : 'Post review'}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">📝</div>
          <h2 className="text-lg font-semibold text-gray-900">No attended events yet</h2>
          <p className="text-sm text-gray-500 mt-2">Mark an event as attending first, then come back here to review it.</p>
        </div>
      )}
    </div>
  )
}
