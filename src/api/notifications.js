import { supabase, assertSupabaseConfigured } from './supabase'
import { truncate } from '../utils/helpers'

const EVENT_LIMIT = 8
const POST_LIMIT = 12
const FEED_LIMIT = 16

function formatEventNotification(event) {
  return {
    id: `event-${event.id}`,
    type: 'event',
    title: event.is_approved ? 'New event added' : 'New event submitted',
    body: event.is_approved
      ? `${event.title} was added for ${event.venue}.`
      : `${event.title} was submitted for ${event.venue}.`,
    createdAt: event.created_at,
    href: `/events/${event.id}`,
    meta: event.is_approved ? event.category : `${event.category} · Pending review`,
  }
}

function formatPostNotification(post) {
  const author = post.profiles?.full_name || post.profiles?.username || 'Someone'
  return {
    id: `post-${post.id}`,
    type: 'social',
    title: 'New social post',
    body: `${author} shared: ${truncate(post.content, 88)}`,
    createdAt: post.created_at,
    href: '/social',
    meta: post.location_tag || 'Social feed',
    author,
    avatarUrl: post.profiles?.avatar_url || null,
  }
}

export async function getNotificationsFeed() {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return []
  }

  assertSupabaseConfigured()

  const [eventsResult, postsResult] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, category, venue, created_at, is_approved')
      .order('created_at', { ascending: false })
      .limit(EVENT_LIMIT),
    supabase
      .from('posts')
      .select('id, content, location_tag, created_at, profiles(username, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(POST_LIMIT),
  ])

  if (eventsResult.error) throw eventsResult.error
  if (postsResult.error) throw postsResult.error

  return [...(eventsResult.data || []).map(formatEventNotification), ...(postsResult.data || []).map(formatPostNotification)]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, FEED_LIMIT)
}
