export function formatDate(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatPrice(price) {
  if (price === 0 || price === null || price === undefined) return 'Free'
  return `SAR ${Number(price).toLocaleString()}`
}

export function priceTierSymbol(tier) {
  if (!tier) return '$'
  return '$'.repeat(Math.min(Math.max(Number(tier), 1), 4))
}

export function timeAgo(timestamp) {
  if (!timestamp) return ''
  const diff = Date.now() - new Date(timestamp).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(timestamp)
}

export function truncate(str, n = 100) {
  if (!str) return ''
  if (str.length <= n) return str
  return str.slice(0, n).trimEnd() + '…'
}

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export const CATEGORY_COLORS = {
  Cinema: 'bg-purple-100 text-purple-800',
  Music: 'bg-pink-100 text-pink-800',
  Art: 'bg-blue-100 text-blue-800',
  Comedy: 'bg-yellow-100 text-yellow-800',
  Workshop: 'bg-green-100 text-green-800',
  Food: 'bg-orange-100 text-orange-800',
  Sports: 'bg-red-100 text-red-800',
  Festival: 'bg-teal-100 text-teal-800',
  Other: 'bg-gray-100 text-gray-800',
}

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Other
}
