import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNotificationsFeed } from '../api/notifications'
import { isSupabaseConfigured, supabase } from '../api/supabase'
import { getInitials, timeAgo } from '../utils/helpers'

const SEEN_STORAGE_KEY = 'jeddah-events.seen-notifications'

const TYPE_STYLES = {
  event: {
    icon: '🎫',
    badge: 'bg-orange-100 text-orange-800',
  },
  social: {
    icon: '💬',
    badge: 'bg-teal-100 text-teal-800',
  },
}

function NotificationSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-xl skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton rounded w-40" />
          <div className="h-3 skeleton rounded w-full" />
          <div className="h-3 skeleton rounded w-28" />
        </div>
      </div>
    </div>
  )
}

function getSeenNotifications() {
  try {
    const value = localStorage.getItem(SEEN_STORAGE_KEY)
    const parsed = value ? JSON.parse(value) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSeenNotifications(ids) {
  localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(ids))
}

function NotificationItem({ item, isSeen, onMarkSeen }) {
  const typeStyle = TYPE_STYLES[item.type] || TYPE_STYLES.social

  return (
    <div className={`card p-4 transition-all ${isSeen ? 'opacity-75' : 'border-brand-200 shadow-sm'}`}>
      <div className="flex items-start gap-3">
        <Link to={item.href} className="contents">
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt={item.author || item.title} className="w-11 h-11 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center text-base font-semibold shrink-0">
              {item.type === 'social' && item.author ? getInitials(item.author) : typeStyle.icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`badge ${typeStyle.badge}`}>{item.title}</span>
              {!isSeen && <span className="w-2 h-2 rounded-full bg-brand-500" aria-hidden="true" />}
              <span className="text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{item.body}</p>
            <p className="text-xs text-gray-500 mt-2">{item.meta}</p>
          </div>
        </Link>
        {!isSeen && (
          <button
            type="button"
            onClick={() => onMarkSeen(item.id)}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0"
          >
            Mark seen
          </button>
        )}
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  const [seenIds, setSeenIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setSeenIds(getSeenNotifications())
  }, [])

  const markSeen = useCallback((id) => {
    setSeenIds((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      saveSeenNotifications(next)
      return next
    })
  }, [])

  const markAllSeen = useCallback(() => {
    const allIds = items.map(item => item.id)
    setSeenIds(allIds)
    saveSeenNotifications(allIds)
  }, [items])

  const unseenCount = items.filter(item => !seenIds.includes(item.id)).length

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getNotificationsFeed()
      setItems(data)
    } catch {
      setError('Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const channel = supabase
      .channel('notifications-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, () => {
        loadNotifications()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        loadNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadNotifications])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Recent activity from new events and the social feed.
          </p>
          {items.length > 0 && !loading && (
            <p className="text-xs text-gray-400 mt-2">{unseenCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && unseenCount > 0 && (
            <button onClick={markAllSeen} className="btn-secondary text-sm">
              Mark all seen
            </button>
          )}
          <button onClick={loadNotifications} className="btn-secondary text-sm">
            Refresh
          </button>
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <div className="card p-6 text-sm text-gray-600">
          Supabase is not configured. Add your `.env` values before notifications can load.
        </div>
      ) : error ? (
        <div className="card p-6 text-sm text-red-600">{error}</div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => <NotificationSkeleton key={index} />)}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map(item => (
            <NotificationItem
              key={item.id}
              item={item}
              isSeen={seenIds.includes(item.id)}
              onMarkSeen={markSeen}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">🔔</div>
          <h2 className="text-lg font-semibold text-gray-900">No notifications yet</h2>
          <p className="text-sm text-gray-500 mt-2">
            New approved events and social posts will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
