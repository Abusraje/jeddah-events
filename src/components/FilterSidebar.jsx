const CATEGORIES = ['Cinema', 'Music', 'Art', 'Comedy', 'Workshop', 'Food', 'Sports', 'Festival']
const DATE_OPTIONS = [
  { label: 'All Dates', value: '' },
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Weekend', value: 'weekend' },
]

export default function FilterSidebar({ filters = {}, onChange }) {
  const update = (key, value) => onChange?.({ ...filters, [key]: value })

  const toggleCategory = (cat) => {
    const current = filters.category || ''
    update('category', current === cat ? '' : cat)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
        <div className="space-y-2">
          {CATEGORIES.map(cat => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.category === cat}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded accent-brand-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-brand-600 transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Date</h3>
        <div className="space-y-1">
          {DATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('dateRange', opt.value)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                (filters.dateRange || '') === opt.value
                  ? 'bg-brand-500 text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          Price Range
          <span className="font-normal text-gray-500 text-sm ml-2">
            {filters.minPrice || 0} – {filters.maxPrice ?? 500} SAR
          </span>
        </h3>
        <input
          type="range"
          min={0}
          max={500}
          step={10}
          value={filters.maxPrice ?? 500}
          onChange={e => update('maxPrice', Number(e.target.value))}
          className="w-full accent-brand-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Free</span>
          <span>SAR 500+</span>
        </div>
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.freeOnly || false}
            onChange={e => update('freeOnly', e.target.checked)}
            className="accent-brand-500"
          />
          <span className="text-sm text-gray-700">Free events only</span>
        </label>
      </div>

      <button
        onClick={() => onChange?.({ category: '', dateRange: '', minPrice: undefined, maxPrice: undefined, freeOnly: false })}
        className="w-full text-sm text-brand-500 hover:text-brand-600 font-medium py-2 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
      >
        Clear all filters
      </button>
    </div>
  )
}
