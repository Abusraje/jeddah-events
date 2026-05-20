import { supabase } from './supabase'

export async function getProfile(id) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  } catch (err) {
    console.error('getProfile error:', err)
    return null
  }
}

export async function updateProfile(id, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  } catch (err) {
    console.error('updateProfile error:', err)
    throw err
  }
}

export async function getUserFavorites(userId) {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('target_type', 'event')
      .order('created_at', { ascending: false })
    if (error) throw error

    const favorites = data || []
    if (favorites.length === 0) return []

    const eventIds = favorites.map(favorite => favorite.target_id)
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)

    if (eventsError) throw eventsError

    const eventsById = new Map((events || []).map(event => [event.id, event]))

    return favorites.map(favorite => ({
      ...favorite,
      events: eventsById.get(favorite.target_id) || null,
    }))
  } catch (err) {
    console.error('getUserFavorites error:', err)
    return []
  }
}

export async function addFavorite({ userId, targetId, targetType }) {
  try {
    const { error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, target_id: targetId, target_type: targetType }])
    if (error) throw error
    return true
  } catch (err) {
    console.error('addFavorite error:', err)
    throw err
  }
}

export async function removeFavorite({ userId, targetId, targetType }) {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .eq('target_type', targetType)
    if (error) throw error
    return true
  } catch (err) {
    console.error('removeFavorite error:', err)
    throw err
  }
}

export async function getFollowers(userId) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(id, username, avatar_url, full_name)')
      .eq('following_id', userId)
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('getFollowers error:', err)
    return []
  }
}

export async function getFollowing(userId) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, username, avatar_url, full_name)')
      .eq('follower_id', userId)
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('getFollowing error:', err)
    return []
  }
}

export async function follow(followerId, followingId) {
  try {
    const { error } = await supabase
      .from('follows')
      .insert([{ follower_id: followerId, following_id: followingId }])
    if (error) throw error
    return true
  } catch (err) {
    console.error('follow error:', err)
    throw err
  }
}

export async function unfollow(followerId, followingId) {
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
    if (error) throw error
    return true
  } catch (err) {
    console.error('unfollow error:', err)
    throw err
  }
}

export async function getUserSubmissions(userId) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('submitted_by', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('getUserSubmissions error:', err)
    return []
  }
}

export async function getUserAttendance(userId) {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, events(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('getUserAttendance error:', err)
    return []
  }
}

export async function searchUsers(query) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10)
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('searchUsers error:', err)
    return []
  }
}

export async function getSuggestedFriends(userId, limit = 4) {
  try {
    const [profilesResult, followingResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio')
        .neq('id', userId)
        .limit(limit + 8),
      supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId),
    ])

    if (profilesResult.error) throw profilesResult.error
    if (followingResult.error) throw followingResult.error

    const followingIds = new Set((followingResult.data || []).map(item => item.following_id))
    return (profilesResult.data || [])
      .filter(profile => !followingIds.has(profile.id))
      .slice(0, limit)
  } catch (err) {
    console.error('getSuggestedFriends error:', err)
    return []
  }
}
