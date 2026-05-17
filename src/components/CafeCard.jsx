import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { priceTierSymbol } from '../utils/helpers'
import StarRating from './StarRating'

export default function CafeCard({ cafe, highlight = false }) {
  const navigate = useNavigate()
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <div
      id={`cafe-${cafe.id}`}
      onClick={() => navigate(`/cafes/${cafe.id}`)}
      className={`card cursor-pointer group hover:shadow-md transition-all duration-200 ${
        highlight ? 'ring-2 ring-brand-500' : ''
      }`}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {!imgLoaded && <div className="absolute inset-0 skeleton" />}
        <img
          src={cafe.image_url || `https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600`}
          alt={cafe.name}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${imgLoaded ? '' : 'opacity-0'}`}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1">
            {cafe.name}
          </h3>
          <span className="text-sm font-medium text-gray-500 shrink-0">{priceTierSymbol(cafe.price_tier)}</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <StarRating value={Math.round(cafe.rating || 0)} readOnly size="sm" />
          <span className="text-sm text-gray-600">{cafe.rating?.toFixed(1) || '—'}</span>
        </div>

        <p className="text-sm text-gray-500 truncate mb-3">📍 {cafe.address}</p>

        {cafe.tags && cafe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cafe.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="badge bg-teal-100 text-teal-800 text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
