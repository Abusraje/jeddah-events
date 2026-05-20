import StarRating from './StarRating'
import { formatDate, getInitials } from '../utils/helpers'
import { useAuthContext } from '../context/AuthContext'

export default function ReviewCard({ review, onDelete }) {
  const { user } = useAuthContext()
  const profile = review.profiles || {}
  const name = profile.full_name || profile.username || 'Anonymous'
  const canDelete = user && review.user_id === user.id

  return (
    <div className="flex gap-3 py-4">
      <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm text-gray-900">{name}</span>
            <span className="text-gray-400 text-xs">·</span>
            <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
          </div>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete?.(review.id)}
              className="text-xs text-red-500 hover:text-red-600 shrink-0"
            >
              Delete
            </button>
          )}
        </div>
        <StarRating value={review.rating} readOnly size="sm" />
        {review.comment && (
          <p className="text-sm text-gray-700 mt-1 leading-relaxed">{review.comment}</p>
        )}
      </div>
    </div>
  )
}
