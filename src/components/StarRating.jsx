import { useState } from 'react'

export default function StarRating({ value = 0, onChange, size = 'md', readOnly = false }) {
  const [hovered, setHovered] = useState(0)

  const sizeClass = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-3xl' : 'text-xl'

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange && onChange(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            className={`${sizeClass} transition-colors duration-100 ${
              readOnly ? 'cursor-default' : 'cursor-pointer'
            } ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}
